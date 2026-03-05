from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
import os
import json
import tempfile
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_database
from routes.auth import extract_token
from auth import decode_token

# RAG & ML
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from services.compliance_graph import compliance_app
from services.report_graph import report_app
from services.pdf_generator import generate_audit_pdf
from fastapi.responses import FileResponse
from fastapi import BackgroundTasks
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/compliance", tags=["Compliance AI"])

# Load Knowledge Graph safely
def load_nbfc_graph():
    graph_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "nbfc_kyc_graph.json")
    try:
        with open(graph_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception as e:
        print(f"Error loading graph: {e}")
        return {}

def extract_file_text(file: UploadFile) -> str:
    """Extracts text from uploaded PDF, DOCX, or TXT securely using temp files"""
    if not file:
        return ""
    
    # Save to a temporary file based on extension
    ext = os.path.splitext(file.filename)[1].lower()
    suffix = ext if ext else ".txt"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
        temp_file.write(file.file.read())
        temp_path = temp_file.name

    text_content = ""
    try:
        if ext == ".pdf":
            loader = PyPDFLoader(temp_path)
            docs = loader.load()
            text_content = "\n".join([doc.page_content for doc in docs])
        elif ext in [".docx", ".doc"]:
            loader = Docx2txtLoader(temp_path)
            docs = loader.load()
            text_content = "\n".join([doc.page_content for doc in docs])
        else: # .txt or others
            loader = TextLoader(temp_path, encoding="utf-8")
            docs = loader.load()
            text_content = "\n".join([doc.page_content for doc in docs])
    except Exception as e:
        print(f"File extraction error: {e}")
        text_content = f"[File content unreadable: {e}]"
    finally:
        os.remove(temp_path)
        
    return text_content

# Global Vector Store Variable
_vector_store = None
INDEX_PATH = "data/faiss_index/langchain_index"

def get_vector_store():
    global _vector_store
    if _vector_store is not None:
        return _vector_store

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Try to load existing LangChain index if it was already saved
    if os.path.exists(INDEX_PATH):
        print(f"Loading existing LangChain FAISS index from {INDEX_PATH}...")
        try:
            _vector_store = FAISS.load_local(INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
            print("LangChain index loaded successfully!")
            return _vector_store
        except Exception as e:
            print(f"Could not load index: {e}. Rebuilding...")

    # Build the FAISS index on the fly from the JSON knowledge graph
    print("Building FAISS vector index from Knowledge Graph...")
    graph_data = load_nbfc_graph()
    nodes = graph_data.get("nodes", [])
    
    docs = []
    for node in nodes:
        node_id = node.get("id", "Unknown ID")
        label = node.get("label", "Unknown Label")
        props = str(node.get("properties", {}))
        content = f"Regulation/Node: {label}\nDetails: {props}"
        docs.append(Document(page_content=content, metadata={"id": node_id, "label": label}))

    if not docs:
        docs = [Document(page_content="No RBI regulations found.", metadata={})]
        
    _vector_store = FAISS.from_documents(docs, embeddings)
    
    # Save the index for next time
    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    _vector_store.save_local(INDEX_PATH)
    print(f"FAISS vector index built and saved to {INDEX_PATH}!")
    
    return _vector_store

@router.post("/chat/")
async def compliance_chat(
    http_request: Request,
    message: str = Form(...),
    file: Optional[UploadFile] = File(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        # Fetch user profile for context
        user_profile = {}
        try:
            token = extract_token(http_request)
            payload = decode_token(token)
            if payload:
                username = payload.get("username")
                user = await db.users.find_one({"username": username}, {"password": 0})
                if user:
                    user_profile = {
                        "company_name": user.get("company_name", "N/A"),
                        "organization_type": user.get("organization_type", "N/A"),
                        "head_office_location": user.get("head_office_location", "N/A"),
                        "cin_number": user.get("cin_number", "N/A"),
                        "gstin": user.get("gstin", "N/A"),
                        "services_provided": user.get("services_provided", "N/A"),
                        "compliance_areas": user.get("compliance_areas", "N/A"),
                        "tech_setup": user.get("tech_setup", "N/A")
                    }
        except Exception as e:
            print(f"Warning: Could not fetch user profile for chat context: {e}")

        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            return JSONResponse(status_code=500, content={"error": "GROQ_API_KEY missing from environment"})

        # Initialize Groq via LangChain
        llm = ChatGroq(
            api_key=api_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0, 
            max_tokens=2048
        )

        user_context = ""
        if file:
            user_context = extract_file_text(file)
            print(f"Extracted {len(user_context)} characters from {file.filename}")

        # Vector Retrieval (RAG)
        vector_store = get_vector_store()
        search_query = f"{message} {user_context[:500]}" # Combine user intent and start of doc for semantic match
        retrieved_docs = vector_store.similarity_search(search_query, k=8)
        
        rbi_context_str = "\n\n---\n\n".join([doc.page_content for doc in retrieved_docs])
        
        # Detect if we should use the FSM (Analysis mode)
        is_analysis_requested = bool(file) or any(keyword in message.lower() for keyword in ["analyze", "check", "audit", "compliance", "violation"])
        
        if is_analysis_requested:
            print("Invoking LangGraph FSM for structured analysis...")
            initial_state = {
                "user_message": message,
                "user_doc": user_context,
                "user_profile": user_profile,
                "rag_context": rbi_context_str,
                "compliance_areas": [],
                "risk_level": "UNKNOWN",
                "affected_depts": [],
                "draft_content": "",
                "analysis_content": "",
                "impact_content": "",
                "action_items_content": "",
                "review_content": "",
                "final_report": "",
                "hallucination_detected": False
            }
            
            final_state = compliance_app.invoke(initial_state)
            reply_content = final_state["final_report"]
        else:
            # Handle general chat with a simple LLM call (resource saving)
            print("General chat mode (skipping FSM)...")
            system_prompt = f"""You are ReguAI, the Expert Compliance Assistant for {user_profile.get('company_name')}.
            You are a professional assistant specialized in RBI regulations.
            User Profile: {user_profile}
            
            RETRIEVED RBI KNOWLEDGE:
            {rbi_context_str}
            
            Respond helpfully. If the user wants a deep analysis, ask them to upload a document or explicitly request a 'compliance audit'.
            """
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=message)
            ]
            response = llm.invoke(messages)
            reply_content = response.content

        return {
            "reply": reply_content,
            "document_processed": bool(file),
            "filename": file.filename if file else None,
            "analysis_mode": is_analysis_requested
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/report/generate/")
async def generate_report_endpoint(
    http_request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Triggers the Audit Report FSM in the background"""
    try:
        user_id = None
        user_profile = {}
        token = extract_token(http_request)
        payload = decode_token(token)
        if payload:
            user_id = payload.get("username")
            user = await db.users.find_one({"username": user_id})
            if user:
                user_profile = {
                    "company_name": user.get("company_name", "N/A"),
                    "organization_type": user.get("organization_type", "N/A"),
                    "services_provided": user.get("services_provided", "N/A"),
                    "tech_setup": user.get("tech_setup", "N/A")
                }

        report_id = str(uuid.uuid4())
        report_doc = {
            "report_id": report_id,
            "user_id": user_id,
            "status": "QUEUED",
            "current_state": "INITIALIZING",
            "progress": 0,
            "created_at": datetime.now(),
            "pdf_path": None
        }
        await db.audit_reports.insert_one(report_doc)

        # Start FSM in background
        background_tasks.add_task(run_report_fsm, report_id, user_profile, db)

        return {"report_id": report_id, "status": "QUEUED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def run_report_fsm(report_id: str, user_profile: dict, db: AsyncIOMotorDatabase):
    """Background worker for Report FSM"""
    try:
        # 1. Update to Started
        await db.audit_reports.update_one({"report_id": report_id}, {"$set": {"status": "IN_PROGRESS", "progress": 5}})
        
        # 2. Get RAG Context (Simulating a general search for the audit)
        vector_store = get_vector_store()
        retrieved_docs = vector_store.similarity_search(f"Audit guidelines for {user_profile.get('organization_type')}", k=10)
        rag_context = "\n\n".join([d.page_content for d in retrieved_docs])

        initial_state = {
            "user_profile": user_profile,
            "user_doc_content": "Simulated Audit Target: Full organizational compliance review.",
            "rag_context": rag_context,
            "risk_profile": "",
            "gap_findings": "",
            "remediation_roadmap": "",
            "current_state": "STARTING",
            "progress": 10,
            "final_pdf_path": "",
            "is_complete": False
        }

        # Instead of a single invoke, we could stream it to update progress in DB
        # But for MVP, we'll run and update in chunks if possible, or just final
        # LangGraph allows streaming:
        async for output in report_app.astream(initial_state):
            for key, value in output.items():
                if "current_state" in value:
                    await db.audit_reports.update_one(
                        {"report_id": report_id}, 
                        {"$set": {
                            "current_state": value["current_state"],
                            "progress": value["progress"]
                        }}
                    )

        # 3. Final State Reached
        final_state = await report_app.ainvoke(initial_state)
        
        # 4. Generate PDF
        pdf_filename = f"audit_report_{report_id}.pdf"
        pdf_dir = "data/reports"
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_path = os.path.join(pdf_dir, pdf_filename)
        
        pdf_data = {
            "company_name": user_profile.get("company_name"),
            "org_type": user_profile.get("organization_type"),
            "risk_level": final_state.get("risk_level", "HIGH"),
            "analysis_content": final_state.get("gap_findings"),
            "action_plan": final_state.get("remediation_roadmap")
        }
        
        generate_audit_pdf(pdf_data, pdf_path)
        
        # 5. Mark as Complete
        await db.audit_reports.update_one(
            {"report_id": report_id}, 
            {"$set": {
                "status": "COMPLETED",
                "progress": 100,
                "current_state": "AUDIT_FINALIZED",
                "pdf_path": pdf_path
            }}
        )
    except Exception as e:
        print(f"Error in Report FSM Worker: {e}")
        await db.audit_reports.update_one({"report_id": report_id}, {"$set": {"status": "FAILED", "error": str(e)}})

@router.get("/report/status/{report_id}")
async def get_report_status(report_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    report = await db.audit_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/report/download/{report_id}")
async def download_report(
    report_id: str, 
    token: str = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # If token passed in query (for window.open)
    if token:
        try:
            decode_token(token)
        except:
            raise HTTPException(status_code=401, detail="Invalid token")
            
    report = await db.audit_reports.find_one({"report_id": report_id})
    if not report or not report.get("pdf_path"):
        raise HTTPException(status_code=404, detail="Report PDF not ready")
    
    pdf_path = report["pdf_path"]
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Physical file missing")
        
    return FileResponse(pdf_path, media_type='application/pdf', filename=os.path.basename(pdf_path))

@router.get("/reports/list")
async def list_user_reports(http_request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    user_id = None
    try:
        token = extract_token(http_request)
        payload = decode_token(token)
        if payload:
            user_id = payload.get("username")
    except: pass
    
    reports = await db.audit_reports.find({"user_id": user_id}).sort("created_at", -1).to_list(100)
    for r in reports:
        r["_id"] = str(r["_id"])
    return reports

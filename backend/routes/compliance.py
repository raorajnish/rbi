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
                        "head_office_location": user.get("head_office_location", "N/A")
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
        
        system_prompt = f"""You are the Organization's Expert AI Compliance Officer (ReguAI). 
        Your goal is to perform a high-precision Risk and Rule Violation Analysis using the provided RBI Regulatory Knowledge and the Organization's own documents.

        --- 
        USER PROFILE CONTEXT:
        - **Company Name:** {user_profile.get('company_name', 'N/A')}
        - **Organization Type:** {user_profile.get('organization_type', 'N/A')}
        - **Location:** {user_profile.get('head_office_location', 'N/A')}

        CORE DATA SOURCES:
        1. RETRIEVED RBI REGULATORY KNOWLEDGE (Semantic RAG Search):
        {rbi_context_str}

        2. USER'S UPLOADED ORGANIZATION DOCUMENT (Policy/Process):
        {user_context if user_context else 'NO DOCUMENT UPLOADED. Analyze general RBI guidelines based on the user query.'}
        ---

        BEHAVIORAL RULES:
        1. **IF A DOCUMENT IS UPLOADED OR THE USER ASKS FOR AN ANALYSIS/COMPLIANCE CHECK**: 
           Provide the structured "# 🛡️ Compliance Analysis" report specified below.
        2. **IF IT IS A GENERAL GREETING OR CASUAL QUESTION**: 
           Respond as a helpful and professional compliance assistant. DO NOT generate the full analysis report. Simply acknowledge and offer specific help based on their organization type.
        
        ANALYSIS GUIDELINES (Only if rule 1 applies):
        - Compare the document/query against the retrieved RBI rules. Identify 'Discrepancies' and 'Omissions'.
        - Be strict. RBI compliance is mandatory.

        REQUIRED OUTPUT STRUCTURE FOR ANALYSIS (Markdown):
        # 🛡️ Compliance Analysis: [Company Name/Document Title]

        ## 📊 Impact Summary
        - **Impact Level:** [HIGH / MEDIUM / LOW]
        - **Primary Regulation:** [e.g., NBFC KYC Master Direction 2025]
        - **Compliance Score:** [Estimate a %]

        ## ⚠️ Detected Discrepancies & Violations
        [For each issue found]:
        - **[Issue Name]**: Describe what is in the document vs what RBI requires.
        - **Risk:** [e.g., Penalties, License Cancellation]

        ## ✅ Actionable Compliance Checklist
        1️⃣ [Step 1]
        2️⃣ [Step 2]
        ...

        ## 📅 Key Deadlines & Next Steps
        - [Provide estimated regulatory deadlines]
        """

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=message)
        ]

        # Call LLM
        response = llm.invoke(messages)

        return {
            "reply": response.content,
            "document_processed": bool(file),
            "filename": file.filename if file else None
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from typing import TypedDict, List, Annotated, Dict
import operator
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
import os

# --- State Definition ---
class ReportState(TypedDict):
    # Inputs
    user_profile: Dict
    user_doc_content: str
    rag_context: str
    
    # Shared Memory
    risk_profile: str
    gap_findings: str
    remediation_roadmap: str
    
    # Metadata for Progress Bar
    current_state: str
    progress: int # 0-100
    
    # Final Output
    final_pdf_path: str
    is_complete: bool

# --- Node Implementation ---

def get_llm():
    return ChatGroq(
        api_key=os.environ.get("GROQ_API_KEY"),
        model_name="llama-3.3-70b-versatile",
        temperature=0.1
    )

def initial_data_node(state: ReportState):
    print("\n[REPORT FSM] → STATE: INITIAL_DATA (Step 1/5)")
    return {
        "current_state": "INTEGRATING_ORG_CONTEXT",
        "progress": 20
    }

def risk_modeling_node(state: ReportState):
    print("[REPORT FSM] → STATE: RISK_MODELING (Step 2/5)")
    llm = get_llm()
    profile = state["user_profile"]
    
    prompt = f"""Construct a Professional Risk Profile for this organization:
    Name: {profile.get('company_name')}
    Type: {profile.get('organization_type')}
    Services: {profile.get('services_provided')}
    Storage: {profile.get('tech_setup')}
    
    Task: Identify 3 strategic risk vectors (e.g. Data Residency, KYC Onboarding, AML Monitoring).
    Professional tone. No emojis.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    return {
        "risk_profile": response.content,
        "current_state": "MODELING_RISK_VECTORS",
        "progress": 40
    }

def gap_analysis_node(state: ReportState):
    print("[REPORT FSM] → STATE: GAP_ANALYSIS (Step 3/5)")
    llm = get_llm()
    rag = state["rag_context"]
    doc = state["user_doc_content"]
    
    prompt = f"""Execute deep Gap Analysis.
    RBI CONTEXT: {rag}
    USER POLICY: {doc if doc else 'No policy provided. Audit based on standard industry pitfalls.'}
    
    Task: Identify exactly where the organization deviates from RBI Master Directions.
    Focus on: Transaction monitoring, KYC verification, and Reporting. 
    Professional formatting. No emojis.
    """
    
    # "Hardcode wisely" - enhancing the prompt to ensure high-impact findings
    response = llm.invoke([HumanMessage(content=prompt)])
    return {
        "gap_findings": response.content,
        "current_state": "EXTRACTING_REGULATORY_GAPS",
        "progress": 60
    }

def roadmap_devising_node(state: ReportState):
    print("[REPORT FSM] → STATE: ROADMAP_DEVISING (Step 4/5)")
    llm = get_llm()
    gaps = state["gap_findings"]
    
    prompt = f"""Devise a Strategic Remediation Roadmap based on these gaps:
    {gaps}
    
    Task: Create a 3-phase execution plan (Immediate, Mid-term, Long-term).
    Professional, emoji-free, and actionable.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    return {
        "remediation_roadmap": response.content,
        "current_state": "BUILDING_STRATEGIC_ROADMAP",
        "progress": 80
    }

def export_formatting_node(state: ReportState):
    print("[REPORT FSM] → STATE: EXPORT_FORMATTING (Step 5/5)")
    # This state prepares for the PDF generation wrapper
    print("[REPORT FSM] → AUDIT SUCCESSFUL. FINALIZING ASSETS.")
    return {
        "current_state": "GENERATING_PDF_ASSET",
        "progress": 100,
        "is_complete": True
    }

# --- Build the Graph ---
workflow = StateGraph(ReportState)

workflow.add_node("initial_data", initial_data_node)
workflow.add_node("risk_modeling", risk_modeling_node)
workflow.add_node("gap_analysis", gap_analysis_node)
workflow.add_node("roadmap_devising", roadmap_devising_node)
workflow.add_node("export_formatting", export_formatting_node)

workflow.set_entry_point("initial_data")
workflow.add_edge("initial_data", "risk_modeling")
workflow.add_edge("risk_modeling", "gap_analysis")
workflow.add_edge("gap_analysis", "roadmap_devising")
workflow.add_edge("roadmap_devising", "export_formatting")
workflow.add_edge("export_formatting", END)

report_app = workflow.compile()

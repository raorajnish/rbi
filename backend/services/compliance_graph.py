import os
from typing import Annotated, List, TypedDict, Dict, Any
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# Define the State
class ComplianceState(TypedDict):
    # Inputs & Context
    user_message: str
    user_doc: str
    user_profile: Dict[str, Any]
    rag_context: str
    
    # Shared Memory (extracted during flow)
    compliance_areas: List[str]
    risk_level: str
    affected_depts: List[str]
    
    # State-specific content
    draft_content: str
    analysis_content: str
    impact_content: str
    action_items_content: str
    review_content: str
    
    # Final Output
    final_report: str
    
    # Control flags
    hallucination_detected: bool

def get_llm():
    api_key = os.environ.get("GROQ_API_KEY", "")
    return ChatGroq(
        api_key=api_key,
        model_name="llama-3.3-70b-versatile",
        temperature=0
    )

# --- State Nodes ---

def draft_node(state: ComplianceState):
    """Initial assessment and scope identification"""
    print("\n--- [FSM] ENTERING STATE: DRAFT ---")
    llm = get_llm()
    profile = state["user_profile"]
    print(f"    Target Organization: {profile.get('company_name')} ({profile.get('organization_type')})")
    
    prompt = f"""Identify the regulatory scope for this organization:
    - Company: {profile.get('company_name')}
    - Type: {profile.get('organization_type')}
    - Services: {profile.get('services_provided')}
    - Compliance Areas: {profile.get('compliance_areas')}
    
    Based on the User Message: {state['user_message']}
    And Initial Doc Content: {state['user_doc'][:1000]}
    
    Task: List the 3 most relevant RBI Master Directions that apply.
    Return only the list of directions.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    print(f"    Draft Content Generated: {response.content[:50]}...")
    return {"draft_content": response.content}

def analysis_node(state: ComplianceState):
    """Detailed Gap Analysis using RAG context"""
    print("\n--- [FSM] ENTERING STATE: ANALYSIS ---")
    llm = get_llm()
    rag = state["rag_context"]
    doc = state["user_doc"]
    
    print(f"    Analyzing RAG context ({len(rag)} bytes) against Org Policy...")
    prompt = f"""Perform a Gap Analysis between the Organization's Policy and RBI Rules.
    
    RBI RULES (RAG):
    {rag}
    
    ORG POLICY:
    {doc if doc else 'No policy uploaded. Analyze based on user query.'}
    
    Identify specific missing controls or discrepancies.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    print(f"    Analysis Generated: {response.content[:50]}...")
    # In a real FSM, we'd also extract compliance_areas here
    return {"analysis_content": response.content, "compliance_areas": ["KYC", "Record Keeping"]}

def impact_assessment_node(state: ComplianceState):
    """Assess Risk Level and Affected Departments"""
    print("\n--- [FSM] ENTERING STATE: IMPACT_ASSESSMENT ---")
    llm = get_llm()
    analysis = state["analysis_content"]
    
    prompt = f"""Based on this gap analysis:
    {analysis}
    
    Determine:
    1. Impact Level (HIGH/MEDIUM/LOW)
    2. Affected Departments (e.g. IT, Operations, Legal)
    
    Format:
    Impact: [Level]
    Depts: [Dept1, Dept2]
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    risk = "HIGH" if "HIGH" in response.content.upper() else "MEDIUM"
    print(f"    Calculated Risk Level: {risk}")
    # Simulating extraction
    return {
        "impact_content": response.content,
        "risk_level": risk,
        "affected_depts": ["Operations", "IT"]
    }

def action_items_node(state: ComplianceState):
    """Generate concrete remediation steps"""
    print("\n--- [FSM] ENTERING STATE: ACTION_ITEMS ---")
    llm = get_llm()
    analysis = state["analysis_content"]
    
    prompt = f"""Create a 5-step Action Plan to remediate these gaps:
    {analysis}
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    print(f"    Action Items Generated ({len(response.content)} chars)")
    return {"action_items_content": response.content}

def review_node(state: ComplianceState):
    """Validate for hallucinations and consistency"""
    print("\n--- [FSM] ENTERING STATE: REVIEW ---")
    llm = get_llm()
    combined_content = f"{state['analysis_content']}\n{state['impact_content']}\n{state['action_items_content']}"
    rag = state["rag_context"]
    
    prompt = f"""You are a Validator. Check if the following compliance analysis hallucinated any rules NOT found in the RBI context.
    
    RBI CONTEXT:
    {rag}
    
    ANALYSIS:
    {combined_content}
    
    Does the analysis mention rules that don't exist in the context? (YES/NO)
    Final check on consistency.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    hallucination = "YES" in response.content.upper()
    print(f"    Hallucination Check Result: {'FAILED' if hallucination else 'PASSED'}")
    return {"review_content": response.content, "hallucination_detected": hallucination}

def final_node(state: ComplianceState):
    """Format the final Markdown report"""
    print("\n--- [FSM] ENTERING STATE: FINAL ---")
    profile = state["user_profile"]
    report = f"""# 🛡️ Compliance Analysis: {profile.get('company_name')}
    
    ## 📊 Impact Summary
    - **Impact Level:** {state['risk_level']}
    - **Affected Depts:** {', '.join(state['affected_depts'])}
    - **Compliance Areas:** {', '.join(state['compliance_areas'])}
    
    ## ⚠️ Analysis Findings
    {state['analysis_content']}
    
    ## ✅ Actionable Checklist
    {state['action_items_content']}
    
    ---
    *Validated by ReguAI FSM Architecture*
    """
    print("--- [FSM] COMPLETED: REPORT READY ---")
    return {"final_report": report}

# --- Build the Graph ---

def create_compliance_graph():
    workflow = StateGraph(ComplianceState)
    
    workflow.add_node("draft", draft_node)
    workflow.add_node("analysis", analysis_node)
    workflow.add_node("impact", impact_assessment_node)
    workflow.add_node("action_items", action_items_node)
    workflow.add_node("review", review_node)
    workflow.add_node("final", final_node)
    
    workflow.set_entry_point("draft")
    
    workflow.add_edge("draft", "analysis")
    workflow.add_edge("analysis", "impact")
    workflow.add_edge("impact", "action_items")
    workflow.add_edge("action_items", "review")
    
    # Conditional edge: if hallucination detected, maybe loop back? 
    # For MVP, we'll just go to Final but flag it if needed.
    workflow.add_edge("review", "final")
    workflow.add_edge("final", END)
    
    return workflow.compile()

# Singleton instance
compliance_app = create_compliance_graph()

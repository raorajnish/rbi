from fpdf import FPDF
import datetime
import os

class AuditReportPDF(FPDF):
    def header(self):
        # Logo placeholder
        self.set_fill_color(27, 38, 59) # var(--primary)
        self.rect(0, 0, 210, 40, 'F')
        
        self.set_font('helvetica', 'B', 24)
        self.set_text_color(255, 255, 255)
        self.cell(0, 20, 'RBI PILOT: COMPLIANCE AUDIT', ln=True, align='L')
        
        self.set_font('helvetica', 'I', 10)
        self.cell(0, -5, f'Generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}', ln=True, align='L')
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()} | Confidential Regulatory Document | ReguAI FSM Engine', align='C')

def generate_audit_pdf(data: dict, output_path: str):
    """
    Generates a professional PDF report from the FSM output data.
    """
    pdf = AuditReportPDF()
    pdf.add_page()
    
    # 1. Executive Summary
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(27, 38, 59)
    pdf.cell(0, 10, '1. EXECUTIVE SUMMARY', ln=True)
    pdf.set_font('helvetica', '', 11)
    pdf.set_text_color(0, 0, 0)
    
    summary_text = (
        f"This audit report serves as a formal evaluation for {data.get('company_name', 'N/A')}, "
        f"operating as a {data.get('org_type', 'N/A')}. The assessment focuses on aligning existing "
        f"operational policies with the latest RBI Master Directions and circulars."
    )
    pdf.multi_cell(0, 7, summary_text)
    pdf.ln(5)

    # 2. Risk Profile
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(27, 38, 59)
    pdf.cell(0, 10, '2. RISK ARCHITECTURE', ln=True)
    
    # Risk Box
    risk_level = data.get('risk_level', 'MEDIUM').upper()
    pdf.set_fill_color(255, 200, 200) if risk_level == 'HIGH' else pdf.set_fill_color(255, 255, 200)
    pdf.rect(10, pdf.get_y(), 190, 15, 'F')
    
    pdf.set_font('helvetica', 'B', 12)
    pdf.set_text_color(200, 0, 0) if risk_level == 'HIGH' else pdf.set_text_color(100, 100, 0)
    pdf.cell(0, 15, f'   ADVISORY IMPACT LEVEL: {risk_level}', ln=True)
    pdf.ln(5)

    # 3. Detailed Gap Analysis
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(27, 38, 59)
    pdf.cell(0, 10, '3. REGULATORY GAP ANALYSIS', ln=True)
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(0, 0, 0)
    
    analysis = data.get('analysis_content', 'No discrepancies found.')
    # Clean up markdown-like bolding for PDF
    analysis = analysis.replace('**', '').replace('##', '')
    pdf.multi_cell(0, 6, analysis)
    pdf.ln(10)

    # 4. Strategic Remediation Roadmap
    pdf.set_font('helvetica', 'B', 16)
    pdf.set_text_color(27, 38, 59)
    pdf.cell(0, 10, '4. REMEDIATION ROADMAP', ln=True)
    pdf.set_font('helvetica', '', 10)
    pdf.set_text_color(0, 0, 0)
    
    roadmap = data.get('action_plan', 'Follow standard RBI guidelines.')
    roadmap = roadmap.replace('**', '').replace('##', '')
    pdf.multi_cell(0, 6, roadmap)

    # Save
    pdf.output(output_path)
    return output_path

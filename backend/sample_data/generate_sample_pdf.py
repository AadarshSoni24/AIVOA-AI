import fitz  # PyMuPDF
import os

def create_sample_pharma_pdf(output_path: str):
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)  # Standard A4 size

    # Margin and coordinates
    x = 50
    y = 50

    # Draw header banner
    rect = fitz.Rect(50, 40, 545, 95)
    page.draw_rect(rect, color=(0.06, 0.09, 0.16), fill=(0.06, 0.09, 0.16)) # Slate-900

    page.insert_text(fitz.Point(65, 65), "AIVOA PHARMACEUTICALS - QUALITY MANAGEMENT SYSTEM", fontsize=11, color=(0.8, 0.85, 0.9), fontname="helv")
    page.insert_text(fitz.Point(65, 83), "INTERNAL DEVIATION & QUALITY INCIDENT REPORT", fontsize=15, color=(1, 1, 1), fontname="helv")

    y = 120
    # Metadata Box
    page.draw_rect(fitz.Rect(50, 110, 545, 230), color=(0.8, 0.85, 0.9), fill=(0.97, 0.98, 1.0))
    page.insert_text(fitz.Point(65, 130), "DEVIATION IDENTIFIER: DEV-2026-0814", fontsize=11, color=(0.05, 0.2, 0.4), fontname="helv")
    page.insert_text(fitz.Point(320, 130), "LOGGED DATE: 2026-07-14", fontsize=10, color=(0.3, 0.3, 0.3), fontname="helv")

    fields = [
        ("Product Name:", "Metformin Hydrochloride API", "Batch/Lot Number:", "MFH260712A"),
        ("Pharmacopeial Grade:", "USP / BP / IP Grade", "Manufacturing Date:", "2026-07-12"),
        ("Manufacturing Suite:", "API Block-3, Synthesis Suite B", "Expiry Date:", "2031-07-11"),
        ("Affected Quantity:", "150 kg (6 HDPE Drums)", "Detection Method:", "QC Release Testing (HPLC)"),
        ("Incident Classification:", "Major Process Deviation", "Immediate Status:", "Quarantine Hold (QA Block)"),
    ]

    fy = 150
    for col1_lbl, col1_val, col2_lbl, col2_val in fields:
        page.insert_text(fitz.Point(65, fy), f"{col1_lbl} {col1_val}", fontsize=9, color=(0.1, 0.1, 0.1), fontname="helv")
        page.insert_text(fitz.Point(320, fy), f"{col2_lbl} {col2_val}", fontsize=9, color=(0.1, 0.1, 0.1), fontname="helv")
        fy += 15

    # Section 1: Deviation Summary
    y = 250
    page.insert_text(fitz.Point(50, y), "1. INCIDENT DESCRIPTION & PROBLEM STATEMENT", fontsize=12, color=(0.06, 0.09, 0.16), fontname="helv")
    page.draw_line(fitz.Point(50, y + 4), fitz.Point(545, y + 4), color=(0.06, 0.09, 0.16), width=1)

    y = 270
    desc_text = (
        "During finished product QC release testing for Metformin Hydrochloride API batch MFH260712A, "
        "the analytical laboratory reported an out-of-specification (OOS) assay result of 97.2% w/w on anhydrous basis. "
        "The approved finished product release specification is 98.0% to 102.0% w/w.\n\n"
        "Initial laboratory Phase I investigation confirmed no analytical, calculation, or standard preparation errors. "
        "Replicate injections on secondary column confirmed assay value at 97.18%. "
        "Investigation escalated to manufacturing operations."
    )
    rect_desc = fitz.Rect(50, y, 545, y + 80)
    page.insert_textbox(rect_desc, desc_text, fontsize=9.5, fontname="helv", color=(0.2, 0.2, 0.2))

    # Section 2: Process & Environmental Observations
    y = 370
    page.insert_text(fitz.Point(50, y), "2. PROCESS & OPERATIONAL EVIDENCE COLLECTED", fontsize=12, color=(0.06, 0.09, 0.16), fontname="helv")
    page.draw_line(fitz.Point(50, y + 4), fitz.Point(545, y + 4), color=(0.06, 0.09, 0.16), width=1)

    y = 390
    obs_text = (
        "1. Fluidized Bed Dryer (FBD-301) SCADA logs indicate drying air inlet temperature spiked to 74°C for 45 minutes.\n"
        "   SOP-PR-304 mandates drying temperature of 60°C - 65°C.\n"
        "2. Thermal decomposition check revealed elevated trace related substance impurity B at 0.18% (specification < 0.10%).\n"
        "3. Steam modulation valve (SMV-301) actuator feedback loop showed intermittent sticking.\n"
        "4. Shift hand-over log states operator manually bypassed high-temperature warning alarm at 03:45 AM."
    )
    rect_obs = fitz.Rect(50, y, 545, y + 80)
    page.insert_textbox(rect_obs, obs_text, fontsize=9.5, fontname="helv", color=(0.2, 0.2, 0.2))

    # Section 3: Immediate Containment Actions
    y = 490
    page.insert_text(fitz.Point(50, y), "3. IMMEDIATE CONTAINMENT ACTIONS TAKEN", fontsize=12, color=(0.06, 0.09, 0.16), fontname="helv")
    page.draw_line(fitz.Point(50, y + 4), fitz.Point(545, y + 4), color=(0.06, 0.09, 0.16), width=1)

    y = 510
    cont_text = (
        "• Batch MFH260712A (all 6 HDPE drums totaling 150 kg) was affixed with QA Quarantine tags and moved to Secure Quarantine Room Q-2.\n"
        "• SAP Material Management status locked to Blocked Stock (status 'S').\n"
        "• Dryer FBD-301 tagged out of service with Red Tag pending engineering calibration."
    )
    rect_cont = fitz.Rect(50, y, 545, y + 60)
    page.insert_textbox(rect_cont, cont_text, fontsize=9.5, fontname="helv", color=(0.2, 0.2, 0.2))

    # Section 4: Signatures & Sign-off
    y = 600
    page.insert_text(fitz.Point(50, y), "4. INVESTIGATION ASSIGNMENT", fontsize=12, color=(0.06, 0.09, 0.16), fontname="helv")
    page.draw_line(fitz.Point(50, y + 4), fitz.Point(545, y + 4), color=(0.06, 0.09, 0.16), width=1)

    y = 620
    page.insert_text(fitz.Point(50, y), "Lead Investigator: Dr. Arvind Sharma (Senior QA Specialist)", fontsize=9.5, fontname="helv")
    page.insert_text(fitz.Point(50, y + 16), "Target Closure Date: 2026-07-28 (14-day SLA)", fontsize=9.5, fontname="helv")
    page.insert_text(fitz.Point(50, y + 32), "Methodology Prescribed: 5 Whys Root Cause Analysis and 6M Fishbone Diagram", fontsize=9.5, fontname="helv")

    # Footer
    page.draw_line(fitz.Point(50, 780), fitz.Point(545, 780), color=(0.7, 0.7, 0.7), width=0.5)
    page.insert_text(fitz.Point(50, 795), "AIVOA.AI Quality Management System - Confidential GxP Regulatory Document", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")
    page.insert_text(fitz.Point(480, 795), "Page 1 of 1", fontsize=8, color=(0.5, 0.5, 0.5), fontname="helv")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"Sample PDF successfully generated at: {output_path}")

if __name__ == "__main__":
    out = os.path.abspath(r"c:\Users\aadar\AIVOVA AI\backend\sample_data\sample_incident.pdf")
    create_sample_pharma_pdf(out)


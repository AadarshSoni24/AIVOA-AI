import os
import fitz  # PyMuPDF

def generate_cgmp_pdf(filepath: str):
    doc = fitz.open()

    # ----------------------------------------------------
    # PAGE 1
    # ----------------------------------------------------
    page1 = doc.new_page(width=595, height=842) # A4
    
    # Header background
    page1.draw_rect(fitz.Rect(0, 0, 595, 60), color=None, fill=(0.06, 0.09, 0.16)) # Dark slate header
    page1.insert_text(fitz.Point(30, 26), "AIVOA PHARMACEUTICALS PRIVATE LIMITED", fontsize=13, fontname="helv", color=(1, 1, 1))
    page1.insert_text(fitz.Point(30, 42), "GLOBAL QUALITY ASSURANCE & REGULATORY COMPLIANCE DIVISION", fontsize=8.5, fontname="helv", color=(0.8, 0.85, 0.95))
    page1.insert_text(fitz.Point(430, 34), "CONFIDENTIAL GxP", fontsize=10, fontname="helv", color=(0.95, 0.75, 0.2))

    # Document Banner
    page1.draw_rect(fitz.Rect(30, 75, 565, 115), color=(0.7, 0.75, 0.85), fill=(0.96, 0.97, 0.99))
    page1.insert_text(fitz.Point(40, 93), "FORMAL DEVIATION & OUT-OF-SPECIFICATION (OOS) INVESTIGATION REPORT", fontsize=10, fontname="helv", color=(0.1, 0.15, 0.3))
    page1.insert_text(fitz.Point(40, 107), "Document ID: DEV-2026-0814  |  QMS Reference: QMS-OOS-26-042  |  Logged Date: 2026-07-14", fontsize=8.5, fontname="helv", color=(0.3, 0.35, 0.45))

    # SECTION 1: Batch & Material Information Table
    page1.draw_rect(fitz.Rect(30, 130, 565, 275), color=(0.8, 0.83, 0.9), fill=(1, 1, 1))
    page1.draw_rect(fitz.Rect(30, 130, 565, 150), color=None, fill=(0.91, 0.93, 0.97))
    page1.insert_text(fitz.Point(40, 144), "1. BATCH & ACTIVE PHARMACEUTICAL INGREDIENT (API) IDENTIFICATION", fontsize=9, fontname="helv", color=(0.1, 0.15, 0.3))

    table_data_p1 = [
        ("Product Name:", "Metformin Hydrochloride API", "Batch / Lot Number:", "MFH260712A"),
        ("Pharmacopoeial Grade:", "USP / Ph. Eur. / IP Grade", "Manufacturing Date:", "2026-07-12"),
        ("Manufacturing Facility:", "API Block-3, Synthesis Suite B", "Expiry / Retest Date:", "2031-07-11 (60 Months)"),
        ("Batch Quantity Affected:", "150 kg (6 HDPE Drums, 25 kg/drum)", "Packaging Configuration:", "Double Polyethylene (LDPE) Liners"),
        ("Dedicated Equipment Train:", "Reactor R-301, Centrifuge CF-201, Fluidized Bed Dryer FBD-301", "Investigation Category:", "OOS - QC Assay Out of Specification"),
        ("Detection Method:", "QC Release Testing (HPLC Method STP-MET-004)", "Initial Severity Classification:", "Major Process Deviation")
    ]

    y = 166
    for row in table_data_p1:
        page1.insert_text(fitz.Point(40, y), row[0], fontsize=8, fontname="helv", color=(0.4, 0.45, 0.55))
        page1.insert_text(fitz.Point(145, y), row[1], fontsize=8.5, fontname="helv", color=(0.1, 0.12, 0.2))
        page1.insert_text(fitz.Point(315, y), row[2], fontsize=8, fontname="helv", color=(0.4, 0.45, 0.55))
        page1.insert_text(fitz.Point(435, y), row[3], fontsize=8.5, fontname="helv", color=(0.1, 0.12, 0.2))
        page1.draw_line(fitz.Point(30, y + 4), fitz.Point(565, y + 4), color=(0.92, 0.93, 0.96))
        y += 19

    # SECTION 2: Incident Problem Statement & Analytical Results
    page1.draw_rect(fitz.Rect(30, 290, 565, 455), color=(0.8, 0.83, 0.9), fill=(1, 1, 1))
    page1.draw_rect(fitz.Rect(30, 290, 565, 310), color=None, fill=(0.91, 0.93, 0.97))
    page1.insert_text(fitz.Point(40, 304), "2. INCIDENT DESCRIPTION & OUT-OF-SPECIFICATION FINDINGS", fontsize=9, fontname="helv", color=(0.1, 0.15, 0.3))

    desc_text = (
        "During routine QC release testing of Metformin Hydrochloride API batch MFH260712A, the QC analytical laboratory "
        "reported an assay result of 97.20% w/w (on dried basis), which fails the approved USP/Ph. Eur. release specification "
        "of 98.0% to 102.0% w/w. The initial duplicate analysis was performed on HPLC instrument HPLC-08 per standard test "
        "procedure STP-QC-MET-004.\n\n"
        "Duplicate injection re-test yielded 97.18% w/w, confirming the Out-of-Specification (OOS) condition. All other chemical "
        "parameters tested complied with release limits: Related Substance Impurity B (Dicyandiamide) was detected at 0.08% "
        "(limit NMT 0.10%), Loss on Drying was 0.32% (limit NMT 0.50%), and heavy metals were within USP limits. Because this batch "
        "fails the primary assay release specification, it cannot be certified for commercial release and was placed under immediate "
        "QA quarantine lock."
    )
    page1.insert_textbox(fitz.Rect(40, 316, 555, 445), desc_text, fontsize=8.5, fontname="helv", color=(0.15, 0.18, 0.25))

    # SECTION 3: Immediate Containment Actions Taken
    page1.draw_rect(fitz.Rect(30, 470, 565, 630), color=(0.8, 0.83, 0.9), fill=(1, 1, 1))
    page1.draw_rect(fitz.Rect(30, 470, 565, 490), color=None, fill=(0.91, 0.93, 0.97))
    page1.insert_text(fitz.Point(40, 484), "3. IMMEDIATE CONTAINMENT ACTIONS & QUARANTINE STATUS", fontsize=9, fontname="helv", color=(0.1, 0.15, 0.3))

    containment_text = (
        "- Physical Quarantine: All 6 HDPE drums (150 kg net weight) of batch MFH260712A were affixed with fluorescent red "
        "QA Quarantine Hold labels and immediately transferred to Secure Quarantine Room Q-2 under dual padlock authorization.\n"
        "- ERP System Block: The SAP Material Management status was locked to Blocked Stock (Status 'S'), preventing any warehouse "
        "transfer, customer reservation, or shipping authorization.\n"
        "- Equipment Lockout: Fluidized Bed Dryer FBD-301 was tagged out of service with a Red Maintenance Tag pending instrumentation "
        "and temperature sensor calibration verification.\n"
        "- Traceback & Adjoining Batches: Preceding batch MFH260711Z and succeeding batch MFH260713B were inspected; process batch records "
        "confirm no physical crossover or equipment contamination occurred."
    )
    page1.insert_textbox(fitz.Rect(40, 496, 555, 620), containment_text, fontsize=8.5, fontname="helv", color=(0.15, 0.18, 0.25))

    # Section 4: Risk Evaluation
    page1.draw_rect(fitz.Rect(30, 645, 565, 765), color=(0.85, 0.75, 0.6), fill=(0.99, 0.97, 0.94)) # Amber tint
    page1.insert_text(fitz.Point(40, 663), "4. INITIAL GxP RISK EVALUATION", fontsize=9, fontname="helv", color=(0.6, 0.35, 0.05))
    risk_text = (
        "Classification: MAJOR RISK (Risk Priority Score: 15 / 25).\n"
        "Patient Impact: Nil currently, as the batch is completely isolated in quarantine before commercial release. If released "
        "sub-potent, reduced therapeutic efficacy could occur in type-2 diabetes management.\n"
        "Regulatory & Compliance Impact: High. An OOS investigation must follow FDA 21 CFR 211.192 and EU GMP Annex 16 guidelines. "
        "Investigation SLA is 14 calendar days with mandated QP sign-off."
    )
    page1.insert_textbox(fitz.Rect(40, 673, 555, 755), risk_text, fontsize=8.5, fontname="helv", color=(0.35, 0.22, 0.05))

    # Page 1 Footer
    page1.draw_line(fitz.Point(30, 790), fitz.Point(565, 790), color=(0.8, 0.8, 0.85))
    page1.insert_text(fitz.Point(30, 805), "AIVOA QMS | GxP Deviation Report DEV-2026-0814", fontsize=7.5, fontname="helv", color=(0.5, 0.55, 0.6))
    page1.insert_text(fitz.Point(510, 805), "Page 1 of 2", fontsize=7.5, fontname="helv", color=(0.5, 0.55, 0.6))

    # ----------------------------------------------------
    # PAGE 2
    # ----------------------------------------------------
    page2 = doc.new_page(width=595, height=842)

    # Header banner
    page2.draw_rect(fitz.Rect(0, 0, 595, 45), color=None, fill=(0.06, 0.09, 0.16))
    page2.insert_text(fitz.Point(30, 28), "AIVOA PHARMACEUTICALS - INVESTIGATION WORKFLOW & PROCESS EVIDENCE", fontsize=10, fontname="helv", color=(1, 1, 1))

    # SECTION 5: Process Operational Investigation & SCADA Trends
    page2.draw_rect(fitz.Rect(30, 60, 565, 230), color=(0.8, 0.83, 0.9), fill=(1, 1, 1))
    page2.draw_rect(fitz.Rect(30, 60, 565, 80), color=None, fill=(0.91, 0.93, 0.97))
    page2.insert_text(fitz.Point(40, 74), "5. PROCESS OPERATIONAL FORENSICS & SCADA TREND AUDIT", fontsize=9, fontname="helv", color=(0.1, 0.15, 0.3))

    proc_text = (
        "A rigorous audit of the manufacturing batch record (BMR # BMR-MET-2026-088) and SCADA automation trends revealed "
        "two critical operational deviations during Stage-4 manufacturing:\n\n"
        "1. Fluid Bed Drying Thermal Excursion: During drying in FBD-301 (12-Jul-2026, 14:10 to 14:38 IST), product thermocouple "
        "TE-302 logged an anomalous temperature excursion spiking from target setpoint 65°C to 74.2°C for 28 minutes. Operator log "
        "notes that chilled water valve CV-102 pneumatic actuator had a delayed response, causing localized overheating.\n\n"
        "2. Mother Liquor Secondary Wash Loss: Mother liquor assay analysis from Centrifuge CF-201 filtrate showed a 2.8% API loss "
        "during the post-crystallization solvent wash, indicating incomplete crystallization before spinning caused by inadequate "
        "cooling bath stabilization (crystallizer remained at 22°C instead of standard 16-18°C setpoint)."
    )
    page2.insert_textbox(fitz.Rect(40, 88, 555, 220), proc_text, fontsize=8.5, fontname="helv", color=(0.15, 0.18, 0.25))

    # SECTION 6: Laboratory Phase I Testing
    page2.draw_rect(fitz.Rect(30, 245, 565, 385), color=(0.8, 0.83, 0.9), fill=(1, 1, 1))
    page2.draw_rect(fitz.Rect(30, 245, 565, 265), color=None, fill=(0.91, 0.93, 0.97))
    page2.insert_text(fitz.Point(40, 259), "6. QC LABORATORY PHASE I TESTING & SYSTEM SUITABILITY", fontsize=9, fontname="helv", color=(0.1, 0.15, 0.3))

    lab_text = (
        "- Analyst Verification: The testing chemist was fully qualified and certified on analytical method STP-QC-MET-004.\n"
        "- HPLC System Performance: System suitability parameters passed (Retention time: 6.42 min, USP theoretical plates: 3,840 "
        "[criterion: >2,500], tailing factor: 1.18 [criterion: <1.5], RSD of 6 replicate injections of standard: 0.42% [criterion: <1.0%]).\n"
        "- Reference Standard & Glassware: Metformin standard lot RS-MET-2025-09 was within valid expiry. Grade-A calibrated volumetric "
        "flasks and pipettes were verified.\n"
        "- Conclusion: No laboratory testing calculation or dilution error was detected; the OOS is attributed to a genuine manufacturing process variation."
    )
    page2.insert_textbox(fitz.Rect(40, 273, 555, 375), lab_text, fontsize=8.5, fontname="helv", color=(0.15, 0.18, 0.25))

    # SECTION 7: Missing Evidence Gaps (Mandatory for Investigation Closure)
    page2.draw_rect(fitz.Rect(30, 400, 565, 570), color=(0.8, 0.83, 0.9), fill=(1, 1, 1))
    page2.draw_rect(fitz.Rect(30, 400, 565, 420), color=None, fill=(0.91, 0.93, 0.97))
    page2.insert_text(fitz.Point(40, 414), "7. CRITICAL MISSING EVIDENCE GAPS IDENTIFIED FOR ROOT CAUSE CLOSURE", fontsize=9, fontname="helv", color=(0.1, 0.15, 0.3))

    gaps_text = (
        "To achieve defensible regulatory closure, the Lead Investigator must collect and verify the following 4 evidence items:\n\n"
        "1. Calibration and qualification records for the HPLC system and analytical balance BAL-042 on the testing day (14-Jul-2026).\n"
        "2. Fluidized bed dryer FBD-301 thermocouple TE-302 temperature trend logs and 6-month calibration log sheet.\n"
        "3. Raw material vendor Certificate of Analysis (CoA) and inbound quarantine batch release verification for Dimethylamine HCl.\n"
        "4. Preventative maintenance records and pneumatic seal integrity inspection for chilled water valve CV-102."
    )
    page2.insert_textbox(fitz.Rect(40, 428, 555, 560), gaps_text, fontsize=8.5, fontname="helv", color=(0.15, 0.18, 0.25))

    # SECTION 8: Assignment & Signatures
    page2.draw_rect(fitz.Rect(30, 585, 565, 765), color=(0.8, 0.83, 0.9), fill=(0.98, 0.99, 1))
    page2.draw_rect(fitz.Rect(30, 585, 565, 605), color=None, fill=(0.91, 0.93, 0.97))
    page2.insert_text(fitz.Point(40, 599), "8. INVESTIGATION TEAM ASSIGNMENT & GxP APPROVAL SIGN-OFF", fontsize=9, fontname="helv", color=(0.1, 0.15, 0.3))

    page2.insert_text(fitz.Point(40, 625), "Lead Investigator:  Dr. Arvind Sharma (Senior QA Specialist)", fontsize=8.5, fontname="helv", color=(0.1, 0.15, 0.3))
    page2.insert_text(fitz.Point(40, 642), "Prescribed Investigation Methods:  5 Whys Root Cause Analysis and Ishikawa 6M Fishbone Diagram", fontsize=8.5, fontname="helv", color=(0.1, 0.15, 0.3))
    page2.insert_text(fitz.Point(40, 659), "Mandated Target Closure Date:  2026-07-28 (14-Calendar-Day SLA)", fontsize=8.5, fontname="helv", color=(0.1, 0.15, 0.3))

    # Signature boxes
    page2.draw_rect(fitz.Rect(45, 680, 185, 745), color=(0.7, 0.75, 0.85), fill=(1, 1, 1))
    page2.insert_text(fitz.Point(52, 698), "Prepared by:", fontsize=7.5, fontname="helv", color=(0.5, 0.55, 0.6))
    page2.insert_text(fitz.Point(52, 715), "Rajesh Kulkarni", fontsize=8.5, fontname="times-italic", color=(0.1, 0.2, 0.5))
    page2.insert_text(fitz.Point(52, 735), "QC Analyst | 14-Jul-2026", fontsize=7.5, fontname="helv", color=(0.3, 0.3, 0.3))

    page2.draw_rect(fitz.Rect(210, 680, 360, 745), color=(0.7, 0.75, 0.85), fill=(1, 1, 1))
    page2.insert_text(fitz.Point(217, 698), "Investigated by:", fontsize=7.5, fontname="helv", color=(0.5, 0.55, 0.6))
    page2.insert_text(fitz.Point(217, 715), "Dr. Arvind Sharma", fontsize=8.5, fontname="times-italic", color=(0.1, 0.2, 0.5))
    page2.insert_text(fitz.Point(217, 735), "Principal QA Engineer | 14-Jul-2026", fontsize=7.5, fontname="helv", color=(0.3, 0.3, 0.3))

    page2.draw_rect(fitz.Rect(385, 680, 545, 745), color=(0.7, 0.75, 0.85), fill=(1, 1, 1))
    page2.insert_text(fitz.Point(392, 698), "Approved by QP:", fontsize=7.5, fontname="helv", color=(0.5, 0.55, 0.6))
    page2.insert_text(fitz.Point(392, 715), "Sunita Rao", fontsize=8.5, fontname="times-italic", color=(0.1, 0.2, 0.5))
    page2.insert_text(fitz.Point(392, 735), "Qualified Person (QP) | 14-Jul-2026", fontsize=7.5, fontname="helv", color=(0.3, 0.3, 0.3))

    # Page 2 Footer
    page2.draw_line(fitz.Point(30, 790), fitz.Point(565, 790), color=(0.8, 0.8, 0.85))
    page2.insert_text(fitz.Point(30, 805), "AIVOA QMS | GxP Deviation Report DEV-2026-0814", fontsize=7.5, fontname="helv", color=(0.5, 0.55, 0.6))
    page2.insert_text(fitz.Point(510, 805), "Page 2 of 2", fontsize=7.5, fontname="helv", color=(0.5, 0.55, 0.6))

    doc.save(filepath)
    doc.close()
    print(f"Generated professional cGMP incident PDF at: {filepath}")

if __name__ == "__main__":
    out_path = os.path.join(os.path.dirname(__file__), "sample_data", "sample_incident.pdf")
    generate_cgmp_pdf(out_path)

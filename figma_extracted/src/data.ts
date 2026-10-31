export type ReviewStatus = "Hypothesis" | "Under Investigation" | "Evidence Supported" | "Human Confirmed" | "Rejected"
export type Cause = {
  id: string
  title: string
  category: string
  description: string
  confidence: string
  supporting: string
  contradicting: string
  missing: string
  verification: string
  status: ReviewStatus
}
export const initialCauses: Cause[] = [
  {
    id: "RC-01",
    title: "HPLC reference standard preparation error",
    category: "Measurement",
    description:
      "An incorrect reference standard concentration may have introduced a systematic bias, resulting in an artificially low assay value.",
    confidence: "High confidence",
    supporting:
      "Standard preparation record shows a manual dilution; no independent verification documented.",
    contradicting:
      "System suitability results were within acceptance criteria.",
    missing: "Independent standard preparation and repeat assay results.",
    verification:
      "Prepare a fresh reference standard independently and repeat the assay on the retained sample.",
    status: "Evidence Supported",
  },
  {
    id: "RC-02",
    title: "Incomplete reaction or impurity carryover",
    category: "Material",
    description:
      "Residual process impurities may have reduced the effective API content in the final material.",
    confidence: "Medium confidence",
    supporting:
      "A minor unidentified peak was observed in the HPLC chromatogram.",
    contradicting:
      "In-process reaction endpoint met the approved acceptance criteria.",
    missing: "Related substances profile and reaction endpoint raw data.",
    verification:
      "Review the impurity profile and compare against the previous three batches.",
    status: "Hypothesis",
  },
  {
    id: "RC-03",
    title: "Insufficient drying time",
    category: "Method",
    description:
      "Residual moisture from a shortened drying cycle may have lowered the assay result on an as-is basis.",
    confidence: "Medium confidence",
    supporting:
      "Drying duration was at the lower end of the validated operating range.",
    contradicting:
      "Recorded loss on drying was within the release specification.",
    missing: "Dryer temperature trend and sample location records.",
    verification:
      "Review the full drying trend and repeat moisture testing on representative samples.",
    status: "Under Investigation",
  },
]
export const whys = [
  {
    question: "Why was the batch placed on hold?",
    answer: "The final assay was 97.2%, below the 98.0–102.0% specification.",
    evidence: "QC analytical report · page 2",
  },
  {
    question: "Why was the measured assay below specification?",
    answer:
      "The HPLC result may reflect a bias in reference standard concentration.",
    evidence: "Analyst worksheet · section 4.2",
  },
  {
    question: "Why could the standard concentration be incorrect?",
    answer:
      "A manual dilution was performed without a documented independent check.",
    evidence: "Standard preparation record · page 3",
  },
  {
    question: "Why was the dilution not independently checked?",
    answer:
      "The current SOP does not explicitly require a second-person verification.",
    evidence: "SOP-QC-014 · revision 06",
  },
  {
    question: "Why is verification not required by the SOP?",
    answer:
      "The risk assessment did not identify manual dilution as a critical control point.",
    evidence: "AI hypothesis · verification needed",
  },
]
export const initialCapas = [
  {
    id: "CA-01",
    type: "Corrective",
    title: "Repeat assay with an independently prepared standard",
    rationale:
      "Verify whether the original result was affected by standard preparation bias.",
    root: "RC-01",
    department: "Quality Control",
    priority: "High",
    date: "18 Jul 2026",
    check: "Two independent assays within 98.0–102.0%.",
    status: "Proposed",
  },
  {
    id: "PA-01",
    type: "Preventive",
    title: "Introduce dual verification for standard preparation",
    rationale:
      "Prevent undetected dilution errors through an independent second-person check.",
    root: "RC-01",
    department: "Quality Assurance",
    priority: "High",
    date: "30 Jul 2026",
    check: "100% compliance across the next 10 preparations.",
    status: "Proposed",
  },
  {
    id: "CA-02",
    type: "Corrective",
    title: "Review impurity profile and drying records",
    rationale: "Evaluate material and process-related alternative root causes.",
    root: "RC-02 / RC-03",
    department: "Manufacturing",
    priority: "Medium",
    date: "20 Jul 2026",
    check: "Complete documented review with QA approval.",
    status: "Proposed",
  },
  {
    id: "PA-02",
    type: "Preventive",
    title: "Update SOP-QC-014 and train laboratory analysts",
    rationale:
      "Embed critical preparation controls into the approved procedure.",
    root: "RC-01",
    department: "Quality Assurance",
    priority: "Medium",
    date: "05 Aug 2026",
    check: "All analysts trained; follow-up audit after 30 days.",
    status: "Proposed",
  },
]
export const evidenceItems = [
  {
    title: "QC analytical report",
    detail: "Assay result, chromatogram & system suitability",
    available: true,
  },
  {
    title: "Batch manufacturing record",
    detail: "Process parameters and in-process controls",
    available: true,
  },
  {
    title: "Standard preparation worksheet",
    detail: "Verify weighing and dilution calculations",
    available: true,
  },
  {
    title: "Independent repeat assay",
    detail: "Required to confirm analytical bias",
    available: false,
  },
  {
    title: "Related substances profile",
    detail: "Rule out impurity carryover",
    available: false,
  },
]

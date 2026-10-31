/**
 * DEV-ONLY MOCK ADAPTER
 * Returns canned contract responses for development and testing.
 * Active ONLY when VITE_USE_MOCK_API=true.
 * Fully isolated; only imported inside client.ts behind the environment switch.
 */

import {
  Investigation,
  CopilotResponseContract,
  InvestigationSummary,
  createEmptyInvestigation
} from '../features/investigation/types';

// In-memory mock database of saved investigations
let mockSavedInvestigations: Investigation[] = [
  {
    ...createEmptyInvestigation(),
    id: 'inv-metformin-001',
    investigation_no: 'RCA-2026-0001',
    status: 'saved',
    incident: {
      title: 'Out-of-specification assay result',
      description: 'Final API assay 97.2%, below the approved specification of 98.0–102.0%. Observed during QC release testing.',
      source_reference: 'QC/OOS/2026/089',
      date_occurrence: '14 July 2026',
      date_discovery: '14 July 2026',
      department: 'Quality Control',
      facility: 'Hyderabad · Unit II',
      reported_by: 'Quality Assurance',
      category: 'OOS Assay',
      detection_method: 'HPLC Release Assay',
      initial_severity: 'Major'
    },
    product: {
      name: 'Metformin Hydrochloride API',
      grade: 'USP / Ph.Eur.',
      batch_number: 'MFH260712A',
      manufacturing_stage: 'Final API Bulk Packaging',
      manufacturing_date: '12 July 2026',
      equipment: 'HPLC Waters-04 / Fluidized Bed Dryer FBD-301',
      affected_quantity: '500',
      unit: 'kg',
      production_details: 'Standard wet granulation and drying synthesis'
    },
    impact: {
      expected_condition: '98.0% – 102.0% (Assay as-is basis)',
      actual_condition: '97.2% (OOS)',
      quality_impact: 'Sub-potent active pharmaceutical ingredient batch',
      product_impact: 'Batch cannot be released for finished formulation packaging',
      patient_impact: 'Risk of clinical underdosing if released',
      containment_actions: 'Batch placed on physical warehouse quarantine and ERP system hold'
    },
    risk: {
      severity: 'Major',
      containment_required: true,
      next_action: 'Verify HPLC standard preparation',
      rationale: 'Below-specification assay may impact potency. Rule out analytical error before evaluating process causes.',
      occurrence: 'Infrequent (1 in 45 batches)',
      detectability: 'High (Caught at routine release HPLC)'
    },
    evidence: [
      {
        id: 'ev-1',
        kind: 'Analytical Report',
        description: 'QC analytical report · Assay result 97.2%, chromatograms and system suitability passed.',
        availability: 'available',
        why_needed: 'Primary OOS detection record',
        source_quote: 'Assay value: 97.2% against specification 98.0-102.0%'
      },
      {
        id: 'ev-2',
        kind: 'Batch Record',
        description: 'Batch manufacturing record · Process parameters and in-process controls within operating envelope.',
        availability: 'available',
        why_needed: 'Verify process parameter anomalies',
        source_quote: 'Synthesis temperatures and reaction times compliant with BMR-MFH-012'
      },
      {
        id: 'ev-3',
        kind: 'Worksheet',
        description: 'Standard preparation worksheet · Analyst manual volumetric dilution recorded.',
        availability: 'available',
        why_needed: 'Check dilution calculations and analyst checks',
        source_quote: 'Manual 5mL to 100mL flask dilution performed'
      },
      {
        id: 'ev-4',
        kind: 'Repeat Testing',
        description: 'Independent repeat assay · Required to confirm analytical preparation bias.',
        availability: 'missing',
        why_needed: 'Confirms whether error was analyst-dependent or true batch deficiency',
        source_quote: ''
      },
      {
        id: 'ev-5',
        kind: 'Impurity Profile',
        description: 'Related substances profile · Required to rule out process impurity carryover.',
        availability: 'missing',
        why_needed: 'Ensures no co-eluting degradants suppressed the main peak area',
        source_quote: ''
      }
    ],
    investigation_method: 'both',
    root_causes: [
      {
        id: 'RC-01',
        category: 'measurement',
        kind: 'candidate',
        statement: 'HPLC reference standard preparation error',
        explanation: 'An incorrect reference standard concentration introduced a systematic bias, resulting in an artificially depressed assay result.',
        supporting_evidence: ['Standard preparation record shows manual pipetting without documented second-person check.'],
        contradicting_evidence: ['HPLC system suitability parameters (RSD, tailing factor) met acceptance criteria.'],
        missing_evidence: ['Independent reference standard repeat assay results.'],
        verification_steps: ['Prepare fresh working standard independently and re-inject retained sample in duplicate.'],
        confidence: 'high',
        status: 'evidence_supported'
      },
      {
        id: 'RC-02',
        category: 'material',
        kind: 'contributing_factor',
        statement: 'Incomplete reaction or process impurity carryover',
        explanation: 'Residual unreacted intermediates or degradation products may have reduced the effective percentage of active API.',
        supporting_evidence: ['Minor unquantified peak observed adjacent to the main retention time.'],
        contradicting_evidence: ['In-process reaction endpoint chromatographic testing passed.'],
        missing_evidence: ['Related substances quantitative profile analysis.'],
        verification_steps: ['Overlay HPLC chromatogram with previous 3 release batches.'],
        confidence: 'medium',
        status: 'hypothesis'
      },
      {
        id: 'RC-03',
        category: 'method',
        kind: 'contributing_factor',
        statement: 'Insufficient fluid bed drying time',
        explanation: 'Residual moisture from a drying cycle run at the low end of the time specification lowered assay on an as-is basis.',
        supporting_evidence: ['Drying duration was 45 min, near lower validated boundary of 45-60 min.'],
        contradicting_evidence: ['Recorded loss on drying (LOD) was 0.38%, within the <0.5% release limit.'],
        missing_evidence: ['Dryer thermal mapping trend logs.'],
        verification_steps: ['Review continuous thermocouple logs and re-verify Karl Fischer moisture content.'],
        confidence: 'medium',
        status: 'under_investigation'
      }
    ],
    why_steps: [
      { id: 'ws-1', root_cause_id: 'RC-01', step_no: 1, question: 'Why was the API batch placed on hold?', answer: 'The final QC release assay measured 97.2%, failing the 98.0–102.0% specification.' },
      { id: 'ws-2', root_cause_id: 'RC-01', step_no: 2, question: 'Why was the measured assay below specification?', answer: 'The HPLC peak area response reflected a systematic bias in reference standard concentration.' },
      { id: 'ws-3', root_cause_id: 'RC-01', step_no: 3, question: 'Why could the reference standard concentration be inaccurate?', answer: 'A manual serial dilution was performed without documented balance weight verification or secondary review.' },
      { id: 'ws-4', root_cause_id: 'RC-01', step_no: 4, question: 'Why was the dilution not independently verified?', answer: 'Current SOP-QC-014 revision 06 did not mandate four-eyes verification for primary standard preparation.' },
      { id: 'ws-5', root_cause_id: 'RC-01', step_no: 5, question: 'Why does the SOP lack secondary verification controls?', answer: 'Previous analytical quality risk assessments classified standard preparation as low risk, omitting independent witness checkpoints.' }
    ],
    capa: [
      {
        id: 'CA-01',
        type: 'corrective',
        description: 'Perform independent re-testing with freshly prepared, dual-verified primary reference standard.',
        rationale: 'Confirm whether original out-of-specification result was isolated to reference standard dilution bias.',
        root_cause_id: 'RC-01',
        department: 'Quality Control',
        priority: 'high',
        target_date: '2026-07-18',
        effectiveness_check: 'Two independent analytical runs within 98.0-102.0% with <0.5% injection precision.',
        status: 'proposed'
      },
      {
        id: 'PA-01',
        type: 'preventive',
        description: 'Implement mandatory dual-analyst verification sign-off on analytical balance and volumetric pipetting.',
        rationale: 'Prevent undetected dilution and weighing bias across all API chromatographic release assays.',
        root_cause_id: 'RC-01',
        department: 'Quality Assurance',
        priority: 'high',
        target_date: '2026-07-30',
        effectiveness_check: '100% compliance across the next 15 consecutive reference standard preparations.',
        status: 'proposed'
      },
      {
        id: 'CA-02',
        type: 'corrective',
        description: 'Conduct comprehensive impurity profile audit and fluid bed dryer thermal trend review.',
        rationale: 'Rule out process-related alternative root causes before batch disposition.',
        root_cause_id: 'RC-02',
        department: 'Manufacturing Science',
        priority: 'medium',
        target_date: '2026-07-20',
        effectiveness_check: 'Documented technical investigation report approved by Quality Head.',
        status: 'proposed'
      },
      {
        id: 'PA-02',
        type: 'preventive',
        description: 'Revise SOP-QC-014 to Rev 07 and conduct retraining of all QC analytical chemists.',
        rationale: 'Embed critical preparation controls into approved laboratory operating procedure.',
        root_cause_id: 'RC-01',
        department: 'Quality Assurance',
        priority: 'medium',
        target_date: '2026-08-05',
        effectiveness_check: 'Post-training analytical competency assessment with zero critical non-conformances after 30 days.',
        status: 'proposed'
      }
    ],
    documents: [
      { id: 'doc-1', filename: 'QC_Report_MFH260712A.pdf', size: 2457600, mime: 'application/pdf' },
      { id: 'doc-2', filename: 'Batch_Record_MFH260712A.pdf', size: 4194304, mime: 'application/pdf' },
      { id: 'doc-3', filename: 'SOP-QC-014_rev06.pdf', size: 860160, mime: 'application/pdf' }
    ],
    field_meta: {
      'incident.title': 'extracted',
      'incident.description': 'extracted',
      'incident.category': 'extracted',
      'product.name': 'extracted',
      'product.batch_number': 'extracted',
      'product.facility': 'extracted',
      'impact.actual_condition': 'extracted',
      'impact.containment_actions': 'extracted',
      'risk.severity': 'ai_suggested',
      'risk.next_action': 'ai_suggested'
    }
  }
];

export async function mockPostMessage(payload: {
  message: string;
  input_type?: string;
  investigation: Investigation;
  history?: any[];
  force_action?: 'rca' | 'capa';
}): Promise<CopilotResponseContract> {
  // Simulate network latency (300-600ms)
  await new Promise((r) => setTimeout(r, 450));

  const text = payload.message.toLowerCase();
  const current = payload.investigation;

  if (payload.force_action === 'capa' || text.includes('capa')) {
    const updated = JSON.parse(JSON.stringify(mockSavedInvestigations[0])) as Investigation;
    updated.id = current.id;
    updated.investigation_no = current.investigation_no || 'RCA-2026-0001';

    return {
      intent: 'generate_capa',
      assistant_message:
        'I have generated 2 corrective and 2 preventive actions linked directly to the root cause hypotheses. Review the responsible departments, target dates, and effectiveness verification criteria before accepting.',
      investigation: updated,
      change_log: [
        { path: 'capa', label: 'CAPA Actions', old: `${current.capa?.length || 0} actions`, new: '4 proposed actions', source: 'ai_suggested' }
      ],
      warnings: ['CAPA actions are preliminary. Confirm root causes prior to execution.']
    };
  }

  if (payload.force_action === 'rca' || text.includes('root cause') || text.includes('5 whys') || text.includes('fishbone')) {
    const updated = JSON.parse(JSON.stringify(mockSavedInvestigations[0])) as Investigation;
    updated.id = current.id;
    updated.investigation_no = current.investigation_no || 'RCA-2026-0001';

    return {
      intent: 'analyze_rca',
      assistant_message:
        'I have evaluated the available analytical records and formulated 3 root cause hypotheses across Measurement, Material, and Method categories, alongside a 5 Whys drill-down for reference standard dilution bias.',
      investigation: updated,
      change_log: [
        { path: 'root_causes', label: 'Root Causes', old: `${current.root_causes?.length || 0} causes`, new: '3 hypotheses', source: 'ai_suggested' },
        { path: 'why_steps', label: '5 Whys Chain', old: '0 steps', new: '5 steps formulated', source: 'ai_suggested' }
      ],
      warnings: ['Root cause hypotheses require human review and analytical confirmation.']
    };
  }

  // Default: Incident logging or extraction
  const updated = JSON.parse(JSON.stringify(mockSavedInvestigations[0])) as Investigation;
  updated.id = current.id;
  updated.investigation_no = current.investigation_no || 'RCA-2026-0001';

  return {
    intent: 'log_incident',
    assistant_message:
      'I have parsed your incident details and structured the investigation workspace. The Metformin Hydrochloride batch MFH260712A has been placed on hold due to an out-of-specification assay result of 97.2%.',
    investigation: updated,
    change_log: [
      { path: 'incident.title', label: 'Incident Title', old: current.incident?.title || '-', new: 'Out-of-specification assay result', source: 'extracted' },
      { path: 'product.name', label: 'Product Name', old: current.product?.name || '-', new: 'Metformin Hydrochloride API', source: 'extracted' },
      { path: 'product.batch_number', label: 'Batch Number', old: current.product?.batch_number || '-', new: 'MFH260712A', source: 'extracted' },
      { path: 'impact.actual_condition', label: 'Assay Result', old: current.impact?.actual_condition || '-', new: '97.2% (OOS)', source: 'extracted' },
      { path: 'risk.severity', label: 'Risk Severity', old: current.risk?.severity || '-', new: 'Major', source: 'ai_suggested' }
    ],
    warnings: []
  };
}

export async function mockPostUpload(
  file: File,
  investigation: Investigation,
  _history?: any[]
): Promise<CopilotResponseContract> {
  await new Promise((r) => setTimeout(r, 600));

  const updated = JSON.parse(JSON.stringify(mockSavedInvestigations[0])) as Investigation;
  updated.id = investigation.id;
  updated.investigation_no = investigation.investigation_no || 'RCA-2026-0001';

  // Attach document
  const newDoc = {
    id: 'doc-' + Date.now(),
    filename: file.name,
    size: file.size,
    mime: file.type || 'application/pdf'
  };
  updated.documents = [newDoc, ...(updated.documents || [])];

  return {
    intent: 'document_extraction',
    assistant_message: `Extracted analytical data from **${file.name}**. Identified OOS assay of 97.2% on batch MFH260712A. Form fields and evidence checklist have been populated for your review.`,
    investigation: updated,
    change_log: [
      { path: 'documents', label: 'Source Document', old: 'None', new: file.name, source: 'extracted' },
      { path: 'incident.title', label: 'Incident Title', old: investigation.incident?.title || '-', new: 'Out-of-specification assay result', source: 'extracted' },
      { path: 'product.batch_number', label: 'Batch Number', old: investigation.product?.batch_number || '-', new: 'MFH260712A', source: 'extracted' },
      { path: 'impact.actual_condition', label: 'Assay Result', old: investigation.impact?.actual_condition || '-', new: '97.2% (OOS)', source: 'extracted' },
      { path: 'risk.severity', label: 'Severity', old: investigation.risk?.severity || '-', new: 'Major', source: 'ai_suggested' }
    ],
    warnings: []
  };
}

export async function mockSaveInvestigation(
  inv: Investigation
): Promise<Investigation> {
  await new Promise((r) => setTimeout(r, 300));
  const toSave: Investigation = {
    ...inv,
    id: inv.id || 'inv-' + Date.now(),
    status: 'saved'
  };

  const existingIdx = mockSavedInvestigations.findIndex((x) => x.id === toSave.id);
  if (existingIdx >= 0) {
    mockSavedInvestigations[existingIdx] = toSave;
  } else {
    mockSavedInvestigations.unshift(toSave);
  }
  return toSave;
}

export async function mockFetchHistory(): Promise<InvestigationSummary[]> {
  await new Promise((r) => setTimeout(r, 200));
  return mockSavedInvestigations.map((inv) => ({
    id: inv.id || 'inv-unknown',
    investigation_no: inv.investigation_no || 'RCA-2026-0001',
    title: inv.incident?.title || 'Untitled Deviation',
    batch_number: inv.product?.batch_number || '-',
    severity: inv.risk?.severity || 'Major',
    status: inv.status,
    updated_at: new Date().toISOString()
  }));
}

export async function mockGetInvestigation(id: string): Promise<Investigation> {
  await new Promise((r) => setTimeout(r, 250));
  const found = mockSavedInvestigations.find((x) => x.id === id);
  if (found) {
    return JSON.parse(JSON.stringify(found));
  }
  return JSON.parse(JSON.stringify(mockSavedInvestigations[0]));
}


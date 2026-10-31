import json
import logging
import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas.investigation import (
    CopilotMessageRequest,
    CopilotResponseContract
)
from services.langgraph_workflow import run_rca_workflow
from services.document_extractor import DocumentExtractorService
from services.contract_transformer import (
    flatten_investigation,
    build_investigation_contract,
    generate_dynamic_assistant_message
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Copilot"])

@router.post("/message", response_model=CopilotResponseContract)
async def handle_copilot_message(
    req: CopilotMessageRequest
):
    try:
        if not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY is not configured on the server. Please add GROQ_API_KEY in your Vercel Project Settings -> Environment Variables."
            )

        logger.info(f"Received Copilot prompt: {req.message[:80]}...")
        prior_inv = req.investigation or {}
        flat_form_data = flatten_investigation(prior_inv)

        # Handle force_action prompt enhancement if requested
        user_prompt = req.message
        if req.force_action == "rca":
            user_prompt = f"Perform root cause analysis using 5 Whys and 6M Fishbone: {req.message}"
        elif req.force_action == "capa":
            user_prompt = f"Generate corrective and preventive actions (CAPA): {req.message}"

        result = await run_rca_workflow(
            user_input=user_prompt,
            current_form_data=flat_form_data
        )

        intent = result.get("intent") or "log_rca"
        investigation_contract, change_log = build_investigation_contract(
            prior_inv=prior_inv,
            langgraph_result=result,
            uploaded_doc=None
        )

        assistant_message = generate_dynamic_assistant_message(
            intent=intent,
            change_log=change_log,
            inv=investigation_contract,
            raw_response=result.get("response_message", "")
        )

        return CopilotResponseContract(
            intent=intent,
            assistant_message=assistant_message,
            investigation=investigation_contract,
            change_log=change_log,
            warnings=[]
        )
    except Exception as e:
        logger.error(f"Error handling copilot message: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI Copilot processing failed: {str(e)}")

@router.post("/upload", response_model=CopilotResponseContract)
async def handle_document_upload(
    file: UploadFile = File(...),
    investigation: Optional[str] = Form(None),
    history: Optional[str] = Form(None),
    current_form_data: Optional[str] = Form(None)
):
    try:
        if not settings.GROQ_API_KEY:
            raise HTTPException(
                status_code=500,
                detail="GROQ_API_KEY is not configured on the server. Please add GROQ_API_KEY in your Vercel Project Settings -> Environment Variables."
            )

        if not file.filename.lower().endswith((".pdf", ".txt")):
            raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

        content = await file.read()
        logger.info(f"Processing uploaded file: {file.filename} ({len(content)} bytes)")

        if file.filename.lower().endswith(".pdf"):
            extracted = DocumentExtractorService.extract_text_from_pdf_bytes(content, file.filename)
            if not extracted.get("success"):
                raise HTTPException(status_code=400, detail=f"Failed to extract PDF: {extracted.get('error')}")
            raw_text = extracted.get("raw_text", "")
        else:
            raw_text = content.decode("utf-8", errors="ignore")

        # Parse incoming investigation from form data
        prior_inv = {}
        inv_str = investigation or current_form_data
        if inv_str:
            try:
                prior_inv = json.loads(inv_str)
            except Exception as pe:
                logger.warning(f"Could not parse investigation JSON: {pe}")

        flat_form_data = flatten_investigation(prior_inv)

        result = await run_rca_workflow(
            user_input=f"Extract deviation record from uploaded file: {file.filename}",
            current_form_data=flat_form_data,
            document_text=raw_text
        )

        intent = result.get("intent") or "document_extraction"
        uploaded_doc = {
            "id": f"doc-{uuid.uuid4().hex[:8]}",
            "filename": file.filename,
            "size": len(content),
            "mime": "application/pdf" if file.filename.lower().endswith(".pdf") else "text/plain"
        }

        investigation_contract, change_log = build_investigation_contract(
            prior_inv=prior_inv,
            langgraph_result=result,
            uploaded_doc=uploaded_doc
        )

        assistant_message = generate_dynamic_assistant_message(
            intent=intent,
            change_log=change_log,
            inv=investigation_contract,
            raw_response=result.get("response_message", "")
        )

        return CopilotResponseContract(
            intent=intent,
            assistant_message=assistant_message,
            investigation=investigation_contract,
            change_log=change_log,
            warnings=[]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling document upload: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Document extraction failed: {str(e)}")

from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Query
from fastapi.responses import JSONResponse
from typing import Optional, List
import uuid
import os
from datetime import datetime

from app.services.pdf_service import PDFService
from app.services.ocr_service import OCRService
from app.utils.file_utils import validate_pdf_file, save_upload_file
from app.schemas.pdf_schemas import (
    PDFUploadResponse,
    PDFProcessResponse,
    OCRConfig,
    ProcessingStatus
)
from app.config import settings

router = APIRouter()
pdf_service = PDFService()
ocr_service = OCRService()

@router.post("/upload", response_model=PDFUploadResponse)
async def upload_pdf(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
):
    """
    Upload a PDF file for processing
    
    - **file**: PDF file to upload
    - **background_tasks**: Optional background processing
    """
    try:
        # Validate file
        if not validate_pdf_file(file):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Only PDF files are allowed."
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        # Save file
        await save_upload_file(file, file_path)
        
        # Get basic file info
        file_info = await pdf_service.get_file_info(file_path)
        
        return PDFUploadResponse(
            file_id=file_id,
            filename=file.filename,
            file_size=file_info["size"],
            pages=file_info["pages"],
            message="File uploaded successfully",
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/{file_id}", response_model=PDFProcessResponse)
async def process_pdf(
    file_id: str,
    ocr_config: Optional[OCRConfig] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Process a PDF file with OCR
    
    - **file_id**: ID of the uploaded file
    - **ocr_config**: Optional OCR configuration
    - **background_tasks**: Optional background processing
    """
    try:
        # Find file by ID
        file_path = await pdf_service.find_file_by_id(file_id)
        if not file_path:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Use default config if not provided
        if ocr_config is None:
            ocr_config = OCRConfig()
        
        # Process PDF
        result = await pdf_service.process_pdf_with_ocr(
            file_path=file_path,
            ocr_config=ocr_config
        )
        
        return PDFProcessResponse(
            file_id=file_id,
            pages=result["pages"],
            total_pages=result["total_pages"],
            processing_time=result["processing_time"],
            ocr_config=ocr_config,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-and-process", response_model=PDFProcessResponse)
async def upload_and_process_pdf(
    file: UploadFile = File(...),
    ocr_config: Optional[OCRConfig] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Upload and process a PDF file in one request
    
    - **file**: PDF file to upload and process
    - **ocr_config**: Optional OCR configuration
    - **background_tasks**: Optional background processing
    """
    try:
        # Validate file
        if not validate_pdf_file(file):
            raise HTTPException(
                status_code=400,
                detail="Invalid file format. Only PDF files are allowed."
            )
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)
        
        # Save file
        await save_upload_file(file, file_path)
        
        # Use default config if not provided
        if ocr_config is None:
            ocr_config = OCRConfig()
        
        # Process PDF
        result = await pdf_service.process_pdf_with_ocr(
            file_path=file_path,
            ocr_config=ocr_config
        )
        
        return PDFProcessResponse(
            file_id=file_id,
            pages=result["pages"],
            total_pages=result["total_pages"],
            processing_time=result["processing_time"],
            ocr_config=ocr_config,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files")
async def list_files():
    """List all uploaded files"""
    try:
        files = await pdf_service.list_uploaded_files()
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{file_id}")
async def get_file_info(file_id: str):
    """Get information about a specific file"""
    try:
        file_info = await pdf_service.get_file_info_by_id(file_id)
        if not file_info:
            raise HTTPException(status_code=404, detail="File not found")
        return file_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """Delete a file"""
    try:
        success = await pdf_service.delete_file(file_id)
        if not success:
            raise HTTPException(status_code=404, detail="File not found")
        return {"message": "File deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ocr/config")
async def get_ocr_config():
    """Get current OCR configuration"""
    return {
        "language": settings.OCR_LANGUAGE,
        "use_angle_cls": settings.OCR_USE_ANGLE_CLS,
        "use_gpu": settings.OCR_USE_GPU,
        "det_db_thresh": settings.OCR_DET_DB_THRESH,
        "det_db_box_thresh": settings.OCR_DET_DB_BOX_THRESH,
        "det_db_un_clip_ratio": settings.OCR_DET_DB_UN_CLIP_RATIO,
        "rec_batch_num": settings.OCR_REC_BATCH_NUM
    } 
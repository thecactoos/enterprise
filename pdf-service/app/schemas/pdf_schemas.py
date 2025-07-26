from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ProcessingStatus(str, Enum):
    """Processing status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class OCRConfig(BaseModel):
    """OCR configuration schema"""
    language: str = Field(default="en", description="OCR language code")
    use_angle_cls: bool = Field(default=True, description="Use angle classification")
    use_gpu: bool = Field(default=False, description="Use GPU acceleration")
    det_db_thresh: float = Field(default=0.3, description="Detection threshold")
    det_db_box_thresh: float = Field(default=0.5, description="Detection box threshold")
    det_db_un_clip_ratio: float = Field(default=1.6, description="Detection unclip ratio")
    rec_batch_num: int = Field(default=6, description="Recognition batch number")
    rec_char_dict_path: Optional[str] = Field(default=None, description="Character dictionary path")

class PageText(BaseModel):
    """Page text extraction result"""
    page_number: int = Field(description="Page number (1-based)")
    text: str = Field(description="Extracted text from the page")
    confidence: float = Field(description="OCR confidence score")
    bounding_boxes: Optional[List[Dict[str, Any]]] = Field(default=None, description="Text bounding boxes")
    processing_time: float = Field(description="Processing time for this page")

class PDFUploadResponse(BaseModel):
    """PDF upload response"""
    file_id: str = Field(description="Unique file identifier")
    filename: str = Field(description="Original filename")
    file_size: int = Field(description="File size in bytes")
    pages: int = Field(description="Number of pages in the PDF")
    message: str = Field(description="Upload status message")
    timestamp: datetime = Field(description="Upload timestamp")

class PDFProcessResponse(BaseModel):
    """PDF processing response"""
    file_id: str = Field(description="Unique file identifier")
    pages: List[PageText] = Field(description="Extracted text from each page")
    total_pages: int = Field(description="Total number of pages processed")
    processing_time: float = Field(description="Total processing time in seconds")
    ocr_config: OCRConfig = Field(description="OCR configuration used")
    timestamp: datetime = Field(description="Processing timestamp")

class FileInfo(BaseModel):
    """File information"""
    file_id: str = Field(description="Unique file identifier")
    filename: str = Field(description="Original filename")
    file_size: int = Field(description="File size in bytes")
    pages: int = Field(description="Number of pages")
    upload_time: datetime = Field(description="Upload timestamp")
    status: ProcessingStatus = Field(description="Processing status")

class BatchProcessRequest(BaseModel):
    """Batch processing request"""
    file_ids: List[str] = Field(description="List of file IDs to process")
    ocr_config: Optional[OCRConfig] = Field(default=None, description="OCR configuration")
    priority: int = Field(default=1, description="Processing priority (1-10)")

class BatchProcessResponse(BaseModel):
    """Batch processing response"""
    batch_id: str = Field(description="Batch processing identifier")
    total_files: int = Field(description="Total number of files in batch")
    status: ProcessingStatus = Field(description="Batch processing status")
    estimated_time: Optional[float] = Field(default=None, description="Estimated processing time")
    timestamp: datetime = Field(description="Batch creation timestamp")

class ErrorResponse(BaseModel):
    """Error response"""
    error: str = Field(description="Error message")
    detail: Optional[str] = Field(default=None, description="Detailed error information")
    timestamp: datetime = Field(description="Error timestamp")
    request_id: Optional[str] = Field(default=None, description="Request identifier for tracking")

class HealthCheck(BaseModel):
    """Health check response"""
    status: str = Field(description="Service status")
    service: str = Field(description="Service name")
    version: str = Field(description="Service version")
    timestamp: datetime = Field(description="Health check timestamp")
    dependencies: Dict[str, str] = Field(description="Dependency status") 
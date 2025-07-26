import os
import asyncio
import time
from typing import List, Dict, Any, Optional
from pathlib import Path
import fitz  # PyMuPDF
from pdf2image import convert_from_path
import tempfile
import shutil

from app.services.ocr_service import OCRService
from app.schemas.pdf_schemas import OCRConfig, PageText
from app.config import settings

class PDFService:
    """Service for handling PDF operations"""
    
    def __init__(self):
        self.ocr_service = OCRService()
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self.temp_dir = Path(settings.TEMP_DIR)
        
        # Ensure directories exist
        self.upload_dir.mkdir(exist_ok=True)
        self.temp_dir.mkdir(exist_ok=True)
    
    async def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get basic information about a PDF file"""
        try:
            doc = fitz.open(file_path)
            info = {
                "size": os.path.getsize(file_path),
                "pages": len(doc),
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", ""),
                "subject": doc.metadata.get("subject", ""),
                "creator": doc.metadata.get("creator", ""),
                "producer": doc.metadata.get("producer", ""),
                "creation_date": doc.metadata.get("creationDate", ""),
                "modification_date": doc.metadata.get("modDate", "")
            }
            doc.close()
            return info
        except Exception as e:
            raise Exception(f"Error reading PDF file: {str(e)}")
    
    async def find_file_by_id(self, file_id: str) -> Optional[str]:
        """Find a file by its ID"""
        for file_path in self.upload_dir.glob(f"{file_id}_*"):
            if file_path.is_file():
                return str(file_path)
        return None
    
    async def list_uploaded_files(self) -> List[Dict[str, Any]]:
        """List all uploaded files with their information"""
        files = []
        for file_path in self.upload_dir.glob("*"):
            if file_path.is_file() and file_path.suffix.lower() == '.pdf':
                try:
                    file_info = await self.get_file_info(str(file_path))
                    # Extract file_id from filename (format: file_id_original_name.pdf)
                    file_id = file_path.stem.split('_', 1)[0]
                    original_name = '_'.join(file_path.stem.split('_')[1:]) + file_path.suffix
                    
                    files.append({
                        "file_id": file_id,
                        "filename": original_name,
                        "file_size": file_info["size"],
                        "pages": file_info["pages"],
                        "upload_time": time.time(),  # You might want to store this in a database
                        "path": str(file_path)
                    })
                except Exception as e:
                    # Skip files that can't be read
                    continue
        return files
    
    async def get_file_info_by_id(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific file by ID"""
        file_path = await self.find_file_by_id(file_id)
        if not file_path:
            return None
        
        try:
            file_info = await self.get_file_info(file_path)
            # Extract original filename
            path_obj = Path(file_path)
            original_name = '_'.join(path_obj.stem.split('_')[1:]) + path_obj.suffix
            
            return {
                "file_id": file_id,
                "filename": original_name,
                "file_size": file_info["size"],
                "pages": file_info["pages"],
                "upload_time": time.time(),
                "path": file_path,
                **file_info
            }
        except Exception as e:
            raise Exception(f"Error getting file info: {str(e)}")
    
    async def delete_file(self, file_id: str) -> bool:
        """Delete a file by ID"""
        file_path = await self.find_file_by_id(file_id)
        if not file_path:
            return False
        
        try:
            os.remove(file_path)
            return True
        except Exception:
            return False
    
    async def convert_pdf_to_images(self, pdf_path: str, dpi: int = None) -> List[str]:
        """Convert PDF pages to images"""
        if dpi is None:
            dpi = settings.IMAGE_DPI
        
        try:
            # Convert PDF to images
            images = convert_from_path(
                pdf_path,
                dpi=dpi,
                fmt=settings.IMAGE_FORMAT.lower(),
                output_folder=str(self.temp_dir),
                output_file="page"
            )
            
            # Return paths to the generated images
            image_paths = []
            for i, image in enumerate(images):
                image_path = str(self.temp_dir / f"page_{i+1:03d}.{settings.IMAGE_FORMAT.lower()}")
                image.save(image_path, settings.IMAGE_FORMAT, quality=settings.IMAGE_QUALITY)
                image_paths.append(image_path)
            
            return image_paths
        except Exception as e:
            raise Exception(f"Error converting PDF to images: {str(e)}")
    
    async def extract_text_with_pymupdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract text using PyMuPDF (faster but less accurate for scanned documents)"""
        try:
            doc = fitz.open(pdf_path)
            pages = []
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text = page.get_text()
                
                pages.append({
                    "page_number": page_num + 1,
                    "text": text,
                    "confidence": 1.0,  # PyMuPDF doesn't provide confidence scores
                    "method": "pymupdf",
                    "processing_time": 0.0  # Very fast
                })
            
            doc.close()
            return pages
        except Exception as e:
            raise Exception(f"Error extracting text with PyMuPDF: {str(e)}")
    
    async def process_pdf_with_ocr(self, file_path: str, ocr_config: OCRConfig) -> Dict[str, Any]:
        """Process PDF with OCR and return extracted text"""
        start_time = time.time()
        
        try:
            # First try to extract text with PyMuPDF
            pymupdf_pages = await self.extract_text_with_pymupdf(file_path)
            
            # Check if pages have substantial text content
            pages_with_text = [p for p in pymupdf_pages if len(p["text"].strip()) > 50]
            
            if len(pages_with_text) == len(pymupdf_pages):
                # All pages have text, use PyMuPDF results
                processing_time = time.time() - start_time
                
                return {
                    "pages": [
                        PageText(
                            page_number=p["page_number"],
                            text=p["text"],
                            confidence=p["confidence"],
                            processing_time=p["processing_time"]
                        ) for p in pymupdf_pages
                    ],
                    "total_pages": len(pymupdf_pages),
                    "processing_time": processing_time,
                    "method": "pymupdf"
                }
            else:
                # Some pages need OCR, convert to images and process
                image_paths = await self.convert_pdf_to_images(file_path)
                
                # Process each image with OCR
                ocr_pages = []
                for i, image_path in enumerate(image_paths):
                    page_start_time = time.time()
                    
                    # Run OCR on the image
                    ocr_result = await self.ocr_service.extract_text_from_image(
                        image_path, ocr_config
                    )
                    
                    page_processing_time = time.time() - page_start_time
                    
                    ocr_pages.append(PageText(
                        page_number=i + 1,
                        text=ocr_result["text"],
                        confidence=ocr_result["confidence"],
                        bounding_boxes=ocr_result.get("bounding_boxes"),
                        processing_time=page_processing_time
                    ))
                    
                    # Clean up image file
                    try:
                        os.remove(image_path)
                    except:
                        pass
                
                processing_time = time.time() - start_time
                
                return {
                    "pages": ocr_pages,
                    "total_pages": len(ocr_pages),
                    "processing_time": processing_time,
                    "method": "ocr"
                }
                
        except Exception as e:
            raise Exception(f"Error processing PDF: {str(e)}")
    
    async def cleanup_temp_files(self):
        """Clean up temporary files"""
        try:
            for file_path in self.temp_dir.glob("*"):
                if file_path.is_file():
                    file_path.unlink()
        except Exception:
            pass  # Ignore cleanup errors 
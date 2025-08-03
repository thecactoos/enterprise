import os
import uuid
import jwt
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from paddleocr import PaddleOCR
import fitz  # PyMuPDF
from PIL import Image
import io
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="OCR Service",
    description="OCR processing service using PaddleOCR v4",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Environment variables
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-here")
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Initialize PaddleOCR
logger.info("Initializing PaddleOCR...")
ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
logger.info("PaddleOCR initialized successfully")

# Supported file types
SUPPORTED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png'}


def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify JWT token and return decoded payload."""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )


def process_image_ocr(image_data: bytes) -> Dict[str, Any]:
    """Process image data with PaddleOCR and return extracted text with coordinates."""
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Get image dimensions
        image_width, image_height = image.size
        
        # Convert PIL Image to numpy array for PaddleOCR
        import numpy as np
        image_array = np.array(image)
        
        # Run OCR
        result = ocr.ocr(image_array, cls=True)
        
        # Process OCR results with full data
        lines = []
        text_blocks = []
        combined_text = []
        
        if result and result[0]:
            for line in result[0]:
                if line and len(line) >= 2:
                    # Extract coordinates and text
                    coordinates = line[0]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                    text_data = line[1]    # (text, confidence)
                    
                    text = text_data[0] if isinstance(text_data, (list, tuple)) else str(text_data)
                    confidence = text_data[1] if isinstance(text_data, (list, tuple)) and len(text_data) > 1 else 1.0
                    
                    if text.strip():
                        # Calculate bounding box
                        x_coords = [point[0] for point in coordinates]
                        y_coords = [point[1] for point in coordinates]
                        
                        bbox = {
                            "x": min(x_coords),
                            "y": min(y_coords),
                            "width": max(x_coords) - min(x_coords),
                            "height": max(y_coords) - min(y_coords)
                        }
                        
                        text_block = {
                            "text": text.strip(),
                            "confidence": confidence,
                            "coordinates": coordinates,
                            "bbox": bbox
                        }
                        
                        lines.append(text.strip())
                        text_blocks.append(text_block)
                        combined_text.append(text.strip())
        
        return {
            "lines": lines,
            "text_blocks": text_blocks,
            "combined_text": "\n".join(combined_text),
            "image_dimensions": {
                "width": image_width,
                "height": image_height
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing image OCR: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}"
        )


def process_pdf_ocr(pdf_path: Path) -> List[Dict[str, Any]]:
    """Process PDF file and return OCR results for each page."""
    try:
        pages_data = []
        
        # Open PDF
        pdf_document = fitz.open(pdf_path)
        
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            
            # Convert page to image
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR quality
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            # Process with OCR
            ocr_result = process_image_ocr(img_data)
            
            pages_data.append({
                "page": page_num + 1,
                "text": ocr_result["combined_text"],
                "text_blocks": ocr_result["text_blocks"],
                "image_dimensions": ocr_result["image_dimensions"]
            })
        
        pdf_document.close()
        return pages_data
        
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing PDF: {str(e)}"
        )


def process_image_file_ocr(image_path: Path) -> List[Dict[str, Any]]:
    """Process image file and return OCR results."""
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
        
        ocr_result = process_image_ocr(image_data)
        
        return [{
            "page": 1,
            "text": ocr_result["combined_text"],
            "text_blocks": ocr_result["text_blocks"],
            "image_dimensions": ocr_result["image_dimensions"]
        }]
        
    except Exception as e:
        logger.error(f"Error processing image file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image file: {str(e)}"
        )


@app.post("/ocr")
async def process_ocr(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(verify_jwt_token)
):
    """
    Process PDF or image file with OCR and return extracted text.
    
    - **file**: PDF or JPG/PNG file to process
    - **Authorization**: Bearer JWT token required
    
    Returns JSON with extracted text, pages, and metadata.
    """
    
    # Validate file type
    file_extension = Path(file.filename).suffix.lower() if file.filename else ""
    if file_extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())
    filename = f"ocr_{unique_id}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    try:
        # Save uploaded file
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        logger.info(f"Processing file: {filename} (type: {file_extension})")
        
        # Process based on file type
        if file_extension == '.pdf':
            pages_data = process_pdf_ocr(file_path)
        else:
            pages_data = process_image_file_ocr(file_path)
        
        # Combine all text
        all_text = "\n\n".join([page["text"] for page in pages_data])
        
        # Extract all lines
        all_lines = []
        for page in pages_data:
            page_lines = page["text"].split("\n")
            all_lines.extend([line.strip() for line in page_lines if line.strip()])
        
        # Get user ID from JWT
        user_id = current_user.get("sub") or current_user.get("user_id") or current_user.get("id")
        
        # Prepare response
        response = {
            "filename": f"uploads/{filename}",
            "text": all_text,
            "pages": pages_data,
            "lines": all_lines,
            "uploaded_by_user_id": user_id,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        
        logger.info(f"Successfully processed {filename}: {len(pages_data)} pages, {len(all_lines)} lines")
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        if file_path.exists():
            file_path.unlink()
        raise
    except Exception as e:
        # Clean up file on error
        if file_path.exists():
            file_path.unlink()
        logger.error(f"Unexpected error processing {filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ocr-service",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "OCR Service",
        "description": "OCR processing service using PaddleOCR v4",
        "version": "1.0.0",
        "endpoints": {
            "POST /ocr": "Process PDF or image file with OCR",
            "GET /health": "Health check",
            "GET /docs": "API documentation"
        }
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
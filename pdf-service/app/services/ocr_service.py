import asyncio
import time
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image
import cv2

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    print("Warning: PaddleOCR not available. Install with: pip install paddlepaddle paddleocr")

from app.schemas.pdf_schemas import OCRConfig
from app.config import settings

class OCRService:
    """Service for OCR operations using PaddleOCR"""
    
    def __init__(self):
        self.ocr_engines = {}  # Cache for OCR engines
        self._initialize_ocr()
    
    def _initialize_ocr(self):
        """Initialize OCR engines for different configurations"""
        if not PADDLEOCR_AVAILABLE:
            raise ImportError("PaddleOCR is not available. Please install it first.")
        
        # Initialize default OCR engine
        default_config = {
            "use_angle_cls": settings.OCR_USE_ANGLE_CLS,
            "use_gpu": settings.OCR_USE_GPU,
            "det_db_thresh": settings.OCR_DET_DB_THRESH,
            "det_db_box_thresh": settings.OCR_DET_DB_BOX_THRESH,
            "det_db_un_clip_ratio": settings.OCR_DET_DB_UN_CLIP_RATIO,
            "rec_batch_num": settings.OCR_REC_BATCH_NUM
        }
        
        self.ocr_engines["default"] = PaddleOCR(
            lang=settings.OCR_LANGUAGE,
            **default_config
        )
    
    def _get_ocr_engine(self, config: OCRConfig) -> Any:
        """Get or create OCR engine for specific configuration"""
        config_key = f"{config.language}_{config.use_angle_cls}_{config.use_gpu}"
        
        if config_key not in self.ocr_engines:
            # Create new OCR engine with custom configuration
            ocr_config = {
                "use_angle_cls": config.use_angle_cls,
                "use_gpu": config.use_gpu,
                "det_db_thresh": config.det_db_thresh,
                "det_db_box_thresh": config.det_db_box_thresh,
                "det_db_un_clip_ratio": config.det_db_un_clip_ratio,
                "rec_batch_num": config.rec_batch_num
            }
            
            if config.rec_char_dict_path:
                ocr_config["rec_char_dict_path"] = config.rec_char_dict_path
            
            self.ocr_engines[config_key] = PaddleOCR(
                lang=config.language,
                **ocr_config
            )
        
        return self.ocr_engines[config_key]
    
    async def extract_text_from_image(self, image_path: str, config: OCRConfig) -> Dict[str, Any]:
        """Extract text from an image using OCR"""
        try:
            # Get OCR engine for this configuration
            ocr_engine = self._get_ocr_engine(config)
            
            # Run OCR in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                ocr_engine.ocr, 
                image_path, 
                cls=config.use_angle_cls
            )
            
            # Process OCR results
            extracted_text = ""
            bounding_boxes = []
            total_confidence = 0.0
            text_count = 0
            
            if result and result[0]:
                for line in result[0]:
                    if len(line) >= 2:
                        # Extract text and confidence
                        text = line[1][0] if isinstance(line[1], (list, tuple)) else str(line[1])
                        confidence = line[1][1] if isinstance(line[1], (list, tuple)) and len(line[1]) > 1 else 1.0
                        
                        # Extract bounding box
                        bbox = line[0] if line[0] else []
                        
                        extracted_text += text + "\n"
                        bounding_boxes.append({
                            "text": text,
                            "confidence": confidence,
                            "bbox": bbox
                        })
                        
                        total_confidence += confidence
                        text_count += 1
            
            # Calculate average confidence
            avg_confidence = total_confidence / text_count if text_count > 0 else 0.0
            
            return {
                "text": extracted_text.strip(),
                "confidence": avg_confidence,
                "bounding_boxes": bounding_boxes,
                "text_count": text_count
            }
            
        except Exception as e:
            raise Exception(f"Error in OCR processing: {str(e)}")
    
    async def extract_text_from_image_array(self, image_array: np.ndarray, config: OCRConfig) -> Dict[str, Any]:
        """Extract text from a numpy image array"""
        try:
            # Get OCR engine for this configuration
            ocr_engine = self._get_ocr_engine(config)
            
            # Run OCR in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None, 
                ocr_engine.ocr, 
                image_array, 
                cls=config.use_angle_cls
            )
            
            # Process results (same as above)
            extracted_text = ""
            bounding_boxes = []
            total_confidence = 0.0
            text_count = 0
            
            if result and result[0]:
                for line in result[0]:
                    if len(line) >= 2:
                        text = line[1][0] if isinstance(line[1], (list, tuple)) else str(line[1])
                        confidence = line[1][1] if isinstance(line[1], (list, tuple)) and len(line[1]) > 1 else 1.0
                        bbox = line[0] if line[0] else []
                        
                        extracted_text += text + "\n"
                        bounding_boxes.append({
                            "text": text,
                            "confidence": confidence,
                            "bbox": bbox
                        })
                        
                        total_confidence += confidence
                        text_count += 1
            
            avg_confidence = total_confidence / text_count if text_count > 0 else 0.0
            
            return {
                "text": extracted_text.strip(),
                "confidence": avg_confidence,
                "bounding_boxes": bounding_boxes,
                "text_count": text_count
            }
            
        except Exception as e:
            raise Exception(f"Error in OCR processing: {str(e)}")
    
    async def preprocess_image(self, image_path: str) -> np.ndarray:
        """Preprocess image for better OCR results"""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise Exception("Could not read image")
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply noise reduction
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Apply contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(denoised)
            
            # Apply thresholding
            _, thresholded = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            return thresholded
            
        except Exception as e:
            raise Exception(f"Error preprocessing image: {str(e)}")
    
    async def extract_text_with_preprocessing(self, image_path: str, config: OCRConfig) -> Dict[str, Any]:
        """Extract text with image preprocessing for better results"""
        try:
            # Preprocess image
            processed_image = await self.preprocess_image(image_path)
            
            # Extract text from processed image
            result = await self.extract_text_from_image_array(processed_image, config)
            
            return result
            
        except Exception as e:
            raise Exception(f"Error in OCR with preprocessing: {str(e)}")
    
    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages"""
        return [
            "ch", "en", "french", "german", "korean", "japan", "chinese_cht", "ta", "te", "ka", "latin", "arabic", "cyrillic", "devanagari"
        ]
    
    def get_engine_info(self) -> Dict[str, Any]:
        """Get information about OCR engines"""
        return {
            "available": PADDLEOCR_AVAILABLE,
            "engines_count": len(self.ocr_engines),
            "supported_languages": self.get_supported_languages(),
            "default_language": settings.OCR_LANGUAGE,
            "use_gpu": settings.OCR_USE_GPU
        } 
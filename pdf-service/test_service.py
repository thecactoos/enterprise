#!/usr/bin/env python3
"""
Simple test script for the PDF OCR Service
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.services.pdf_service import PDFService
from app.services.ocr_service import OCRService
from app.schemas.pdf_schemas import OCRConfig

async def test_ocr_service():
    """Test OCR service functionality"""
    print("🧪 Testing OCR Service...")
    
    try:
        ocr_service = OCRService()
        
        # Test engine info
        info = ocr_service.get_engine_info()
        print(f"✅ OCR Engine Info: {info}")
        
        # Test supported languages
        languages = ocr_service.get_supported_languages()
        print(f"✅ Supported Languages: {languages}")
        
        print("✅ OCR Service test passed!")
        return True
        
    except Exception as e:
        print(f"❌ OCR Service test failed: {e}")
        return False

async def test_pdf_service():
    """Test PDF service functionality"""
    print("\n🧪 Testing PDF Service...")
    
    try:
        pdf_service = PDFService()
        
        # Test directory creation
        print(f"✅ Upload directory: {pdf_service.upload_dir}")
        print(f"✅ Temp directory: {pdf_service.temp_dir}")
        
        # Test file listing (should be empty initially)
        files = await pdf_service.list_uploaded_files()
        print(f"✅ Files in upload directory: {len(files)}")
        
        print("✅ PDF Service test passed!")
        return True
        
    except Exception as e:
        print(f"❌ PDF Service test failed: {e}")
        return False

async def test_configuration():
    """Test configuration loading"""
    print("\n🧪 Testing Configuration...")
    
    try:
        from app.config import settings
        
        print(f"✅ API Base URL: {settings.API_V1_STR}")
        print(f"✅ Max File Size: {settings.MAX_FILE_SIZE}")
        print(f"✅ OCR Language: {settings.OCR_LANGUAGE}")
        print(f"✅ Use GPU: {settings.OCR_USE_GPU}")
        print(f"✅ Image DPI: {settings.IMAGE_DPI}")
        
        print("✅ Configuration test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

async def test_schemas():
    """Test Pydantic schemas"""
    print("\n🧪 Testing Schemas...")
    
    try:
        from app.schemas.pdf_schemas import OCRConfig, PageText
        
        # Test OCR config
        config = OCRConfig(
            language="en",
            use_angle_cls=True,
            use_gpu=False
        )
        print(f"✅ OCR Config: {config}")
        
        # Test page text
        page = PageText(
            page_number=1,
            text="Test text",
            confidence=0.95,
            processing_time=1.5
        )
        print(f"✅ Page Text: {page}")
        
        print("✅ Schemas test passed!")
        return True
        
    except Exception as e:
        print(f"❌ Schemas test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting PDF OCR Service Tests...\n")
    
    tests = [
        test_configuration,
        test_schemas,
        test_ocr_service,
        test_pdf_service
    ]
    
    results = []
    for test in tests:
        try:
            result = await test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "="*50)
    print("📊 Test Results Summary:")
    print("="*50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n🎉 All tests passed! The service is ready to use.")
        print("\n💡 Next steps:")
        print("   1. Start the service: uvicorn app.main:app --reload")
        print("   2. Visit: http://localhost:8000/docs")
        print("   3. Upload a PDF and test OCR functionality")
    else:
        print("\n⚠️  Some tests failed. Please check the errors above.")
        print("\n💡 Common issues:")
        print("   - Install dependencies: pip install -r requirements.txt")
        print("   - Install system dependencies: sudo apt-get install poppler-utils")
        print("   - Check PaddleOCR installation: pip install paddlepaddle paddleocr")
    
    return passed == total

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1) 
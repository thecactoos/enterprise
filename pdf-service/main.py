from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import json
from typing import Dict, Any
import re

app = FastAPI(title="PDF Analysis Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://api-gateway:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_invoice_data(text: str) -> Dict[str, Any]:
    """Extract invoice data from PDF text"""
    data = {
        "invoice_number": None,
        "date": None,
        "total_amount": None,
        "vendor_name": None,
        "vendor_address": None,
        "customer_name": None,
        "customer_address": None,
        "items": [],
        "raw_text": text[:1000]  # First 1000 characters for debugging
    }
    
    # Extract invoice number (common patterns)
    invoice_patterns = [
        r'invoice\s*#?\s*(\d+)',
        r'invoice\s*number\s*:?\s*(\d+)',
        r'#\s*(\d{6,})',
    ]
    
    for pattern in invoice_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["invoice_number"] = match.group(1)
            break
    
    # Extract date
    date_patterns = [
        r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
        r'(\d{4}-\d{2}-\d{2})',
        r'date\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["date"] = match.group(1)
            break
    
    # Extract total amount
    amount_patterns = [
        r'total\s*:?\s*\$?(\d+,?\d*\.?\d*)',
        r'amount\s*:?\s*\$?(\d+,?\d*\.?\d*)',
        r'\$(\d+,?\d*\.?\d*)',
    ]
    
    for pattern in amount_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["total_amount"] = float(match.group(1).replace(',', ''))
            break
    
    # Extract vendor information
    vendor_patterns = [
        r'from\s*:?\s*([^\n]+)',
        r'vendor\s*:?\s*([^\n]+)',
        r'company\s*:?\s*([^\n]+)',
    ]
    
    for pattern in vendor_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["vendor_name"] = match.group(1).strip()
            break
    
    # Extract customer information
    customer_patterns = [
        r'to\s*:?\s*([^\n]+)',
        r'customer\s*:?\s*([^\n]+)',
        r'bill\s*to\s*:?\s*([^\n]+)',
    ]
    
    for pattern in customer_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data["customer_name"] = match.group(1).strip()
            break
    
    return data

@app.post("/analyze")
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Analyze PDF file and extract structured data
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Read the uploaded file
        contents = await file.read()
        
        # Create a PDF reader object
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Analyze the extracted text
        result = extract_invoice_data(text)
        
        return {
            "success": True,
            "filename": file.filename,
            "pages": len(pdf_reader.pages),
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "pdf-analysis"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
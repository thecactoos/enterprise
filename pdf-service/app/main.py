from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import pdf_routes
from app.config import settings

app = FastAPI(
    title="PDF OCR Service",
    description="A microservice for PDF processing and OCR using PaddleOCR",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(pdf_routes.router, prefix="/api/v1", tags=["pdf"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PDF OCR Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "pdf-ocr"} 
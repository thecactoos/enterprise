# 📄 PDF OCR Service

A FastAPI-based microservice for PDF processing and OCR using PaddleOCR. This service can extract text from PDF files using both PyMuPDF (for text-based PDFs) and PaddleOCR (for scanned documents).

## 🚀 Features

- **PDF Upload & Processing**: Upload PDF files and extract text
- **Dual Processing**: Automatic detection of text-based vs scanned PDFs
- **OCR with PaddleOCR**: High-accuracy text extraction from images
- **Configurable OCR**: Customize language, GPU usage, and detection parameters
- **RESTful API**: Clean REST API with OpenAPI documentation
- **File Management**: Upload, list, and delete files
- **Async Processing**: Support for background processing
- **Docker Support**: Easy deployment with Docker

## 🏗️ Architecture

```
pdf-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── routes/
│   │   ├── __init__.py
│   │   └── pdf_routes.py    # API endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── pdf_service.py   # PDF processing logic
│   │   └── ocr_service.py   # OCR operations
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── pdf_schemas.py   # Pydantic models
│   └── utils/
│       ├── __init__.py
│       └── file_utils.py    # File handling utilities
├── uploads/                 # Uploaded PDF files
├── temp/                    # Temporary files
├── requirements.txt         # Python dependencies
├── Dockerfile              # Docker configuration
└── README.md               # This file
```

## 🛠️ Installation

### Prerequisites

- Python 3.11+
- Docker (optional)
- Poppler-utils (for PDF to image conversion)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pdf-service
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Install system dependencies** (Ubuntu/Debian)
   ```bash
   sudo apt-get update
   sudo apt-get install -y poppler-utils libgl1-mesa-glx libglib2.0-0
   ```

5. **Run the service**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Docker Deployment

1. **Build the image**
   ```bash
   docker build -t pdf-ocr-service .
   ```

2. **Run the container**
   ```bash
   docker run -p 8000:8000 -v $(pwd)/uploads:/app/uploads pdf-ocr-service
   ```

## 📚 API Documentation

Once the service is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Upload PDF
```http
POST /api/v1/upload
Content-Type: multipart/form-data

file: <pdf_file>
```

#### Process PDF with OCR
```http
POST /api/v1/process/{file_id}
Content-Type: application/json

{
  "language": "en",
  "use_angle_cls": true,
  "use_gpu": false
}
```

#### Upload and Process in One Request
```http
POST /api/v1/upload-and-process
Content-Type: multipart/form-data

file: <pdf_file>
```

#### List Files
```http
GET /api/v1/files
```

#### Get File Info
```http
GET /api/v1/files/{file_id}
```

#### Delete File
```http
DELETE /api/v1/files/{file_id}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=PDF OCR Service

# File Upload
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_DIR=uploads
TEMP_DIR=temp

# OCR Configuration
OCR_LANGUAGE=en
OCR_USE_ANGLE_CLS=true
OCR_USE_GPU=false
OCR_DET_DB_THRESH=0.3
OCR_DET_DB_BOX_THRESH=0.5
OCR_DET_DB_UN_CLIP_RATIO=1.6
OCR_REC_BATCH_NUM=6

# Image Processing
IMAGE_DPI=300
IMAGE_FORMAT=PNG
IMAGE_QUALITY=95

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:3001"]
```

### OCR Configuration

The service supports various OCR configurations:

```python
{
    "language": "en",              # OCR language
    "use_angle_cls": true,         # Use angle classification
    "use_gpu": false,              # Use GPU acceleration
    "det_db_thresh": 0.3,          # Detection threshold
    "det_db_box_thresh": 0.5,      # Detection box threshold
    "det_db_un_clip_ratio": 1.6,   # Detection unclip ratio
    "rec_batch_num": 6             # Recognition batch number
}
```

### Supported Languages

- `en` - English
- `ch` - Chinese
- `french` - French
- `german` - German
- `korean` - Korean
- `japan` - Japanese
- `chinese_cht` - Traditional Chinese
- `ta` - Tamil
- `te` - Telugu
- `ka` - Kannada
- `latin` - Latin
- `arabic` - Arabic
- `cyrillic` - Cyrillic
- `devanagari` - Devanagari

## 🔧 Usage Examples

### Python Client

```python
import requests

# Upload PDF
with open('document.pdf', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/api/v1/upload', files=files)
    file_id = response.json()['file_id']

# Process with OCR
ocr_config = {
    "language": "en",
    "use_angle_cls": True,
    "use_gpu": False
}
response = requests.post(
    f'http://localhost:8000/api/v1/process/{file_id}',
    json=ocr_config
)
result = response.json()

# Print extracted text
for page in result['pages']:
    print(f"Page {page['page_number']}:")
    print(page['text'])
    print(f"Confidence: {page['confidence']:.2f}")
    print("---")
```

### cURL Examples

```bash
# Upload PDF
curl -X POST "http://localhost:8000/api/v1/upload" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@document.pdf"

# Process with OCR
curl -X POST "http://localhost:8000/api/v1/process/{file_id}" \
     -H "Content-Type: application/json" \
     -d '{"language": "en", "use_angle_cls": true}'

# Upload and process in one request
curl -X POST "http://localhost:8000/api/v1/upload-and-process" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@document.pdf"
```

## 🧪 Testing

### Run Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=app
```

### Test with Sample PDFs

1. Create a test PDF or use any existing PDF
2. Upload it using the API
3. Check the extracted text quality
4. Adjust OCR parameters if needed

## 🚀 Performance

### Optimization Tips

1. **GPU Acceleration**: Enable GPU for faster OCR processing
   ```python
   {"use_gpu": True}
   ```

2. **Batch Processing**: Adjust batch size for your hardware
   ```python
   {"rec_batch_num": 8}  # Increase for better GPUs
   ```

3. **Image Quality**: Balance between quality and speed
   ```python
   IMAGE_DPI=200  # Lower for faster processing
   ```

4. **Memory Management**: Clean up temporary files regularly

### Performance Benchmarks

- **Text-based PDFs**: ~1-2 seconds per page (PyMuPDF)
- **Scanned PDFs**: ~5-10 seconds per page (PaddleOCR)
- **GPU acceleration**: 2-3x faster OCR processing

## 🔒 Security

### File Validation

- File type validation (PDF only)
- File size limits (configurable)
- Safe filename handling
- Temporary file cleanup

### Best Practices

1. **File Size Limits**: Set appropriate `MAX_FILE_SIZE`
2. **Input Validation**: All inputs are validated with Pydantic
3. **Error Handling**: Comprehensive error handling and logging
4. **CORS Configuration**: Configure allowed origins properly

## 🐛 Troubleshooting

### Common Issues

1. **PaddleOCR Import Error**
   ```bash
   pip install paddlepaddle paddleocr
   ```

2. **Poppler-utils Missing**
   ```bash
   sudo apt-get install poppler-utils
   ```

3. **OpenCV Dependencies**
   ```bash
   sudo apt-get install libgl1-mesa-glx libglib2.0-0
   ```

4. **Memory Issues**
   - Reduce `IMAGE_DPI`
   - Lower `rec_batch_num`
   - Enable temporary file cleanup

### Logs

Check application logs for detailed error information:

```bash
# Docker logs
docker logs <container_id>

# Local logs
uvicorn app.main:app --log-level debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) - OCR engine
- [PyMuPDF](https://github.com/pymupdf/PyMuPDF) - PDF processing
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework
- [pdf2image](https://github.com/Belval/pdf2image) - PDF to image conversion 
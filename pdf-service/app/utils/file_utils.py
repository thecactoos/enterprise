import os
import aiofiles
from typing import List
from fastapi import UploadFile
from app.config import settings

def validate_pdf_file(file: UploadFile) -> bool:
    """Validate if the uploaded file is a valid PDF"""
    # Check file extension
    if not file.filename.lower().endswith('.pdf'):
        return False
    
    # Check file size
    if file.size and file.size > settings.MAX_FILE_SIZE:
        return False
    
    # Check content type
    if file.content_type and file.content_type != 'application/pdf':
        return False
    
    return True

async def save_upload_file(file: UploadFile, file_path: str) -> str:
    """Save uploaded file to disk"""
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        return file_path
    except Exception as e:
        raise Exception(f"Error saving file: {str(e)}")

def get_file_size_mb(file_path: str) -> float:
    """Get file size in megabytes"""
    try:
        size_bytes = os.path.getsize(file_path)
        return size_bytes / (1024 * 1024)
    except Exception:
        return 0.0

def get_file_extension(file_path: str) -> str:
    """Get file extension"""
    return os.path.splitext(file_path)[1].lower()

def is_valid_file_extension(file_path: str) -> bool:
    """Check if file has valid extension"""
    extension = get_file_extension(file_path)
    return extension in settings.ALLOWED_EXTENSIONS

def cleanup_temp_files(temp_dir: str) -> None:
    """Clean up temporary files"""
    try:
        for filename in os.listdir(temp_dir):
            file_path = os.path.join(temp_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
    except Exception:
        pass  # Ignore cleanup errors

def get_unique_filename(original_filename: str, directory: str) -> str:
    """Generate unique filename to avoid conflicts"""
    import uuid
    import time
    
    # Get file extension
    name, ext = os.path.splitext(original_filename)
    
    # Generate unique name
    unique_id = str(uuid.uuid4())[:8]
    timestamp = int(time.time())
    
    new_filename = f"{name}_{timestamp}_{unique_id}{ext}"
    
    # Ensure it's unique in the directory
    counter = 1
    while os.path.exists(os.path.join(directory, new_filename)):
        new_filename = f"{name}_{timestamp}_{unique_id}_{counter}{ext}"
        counter += 1
    
    return new_filename

def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f}{size_names[i]}"

def get_safe_filename(filename: str) -> str:
    """Convert filename to safe version"""
    import re
    
    # Remove or replace unsafe characters
    safe_filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Remove leading/trailing spaces and dots
    safe_filename = safe_filename.strip('. ')
    
    # Limit length
    if len(safe_filename) > 255:
        name, ext = os.path.splitext(safe_filename)
        safe_filename = name[:255-len(ext)] + ext
    
    return safe_filename or "unnamed_file" 
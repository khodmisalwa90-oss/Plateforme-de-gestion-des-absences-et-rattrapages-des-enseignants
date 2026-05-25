import os
import uuid
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

def save_upload_file(upload_file: UploadFile, subdir: str = "") -> str:
    # Validate extension
    ext = os.path.splitext(upload_file.filename)[1].lower()
    allowed_exts = [e.strip() for e in settings.ALLOWED_EXTENSIONS.split(",")]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension de fichier invalide. Autorisé: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Check size (read first chunk)
    contents = upload_file.file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le fichier dépasse la taille maximale de {settings.MAX_UPLOAD_SIZE} octets"
        )
    # Reset cursor after reading
    upload_file.file.seek(0)
    
    # Make dir
    target_dir = os.path.join(settings.UPLOAD_DIR, subdir)
    os.makedirs(target_dir, exist_ok=True)
    
    # Save file
    safe_filename = f"{uuid.uuid4()}{ext}"
    target_path = os.path.join(target_dir, safe_filename)
    
    with open(target_path, "wb") as f:
        f.write(contents)
        
    # Relative path to store in db
    return os.path.join(subdir, safe_filename).replace("\\", "/")

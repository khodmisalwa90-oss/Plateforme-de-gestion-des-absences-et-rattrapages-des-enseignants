from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.services.chatbot_service import ChatbotService
from app.utils.upload import save_upload_file

router = APIRouter()

class ChatMessageRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

class ConfirmActionRequest(BaseModel):
    action: str
    params: Dict[str, Any]

@router.post("/message")
def chat_message(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    """
    Sends a message to the AI Chatbot and receives a natural language or action confirmation response.
    """
    return ChatbotService.process_message(
        db=db,
        user=current_user,
        message=payload.message,
        history=payload.history
    )

@router.post("/confirm")
def chat_confirm_action(
    payload: ConfirmActionRequest,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    """
    Confirms and executes a write/action from the chatbot.
    """
    result = ChatbotService.execute_confirmed_action(
        db=db,
        user=current_user,
        action=payload.action,
        params=payload.params
    )
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("message", "Erreur lors de l'exécution de l'action.")
        )
    return result

@router.post("/upload")
def chatbot_upload_file(
    file: UploadFile = File(...),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    """
    Saves an uploaded file to the static files folder specifically for chatbot justifications.
    Returns the saved file path and name.
    """
    try:
        path = save_upload_file(file, subdir="")
        return {
            "success": True,
            "filename": file.filename,
            "path": path
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

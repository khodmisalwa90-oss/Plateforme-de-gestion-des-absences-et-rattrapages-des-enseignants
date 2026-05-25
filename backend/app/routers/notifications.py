from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.schemas.notification import NotificationResponse
from app.schemas.common import PaginatedResponse
from app.services.notification_service import NotificationService

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[NotificationResponse])
def get_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    items, total = NotificationService.get_for_user(db, current_user.id, page, per_page)
    total_pages = (total + per_page - 1) // per_page
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/non-lues", response_model=PaginatedResponse[NotificationResponse])
def get_unread_notifications(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    items, total = NotificationService.get_for_user(db, current_user.id, page, per_page, unread_only=True)
    total_pages = (total + per_page - 1) // per_page
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/{id}", response_model=NotificationResponse)
def get_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    return NotificationService.get_by_id(db, id, current_user.id)

@router.put("/{id}/lire", response_model=NotificationResponse)
def mark_as_read(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    return NotificationService.mark_as_read(db, id, current_user.id)

@router.put("/tout-lire")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    count = NotificationService.mark_all_as_read(db, current_user.id)
    return {
        "message": "Toutes les notifications ont été marquées comme lues",
        "updated_count": count
    }

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    NotificationService.delete(db, id, current_user.id)
    return None

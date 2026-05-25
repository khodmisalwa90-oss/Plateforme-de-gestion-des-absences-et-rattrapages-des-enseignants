from sqlalchemy.orm import Session
from typing import List, Tuple, Optional
from app.models.notification import Notification
from app.models.utilisateur import Utilisateur
from app.utils.email import send_email
from fastapi import HTTPException, status

class NotificationService:
    @staticmethod
    def get_for_user(db: Session, user_id: int, page: int = 1, per_page: int = 20, unread_only: bool = False) -> Tuple[List[Notification], int]:
        query = db.query(Notification).filter(Notification.utilisateur_id == user_id)
        if unread_only:
            query = query.filter(Notification.est_lu == False)
        
        total = query.count()
        items = query.order_by(Notification.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, notification_id: int, user_id: int) -> Notification:
        notification = db.query(Notification).filter(Notification.id == notification_id, Notification.utilisateur_id == user_id).first()
        if not notification:
            raise HTTPException(status_code=404, detail="Notification non trouvée")
        return notification

    @staticmethod
    def create(db: Session, user_id: int, titre: str, message: str) -> Notification:
        db_item = Notification(utilisateur_id=user_id, titre=titre, message=message)
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        
        # Send email
        user = db.query(Utilisateur).filter(Utilisateur.id == user_id).first()
        if user and user.email:
            send_email(user.email, titre, message)
            
        return db_item

    @staticmethod
    def mark_as_read(db: Session, notification_id: int, user_id: int) -> Notification:
        notification = NotificationService.get_by_id(db, notification_id, user_id)
        notification.est_lu = True
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def mark_all_as_read(db: Session, user_id: int) -> int:
        updated_count = db.query(Notification).filter(
            Notification.utilisateur_id == user_id, 
            Notification.est_lu == False
        ).update({"est_lu": True}, synchronize_session=False)
        db.commit()
        return updated_count

    @staticmethod
    def delete(db: Session, notification_id: int, user_id: int) -> bool:
        notification = NotificationService.get_by_id(db, notification_id, user_id)
        db.delete(notification)
        db.commit()
        return True

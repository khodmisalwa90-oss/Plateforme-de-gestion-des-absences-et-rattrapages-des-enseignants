from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, select
from typing import List, Optional, Tuple
from datetime import date, time, datetime
from app.models.salle import Salle
from app.models.emploi_du_temps import EmploiDuTemps
from app.models.rattrapage import Rattrapage
from app.models.enums import StatutRattrapage
from app.schemas.salle import SalleCreate, SalleUpdate

class SalleService:
    @staticmethod
    def get_paginated(db: Session, page: int, per_page: int, search: Optional[str] = None) -> Tuple[List[Salle], int]:
        query = db.query(Salle)
        if search:
            query = query.filter(Salle.nom.ilike(f"%{search}%"))
        
        total = query.count()
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, salle_id: int) -> Optional[Salle]:
        return db.query(Salle).filter(Salle.id == salle_id).first()

    @staticmethod
    def create(db: Session, data: SalleCreate) -> Salle:
        db_obj = Salle(nom=data.nom, capacite=data.capacite)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, salle_id: int, data: SalleUpdate) -> Optional[Salle]:
        db_obj = db.query(Salle).filter(Salle.id == salle_id).first()
        if not db_obj:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, salle_id: int) -> bool:
        db_obj = db.query(Salle).filter(Salle.id == salle_id).first()
        if not db_obj:
            return False
        
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def check_availability(db: Session, target_date: date, start_time: time, end_time: time, page: int, per_page: int) -> Tuple[List[Salle], int]:
        # EmploiDuTemps is weekly recurring. We get day of week (0=Monday, ..., 6=Sunday).
        day_of_week = target_date.weekday()
        
        # Subquery to find rooms that are occupied at specified date/time in EmploiDuTemps
        occupied_in_edt = db.query(EmploiDuTemps.salle_id).filter(
            EmploiDuTemps.jour_semaine == day_of_week,
            EmploiDuTemps.heure_debut < end_time,
            EmploiDuTemps.heure_fin > start_time
        ).subquery()
        
        # Subquery to find rooms that are occupied at specified date/time in Rattrapage
        occupied_in_rattrapage = db.query(Rattrapage.salle_id).filter(
            Rattrapage.date_proposee == target_date,
            Rattrapage.statut == StatutRattrapage.VALIDE,
            Rattrapage.heure_debut < end_time,
            Rattrapage.heure_fin > start_time
        ).subquery()
        
        # Room query excluding those in any of the occupation subqueries
        available_rooms_query = db.query(Salle).filter(
            Salle.id.notin_(select(occupied_in_edt)),
            Salle.id.notin_(select(occupied_in_rattrapage))
        )
        
        total = available_rooms_query.count()
        offset = (page - 1) * per_page
        items = available_rooms_query.offset(offset).limit(per_page).all()
        
        return items, total

    @staticmethod
    def has_future_bookings(db: Session, salle_id: int) -> bool:
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        
        # Check EmploiDuTemps (since they are recurring every week indefinitely)
        count_edt = db.query(EmploiDuTemps).filter(
            EmploiDuTemps.salle_id == salle_id
        ).count()
        
        if count_edt > 0:
            return True
            
        # Check Rattrapage
        count_rattrapage = db.query(Rattrapage).filter(
            Rattrapage.salle_id == salle_id,
            Rattrapage.statut == StatutRattrapage.VALIDE,
            or_(
                Rattrapage.date_proposee > today,
                and_(
                    Rattrapage.date_proposee == today,
                    Rattrapage.heure_fin > current_time
                )
            )
        ).count()
        
        return count_rattrapage > 0

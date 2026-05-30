from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import os
from app.models import *
from app.core.database import Base, engine
from app.routers import auth, utilisateurs, departements, groupes, matieres, salles, emplois_du_temps, absences, rattrapages, dashboard, notifications, chatbot
from app.utils.validation import translate_validation_errors

Base.metadata.create_all(bind=engine)

os.makedirs("./uploads/justificatifs", exist_ok=True)

app = FastAPI(
    title="Gestion des Absences et Rattrapages des Enseignants",
    version="1.0.0"
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    translated_errors = [translate_validation_errors(err) for err in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={"detail": translated_errors}
    )


app.mount("/uploads", StaticFiles(directory="./uploads/justificatifs"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(utilisateurs.router, prefix="/api/v1/users", tags=["users"])
app.include_router(departements.router, prefix="/api/v1/departements", tags=["departements"])
app.include_router(groupes.router, prefix="/api/v1/groupes", tags=["groupes"])
app.include_router(matieres.router, prefix="/api/v1/matieres", tags=["matieres"])
app.include_router(salles.router, prefix="/api/v1/salles", tags=["salles"])
app.include_router(emplois_du_temps.router, prefix="/api/v1/emplois-du-temps", tags=["emplois-du-temps"])
app.include_router(absences.router, prefix="/api/v1/absences", tags=["absences"])
app.include_router(rattrapages.router, prefix="/api/v1/rattrapages", tags=["rattrapages"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["chatbot"])

@app.get("/")
async def root():
    return {"message": "Bienvenue dans l'API Gestion des Absences"}

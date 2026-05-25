@echo off
echo Setting up virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Checking for .env file...
if not exist .env (
    echo Creating .env from .env.example
    copy .env.example .env
    echo Please edit .env with your database settings.
    pause
)

echo Starting FastAPI server...
uvicorn main:app --reload

pause
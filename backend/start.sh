#!/bin/bash

echo "Setting up virtual environment..."
python3 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Checking for .env file..."
if [ ! -f .env ]; then
echo "Creating .env from .env.example"
cp .env.example .env
echo "Please edit .env with your database settings."
read -p "Press Enter to continue..."
fi

echo "Starting FastAPI server..."
uvicorn main:app --reload

read -p "Press Enter to exit..."

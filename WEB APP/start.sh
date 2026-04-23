#!/bin/bash
# Quick Start - Mare Calmo v2.0

echo "Mare Calmo - Quick Start"
echo "============================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python3 non trovato. Installare Python."
    exit 1
fi

echo "Python3 trovato"

# Setup backend
echo ""
echo "Setup Backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "   Creazione virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "   Installazione dipendenze..."
pip install -q -r requirements.txt

echo "Backend configurato"

# Check if uvicorn is available
if ! command -v uvicorn &> /dev/null; then
    echo "Error: uvicorn non trovato. Verificare installazione."
    exit 1
fi

# Start backend server
echo ""
echo "Avvio server backend..."
echo "   → http://localhost:8000"
echo "   → Docs: http://localhost:8000/docs"
echo ""

uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Setup frontend
echo ""
echo "Setup Frontend..."
cd ../frontend

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm non trovato. frontend richiede Node.js + npm"
    echo "   Scarica da: https://nodejs.org/"
else
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        echo "   Installazione dipendenze..."
        npm install -q
    fi
    
    echo "Frontend configurato"
    echo ""
    echo "Avvio dev server frontend..."
    echo "   → http://localhost:5173"
    echo ""
    
    npm run dev &
    FRONTEND_PID=$!
fi

echo ""
echo "Mare Calmo è in esecuzione!"
echo ""
echo "Premi Ctrl+C per arrestare i server..."
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null

echo ""
echo "Arrivederci!"

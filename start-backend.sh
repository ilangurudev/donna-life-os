#!/bin/bash
cd /home/sprite/donna-life-os

# Load environment variables from .env file
set -a  # automatically export all variables
source .env
set +a

.venv/bin/python -m uvicorn src.web.main:app --host 0.0.0.0 --reload --port 8000

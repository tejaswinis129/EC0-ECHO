import sys
import os
from pathlib import Path

# Add project root to sys.path so 'server' modules can be imported
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Mark serverless environment
os.environ["VERCEL"] = "1"

# Import ASGI FastAPI application
from server.app.main import app

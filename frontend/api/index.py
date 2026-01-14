from main import app as application
import sys
import os

# Add backend directory to path so imports work
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Vercel needs 'app' variable
app = application

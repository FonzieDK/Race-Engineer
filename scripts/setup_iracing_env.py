#!/usr/bin/env python3
"""
Setup script for Race-Engineer.
Checks Python installation, creates a virtual environment, and installs dependencies.
"""

import subprocess
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
VENV_DIR = PROJECT_ROOT / "venv"
REQUIREMENTS_FILE = PROJECT_ROOT / "requirements" / "runtime.txt"

def check_python_version():
    """Check if a supported Python version is installed."""
    if sys.version_info < (3, 10):
        print("Error: Python 3.10 or higher is required.")
        sys.exit(1)
    print(f"Python version: {sys.version}")

def create_virtual_env():
    """Create a virtual environment named 'venv'."""
    if VENV_DIR.exists():
        print("Virtual environment already exists.")
        return
    print("Creating virtual environment...")
    subprocess.check_call([sys.executable, "-m", "venv", str(VENV_DIR)])
    print("Virtual environment created.")

def install_requirements():
    """Install required packages."""
    pip_path = VENV_DIR / "Scripts" / "pip.exe"
    print("Installing requirements...")
    subprocess.check_call([str(pip_path), "install", "-r", str(REQUIREMENTS_FILE)])
    print("Requirements installed.")

def main():
    print("Setting up the Race-Engineer environment...")
    try:
        check_python_version()
        create_virtual_env()
        install_requirements()
        print("Setup complete. Run scripts/start_race_engineer.bat to launch Race-Engineer.")
    except Exception as e:
        print(f"Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

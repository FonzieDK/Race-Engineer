#!/usr/bin/env python3
"""
Setup script for Race-Engineer.
Checks Python installation, creates virtual environment, installs dependencies, and verifies iRacing availability.
"""

import sys
import os
import subprocess
import json

def check_python_version():
    """Check if Python 3.6+ is installed."""
    if sys.version_info < (3, 6):
        print("Error: Python 3.6 or higher is required.")
        sys.exit(1)
    print(f"Python version: {sys.version}")

def create_virtual_env():
    """Create a virtual environment named 'venv'."""
    if os.path.exists('venv'):
        print("Virtual environment already exists.")
        return
    print("Creating virtual environment...")
    subprocess.check_call([sys.executable, '-m', 'venv', 'venv'])
    print("Virtual environment created.")

def install_requirements():
    """Install required packages."""
    pip_path = os.path.join('venv', 'Scripts', 'pip.exe')
    print("Installing requirements...")
    subprocess.check_call([pip_path, 'install', '-r', 'requirements.txt'])
    print("Requirements installed.")

def check_iracing_running():
    """Check if iRacing is running."""
    try:
        import psutil
    except ImportError:
        print("psutil not available, skipping iRacing check.")
        return False
    for proc in psutil.process_iter(['pid', 'name']):
        if proc.info['name'] == 'iRacing.exe':
            print("iRacing is running.")
            return True
    print("Warning: iRacing does not appear to be running. Race-Engineer requires iRacing to be active.")
    return False

def main():
    print("Setting up the Race-Engineer environment...")
    try:
        check_python_version()
        create_virtual_env()
        install_requirements()
        check_iracing_running()
        print("Setup complete. Run start_race_engineer.bat to launch Race-Engineer.")
    except Exception as e:
        print(f"Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

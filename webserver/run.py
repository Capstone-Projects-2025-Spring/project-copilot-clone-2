import os
import subprocess
import sys
import venv

venv_dir = ".venv"
requirements_file = "requirements.txt"
docs_path = "docs"


def get_python_executable():
    """Get the correct Python executable inside the virtual environment."""
    if sys.platform == "win32":
        return os.path.join(venv_dir, "Scripts", "python.exe")
    return os.path.join(venv_dir, "bin", "python")


def create_virtualenv():
    """Create a virtual environment if it doesn't exist."""
    if not os.path.exists(venv_dir):
        print(f"Creating virtual environment in {venv_dir}...")
        venv.create(venv_dir, with_pip=True)
    else:
        print(f"Virtual environment already exists in {venv_dir}.")


def install_requirements():
    """Install dependencies from the requirements file."""
    if os.path.exists(requirements_file):
        print(f"Installing dependencies from {requirements_file}...")
        subprocess.run([get_python_executable(), "-m", "pip", "install", "-r", requirements_file], check=True)
    else:
        print(f"{requirements_file} not found. Skipping dependency installation.")


def build_docs():
    """Build the Sphinx documentation."""
    if os.path.exists(docs_path):
        print(f"Building Sphinx docs in {docs_path}...")
        subprocess.run([get_python_executable(), "-m", "sphinx.cmd.build", "-b", "html", "source", "build"], cwd=docs_path, check=True)
    else:
        print(f"Docs folder not found at {docs_path}. Skipping docs build.")


def run_flask_app():
    """Run the Flask application."""
    print("Starting Flask app...")
    subprocess.run([get_python_executable(), "app.py"], check=True)


if __name__ == "__main__":
    create_virtualenv()
    install_requirements()
    build_docs()

    # Run the Flask app
    run_flask_app()

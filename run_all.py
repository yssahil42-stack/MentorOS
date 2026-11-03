"""
MentorOS — Start all services
Usage:
    python run_all.py           # start backend + frontend and open in browser
    python run_all.py --no-open # start without auto-opening browser
    python run_all.py --test    # start + run e2e suite after ready
"""
import subprocess
import sys
import time
import os
import webbrowser
from pathlib import Path

ROOT     = Path(__file__).parent.resolve()
VENV     = ROOT / "venv"
BACKEND  = ROOT / "backend"
FRONTEND = ROOT / "frontend"

# Resolve the venv python / pip
if sys.platform == "win32":
    PYTHON = VENV / "Scripts" / "python.exe"
else:
    PYTHON = VENV / "bin" / "python"

RUN_TEST = "--test" in sys.argv
NO_OPEN  = "--no-open" in sys.argv


def step(msg: str):
    print(f"\n>>> {msg}", flush=True)


def abort(msg: str):
    print(f"[ERROR] {msg}", flush=True)
    sys.exit(1)


def check_prereqs():
    step("Checking prerequisites...")

    if not PYTHON.exists():
        abort(
            f"venv not found at '{VENV}'.\n"
            "  Create it first:\n"
            "    python -m venv venv\n"
            "    venv\\Scripts\\activate  (or source venv/bin/activate)\n"
            "    pip install -r requirements.txt"
        )

    npm = subprocess.run("npm --version", shell=True, capture_output=True)
    if npm.returncode != 0:
        abort("npm not found. Install Node.js from https://nodejs.org")

    node_modules = FRONTEND / "node_modules"
    if not node_modules.exists():
        step("node_modules missing — running npm install...")
        subprocess.run("npm install", shell=True, cwd=FRONTEND, check=True)


def start_backend() -> subprocess.Popen:
    step("Starting FastAPI backend  (http://127.0.0.1:8000)...")
    cmd = [
        str(PYTHON), "-m", "uvicorn",
        "app.main:app",
        "--reload",
        "--host", "127.0.0.1",
        "--port", "8000",
    ]
    # On Windows open a new console window; on Unix just a background process
    kwargs = {}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_CONSOLE
    return subprocess.Popen(cmd, cwd=BACKEND, **kwargs)


def start_frontend() -> subprocess.Popen:
    step("Starting Vite dev server  (http://localhost:5173)...")
    # Use shell=True so Windows finds npm.cmd automatically
    kwargs = {"shell": True}
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_CONSOLE
    return subprocess.Popen("npm run dev", cwd=FRONTEND, **kwargs)


def run_tests():
    step("Waiting 5 s for services to start before running e2e tests...")
    time.sleep(5)
    step("Running e2e test suite...")
    result = subprocess.run([str(PYTHON), str(ROOT / "test_e2e_suite.py")])
    return result.returncode


def main():
    check_prereqs()

    be = start_backend()
    fe = start_frontend()

    print()
    print("=" * 60)
    print("  MentorOS Services Online!")
    print("  Frontend UI : http://localhost:5173")
    print("  Backend API : http://127.0.0.1:8000")
    print("  API Docs    : http://127.0.0.1:8000/docs")
    print("=" * 60)
    print()

    if not NO_OPEN and not RUN_TEST:
        time.sleep(2)
        try:
            webbrowser.open("http://localhost:5173")
        except Exception:
            pass

    if RUN_TEST:
        code = run_tests()
        sys.exit(code)
    else:
        print("Tip: run with --test to also execute the e2e suite after startup.")
        print("\nAll services launched. Press Ctrl+C to stop.\n")
        try:
            be.wait()
        except KeyboardInterrupt:
            print("\nShutting down...")
            be.terminate()
            fe.terminate()


if __name__ == "__main__":
    main()

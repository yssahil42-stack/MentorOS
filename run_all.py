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
import socket
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


def wait_for_service(port: int, service_name: str, timeout: float = 30.0) -> bool:
    """Wait until a service is accepting TCP connections on port 127.0.0.1 or localhost."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        for host in ("127.0.0.1", "localhost"):
            try:
                with socket.create_connection((host, port), timeout=0.5):
                    return True
            except (OSError, ConnectionRefusedError):
                pass
        time.sleep(0.3)
    print(f"[WARNING] Timed out waiting for {service_name} on port {port} after {timeout}s", flush=True)
    return False


def run_tests():
    step("Waiting for services before running e2e tests...")
    wait_for_service(8000, "Backend API")
    wait_for_service(5173, "Frontend Vite server")
    step("Running e2e test suite...")
    result = subprocess.run([str(PYTHON), str(ROOT / "test_e2e_suite.py")])
    return result.returncode


def main():
    check_prereqs()

    be = start_backend()
    fe = start_frontend()

    step("Waiting for backend (port 8000) and frontend (port 5173) to be fully ready...")
    be_ready = wait_for_service(8000, "Backend API")
    fe_ready = wait_for_service(5173, "Frontend Vite server")

    print()
    print("=" * 60)
    print("  MentorOS Services Online!")
    print("  Frontend UI : http://localhost:5173")
    print("  Backend API : http://127.0.0.1:8000")
    print("  API Docs    : http://127.0.0.1:8000/docs")
    print("=" * 60)
    print()

    if not NO_OPEN and not RUN_TEST:
        if fe_ready:
            # Brief 0.5s pause so Vite completes internal route registration before browser hits it
            time.sleep(0.5)
            step("Opening http://localhost:5173 in default browser...")
            try:
                webbrowser.open("http://localhost:5173")
            except Exception:
                pass
        else:
            print("[WARNING] Could not auto-open browser: Frontend port 5173 was not ready.")

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

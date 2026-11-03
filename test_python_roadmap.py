import sys
import httpx

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_python_roadmap():
    base_url = "http://127.0.0.1:8000/api/v1"
    
    # 1. Login
    login_data = {"email": "developer@mentoros.dev", "password": "password123"}
    resp = httpx.post(f"{base_url}/auth/login", json=login_data)
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[SUCCESS] Successfully authenticated with MentorOS backend API.")
    
    # 2. Request AI proposal
    user_prompt = "i want to learn python in 3 months"
    print(f"\n[Test] Sending prompt: '{user_prompt}' to /ai/propose...")
    prop_resp = httpx.post(f"{base_url}/ai/propose", json={"request_text": user_prompt, "role": "student"}, headers=headers, timeout=60.0)
    assert prop_resp.status_code == 200, f"Proposal failed: {prop_resp.text}"
    proposal = prop_resp.json()
    
    summary = proposal["summary"]
    print("\n--- Proposal Summary Received ---")
    print(summary[:350] + f"...\n(Total length: {len(summary)} characters)\n")
    
    # Verify core parts of user requested curriculum
    required_phrases = [
        "If your goal is to become genuinely comfortable with Python in 3 months",
        "3-Month Python Roadmap",
        "Month 1 — Python Fundamentals",
        "Week 1: Python Basics",
        "Calculator",
        "Unit converter",
        "Week 2: Decision Making",
        "Week 3: Loops",
        "Week 4: Data Structures",
        "Student Management System",
        "Month 2 — Intermediate Python",
        "Week 5: Functions",
        "Week 6: Files + Error Handling",
        "Expense Tracker",
        "Week 7: Object-Oriented Programming",
        "Library Management System",
        "Week 8: Modules + Professional Python",
        "Month 3 — Advanced Python + Real Projects",
        "Week 9: Advanced Python",
        "Week 10: APIs + Database",
        "Week 11: FastAPI",
        "Week 12: Final Project",
        "AI Productivity Workspace Backend",
        "Daily Schedule",
        "Don't spend 2 hours watching Python tutorials. Spend 2 hours writing Python.",
        "Your progression"
    ]
    
    for phrase in required_phrases:
        assert phrase in summary, f"Missing required curriculum phrase: '{phrase}'"
    print(f"[SUCCESS] All {len(required_phrases)} required curriculum sections present in summary!")
    
    # Verify items
    items = proposal["items"]
    projects = [i for i in items if i["item_type"] == "project"]
    milestones = [i for i in items if i["item_type"] == "milestone"]
    tasks = [i for i in items if i["item_type"] == "task"]
    notes = [i for i in items if i["item_type"] == "note"]
    events = [i for i in items if i["item_type"] == "calendar_event"]
    
    print(f"[SUCCESS] Proposal generated: {len(projects)} Project, {len(milestones)} Milestones, {len(tasks)} Tasks, {len(notes)} Note, {len(events)} Event")
    assert len(projects) == 1, "Should have 1 project"
    assert len(milestones) == 3, f"Should have 3 milestones (Months 1-3), got {len(milestones)}"
    assert len(tasks) == 12, f"Should have 12 weekly tasks (Weeks 1-12), got {len(tasks)}"
    assert len(notes) >= 1, "Should have at least 1 note"
    
    # Verify note content has full roadmap as well
    note_content = notes[0]["payload"]["content"]
    assert "If your goal is to become genuinely comfortable with Python in 3 months" in note_content
    print("[SUCCESS] Note payload also contains the full mentor-grade roadmap curriculum!")
    
    # 3. Test 1-click Approval
    all_item_ids = [i["id"] for i in items]
    print(f"\n[Test] Approving {len(all_item_ids)} items into workspace...")
    appr_resp = httpx.post(f"{base_url}/ai/proposals/{proposal['id']}/approve", json={"approved_item_ids": all_item_ids}, headers=headers)
    assert appr_resp.status_code == 200, f"Approval failed: {appr_resp.text}"
    appr_res = appr_resp.json()
    print(f"[SUCCESS] Approval success! Created: {len(appr_res['created_tasks'])} tasks, {len(appr_res['created_milestones'])} milestones, {len(appr_res['created_projects'])} projects.")
    assert len(appr_res["created_tasks"]) == 12, "Should create 12 tasks in DB"
    
    print("\nALL ROADMAP VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_python_roadmap()

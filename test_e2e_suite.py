import urllib.request
import urllib.error
import json
import sys

base_url = 'http://127.0.0.1:8000/api/v1'

# ─────────────────────────────────────────────
# HTTP helpers
# ─────────────────────────────────────────────

def post(endpoint, data, token=None):
    req = urllib.request.Request(
        f'{base_url}{endpoint}',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json', **({'Authorization': f'Bearer {token}'} if token else {})}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(endpoint, token=None):
    req = urllib.request.Request(
        f'{base_url}{endpoint}',
        headers=({'Authorization': f'Bearer {token}'} if token else {})
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def patch(endpoint, data, token=None):
    req = urllib.request.Request(
        f'{base_url}{endpoint}',
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json', **({'Authorization': f'Bearer {token}'} if token else {})},
        method='PATCH'
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def delete(endpoint, token=None):
    req = urllib.request.Request(
        f'{base_url}{endpoint}',
        headers=({'Authorization': f'Bearer {token}'} if token else {}),
        method='DELETE'
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status

# ─────────────────────────────────────────────
# Shared auth state
# ─────────────────────────────────────────────

_token = None

def _get_token():
    global _token
    if _token is None:
        test_auth_login()
    return _token

# ─────────────────────────────────────────────
# Individual test functions
# ─────────────────────────────────────────────

def test_auth_login():
    print('=== 1. Testing Auth Login (Developer) ===')
    global _token
    login = post('/auth/login', {'email': 'developer@mentoros.dev', 'password': 'password123'})
    _token = login['access_token']
    user = login['user']
    print(f'Logged in user: {user["full_name"]} ({user["role"]})')

def test_auth_me():
    print('\n=== 2. Testing /auth/me ===')
    me = get('/auth/me', _get_token())
    assert me['email'] == 'developer@mentoros.dev'
    print('Verified /auth/me: OK')

def test_tasks():
    print('\n=== 3. Testing Task Endpoints (Create, Filter, Complete, Delete) ===')
    token = _get_token()
    new_task = post('/tasks', {
        'title': 'Test Button: Automated Task Creation',
        'description': 'Verification of task action',
        'priority': 'urgent',
        'estimated_minutes': 45
    }, token)
    print(f'Created Task ID {new_task["id"]}: {new_task["title"]}')

    # Toggle task to completed
    updated_task = patch(f'/tasks/{new_task["id"]}', {'status': 'completed'}, token)
    assert updated_task['status'] == 'completed'
    print('Task status toggled to completed: OK')

    # Query task list
    tasks = get('/tasks', token)
    print(f'Total tasks in sprint: {len(tasks)}')

    # Delete task
    del_status = delete(f'/tasks/{new_task["id"]}', token)
    print(f'Task deleted with HTTP status {del_status}')

def test_projects_and_milestones():
    print('\n=== 4. Testing Project & Milestone Endpoints ===')
    token = _get_token()
    new_proj = post('/projects', {
        'title': 'Test Project: Microservices Migration',
        'description': 'Architecture evolution sprint',
        'priority': 'high',
        'target_date': '2026-11-01'
    }, token)
    print(f'Created Project ID {new_proj["id"]}: {new_proj["title"]}')

    new_ms = post('/milestones', {
        'project_id': new_proj['id'],
        'title': 'Deploy Canary Cluster',
        'description': 'Zero downtime rollout',
        'target_date': '2026-10-15'
    }, token)
    print(f'Created Milestone ID {new_ms["id"]}: {new_ms["title"]}')

    updated_ms = patch(f'/milestones/{new_ms["id"]}', {'status': 'completed'}, token)
    assert updated_ms['status'] == 'completed'
    print('Milestone marked completed: OK')

    # Cleanup project
    delete(f'/projects/{new_proj["id"]}', token)
    print('Project cleaned up: OK')

def test_calendar_events():
    print('\n=== 5. Testing Calendar Events ===')
    token = _get_token()
    ev = post('/calendar/events', {
        'title': 'Test Button: Schedule Deep Work Block',
        'start_at': '2026-09-22T10:00:00',
        'end_at': '2026-09-22T12:00:00',
        'event_type': 'build_block'
    }, token)
    print(f'Created Calendar Event ID {ev["id"]}: {ev["title"]}')
    delete(f'/calendar/events/{ev["id"]}', token)
    print('Calendar event cleaned up: OK')

def test_notes():
    print('\n=== 6. Testing Notes & ADRs ===')
    token = _get_token()
    n = post('/notes', {
        'title': 'Test Note: Cache Partitioning',
        'content': 'ADR content testing...',
        'is_pinned': True
    }, token)
    print(f'Created Note ID {n["id"]}: {n["title"]}')
    delete(f'/notes/{n["id"]}', token)
    print('Note cleaned up: OK')

def test_ai_pipeline():
    print('\n=== 7. Testing AI Drawer Pipeline (Propose & 1-Click Approve) ===')
    token = _get_token()
    prop = post('/ai/propose', {
        'request_text': 'Build notification service with websockets and alerts'
    }, token)
    print(f'AI Proposal Generated ID {prop["id"]}: {len(prop["items"])} items proposed')

    # Approve items
    approved = post(f'/ai/proposals/{prop["id"]}/approve', {
        'approved_item_ids': [item['id'] for item in prop['items']]
    }, token)
    print(f'Approved! Created {len(approved["created_tasks"])} tasks, {len(approved["created_projects"])} projects, {len(approved["created_milestones"])} milestones')

def test_dashboard_summary():
    print('\n=== 8. Testing Dashboard Summary Across All 4 Roles ===')
    token = _get_token()
    for role in ['developer', 'student', 'freelancer', 'job_seeker']:
        dash = get(f'/dashboard/summary?role={role}', token)
        print(f'Role {role:10s}: active_projects={dash["active_projects"]}, open_tasks={dash["open_tasks"]}, suggestion="{dash["ai_suggestion"]["id"]}"')

def test_multi_role_logins():
    print('\n=== 9. Testing Student, Freelancer & Job Seeker Logins ===')
    for acc in [('student@mentoros.dev', 'student'), ('freelancer@mentoros.dev', 'freelancer'), ('jobseeker@mentoros.dev', 'job_seeker')]:
        res = post('/auth/login', {'email': acc[0], 'password': 'password123'})
        assert res['user']['role'] == acc[1]
        print(f'Logged in {acc[0]} -> role {res["user"]["role"]}: OK')

# ─────────────────────────────────────────────
# Run All
# ─────────────────────────────────────────────

ALL_TESTS = [
    test_auth_login,
    test_auth_me,
    test_tasks,
    test_projects_and_milestones,
    test_calendar_events,
    test_notes,
    test_ai_pipeline,
    test_dashboard_summary,
    test_multi_role_logins,
]

def run_all():
    passed = 0
    failed = 0
    for test_fn in ALL_TESTS:
        try:
            test_fn()
            passed += 1
        except (AssertionError, urllib.error.URLError, KeyError) as e:
            print(f'\n[FAILED] {test_fn.__name__}: {e}')
            failed += 1

    print('\n======================================================')
    if failed == 0:
        print(f'SUCCESS: ALL {passed} TESTS PASSED!')
    else:
        print(f'RESULTS: {passed} passed, {failed} FAILED.')
    print('======================================================')
    return failed == 0

# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────

if __name__ == '__main__':
    # Usage:
    #   python test_e2e_suite.py              → run all tests
    #   python test_e2e_suite.py test_tasks   → run a single test by name
    #   python test_e2e_suite.py --list       → list available tests
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == '--list':
            print('Available tests:')
            for f in ALL_TESTS:
                print(f'  {f.__name__}')
            sys.exit(0)
        match = next((f for f in ALL_TESTS if f.__name__ == arg), None)
        if match is None:
            print(f'Unknown test: "{arg}"')
            print('Run with --list to see available tests.')
            sys.exit(1)
        _get_token()   # ensure auth before single test
        match()
    else:
        ok = run_all()
        sys.exit(0 if ok else 1)

#!/usr/bin/env python3
"""
Seed Supabase tables with data from TypeScript data files.
Reads .env.local for credentials. Uses Supabase REST API directly.
Usage: python3 scripts/seed_supabase.py
"""

import os, re, json, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── helpers ──────────────────────────────────────────────────────────

def load_env():
    path = os.path.join(ROOT, '.env.local')
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ.setdefault(k, v)
    
    # Check if required environment variables are set
    if 'NEXT_PUBLIC_SUPABASE_URL' not in os.environ or 'SUPABASE_SERVICE_ROLE_KEY' not in os.environ:
        print("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.")
        sys.exit(1)

def read_file(*parts):
    with open(os.path.join(ROOT, *parts)) as f:
        return f.read()

def extract_after(text, marker):
    """Return everything after *marker* up to the final semicolon."""
    idx = text.index(marker) + len(marker)
    rest = text[idx:].strip()
    if rest.startswith('='):
        rest = rest[1:].strip()
    # find the outer value — bracket/brace depth
    depth = 0
    in_str = False
    q = None
    skip_next = False
    end = 0
    for i, c in enumerate(rest):
        if skip_next:
            skip_next = False
            continue
        if in_str:
            if c == '\\':
                skip_next = True
            elif c == q:
                in_str = False
        elif c in '"\'':
            in_str = True
            q = c
        elif c in '[{':
            depth += 1
        elif c in ']}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end == 0:
        raise ValueError(f'Could not find end of value after "{marker}"')
    return rest[:end]

def ts_literal_to_py(text):
    """Convert a TypeScript literal value (object/array) to a Python object."""
    # 1: single-quoted strings → JSON-safe double-quoted (handle escapes)
    def fix_sq(m):
        inner = m.group(1)
        inner = inner.replace("\\'", "'").replace('\\\\', '\\')
        return json.dumps(inner, ensure_ascii=False)
    text = re.sub(r"'((?:[^'\\]|\\.)*)'", fix_sq, text)
    # 2: unquoted object keys → quoted (handles inline keys like { title: })
    text = re.sub(r'([{,]\s*)(\w+)(\s*:)', r'\1"\2"\3', text)
    # 3: trailing commas before } or ]
    text = re.sub(r',(\s*[}\]])', r'\1', text)
    return json.loads(text)

def supabase_rest(method, table, body=None):
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + f'/rest/v1/{table}'
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()}')
        return None

def upsert(table, rows, conflict_col='id'):
    """Upsert rows using POST with on_conflict."""
    if not rows:
        return []
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    url = os.environ['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + f'/rest/v1/{table}?on_conflict={conflict_col}'
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}',
        'Content-Type': 'application/json',
        'Prefer': f'resolution=merge-duplicates,return=representation',
    }
    body = rows if isinstance(rows, list) else [rows]
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()}')
        return None

def clear_table(table):
    supabase_rest('DELETE', table)

print('')
print('Seeding portfolio data into Supabase…')
print('')

load_env()

# ── 1. Projects ──────────────────────────────────────────────────────

print('Projects…')
try:
    with open(os.path.join(ROOT, 'src', 'data', 'projects.json'), 'r') as f:
        projects_raw = json.load(f)
except Exception as e:
    print(f'  Failed to load projects.json: {e}')
    projects_raw = []

for p in projects_raw:
    p['slug'] = p.pop('id')
    p['isLive'] = p.get('isLive', False)
    p['status'] = p.get('status', 'soon')
    p.setdefault('longDescription', p.get('longDescription', ''))
if projects_raw:
    upsert('projects', projects_raw, 'slug')
print(f'  {len(projects_raw)} projects synced')

# ── 2. Skills ────────────────────────────────────────────────────────

print('Skills…')
try:
    with open(os.path.join(ROOT, 'src', 'data', 'skills.json'), 'r') as f:
        skills_raw = json.load(f)
except Exception as e:
    print(f'  Failed to load skills.json: {e}')
    skills_raw = []

for s in skills_raw:
    s.setdefault('level', '')
    s.setdefault('prereq', '')
    s.setdefault('status', '')
    s.setdefault('projects', [])
if skills_raw:
    upsert('skills', skills_raw, 'name')
print(f'  {len(skills_raw)} skills synced')

# ── 3. Certificates ──────────────────────────────────────────────────

print('Certificates…')
try:
    with open(os.path.join(ROOT, 'src', 'data', 'certificates.json'), 'r') as f:
        certs_raw = json.load(f)
except Exception as e:
    print(f'  Failed to load certificates.json: {e}')
    certs_raw = []

for c in certs_raw:
    c['slug'] = c.pop('id')
if certs_raw:
    upsert('certificates', certs_raw, 'slug')
print(f'  {len(certs_raw)} certificates synced')

# ── 4. Profile (resume) ──────────────────────────────────────────────

print('Profile…')
try:
    with open(os.path.join(ROOT, 'src', 'data', 'resume.json'), 'r') as f:
        resume_data = json.load(f)
except Exception as e:
    print(f'  Failed to load resume.json: {e}')
    resume_data = None

if resume_data:
    row = {'id': 1, 'data': resume_data}
    upsert('profile', [row], 'id')
print('  resume profile synced')

print('')
print('Done!')

"""
Supabase sync helper for the synchronizer.
Uses the Supabase REST API with the service role key from .env.local.
"""

import os, json, urllib.request, urllib.error

_URL = None
_KEY = None

def _load_env():
    global _URL, _KEY
    if _URL and _KEY:
        return
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                if k == 'NEXT_PUBLIC_SUPABASE_URL':
                    _URL = v.rstrip('/')
                elif k == 'SUPABASE_SERVICE_ROLE_KEY':
                    _KEY = v

def _supabase_rest(table, method='GET', body=None, params=None):
    _load_env()
    url = f'{_URL}/rest/v1/{table}'
    if params:
        url += '?' + '&'.join(f'{k}={urllib.request.quote(str(v))}' for k, v in params)
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
    if method == 'DELETE':
        del headers['Content-Type']
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()}')
        return None

def sync_projects(projects):
    if not projects:
        return
    rows = []
    for p in projects:
        rows.append({
            'slug': p.get('id', ''),
            'title': p.get('title', ''),
            'description': p.get('description', ''),
            'longDescription': p.get('longDescription', ''),
            'image': p.get('image', ''),
            'tags': p.get('tags', []),
            'liveUrl': p.get('liveUrl', ''),
            'githubUrl': p.get('githubUrl', ''),
            'color': p.get('color', '#00E676'),
            'isLive': p.get('isLive', False),
            'status': p.get('status', 'soon'),
        })
    # Upsert via POST with merge-duplicates
    _load_env()
    url = f'{_URL}/rest/v1/projects'
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()}')
        return None

def sync_skills(skills_list):
    if not skills_list:
        return
    rows = []
    for s in skills_list:
        row = {
            'name': s.get('name', ''),
            'icon': s.get('icon', 'sparkles'),
            'description': s.get('description', ''),
            'category': s.get('category', 'dynamic'),
            'color': s.get('color', '#00E676'),
            'level': s.get('level', ''),
            'prereq': s.get('prereq', ''),
            'status': s.get('status', ''),
            'projects': s.get('projects', []),
        }
        rows.append(row)
    _load_env()
    url = f'{_URL}/rest/v1/skills'
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()}')
        return None

def sync_certificates(certs):
    if not certs:
        return
    rows = []
    for c in certs:
        rows.append({
            'slug': c.get('id', ''),
            'title': c.get('title', ''),
            'issuer': c.get('issuer', ''),
            'date': c.get('date', ''),
            'credentialId': c.get('credentialId', ''),
            'verifyUrl': c.get('verifyUrl', ''),
            'image': c.get('image', ''),
            'tags': c.get('tags', []),
        })
    _load_env()
    url = f'{_URL}/rest/v1/certificates'
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    data = json.dumps(rows).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()}')
        return None

def sync_resume(resume):
    _load_env()
    url = f'{_URL}/rest/v1/profile'
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    body = {'id': 1, 'data': resume}
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code}: {e.read().decode()}')
        return None

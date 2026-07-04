"""
Supabase sync helper for the synchronizer.
Uses the Supabase REST API with the service role key from .env.local.
"""

import os, json, urllib.parse, urllib.request, urllib.error

_URL = None
_KEY = None

def _load_env():
    global _URL, _KEY
    if _URL and _KEY:
        return
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    try:
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    if k == 'NEXT_PUBLIC_SUPABASE_URL':
                        _URL = v.rstrip('/')
                    elif k == 'SUPABASE_SERVICE_ROLE_KEY':
                        _KEY = v
    except FileNotFoundError:
        return

def _has_config():
    _load_env()
    return bool(_URL and _KEY)

def _supabase_rest(table, method='GET', body=None, params=None):
    if not _has_config():
        return None
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
        return []
    rows = []
    for p in projects:
        rows.append({
            'slug': p.get('id', ''),
            'title': p.get('title', ''),
            'description': p.get('description', ''),
            'longDescription': p.get('longDescription', ''),
            'description_business': p.get('description_business', ''),
            'longDescription_business': p.get('longDescription_business', ''),
            'image': p.get('image', ''),
            'tags': p.get('tags', []),
            'liveUrl': p.get('liveUrl', ''),
            'githubUrl': p.get('githubUrl', ''),
            'color': p.get('color', '#00E676'),
            'isLive': p.get('isLive', False),
            'status': p.get('status', 'soon'),
        })
    # Upsert via POST with merge-duplicates
    if not _has_config():
        return None
    url = f'{_URL}/rest/v1/projects?on_conflict=slug'
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
        return []
    rows = []
    for s in skills_list:
        row = {
            'name': s.get('name', ''),
            'name_business': s.get('name_business', ''),
            'icon': s.get('icon', 'sparkles'),
            'description': s.get('description', ''),
            'description_business': s.get('description_business', ''),
            'category': s.get('category', 'dynamic'),
            'color': s.get('color', '#00E676'),
            'level': s.get('level', ''),
            'prereq': s.get('prereq', ''),
            'status': s.get('status', ''),
            'projects': s.get('projects', []),
        }
        rows.append(row)
    if not _has_config():
        return None
    url = f'{_URL}/rest/v1/skills?on_conflict=name'
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
        return []
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
    if not _has_config():
        return None
    url = f'{_URL}/rest/v1/certificates?on_conflict=slug'
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
    if not _has_config():
        return None
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

def fetch_projects():
    if not _has_config():
        return None
    res = _supabase_rest('projects', method='GET', params=[('order', 'created_at.desc')])
    if res:
        for r in res:
            if 'slug' in r:
                r['id'] = r.pop('slug')
    return res

def fetch_skills():
    if not _has_config():
        return None
    return _supabase_rest('skills', method='GET', params=[('order', 'created_at.asc')])

def fetch_certificates():
    if not _has_config():
        return None
    res = _supabase_rest('certificates', method='GET', params=[('order', 'created_at.desc')])
    if res:
        for r in res:
            if 'slug' in r:
                r['id'] = r.pop('slug')
    return res

def fetch_resume():
    if not _has_config():
        return None
    res = _supabase_rest('profile', method='GET', params=[('id', 'eq.1')])
    if res and len(res) > 0:
        return res[0].get('data')
    return None

def call_rpc(func_name, body=None):
    if not _has_config():
        return None
    url = f'{_URL}/rest/v1/rpc/{func_name}'
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
        'Content-Type': 'application/json',
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code} calling RPC {func_name}: {e.read().decode()}')
        return None
    except Exception as e:
        print(f'  Error calling RPC {func_name}: {e}')
        return None

def fetch_page_visits(params=None):
    return _supabase_rest('page_visits', method='GET', params=params)

def sync_blog_post(post):
    if not _has_config():
        return None
    url = f'{_URL}/rest/v1/posts?on_conflict=slug'
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=representation',
    }
    row = {
        'slug': post.get('slug', ''),
        'title': post.get('title', ''),
        'date': post.get('date', ''),
        'excerpt': post.get('excerpt', ''),
        'tags': post.get('tags', []),
        'coverImage': post.get('coverImage', ''),
        'content': post.get('content', ''),
    }
    data = json.dumps([row]).encode()
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code} syncing blog post {post.get("slug")}: {e.read().decode()}')
        return None

def delete_blog_post(slug):
    if not _has_config():
        return False
    url = f'{_URL}/rest/v1/posts?slug=eq.{urllib.parse.quote(str(slug), safe="")}'
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
    }
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req) as resp:
            return True
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code} deleting blog post {slug}: {e.read().decode()}')
        return False

def _delete_by_filter(table, column, value):
    if not _has_config():
        return False
    encoded_value = urllib.parse.quote(str(value), safe='')
    url = f'{_URL}/rest/v1/{table}?{column}=eq.{encoded_value}'
    headers = {
        'apikey': _KEY,
        'Authorization': f'Bearer {_KEY}',
    }
    req = urllib.request.Request(url, headers=headers, method='DELETE')
    try:
        with urllib.request.urlopen(req):
            return True
    except urllib.error.HTTPError as e:
        print(f'  HTTP {e.code} deleting {table}.{column}={value}: {e.read().decode()}')
        return False

def delete_project(slug):
    return _delete_by_filter('projects', 'slug', slug)

def delete_skill(name):
    return _delete_by_filter('skills', 'name', name)

def delete_certificate(slug):
    return _delete_by_filter('certificates', 'slug', slug)

def fetch_blog_posts():
    if not _has_config():
        return None
    return _supabase_rest('posts', method='GET', params=[('order', 'date.desc')])


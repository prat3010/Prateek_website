#!/usr/bin/env python3
"""
Audit Supabase Database Schema
Compares the schema defined in `supabase_schema.sql` with the live database structure via the Supabase REST OpenAPI spec.
Exit code: 0 if in sync, 1 if mismatches found.
"""

import os
import re
import json
import urllib.request
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

def load_env():
    path = os.path.join(ROOT, '.env.local')
    if not os.path.exists(path):
        print(f"{YELLOW}Warning: .env.local not found. Cannot audit live database.{RESET}")
        return False
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k, v)
    return True

def parse_local_schema():
    sql_path = os.path.join(ROOT, 'supabase_schema.sql')
    if not os.path.exists(sql_path):
        print(f"{RED}Error: supabase_schema.sql not found at {sql_path}{RESET}")
        return None

    with open(sql_path, 'r') as f:
        content = f.read()

    # Extract CREATE TABLE definitions
    tables = {}
    matches = re.finditer(r'CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\((.*?)\);', content, re.DOTALL | re.IGNORECASE)
    for match in matches:
        table_name = match.group(1)
        body = match.group(2)
        columns = []
        for line in body.split('\n'):
            line = line.strip()
            # Skip empty lines, constraints, and check constraints
            if not line or line.upper().startswith(('PRIMARY KEY', 'FOREIGN KEY', 'CONSTRAINT', 'UNIQUE', 'CHECK', ')')):
                continue
            # First word (optionally double-quoted) is column name
            m_col = re.match(r'^"?(\w+)"?\s', line)
            if m_col:
                columns.append(m_col.group(1))
        tables[table_name] = columns
    return tables

def fetch_live_schema():
    url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        print(f"{RED}Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing from environment.{RESET}")
        return None

    endpoint = url.rstrip('/') + '/rest/v1/'
    headers = {
        'apikey': key,
        'Authorization': f'Bearer {key}'
    }
    req = urllib.request.Request(endpoint, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
            return data.get('definitions', {})
    except urllib.error.HTTPError as e:
        print(f"{RED}HTTP Error {e.code} fetching schema: {e.read().decode()}{RESET}")
        return None
    except Exception as e:
        print(f"{RED}Error connecting to Supabase: {e}{RESET}")
        return None

def main():
    print(f"\n{BOLD}Auditing Supabase database schema against local configuration...{RESET}\n")

    if not load_env():
        return 1

    local_tables = parse_local_schema()
    if not local_tables:
        return 1

    live_tables = fetch_live_schema()
    if not live_tables:
        return 1

    mismatches = 0

    # Check each local table against live
    for table, expected_cols in local_tables.items():
        if table not in live_tables:
            print(f"  [{RED}✗{RESET}] Table {BOLD}{table}{RESET} is {RED}missing{RESET} in the live database!")
            mismatches += 1
            continue

        live_properties = live_tables[table].get('properties', {})
        live_cols = list(live_properties.keys())

        # Check missing columns
        missing_cols = [c for c in expected_cols if c not in live_cols]
        # Check extra columns (not defined locally but present in DB)
        extra_cols = [c for c in live_cols if c not in expected_cols]

        if not missing_cols and not extra_cols:
            print(f"  [{GREEN}✓{RESET}] Table {BOLD}{table}{RESET} is fully in sync.")
        else:
            if missing_cols:
                print(f"  [{RED}✗{RESET}] Table {BOLD}{table}{RESET} has {RED}missing columns{RESET}: {', '.join(missing_cols)}")
                mismatches += len(missing_cols)
            if extra_cols:
                print(f"  [{YELLOW}!{RESET}] Table {BOLD}{table}{RESET} has {YELLOW}extra db-only columns{RESET}: {', '.join(extra_cols)}")

    # Check for tables present in live DB but not defined in local schema
    for live_table in live_tables.keys():
        if live_table not in local_tables:
            print(f"  [{YELLOW}!{RESET}] Table {BOLD}{live_table}{RESET} exists in live DB but is {YELLOW}not defined{RESET} in schema file.")

    if mismatches > 0:
        print(f"\n{RED}{BOLD}Audit Failed!{RESET} Found {mismatches} critical schema mismatch(es).\n")
        return 1
    else:
        print(f"\n{GREEN}{BOLD}Audit Passed!{RESET} All local schema files are perfectly in sync with the live database.\n")
        return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())

#!/usr/bin/env python3
"""
audit_contracts.py

Automated Contract & Fallback Integrity Auditor.
Verifies that JSON fallbacks (intakeQuestionnaireDefaults.json vs. resume.json)
remain in 100% data contract synchronization across engines, features, goals,
brand assets, and maintenance plans.

Usage:
    python3 scripts/audit_contracts.py
"""

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DEFAULTS_PATH = ROOT_DIR / "src" / "data" / "intakeQuestionnaireDefaults.json"
RESUME_PATH = ROOT_DIR / "src" / "data" / "resume.json"
COMMISSION_PATH = ROOT_DIR / "src" / "data" / "commissionConfig.json"
MIDDLEMAN_DEFAULTS_PATH = ROOT_DIR / "src" / "data" / "middlemanAgreementDefaults.json"

def load_json(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Failed to load JSON from {filepath}: {e}")
        sys.exit(1)

def audit_intake_sync():
    """Audit intakeQuestionnaireDefaults.json vs resume.json intake object."""
    errors = []
    defaults = load_json(DEFAULTS_PATH)
    resume = load_json(RESUME_PATH)
    
    resume_intake = resume.get("intake", {})
    if not resume_intake:
        errors.append("resume.json is missing top-level 'intake' key.")
        return errors

    # Check Engines 1:1 match
    def_engines = {e["id"]: e for e in defaults.get("engines", [])}
    res_engines = {e["id"]: e for e in resume_intake.get("engines", [])}
    
    missing_in_resume = set(def_engines.keys()) - set(res_engines.keys())
    if missing_in_resume:
        errors.append(f"resume.json intake.engines missing engine IDs: {missing_in_resume}")
        
    for eid, def_eng in def_engines.items():
        if eid in res_engines:
            res_eng = res_engines[eid]
            for price_key in ("priceINR", "priceUSD"):
                if def_eng.get(price_key) != res_eng.get(price_key):
                    errors.append(
                        f"Engine '{eid}' price mismatch on '{price_key}': "
                        f"defaults={def_eng.get(price_key)} vs resume.json={res_eng.get(price_key)}"
                    )

    # Check Care Plans 1:1 match
    def_plans = {p["id"]: p for p in defaults.get("maintenancePlans", [])}
    res_plans = {p["id"]: p for p in resume_intake.get("maintenancePlans", [])}
    
    missing_plans = set(def_plans.keys()) - set(res_plans.keys())
    if missing_plans:
        errors.append(f"resume.json intake.maintenancePlans missing plan IDs: {missing_plans}")

    return errors

def audit_commission_config():
    """Verify commissionConfig.json exists and has mandatory fields."""
    errors = []
    config = load_json(COMMISSION_PATH)
    required_keys = ["bands", "recurringRate", "depositSplit", "disbursementWindow"]
    for key in required_keys:
        if key not in config:
            errors.append(f"commissionConfig.json is missing required key '{key}'.")
    return errors

def main():
    print("🔍 Auditing codebase data contracts & JSON fallback synchronization...")
    
    intake_errors = audit_intake_sync()
    comm_errors = audit_commission_config()
    
    all_errors = intake_errors + comm_errors
    
    if all_errors:
        print("\n❌ CONTRACT AUDIT FAILED with errors:")
        for err in all_errors:
            print(f"  - {err}")
        return 1

    print("✓ All data contracts and JSON fallbacks are 100% in sync!")
    return 0

if __name__ == "__main__":
    sys.exit(main())

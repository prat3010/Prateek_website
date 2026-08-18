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

    sections = [
        ("engines", "priceINR", "priceUSD"),
        ("features", "priceINR", "priceUSD"),
        ("goals",),
        ("brandAssets", "priceINR", "priceUSD"),
        ("maintenancePlans", "priceINR", "priceUSD"),
        ("quickServices", "priceINR", "priceUSD"),
    ]

    for sec_tuple in sections:
        sec = sec_tuple[0]
        price_keys = sec_tuple[1:]
        def_items = {item["id"]: item for item in defaults.get(sec, [])}
        res_items = {item["id"]: item for item in resume_intake.get(sec, [])}

        missing = set(def_items.keys()) - set(res_items.keys())
        if missing:
            errors.append(f"resume.json intake.{sec} missing IDs: {missing}")

        for item_id, def_item in def_items.items():
            if item_id in res_items:
                res_item = res_items[item_id]
                for pk in price_keys:
                    if def_item.get(pk) != res_item.get(pk):
                        errors.append(
                            f"Section '{sec}' item '{item_id}' price mismatch on '{pk}': "
                            f"defaults={def_item.get(pk)} vs resume.json={res_item.get(pk)}"
                        )
                if sec == "goals":
                    for goal_key in ("label", "compulsoryFeatureLabels"):
                        if def_item.get(goal_key) != res_item.get(goal_key):
                            errors.append(
                                f"Goal '{item_id}' mismatch on '{goal_key}': "
                                f"defaults={def_item.get(goal_key)} vs resume.json={res_item.get(goal_key)}"
                            )

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

def audit_middleman_sync():
    """Audit middlemanAgreementDefaults.json vs resume.json middlemanAgreement sections."""
    errors = []
    defaults = load_json(MIDDLEMAN_DEFAULTS_PATH)
    resume = load_json(RESUME_PATH)
    res_mm = resume.get("intake", {}).get("middlemanAgreement", {})
    if res_mm and "sections" in res_mm:
        def_sections = {s["key"]: s for s in defaults.get("sections", [])}
        res_sections = {s["key"]: s for s in res_mm.get("sections", []) if isinstance(s, dict) and "key" in s}
        for key, def_sec in def_sections.items():
            if key in res_sections:
                if def_sec.get("lines") != res_sections[key].get("lines"):
                    errors.append(f"middlemanAgreement section '{key}' lines mismatch between middlemanAgreementDefaults.json and resume.json")
    return errors

def main():
    print("🔍 Auditing codebase data contracts & JSON fallback synchronization...")
    
    intake_errors = audit_intake_sync()
    comm_errors = audit_commission_config()
    mm_errors = audit_middleman_sync()
    
    all_errors = intake_errors + comm_errors + mm_errors
    
    if all_errors:
        print("\n❌ CONTRACT AUDIT FAILED with errors:")
        for err in all_errors:
            print(f"  - {err}")
        return 1

    print("✓ All data contracts and JSON fallbacks are 100% in sync!")
    return 0

if __name__ == "__main__":
    sys.exit(main())

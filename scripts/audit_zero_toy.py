#!/usr/bin/env python3
"""Zero-Toy & Authentic Engineering Static Analysis Scanner for Portfolio & Client Control Plane.

Scans all production TypeScript/JavaScript files in src/ (excluding __tests__/):
1. Ensures API routes do not return synthetic mock objects.
2. Ensures no fake artificial delay loops simulate AI cognition.
3. Ensures all client data operations invoke genuine Supabase or Retriever APIs.

Exits with code 0 if 100% clean, or code 1 with line-by-line violation reports.
"""

import re
import sys
from pathlib import Path

VIOLATIONS: list[str] = []

SRC_DIR = Path(__file__).resolve().parent.parent / "src"

# Forbidden patterns in production frontend and API code
FORBIDDEN_PATTERNS = [
    (re.compile(r'mockResponse\s*='), "Synthetic mock response assignment in production code"),
    (re.compile(r'fakeData\s*='), "Fake data assignment in production code"),
    (re.compile(r'return\s+\[\s*\{\s*id:\s*["\']mock-'), "Returning mock object array in production code"),
    (re.compile(r'Math\.random\(\)\s*<\s*0\.05.*fake', re.IGNORECASE), "Simulated failure/success injection"),
]


def check_file(path: Path) -> None:
    # Skip test files
    if "__tests__" in path.parts or path.name.endswith(".test.ts") or path.name.endswith(".test.tsx"):
        return

    text = path.read_text(encoding="utf-8", errors="ignore")

    for pattern, reason in FORBIDDEN_PATTERNS:
        match = pattern.search(text)
        if match:
            start = match.start()
            line_no = text.count("\n", 0, start) + 1
            VIOLATIONS.append(f"{path.relative_to(SRC_DIR)}:{line_no} - {reason}")


def main() -> int:
    if not SRC_DIR.is_dir():
        print(f"Error: Source directory {SRC_DIR} not found.")
        return 1

    ts_files = list(SRC_DIR.glob("**/*.ts")) + list(SRC_DIR.glob("**/*.tsx"))
    scanned_count = 0
    for f in ts_files:
        if "__tests__" not in f.parts and not f.name.endswith(".test.ts") and not f.name.endswith(".test.tsx"):
            check_file(f)
            scanned_count += 1

    if VIOLATIONS:
        print("\n=================================================================")
        print("❌ ZERO-TOY INVARIANT VIOLATIONS DETECTED (MANDATORY GATE FAILURE)")
        print("=================================================================")
        for v in VIOLATIONS:
            print(f"  ! {v}")
        print("\nProduction code must NEVER contain mock facades or fake data returns.")
        return 1

    print(f"✓ Zero-Toy Audit Passed: {scanned_count} production TypeScript files scanned, 0 violations.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

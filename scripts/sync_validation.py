"""
Validation helpers for AI-generated synchronizer data.
"""

import re
from datetime import datetime
from urllib.parse import urlparse


HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def require_string(data, key, *, max_len=5000):
    value = data.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Gemini response is missing a valid '{key}' string.")
    value = value.strip()
    if len(value) > max_len:
        raise ValueError(f"Gemini response field '{key}' is too long.")
    return value


def optional_string(data, key, *, max_len=5000):
    value = data.get(key, "")
    if value is None:
        return ""
    if not isinstance(value, str):
        raise ValueError(f"Gemini response field '{key}' must be a string.")
    value = value.strip()
    if len(value) > max_len:
        raise ValueError(f"Gemini response field '{key}' is too long.")
    return value


def validate_tags(value, *, min_items=0, max_items=8):
    if not isinstance(value, list):
        raise ValueError("Gemini response field 'tags' must be a list.")
    tags = []
    for tag in value:
        if not isinstance(tag, str):
            raise ValueError("Gemini response tags must be strings.")
        clean = tag.strip()
        if clean and clean not in tags:
            tags.append(clean[:60])
    if len(tags) < min_items:
        raise ValueError(f"Gemini response must include at least {min_items} tag(s).")
    return tags[:max_items]


def validate_url(value, key):
    if not value:
        return ""
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError(f"Gemini response field '{key}' must be a valid http(s) URL.")
    return value


def validate_date(value, key):
    if not DATE_RE.match(value):
        raise ValueError(f"Gemini response field '{key}' must use YYYY-MM-DD format.")
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError as exc:
        raise ValueError(f"Gemini response field '{key}' is not a real date.") from exc
    return value


def validate_project_response(data):
    if not isinstance(data, dict):
        raise ValueError("Gemini project response must be a JSON object.")
    resume_bullet = data.get("resumeBullet")
    if not isinstance(resume_bullet, dict):
        raise ValueError("Gemini project response is missing 'resumeBullet'.")
    color = optional_string(data, "color", max_len=16) or "#00E676"
    if not HEX_RE.match(color):
        raise ValueError("Gemini project response field 'color' must be a #RRGGBB hex color.")
    return {
        "title": require_string(data, "title", max_len=140),
        "description": require_string(data, "description", max_len=500),
        "longDescription": require_string(data, "longDescription", max_len=2500),
        "tags": validate_tags(data.get("tags"), min_items=1, max_items=8),
        "color": color,
        "resumeBullet": {
            "general": require_string(resume_bullet, "general", max_len=500),
            "fullstack": optional_string(resume_bullet, "fullstack", max_len=500),
            "ai": optional_string(resume_bullet, "ai", max_len=500),
            "creative": optional_string(resume_bullet, "creative", max_len=500),
        },
    }


def validate_certificate_response(data):
    if not isinstance(data, dict):
        raise ValueError("Gemini certificate response must be a JSON object.")
    verify_url = optional_string(data, "verifyUrl", max_len=1000)
    if verify_url and not verify_url.startswith(("http://", "https://")):
        verify_url = "https://" + verify_url
    return {
        "title": require_string(data, "title", max_len=240),
        "issuer": require_string(data, "issuer", max_len=160),
        "date": validate_date(require_string(data, "date", max_len=20), "date"),
        "credentialId": optional_string(data, "credentialId", max_len=240),
        "verifyUrl": validate_url(verify_url, "verifyUrl") if verify_url else "",
        "tags": validate_tags(data.get("tags", []), min_items=0, max_items=8),
    }


def validate_blog_fields(title, excerpt, tags, content):
    clean_title = title.strip()
    clean_excerpt = excerpt.strip()
    clean_content = content.strip()
    if not clean_title:
        raise ValueError("Blog title is required.")
    if not clean_content:
        raise ValueError("Blog content is required.")
    if len(clean_title) > 180:
        raise ValueError("Blog title is too long.")
    return clean_title, clean_excerpt[:500], validate_tags(tags, max_items=12), clean_content

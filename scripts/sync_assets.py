"""
Asset staging helpers for synchronizer file moves and deletes.
"""

import os
import shutil
import tempfile


def copy_to_staged_file(source_path, target_path):
    directory = os.path.dirname(target_path) or "."
    os.makedirs(directory, exist_ok=True)
    fd, staged_path = tempfile.mkstemp(prefix=f".{os.path.basename(target_path)}.", suffix=".tmp", dir=directory)
    os.close(fd)
    try:
        shutil.copy2(source_path, staged_path)
        return staged_path
    except Exception:
        try:
            os.unlink(staged_path)
        except OSError:
            pass
        raise


def finalize_staged_file(staged_path, target_path):
    os.replace(staged_path, target_path)


def cleanup_staged_file(staged_path):
    if staged_path:
        try:
            os.unlink(staged_path)
        except OSError:
            pass


def delete_existing_files(paths):
    deleted = []
    for path in paths:
        if path and os.path.exists(path):
            os.remove(path)
            deleted.append(path)
    return deleted

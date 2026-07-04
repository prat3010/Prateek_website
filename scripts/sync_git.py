"""
Safer Git operations for the synchronizer.
"""

import os


def normalize_repo_path(path):
    return path.replace("\\", "/").lstrip("./")


def cached_paths(run_git_command, cwd):
    success, output = run_git_command(["git", "diff", "--cached", "--name-only"], cwd=cwd)
    if not success:
        return False, output
    return True, {normalize_repo_path(line.strip()) for line in output.splitlines() if line.strip()}


def ensure_no_unrelated_staged(run_git_command, cwd, intended_paths):
    intended = {normalize_repo_path(path) for path in intended_paths}
    ok, result = cached_paths(run_git_command, cwd)
    if not ok:
        return False, result
    unrelated = sorted(
        path for path in result
        if path not in intended and not any(path.startswith(item.rstrip("/") + "/") for item in intended)
    )
    if unrelated:
        return False, "Unrelated staged changes exist: " + ", ".join(unrelated)
    return True, ""


def commit_and_push_paths(run_git_command, paths, commit_message, cwd=None, push=True):
    cwd = cwd or os.getcwd()
    paths = [normalize_repo_path(path) for path in paths]
    ok, msg = ensure_no_unrelated_staged(run_git_command, cwd, paths)
    if not ok:
        return False, msg

    success, status_out = run_git_command(["git", "status", "--porcelain"], cwd=cwd)
    if not success:
        return False, f"Git status failed: {status_out}"

    changed = set()
    for line in status_out.splitlines():
        if not line.strip():
            continue
        changed_path = normalize_repo_path(line[3:].strip() if len(line) > 3 else line.strip())
        if changed_path in paths or any(changed_path.startswith(path.rstrip("/") + "/") for path in paths):
            changed.add(changed_path)

    if not changed:
        return True, "No changes to commit for the intended path(s)."

    success, output = run_git_command(["git", "add", *paths], cwd=cwd)
    if not success:
        return False, f"Git add failed: {output}"

    ok, msg = ensure_no_unrelated_staged(run_git_command, cwd, paths)
    if not ok:
        return False, msg

    success, output = run_git_command(["git", "commit", "-m", commit_message, "--", *paths], cwd=cwd)
    if not success:
        return False, f"Git commit failed: {output}"

    if push:
        success, output = run_git_command(["git", "push", "origin", "main"], cwd=cwd)
        if not success:
            return False, f"Git push failed: {output}"

    return True, "Successfully committed and pushed to GitHub!" if push else "Successfully committed changes."

"""Fetch Teambition task summary via Open API.

Usage: python3 tb_fetch.py <TASK_ID> <URL>
Output: JSON with url, display_id, title, comments fields.
Exits non-zero on error with ERROR message on stderr.

Uses curl for HTTP (not urllib) to avoid SSL issues on Windows,
matching the proven approach in the teambition skill.
"""
import json, time, hmac, hashlib, base64, subprocess, sys

if len(sys.argv) < 3:
    print("ERROR: usage: tb_fetch.py <TASK_ID> <URL>", file=sys.stderr)
    sys.exit(1)

TASK_ID = sys.argv[1]
TASK_URL = sys.argv[2]

APP_ID = "69d8b5ef0cf0d7f4d5091988"
SECRET = "JNkWgTBGDCINEAKHvchnCtim7snOQ8lM"

# --- JWT ---
header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).rstrip(b"=").decode()
now = int(time.time())
payload = base64.urlsafe_b64encode(json.dumps({"_appId": APP_ID, "iat": now, "exp": now + 3600}).encode()).rstrip(b"=").decode()
sig = base64.urlsafe_b64encode(hmac.new(SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
jwt_token = f"{header}.{payload}.{sig}"

CURL_BASE = ["curl", "-s", "--noproxy", "*", "--connect-timeout", "10", "-m", "15"]
AUTH_H = [
    "-H", f"Authorization: Bearer {jwt_token}",
    "-H", "X-Tenant-Id: 613f0dacd4147ebbe9283b8f",
    "-H", "X-Tenant-Type: organization",
]

# Project short-name mapping (from teambition skill core project index)
PROJECT_SHORT_NAMES = {
    "631710f1ac04e183d048d326": "xqchi",
    "635bb5cec3bd1e0fb4113544": "jzbug",
    "616e6868a46ec51df166f4cd": "xcxx",
    "692d0d01bc248ae7b6921029": "ddzx",
    "65b344b165aef0e79fced03e": "jfcs",
    "63bb7801f2b5d43ad3a1e615": "jjchi",
    "63e607dd31f057beb327bf51": "jztotal",
}


def curl_json(url):
    """Call url with JWT auth, return parsed JSON. Exits on error."""
    try:
        proc = subprocess.run(
            CURL_BASE + AUTH_H + [url],
            capture_output=True, timeout=20
        )
    except FileNotFoundError:
        print("ERROR: curl not found", file=sys.stderr)
        sys.exit(1)
    except subprocess.TimeoutExpired:
        print("ERROR: curl timed out", file=sys.stderr)
        sys.exit(1)

    if proc.returncode != 0:
        err_detail = proc.stderr.decode("utf-8", errors="replace").strip() or f"curl exit code {proc.returncode}"
        print(f"ERROR: {err_detail}", file=sys.stderr)
        sys.exit(1)

    try:
        return json.loads(proc.stdout.decode("utf-8"))
    except json.JSONDecodeError as e:
        print(f"ERROR: invalid JSON response: {e}", file=sys.stderr)
        sys.exit(1)


# --- Fetch task ---
data = curl_json(f"https://open.teambition.com/api/v3/task/query?taskId={TASK_ID}")
tasks = data.get("result", [])
if not tasks:
    print("ERROR: no task found", file=sys.stderr)
    sys.exit(1)

task = tasks[0]
title = task.get("content", "未命名任务")
project_id = task.get("projectId", "")
unique_id = task.get("uniqueId")

# Build display_id: <project_short_name>-<uniqueId>
if unique_id is not None and project_id in PROJECT_SHORT_NAMES:
    display_id = f"{PROJECT_SHORT_NAMES[project_id]}-{unique_id}"
elif unique_id is not None:
    display_id = str(unique_id)
else:
    display_id = TASK_ID[-6:] if len(TASK_ID) >= 6 else TASK_ID

# --- Fetch comments ---
comments = []
try:
    act_data = curl_json(f"https://open.teambition.com/api/v3/task/{TASK_ID}/activity/list?pageSize=20")
    activities = act_data.get("result", [])
    for act in activities:
        if act.get("action") != "comment":
            continue
        try:
            content_obj = json.loads(act.get("content", "{}"))
            comment_text = content_obj.get("comment", "")
            if comment_text.strip():
                comments.append(comment_text.strip())
        except (json.JSONDecodeError, TypeError):
            pass
except SystemExit:
    # Comment fetch failed — non-blocking, continue without comments
    pass

result = {
    "url": TASK_URL,
    "display_id": display_id,
    "title": title,
    "comments": comments,
}
print(json.dumps(result, ensure_ascii=False))

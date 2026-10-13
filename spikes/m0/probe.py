"""Disposable real-Codex probe with an unauthenticated, local Responses fixture.

This is a transport fixture, not a replacement CLI. Never provide a real key.
Only marker presence, process outcomes, and coarse error categories are saved.
"""
import argparse
import http.server
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading


def clean_env(home, temporary):
    return {
        "PATH": "/usr/local/bin:/usr/bin:/bin",
        "HOME": str(home),
        "TMPDIR": str(temporary),
        "LANG": "C.UTF-8",
        "TERM": "xterm-256color",
        "GIT_CONFIG_GLOBAL": "/dev/null",
        "GIT_CONFIG_NOSYSTEM": "1",
        "GIT_TERMINAL_PROMPT": "0",
        "M0_FIXTURE_AUTH": "fixture-only",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--codex-bin", required=True, type=Path)
    parser.add_argument("--work-dir", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    args.work_dir.mkdir(parents=True, exist_ok=True)
    requests = []

    class Fixture(http.server.BaseHTTPRequestHandler):
        def log_message(self, *_args):
            pass

        def do_GET(self):
            body = json.dumps({"data": [{"id": "fixture", "object": "model"}]}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)

        def do_POST(self):
            length = int(self.headers.get("Content-Length", "0"))
            # Authorization headers are deliberately not read or retained.
            body = self.rfile.read(length)
            requests.append(body)
            message = {
                "id": "msg_fixture", "type": "message", "status": "completed",
                "role": "assistant",
                "content": [{"type": "output_text", "text": "M0 fixture response.", "annotations": []}],
            }
            response = {
                "id": "resp_fixture", "object": "response", "created_at": 0,
                "status": "completed", "model": "fixture", "output": [message],
                "usage": {"input_tokens": 1, "output_tokens": 1, "total_tokens": 2},
            }
            events = [
                ("response.created", {"response": {**response, "status": "in_progress", "output": []}}),
                ("response.output_item.added", {"output_index": 0, "item": {**message, "status": "in_progress", "content": []}}),
                ("response.content_part.added", {"item_id": "msg_fixture", "output_index": 0, "content_index": 0, "part": {"type": "output_text", "text": "", "annotations": []}}),
                ("response.output_text.delta", {"item_id": "msg_fixture", "output_index": 0, "content_index": 0, "delta": "M0 fixture response."}),
                ("response.output_item.done", {"output_index": 0, "item": message}),
                ("response.completed", {"response": response}),
            ]
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Connection", "close")
            self.end_headers()
            try:
                for kind, payload in events:
                    self.wfile.write(("event: " + kind + "\ndata: " + json.dumps({"type": kind, **payload}) + "\n\n").encode())
                self.wfile.flush()
            except BrokenPipeError:
                pass

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Fixture)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    observations = []
    try:
        with tempfile.TemporaryDirectory(prefix="codex-", dir=args.work_dir) as temporary:
            base = Path(temporary)
            home = base / "home"
            workspace = base / "workspace"
            nested = workspace / "nested"
            home.mkdir()
            nested.mkdir(parents=True)
            (workspace / "AGENTS.md").write_text("ROOT_REINS_MARKER: Report only the fixed fixture response.\n")
            (nested / "AGENTS.md").write_text("CHILD_REINS_MARKER: Report only the fixed fixture response.\n")
            (nested / "target.txt").write_text("fixture input\n")
            skills = workspace / ".agents/skills/fixture-skill"
            skills.mkdir(parents=True)
            (skills / "SKILL.md").write_text("---\nname: fixture-skill\ndescription: SKILL_REINS_MARKER for a disposable probe\n---\nUse only the fixed fixture response.\n")
            env = clean_env(home, base)
            git = subprocess.run(["git", "-c", "init.templateDir=", "init", "--quiet", str(workspace)], env=env, capture_output=True, timeout=10)
            if git.returncode != 0:
                raise RuntimeError("isolated-fixture-git-init-failed")
            config_dir = home / ".codex"
            config_dir.mkdir()
            (config_dir / "config.toml").write_text(
                'model = "fixture"\nmodel_provider = "m0_fixture"\n'
                '[model_providers.m0_fixture]\nname = "Local M0 fixture"\n'
                f'base_url = "http://127.0.0.1:{server.server_port}/v1"\n'
                'wire_api = "responses"\nenv_key = "M0_FIXTURE_AUTH"\nrequires_openai_auth = false\n'
            )
            for label, cwd in [("root-cwd", workspace), ("nested-cwd", nested)]:
                before = len(requests)
                try:
                    result = subprocess.run([
                        str(args.codex_bin), "--no-daemon", "-C", str(cwd), "-s", "read-only",
                        "exec", "--skip-git-repo-check", "--json", "--ephemeral",
                        "Respond with the fixed fixture response. Do not use tools.",
                    ], env=env, cwd=cwd, capture_output=True, timeout=25)
                    code = result.returncode
                    stderr = result.stderr.decode(errors="replace")
                    categories = [name for name in ["Operation not permitted", "Permission denied", "No such file", "not supported", "could not", "error"] if name.lower() in stderr.lower()]
                except subprocess.TimeoutExpired:
                    code = 124
                    categories = ["timeout"]
                visible = b"\n".join(requests[before:])
                observations.append({
                    "probe": label, "exitCode": code, "requestCount": len(requests) - before,
                    "rootMarker": b"ROOT_REINS_MARKER" in visible,
                    "childMarker": b"CHILD_REINS_MARKER" in visible,
                    "skillMarker": b"SKILL_REINS_MARKER" in visible,
                    "categories": categories,
                })
    finally:
        server.shutdown()
        server.server_close()
    args.output.write_text(json.dumps({"runtime": "codex", "transport": "local-protocol-fixture", "observations": observations}, indent=2) + "\n")
    print(json.dumps(observations))


if __name__ == "__main__":
    main()

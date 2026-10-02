import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parent.parent / "scripts/harness-status"
VERIFY = Path(__file__).resolve().parent.parent / "scripts/verify"


class HarnessStatusTest(unittest.TestCase):
    def test_verify_modes_and_native_failure(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            log = root / "calls"
            for name in ("python3", "npm"):
                stub = root / name
                stub.write_text(
                    '#!/bin/sh\nprintf "%s %s\\n" "' + name + '" "$*" >> "$HARNESS_LOG"\n'
                    + ('[ "${FAIL_CHECK:-0}" = 1 ] && [ "$*" = "run check" ] && exit 37\n' if name == "npm" else '')
                    + 'exit 0\n'
                )
                stub.chmod(0o755)
            env = dict(os.environ, PATH=f"{root}:{os.environ['PATH']}", HARNESS_LOG=str(log))

            def run(*args, fail=False):
                log.write_text("")
                return subprocess.run([str(VERIFY), *args], env=dict(env, FAIL_CHECK="1" if fail else "0"), capture_output=True, text=True)

            self.assertEqual(run("--bogus").returncode, 2)
            self.assertEqual(log.read_text(), "")
            self.assertEqual(run("--changed").returncode, 0)
            self.assertIn("--changed uses default coverage", run("--changed").stdout)
            self.assertIn("npm run check", log.read_text())
            self.assertEqual(run("--changed", "--full").returncode, 2)
            self.assertEqual(run(fail=True).returncode, 37)

    def test_stale_source_and_local_override_are_distinct(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            os_repo = root / "os"
            os_repo.mkdir()
            source = os_repo / "templates/project-harness/VERIFY.md"
            source.parent.mkdir(parents=True)
            source.write_text("old\n")
            subprocess.run(["git", "init", "-q", str(os_repo)], check=True)
            subprocess.run(["git", "-C", str(os_repo), "add", "."], check=True)
            subprocess.run(["git", "-C", str(os_repo), "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "old"], check=True)
            pinned = subprocess.check_output(["git", "-C", str(os_repo), "rev-parse", "HEAD"], text=True).strip()
            blob = subprocess.check_output(["git", "-C", str(os_repo), "rev-parse", f"{pinned}:templates/project-harness/VERIFY.md"], text=True).strip()
            project = root / "project"
            local = project / "scripts/verify"
            local.parent.mkdir(parents=True)
            local.write_text("adapted\n")
            manifest_path = project / "docs/engineering/HARNESS_PROVENANCE.json"
            manifest_path.parent.mkdir(parents=True)
            manifest_path.write_text(json.dumps({
                "os_sha": pinned,
                "contract_path": "templates/project-harness",
                "derived": [{
                    "source": "templates/project-harness/VERIFY.md",
                    "source_blob": blob,
                    "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                    "local": "scripts/verify",
                    "local_sha256": hashlib.sha256(local.read_bytes()).hexdigest(),
                }],
                "omitted": {},
            }))

            def status(target):
                result = subprocess.run(["python3", str(SCRIPT), "--os-repo", str(os_repo), "--target", target, "--manifest", str(manifest_path)], capture_output=True, text=True, check=True)
                return json.loads(result.stdout)

            self.assertFalse(status(pinned)["harness_stale"])
            source.write_text("new\n")
            subprocess.run(["git", "-C", str(os_repo), "add", "."], check=True)
            subprocess.run(["git", "-C", str(os_repo), "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "new"], check=True)
            latest = subprocess.check_output(["git", "-C", str(os_repo), "rev-parse", "HEAD"], text=True).strip()
            self.assertEqual(status(latest)["upstream_changes"], ["templates/project-harness/VERIFY.md"])
            local.write_text("owner edit\n")
            self.assertEqual(status(latest)["local_override_drift"], ["scripts/verify"])


if __name__ == "__main__":
    unittest.main()

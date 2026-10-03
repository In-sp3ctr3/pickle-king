import hashlib
import json
import os
from pathlib import Path
import runpy
import subprocess
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parent.parent / "scripts/harness-status"
VERIFY = Path(__file__).resolve().parent.parent / "scripts/verify"
ROOT = Path(__file__).resolve().parent.parent
PROMPT = ROOT / "scripts/eng-ticket-prompt"
FEEDBACK = ROOT / "scripts/eng-os-feedback"
HYGIENE = ROOT / "scripts/repo-hygiene"


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

    def test_os_movement_relevance_drift_override_and_no_action_are_distinct(self):
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
                "relevant_upstream_paths": ["templates/project-harness", "os_feedback.py"],
                "derived": [{
                    "source": "templates/project-harness/VERIFY.md",
                    "source_blob": blob,
                    "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                    "local": "scripts/verify",
                    "local_sha256": hashlib.sha256(local.read_bytes()).hexdigest(),
                }],
                "os_runtime": [],
                "reviewed_upstream": [],
                "intentional_overrides": [{"id": "test-override", "source": "templates/project-harness/VERIFY.md", "local": "scripts/verify", "reason": "fixture", "status": "active"}],
                "omitted": {},
            }))

            def status(target):
                result = subprocess.run(["python3", str(SCRIPT), "--os-repo", str(os_repo), "--target", target, "--manifest", str(manifest_path)], capture_output=True, text=True, check=True)
                return json.loads(result.stdout)

            current = status(pinned)
            self.assertFalse(current["harness_stale"])
            self.assertFalse(current["upstream_os_moved"])
            self.assertTrue(current["no_action_required"])
            self.assertEqual(current["steward_stocktake_gate"], "direct_status_required")
            self.assertEqual(current["intentional_overrides"][0]["id"], "test-override")
            (os_repo / "UNRELATED.md").write_text("moved\n")
            subprocess.run(["git", "-C", str(os_repo), "add", "."], check=True)
            subprocess.run(["git", "-C", str(os_repo), "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "unrelated"], check=True)
            unrelated = subprocess.check_output(["git", "-C", str(os_repo), "rev-parse", "HEAD"], text=True).strip()
            moved = status(unrelated)
            self.assertTrue(moved["upstream_os_moved"])
            self.assertEqual(moved["relevant_shared_delta"], [])
            self.assertTrue(moved["no_action_required"])
            source.write_text("new\n")
            subprocess.run(["git", "-C", str(os_repo), "add", "."], check=True)
            subprocess.run(["git", "-C", str(os_repo), "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "new"], check=True)
            latest = subprocess.check_output(["git", "-C", str(os_repo), "rev-parse", "HEAD"], text=True).strip()
            self.assertEqual(status(latest)["upstream_changes"], ["templates/project-harness/VERIFY.md"])
            self.assertEqual(status(latest)["action"], "review_shared_delta")
            runtime = os_repo / "os_feedback.py"
            runtime.write_text("changed\n")
            subprocess.run(["git", "-C", str(os_repo), "add", "."], check=True)
            subprocess.run(["git", "-C", str(os_repo), "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "runtime"], check=True)
            runtime_target = subprocess.check_output(["git", "-C", str(os_repo), "rev-parse", "HEAD"], text=True).strip()
            self.assertIn("os_feedback.py", status(runtime_target)["relevant_shared_delta"])
            local.write_text("owner edit\n")
            drift = status(runtime_target)
            self.assertEqual(drift["local_override_drift"], ["scripts/verify"])
            self.assertEqual(drift["action"], "resolve_local_drift")
            self.assertFalse(drift["no_action_required"])
            gate = subprocess.run(["python3", str(SCRIPT), "--os-repo", str(os_repo), "--target", runtime_target, "--manifest", str(manifest_path), "--gate"], capture_output=True, text=True)
            self.assertEqual(gate.returncode, 2)

    def test_prompt_footer_and_checkpoint_feedback_contract(self):
        footer = (ROOT / "docs/engineering/OS_FEEDBACK_FOOTER.md").read_text()
        prompt = subprocess.check_output([str(PROMPT), "SPE-215", "pickle-king"], text=True)
        self.assertIn(footer, prompt)
        self.assertIn("os_feedback: none", prompt)
        invalid = subprocess.run([str(PROMPT), "bad", "pickle-king"], capture_output=True, text=True)
        self.assertNotEqual(invalid.returncode, 0)
        state = (ROOT / "docs/engineering/STATE.md").read_text()
        lifecycle = (ROOT / "docs/engineering/LIFECYCLE.md").read_text()
        for value in ("unassessed", "Explicit `none`", "unresolved"):
            self.assertIn(value, state)
        self.assertIn("later clean assessment does not close an earlier observation", lifecycle)
        self.assertIn("never creates a fallback ledger", lifecycle)

    def test_dependabot_actor_allowlist_is_exact_and_fail_closed(self):
        classify = runpy.run_path(str(HYGIENE))["is_dependabot_actor"]
        for login in ("dependabot", "dependabot[bot]", "app/dependabot"):
            self.assertTrue(classify(login))
        for login in ("dependabot-human", "app/dependabot-lookalike", "human"):
            self.assertFalse(classify(login))
        for malformed in (None, "", 7, {}):
            with self.assertRaises(ValueError):
                classify(malformed)

    def test_feedback_adapter_requires_verified_runtime_existing_ledger_and_identity(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            os_repo = root / "os"
            (os_repo / "scripts").mkdir(parents=True)
            shared = os_repo / "scripts/eng-os-feedback"
            shared.write_text(
                "#!/usr/bin/env python3\n"
                "import json,sys\n"
                "data=json.load(sys.stdin)\n"
                "if data['assessment_id']=='assessment-fail': raise SystemExit(7)\n"
                "print(json.dumps({'assessment_id': data['assessment_id'], 'os_feedback': 'none'}))\n"
            )
            shared.chmod(0o755)
            (os_repo / "scripts/eng-os-stocktake").write_text("stocktake\n")
            (os_repo / "os_feedback.py").write_text("feedback\n")
            (os_repo / "run_ledger.py").write_text("ledger\n")
            subprocess.run(["git", "init", "-q", str(os_repo)], check=True)
            subprocess.run(["git", "-C", str(os_repo), "add", "."], check=True)
            subprocess.run(["git", "-C", str(os_repo), "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "runtime"], check=True)
            adopted = subprocess.check_output(["git", "-C", str(os_repo), "rev-parse", "HEAD"], text=True).strip()
            runtime = []
            for name in ("os_feedback.py", "run_ledger.py", "scripts/eng-os-feedback", "scripts/eng-os-stocktake"):
                target = os_repo / name
                runtime.append({
                    "source": name,
                    "source_blob": subprocess.check_output(["git", "-C", str(os_repo), "rev-parse", f"{adopted}:{name}"], text=True).strip(),
                    "source_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
                })
            manifest = root / "manifest.json"
            manifest.write_text(json.dumps({"repo_id": "pickle-king", "os_sha": adopted, "os_runtime": runtime}))
            ledger = root / "private.sqlite"
            ledger.write_text("existing")
            payload = {"assessment_id": "assessment-1", "repo": "pickle-king", "ticket": "SPE-215", "run_id": "run-1", "reporter_ref": "reporter-1", "at": "2026-10-03T12:00:00+00:00"}
            registry = root / "registry.json"
            registry.write_text(json.dumps({"accepted_os_sha": adopted, "repos": {"pickle-king": {"authority_verified": True, "tickets": {"SPE-215": {"runs": ["run-1"], "reporters": ["reporter-1"]}}}}}))

            def run(data, ledger_path=ledger, registry_path=registry):
                return subprocess.run([str(FEEDBACK), "--os-repo", str(os_repo), "--ledger", str(ledger_path), "--registry", str(registry_path), "--manifest", str(manifest)], input=json.dumps(data), capture_output=True, text=True)

            success = run(payload)
            self.assertEqual(success.returncode, 0, success.stderr)
            self.assertEqual(json.loads(success.stdout)["os_feedback"], "none")
            missing = root / "missing.sqlite"
            self.assertNotEqual(run(payload, missing).returncode, 0)
            self.assertFalse(missing.exists())
            before = ledger.read_bytes()
            malformed = subprocess.run([str(FEEDBACK), "--os-repo", str(os_repo), "--ledger", str(ledger), "--registry", str(registry), "--manifest", str(manifest)], input="not-json", capture_output=True, text=True)
            self.assertNotEqual(malformed.returncode, 0)
            self.assertEqual(ledger.read_bytes(), before)
            missing_registry = root / "missing-registry.json"
            self.assertNotEqual(run(payload, registry_path=missing_registry).returncode, 0)
            self.assertNotEqual(run({key: value for key, value in payload.items() if key != "reporter_ref"}).returncode, 0)
            for key, value in (("repo", "other-repo"), ("ticket", "SPE-999"), ("run_id", "run-999"), ("reporter_ref", "reporter-999")):
                self.assertNotEqual(run({**payload, key: value}).returncode, 0)
                self.assertEqual(ledger.read_bytes(), before)
            valid_registry = json.loads(registry.read_text())
            ticket_registry = valid_registry["repos"]["pickle-king"]["tickets"]["SPE-215"]
            for field, malformed_values in (("reporters", ("reporter-100", {"reporter-1": True}, None, ["reporter-1", "reporter-1"])), ("runs", ("run-100", {"run-1": True}, None, ["run-1", "run-1"]))):
                for malformed_value in malformed_values:
                    malformed_registry = json.loads(json.dumps(valid_registry))
                    malformed_registry["repos"]["pickle-king"]["tickets"]["SPE-215"][field] = malformed_value
                    registry.write_text(json.dumps(malformed_registry))
                    self.assertNotEqual(run(payload).returncode, 0)
                    self.assertEqual(ledger.read_bytes(), before)
            registry.write_text(json.dumps(valid_registry))
            self.assertNotEqual(run({**payload, "assessment_id": "assessment-fail"}).returncode, 0)
            (os_repo / "os_feedback.py").write_text("dirty\n")
            self.assertNotEqual(run(payload).returncode, 0)


if __name__ == "__main__":
    unittest.main()

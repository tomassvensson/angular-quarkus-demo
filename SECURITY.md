# Security Policy

This repository is a **public demo project** intended for learning and showcasing implementation patterns. It is **not** an official product and is **not** intended to be deployed as-is in production environments.

Even so, security issues are taken seriously. If you believe you found a vulnerability, please report it responsibly (see below).

## Supported Versions

Security fixes are provided only for the default branch:

| Version / Branch    | Supported |
| ------------------- | --------- |
| `main`              | ✅        |
| older tags/branches | ❌        |

Notes:

- Demo repositories often change quickly; older commits/tags are not maintained.
- If you are running a fork, you are responsible for keeping it updated.

## Reporting a Vulnerability

Please **do not** open public GitHub Issues for suspected security vulnerabilities.

Instead:

1. Use **GitHub Private Vulnerability Reporting** (if enabled for this repo), **or**
2. If private reporting is not available, contact the maintainer via a private channel (e.g., email listed in the repository profile).

Include as much detail as possible:

- A clear description of the issue and potential impact
- Steps to reproduce (proof-of-concept is helpful)
- Affected component(s) and commit hash/tag (if known)
- Any suggested mitigation or fix

### What to expect

- **Acknowledgement:** typically within **7 days**
- **Status updates:** when there is meaningful progress (or at least every **14 days** while actively investigating)
- **Fix timeline:** best effort. Because this is a demo project, there is **no guaranteed SLA**.
- **Disclosure:** please allow a reasonable time for remediation before any public disclosure. Coordinated disclosure is appreciated.

### Scope

In scope:

- Vulnerabilities in code contained in this repository
- Misconfigurations in provided example configs (e.g., insecure defaults) that could lead to real compromise if copied

Out of scope (generally):

- Vulnerabilities in third-party dependencies (please also report upstream; you may still open a PR bumping versions)
- Findings that require unrealistic assumptions or highly unusual environments
- Issues involving only missing security headers or best-practice suggestions without a concrete impact

## Security Best Practices for Users

If you reuse parts of this demo:

- Do not commit real secrets. Use environment variables and secret managers.
- Rotate any keys that might have been exposed.
- Apply least privilege to credentials and IAM/service accounts.
- Keep dependencies updated and enable dependency scanning in your fork.

Thank you for helping improve security.

# Test Fixtures

This directory contains fixtures for testing RepoGuard AI scanners.

## test-secrets.env
Contains dummy credentials for testing Gitleaks detection.
These are NOT real credentials — they are intentionally seeded for scanner validation.

## Usage in tests
The test suite uses these fixtures to verify that:
1. Gitleaks detects seeded secrets
2. Trivy detects known vulnerable dependencies
3. OSV-Scanner identifies package vulnerabilities
4. Risk engine ranks findings correctly

# Repository_Auditor
A multi AI agent workflow designed specifically for generating the repository health. The workflow is responsible for generating a detailed report for the auditing purposes while providing the overall risk score on the scale of 1 - 10. It gives the instructions for the repository about the critical actions, short term actions, long term actions and the final recommendation to preserve your repository health with also identifying the security issues accordingly.

The platform allows users to submit a Github repository URL through a web interface and receive a detailed audit report directly via email. Built using n8n, Groq LLMs, GitHub APIs, Railway and Gmail integration.

# Features

# Repository Crwaling

- Extracts repository metadata using GitHub APIs
- Collects README information
- Analyzes repository structure
- Reviews Dependency Manifests and Project Configuration.

# Multi-Agent Analysis


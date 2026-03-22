---
name: site-analyzer
description: Site analysis for SEO, performance, UI/UX, traffic, etc.
metadata:
  emoji: "🔍"
---

# Site Analyzer Guidelines

This skill handles automated site analysis submissions, retrieval of reports, generating PDF exports, and managing domain contact information. 

## Instructions for Agent
1. Determine the user's goal: Do they want to scan a new site, fetch a complete report, delete an old report, or fetch/update contact info?
2. Parameter Guidelines:
   - `--action`: Mandatory. Options: `addSite`, `get`, `report`, `delete`, `contacts`, `add-contact`.
   - `--site`: Mandatory. The target domain URL (e.g., https://example.com).
   - `--fields`: Optional (only for `addSite`). Comma-separated metrics to analyze (e.g., `seo,performance,ui/ux,traffic`).
   - `--report`: Optional (for `get` or `delete`). Specify a specific metric like `seo` or use `all`. Default is usually `all`.
   - `--attachment`: Optional (for `report`). If set to `true`, generates a mock PDF file.
   - `--platform` & `--value`: Required when action is `add-contact`.
3. State Management: The analysis may take time. Initial `addSite` puts it in `pending` state. The agent must recall the site later using `get` to verify if it's `completed` and present the results.
4. Take decisive action utilizing the output and avoid overwhelming the user with raw logs unless requested.

## Examples
Initiate Analysis:
`node scripts/analyzer.js --action=addSite --site=https://domain.com --fields=seo,performance`

Check Status/Results:
`node scripts/analyzer.js --action=get --site=https://domain.com --report=all`

Export PDF:
`node scripts/analyzer.js --action=report --site=https://domain.com --attachment=true`

Add Contact Details:
`node scripts/analyzer.js --action=add-contact --site=https://domain.com --platform=whatsapp --value=+1234567890`

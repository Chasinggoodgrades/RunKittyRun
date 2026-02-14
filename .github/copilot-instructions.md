# Copilot Instructions

## General Guidelines
- Avoid using ToList and similar SQL-like LINQ commands due to leak concerns.
- Prefer avoiding dictionaries for performance and memory efficiency; avoid ToList/LINQ as well.
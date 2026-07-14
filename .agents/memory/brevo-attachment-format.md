---
name: Brevo attachment format allowlist
description: Why emailed DB backups are zipped (not gzipped) and how the backup email path is built
---

# Brevo rejects .gz attachments

Brevo's transactional email API enforces an attachment **extension allowlist**. A
`.gz` (or `.sql`) attachment returns HTTP 400 `{"code":"invalid_parameter","message":"Unsupported file format: gz"}`.
`.zip`, `.tar`, `.csv`, `.txt`, `.pdf` are accepted.

**Rule:** anything emailed as an attachment via `sendEmail` (server/lib/email.ts,
`attachments: [{content, name}]`, base64) must use a Brevo-allowed extension.

**Why:** the weekly DB backup emails a pg_dump. pg_dump output compressed with
gzip (`.sql.gz`) is the natural artifact, but Brevo silently 400s on it. On-demand
DOWNLOAD backups (via present_asset) can stay `.gz` — only the email path is
constrained.

**How to apply:** the `zip` binary is NOT installed in this environment (only
`gzip` + `pg_dump`). Use the `jszip` package (already in node_modules) to build the
zip in Node: `zip.file(name+".sql", sqlBuffer); zip.generateAsync({type:"nodebuffer",
compression:"DEFLATE", compressionOptions:{level:9}})`. See server/lib/db-backup.ts.
Keep a size ceiling (~9MB) before sending — Brevo caps attachment size too.

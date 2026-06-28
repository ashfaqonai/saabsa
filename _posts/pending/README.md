# Scheduled blog posts (90-day queue + ForgeMeter extension)

These JSON files publish **one per day** via GitHub Actions (`publish-post.yml`).

## Products covered
- **Patientree AI** (Healthcare Technology) — posts 01–25
- **DataXPipe** (Data Engineering) — posts 26–50
- **Lease Exit** (Consumer Legal Tech) — posts 51–75
- **Saabsa Solutions** (Company News / AI) — posts 76–90
- **ForgeMeter** (Developer Tools) + portfolio announcement — posts 91–100

## How publishing works
1. Cron runs daily at 16:20 UTC (10:20 AM CST).
2. `scripts/publish-pending.js` moves the oldest file from `_posts/pending/` to `_posts/YYYY-MM-DD_slug.json`.
3. Deploy workflow runs `scripts/build-blog.js` to regenerate HTML, posts.json, and sitemap.

## Commands
```bash
# Regenerate pending queue (use --force to overwrite)
node scripts/generate-pending-posts.js

# Publish next post locally
node scripts/publish-pending.js
```

## Notes
- Filenames are prefixed `01-` … `90-` to control publish order.
- Do not add date prefixes here; dates are assigned at publish time.
- Logic formerly in `saabsa-auto-publisher-repo` now lives in this repo.

#!/usr/bin/env node
/**
 * Publish the oldest pending blog post from _posts/pending/ into _posts/.
 * Used by GitHub Actions (publish-post.yml) and runnable locally:
 *   node scripts/publish-pending.js
 *
 * Migrated from saabsa-auto-publisher-repo — site build (build-blog.js) handles HTML.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PENDING_DIR = path.join(ROOT, '_posts', 'pending');
const POSTS_DIR = path.join(ROOT, '_posts');

function todayISO() {
    const d = new Date();
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getOldestPending() {
    if (!fs.existsSync(PENDING_DIR)) return null;
    const files = fs.readdirSync(PENDING_DIR)
        .filter(f => f.endsWith('.json') && f !== 'README.md')
        .sort();
    if (!files.length) return null;
    return path.join(PENDING_DIR, files[0]);
}

function publish() {
    const next = getOldestPending();
    if (!next) {
        console.log('No pending posts found. Nothing to publish.');
        return { published: false };
    }

    const basename = path.basename(next);
    const raw = JSON.parse(fs.readFileSync(next, 'utf8'));
    const slug = String(raw.slug || basename.replace(/^\d+-/, '').replace(/\.json$/, ''));
    const date = todayISO();
    const dest = path.join(POSTS_DIR, `${date}_${slug}.json`);

    if (fs.existsSync(dest)) {
        throw new Error(`Destination already exists: ${dest}`);
    }

    console.log(`Publishing: ${basename}`);
    console.log(`  From: ${next}`);
    console.log(`  To:   ${dest}`);
    console.log(`  Date: ${date}`);

    fs.renameSync(next, dest);

    const remaining = fs.readdirSync(PENDING_DIR).filter(f => f.endsWith('.json')).length;
    console.log(`Remaining pending posts: ${remaining}`);

    return { published: true, slug, dest, date };
}

if (require.main === module) {
    try {
        const result = publish();
        if (result.published) {
            process.stdout.write(`slug=${result.slug}\n`);
        }
        process.exit(result.published ? 0 : 0);
    } catch (err) {
        console.error('Publish failed:', err.message);
        process.exit(1);
    }
}

module.exports = { publish, getOldestPending, todayISO };

/**
 * Blog hero images — Pexels CDN fallbacks (no API key required) + persist helpers.
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', '_posts');

/** Curated Pexels photo IDs — direct CDN URLs work without API key */
const POOLS = {
    healthcare: [
        7659573, 8413333, 7723528, 8460227, 7195090, 3584994, 6627926, 7579823,
        4266942, 5706225, 5395777, 8830696, 6129207, 3690735, 7821762, 8376153,
        8439075, 7195308, 97080, 4610799, 5965635, 12203711, 12599544, 8834114,
    ],
    data: [
        3861969, 669619, 1181677, 577585, 3184465, 1181244, 265087, 3861972,
        5474296, 17809394, 325229, 1181317, 590020, 7567443, 256381, 416405,
        7376, 3184292, 574071, 210607, 803963, 1181263, 259200, 3862132,
    ],
    lease: [
        8293779, 439391, 1643384, 1732414, 3288103, 707889, 1571460, 2102587,
        259588, 1428621, 8292895, 1457842, 186077, 106399, 271624, 1571459,
        4391470, 5824907, 6480707, 757920, 1454367, 271743, 1396122, 259962,
    ],
    general: [
        3182812, 7413906, 7688336, 1181345, 3184460, 3861969, 3183150, 3861972,
        6476589, 3184296, 3861969, 1181676, 3184290, 7688460, 3862132, 3182812,
        590022, 3184465, 3861972, 6476264, 3183153, 7688460, 3861969, 6476589,
    ],
};

const CATEGORY_POOL = {
    'Healthcare Technology': 'healthcare',
    'Technology': 'healthcare',
    'Data Engineering': 'data',
    'Consumer Legal Tech': 'lease',
    'Company News': 'general',
    'AI & Automation': 'general',
};

function hashSlug(slug) {
    let h = 0;
    const s = String(slug || '');
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

function pexelsCropUrl(photoId, width = 1200, height = 627) {
    return `https://images.pexels.com/photos/${photoId}/pexels-photo-${photoId}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=${height}&w=${width}`;
}

function poolForPost(post) {
    if (post.product && POOLS[post.product]) {
        const map = { patientree: 'healthcare', dataxpipe: 'data', leasexit: 'lease', saabsa: 'general', ai: 'general' };
        return map[post.product] || 'general';
    }
    return CATEGORY_POOL[post.category] || 'general';
}

function resolveFallbackImage(post) {
    const poolName = poolForPost(post);
    const pool = POOLS[poolName] || POOLS.general;
    const id = pool[hashSlug(post.slug) % pool.length];
    return {
        imageUrl: pexelsCropUrl(id, 1200, 627),
        imageMedium: pexelsCropUrl(id, 800, 500),
    };
}

function resolvePostImage(post) {
    const existing = (post.imageUrl || post.featuredImageUrl || '').trim();
    if (existing) {
        return {
            imageUrl: existing,
            imageMedium: post.imageMedium || existing,
        };
    }
    return resolveFallbackImage(post);
}

function persistPostImage(post) {
    if (!post.sourceFile || !post.imageUrl) return false;

    const filePath = path.join(POSTS_DIR, post.sourceFile);
    if (!fs.existsSync(filePath)) return false;

    if (post.sourceFile.endsWith('.json')) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.imageUrl === post.imageUrl) return false;
        data.imageUrl = post.imageUrl;
        if (post.imageMedium) data.imageMedium = post.imageMedium;
        if (post.photographer) data.photographer = post.photographer;
        if (post.photographerUrl) data.photographerUrl = post.photographerUrl;
        if (post.pexelsUrl) data.pexelsUrl = post.pexelsUrl;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        return true;
    }

    return false;
}

/** Backfill imageUrl on all published and pending JSON posts */
function backfillAllPostFiles() {
    let updated = 0;
    const dirs = [POSTS_DIR, path.join(POSTS_DIR, 'pending')];

    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir)) {
            if (!file.endsWith('.json') || file === 'posts.json') continue;
            const filePath = path.join(dir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if ((data.imageUrl || '').trim()) continue;

            const slug = data.slug || file.replace(/^\d+-/, '').replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/\.json$/, '');
            const resolved = resolveFallbackImage({ slug, category: data.category, product: data.product });
            data.imageUrl = resolved.imageUrl;
            data.imageMedium = resolved.imageMedium;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
            updated++;
        }
    }
    return updated;
}

module.exports = {
    POOLS,
    pexelsCropUrl,
    resolvePostImage,
    resolveFallbackImage,
    persistPostImage,
    backfillAllPostFiles,
    poolForPost,
};

if (require.main === module) {
    const n = backfillAllPostFiles();
    console.log(`Backfilled imageUrl on ${n} post file(s).`);
}

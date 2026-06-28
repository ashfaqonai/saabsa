/**
 * Blog hero images — Pexels CDN fallbacks (no API key required) + persist helpers.
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '..', '_posts');

/** Curated unique Pexels photo IDs — direct CDN URLs work without API key */
const POOLS = {
    healthcare: [
        7659573, 8413333, 7723528, 8460227, 7195090, 3584994, 6627926, 7579823,
        4266942, 5706225, 5395777, 8830696, 6129207, 3690735, 7821762, 8376153,
        8439075, 7195308, 97080, 4610799, 5965635, 12203711, 12599544, 8834114,
        30313813, 4021802, 17515225, 33127693, 15177504, 7821463, 6814522, 7578800,
        4021775, 30901558, 8248433, 6129586, 11484112, 9574466, 6129494,
        6129444, 6627930, 7195122, 7108346, 5355709, 9122014, 7579821, 6097758,
        8527652, 8376326, 4226270, 11623619, 7370679, 7108332, 6809657, 6129198,
        4386183, 36571389, 8413294, 4989172, 6823507, 139387, 7088834, 4269933,
        18500632, 5355693, 5849579, 590022, 6128340, 4386466, 263402, 263453,
        263397, 263388, 1170979, 263086, 263084, 2280549, 4386464,
        3845457, 3845810, 5215024, 5214959, 5215022, 8460156, 8460137, 8460121,
        8460116, 8460109, 8460095, 8460087, 8460058,
        3861087, 3861086,
    ],
    data: [
        3861969, 669619, 1181677, 577585, 3184465, 1181244, 265087, 3861972,
        5474296, 325229, 1181317, 590020, 7567443, 256381, 416405,
        3184292, 574071, 210607, 803963, 1181263, 259200, 3862132,
        1181676, 3184290, 7688460, 6476264, 3183153, 6476589, 3183150, 3184460,
        1181345, 7688336, 3182812, 256219, 3861969, 669619, 1181677, 577585,
        3184465, 1181244, 265087, 3861972,
    ],
    lease: [
        8293779, 439391, 1643384, 1732414, 1571460, 2102587,
        259588, 1428621, 8292895, 1457842, 186077, 106399, 271624, 1571459,
        4391470, 5824907, 6480707, 757920, 1454367, 271743, 1396122, 259962,
        276724, 1571468, 1571455,
        2121121, 2121120, 2121119, 8293778, 8293777, 8293776,
    ],
    general: [
        3182812, 7688336, 1181345, 3184460, 3183150, 6476589, 3184296,
        1181676, 3184290, 7688460, 6476264, 3183153, 590022, 3861972,
        256219, 3861969, 669619, 1181677, 577585, 3184465, 1181244, 265087,
        3862132, 5474296, 325229, 1181317, 590020, 7567443, 256381,
        3861087, 3861086,
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

function uniquePoolIds(poolName) {
    const pool = POOLS[poolName] || POOLS.general;
    return [...new Set(pool)];
}

/** Pexels photo IDs removed from CDN — treat stored URLs using these as missing */
const REMOVED_PHOTO_IDS = new Set([
    47327, 40568, 8460078, 8460069, 17809394, 7376, 7413906, 5473976,
    3288103, 707889, 1570123,
]);

function photoIdFromUrl(url) {
    const match = String(url || '').match(/photos\/(\d+)/);
    return match ? Number(match[1]) : null;
}

function isStoredImageValid(url) {
    const id = photoIdFromUrl(url);
    if (!id) return Boolean((url || '').trim());
    return !REMOVED_PHOTO_IDS.has(id);
}

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

function pickPhotoId(poolName, slug, usedInPool) {
    const pool = uniquePoolIds(poolName);
    const unused = pool.find(id => !usedInPool.has(id));
    if (unused) return unused;
    return pool[(hashSlug(slug) + usedInPool.size) % pool.length];
}

function imagesFromPhotoId(photoId) {
    return {
        imageUrl: pexelsCropUrl(photoId, 1200, 627),
        imageMedium: pexelsCropUrl(photoId, 800, 500),
    };
}

function resolveFallbackImage(post, usedInPool = null) {
    const poolName = poolForPost(post);
    const used = usedInPool || new Set();
    const photoId = pickPhotoId(poolName, post.slug, used);
    if (usedInPool) usedInPool.add(photoId);
    return imagesFromPhotoId(photoId);
}

function resolvePostImage(post, usedInPool = null) {
    const existing = (post.imageUrl || post.featuredImageUrl || '').trim();
    if (existing && isStoredImageValid(existing)) {
        return {
            imageUrl: existing,
            imageMedium: post.imageMedium || existing,
        };
    }
    return resolveFallbackImage(post, usedInPool);
}

function persistPostImage(post) {
    if (!post.sourceFile || !post.imageUrl) return false;

    const filePath = path.join(POSTS_DIR, post.sourceFile);
    if (!fs.existsSync(filePath)) return false;

    if (post.sourceFile.endsWith('.json')) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (data.imageUrl === post.imageUrl && data.imageMedium === post.imageMedium) return false;
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

function collectPostJsonFiles() {
    const files = [];
    const dirs = [POSTS_DIR, path.join(POSTS_DIR, 'pending')];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) continue;
        for (const file of fs.readdirSync(dir).sort()) {
            if (!file.endsWith('.json') || file === 'posts.json') continue;
            const filePath = path.join(dir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const slug = data.slug || file.replace(/^\d+-/, '').replace(/^\d{4}-\d{2}-\d{2}_/, '').replace(/\.json$/, '');
            files.push({ filePath, data, slug, category: data.category, product: data.product });
        }
    }
    return files;
}

/** Assign a unique image per post within each category pool (fixes hash collisions). */
function reassignUniqueImages({ force = false } = {}) {
    const posts = collectPostJsonFiles();
    const usedByPool = {};
    for (const name of Object.keys(POOLS)) usedByPool[name] = new Set();

    if (!force) {
        for (const post of posts) {
            const existingId = photoIdFromUrl(post.data.imageUrl);
            if (existingId && isStoredImageValid(post.data.imageUrl)) {
                usedByPool[poolForPost(post)].add(existingId);
            }
        }
    }

    let updated = 0;
    for (const post of posts) {
        const poolName = poolForPost(post);
        const used = usedByPool[poolName];
        const existingId = photoIdFromUrl(post.data.imageUrl);

        if (!force && existingId && isStoredImageValid(post.data.imageUrl)) {
            continue;
        }

        const photoId = pickPhotoId(poolName, post.slug, used);
        used.add(photoId);
        const { imageUrl, imageMedium } = imagesFromPhotoId(photoId);

        if (post.data.imageUrl === imageUrl && post.data.imageMedium === imageMedium) continue;

        post.data.imageUrl = imageUrl;
        post.data.imageMedium = imageMedium;
        fs.writeFileSync(post.filePath, JSON.stringify(post.data, null, 2) + '\n', 'utf8');
        updated++;
    }
    return { updated, total: posts.length };
}

/** Backfill only posts missing imageUrl */
function backfillAllPostFiles() {
    const posts = collectPostJsonFiles();
    const usedByPool = {};
    for (const name of Object.keys(POOLS)) usedByPool[name] = new Set();

    // Reserve already-assigned photo IDs so new posts don't collide
    for (const post of posts) {
        const existing = (post.data.imageUrl || '').trim();
        if (!existing) continue;
        const match = existing.match(/photos\/(\d+)/);
        if (match) usedByPool[poolForPost(post)].add(Number(match[1]));
    }

    let updated = 0;
    for (const post of posts) {
        if ((post.data.imageUrl || '').trim()) continue;
        const resolved = resolveFallbackImage(post, usedByPool[poolForPost(post)]);
        post.data.imageUrl = resolved.imageUrl;
        post.data.imageMedium = resolved.imageMedium;
        fs.writeFileSync(post.filePath, JSON.stringify(post.data, null, 2) + '\n', 'utf8');
        updated++;
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
    reassignUniqueImages,
    poolForPost,
    uniquePoolIds,
};

if (require.main === module) {
    const force = process.argv.includes('--reassign');
    if (force) {
        const { updated, total } = reassignUniqueImages({ force: true });
        console.log(`Reassigned unique images for ${updated}/${total} post(s).`);
    } else {
        const n = backfillAllPostFiles();
        console.log(`Backfilled imageUrl on ${n} post file(s). Use --reassign to fix duplicates.`);
    }
}

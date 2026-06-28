#!/usr/bin/env node
/**
 * Blog Build Script for Saabsa Solutions
 *
 * Reads post files from _posts/ and generates:
 *   - Static HTML pages in blog/  (fully rendered, SEO-ready)
 *   - _posts/posts.json           (post index for the blog listing page)
 *   - sitemap.xml                 (updated with all blog post URLs)
 *
 * Supports two post formats:
 *   - Markdown (.md) with YAML front matter
 *   - JSON (.json) with bodyHtml field
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { marked } = require('marked');
const {
    blogHeader,
    blogFooter,
    generateBlogListingBlock,
    formatDateShort,
} = require('./blog-layout');
const { resolvePostImage, persistPostImage } = require('./blog-images');

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, '_posts');
const BLOG_DIR = path.join(ROOT, 'blog');
const BLOG_INDEX_PATH = path.join(ROOT, 'blog.html');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const SITE_URL = 'https://www.saabsa.com';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Decode HTML entities — handles bodyHtml that arrives pre-escaped */
function unescapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${months[month - 1]} ${day}, ${year}`;
}

/** Parse simple YAML-like front matter (key: "value" or key: value) */
function parseFrontMatter(text) {
    const result = {};
    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        // Match: key: "quoted value"
        const quotedMatch = trimmed.match(/^(\w+):\s*"(.*)"\s*$/);
        if (quotedMatch) {
            result[quotedMatch[1]] = quotedMatch[2].replace(/\\"/g, '"');
            continue;
        }
        // Match: key: unquoted value
        const unquotedMatch = trimmed.match(/^(\w+):\s*(.+?)\s*$/);
        if (unquotedMatch && unquotedMatch[2] !== '') {
            result[unquotedMatch[1]] = unquotedMatch[2];
        }
    }
    return result;
}

// ---------------------------------------------------------------------------
// Pexels image fetching
// ---------------------------------------------------------------------------

/**
 * Fetch a landscape photo from Pexels based on a keyword.
 * Returns { url, photographer, photographerUrl, pexelsUrl } or null.
 */
function fetchPexelsImage(keyword) {
    if (!PEXELS_API_KEY || !keyword) return Promise.resolve(null);

    const query = encodeURIComponent(keyword);
    const apiUrl = `https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`;

    return new Promise((resolve) => {
        const req = https.request(apiUrl, {
            headers: { 'Authorization': PEXELS_API_KEY }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.photos && json.photos.length > 0) {
                        const photo = json.photos[0];
                        resolve({
                            url: photo.src.large2x || photo.src.large,       // ~1880px wide
                            medium: photo.src.medium,                         // ~350px (for listing)
                            photographer: photo.photographer,
                            photographerUrl: photo.photographer_url,
                            pexelsUrl: photo.url
                        });
                    } else {
                        console.warn(`    No Pexels results for "${keyword}"`);
                        resolve(null);
                    }
                } catch (e) {
                    console.warn(`    Pexels API parse error for "${keyword}":`, e.message);
                    resolve(null);
                }
            });
        });
        req.on('error', (e) => {
            console.warn(`    Pexels API request error for "${keyword}":`, e.message);
            resolve(null);
        });
        req.end();
    });
}

/**
 * Resolve hero images: Pexels API when key is set, else curated CDN fallbacks.
 * Persists imageUrl back to source JSON so images survive rebuilds without API key.
 */
async function enrichPostsWithImages(posts) {
    console.log('  Resolving blog images...');

    for (const post of posts) {
        const existing = (post.imageUrl || '').trim();
        if (existing) {
            if (!post.imageMedium) post.imageMedium = existing;
            console.log(`    ✓ ${post.slug} (already has image)`);
            continue;
        }

        if (PEXELS_API_KEY && post.imageKeyword) {
            const img = await fetchPexelsImage(post.imageKeyword);
            if (img) {
                post.imageUrl = img.url;
                post.imageMedium = img.medium;
                post.photographer = img.photographer;
                post.photographerUrl = img.photographerUrl;
                post.pexelsUrl = img.pexelsUrl;
                persistPostImage(post);
                console.log(`    ✓ ${post.slug} → Pexels "${post.imageKeyword}" (by ${img.photographer})`);
                await new Promise(r => setTimeout(r, 200));
                continue;
            }
        }

        const fallback = resolvePostImage(post);
        post.imageUrl = fallback.imageUrl;
        post.imageMedium = fallback.imageMedium;
        if (persistPostImage(post)) {
            console.log(`    ↳ ${post.slug} (fallback image, saved to source)`);
        } else {
            console.log(`    ↳ ${post.slug} (fallback image)`);
        }
    }
    console.log('');
}

// ---------------------------------------------------------------------------
// Read posts
// ---------------------------------------------------------------------------

function readPosts() {
    const files = fs.readdirSync(POSTS_DIR);
    const posts = [];

    for (const file of files) {
        if (file === 'posts.json') continue;

        const filePath = path.join(POSTS_DIR, file);
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        try {
            if (file.endsWith('.md')) {
                const raw = fs.readFileSync(filePath, 'utf8');
                const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
                if (!fmMatch) {
                    console.warn(`  Skipping ${file}: no front matter found`);
                    continue;
                }
                const meta = parseFrontMatter(fmMatch[1]);
                const bodyHtml = marked.parse(fmMatch[2]);
                posts.push({
                    title: meta.title || 'Untitled',
                    date: meta.date || null,
                    category: meta.category || 'General',
                    excerpt: meta.excerpt || '',
                    slug: meta.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, ''),
                    bodyHtml,
                    imageKeyword: meta.imageKeyword || '',
                    imageUrl: meta.imageUrl || meta.featuredImageUrl || '',
                    product: meta.product || '',
                    sourceFile: file
                });

            } else if (file.endsWith('.json')) {
                const raw = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(raw);
                const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})[_-]/);
                posts.push({
                    title: data.title || 'Untitled',
                    date: dateMatch ? dateMatch[1] : null,
                    category: data.publishCategory || data.category || 'General',
                    excerpt: data.excerpt || '',
                    slug: data.slug || file.replace(/^\d{4}-\d{2}-\d{2}[_-]/, '').replace(/\.json$/, ''),
                    bodyHtml: unescapeHtml(data.bodyHtml || ''),
                    imageKeyword: data.imageKeyword || '',
                    imageUrl: data.imageUrl || data.featuredImageUrl || '',
                    product: data.product || '',
                    sourceFile: file
                });
            }
        } catch (err) {
            console.error(`  Error processing ${file}:`, err.message);
        }
    }

    // Newest first
    posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return posts;
}

// ---------------------------------------------------------------------------
// Generate static HTML for a single blog post
// ---------------------------------------------------------------------------

function generatePostHtml(post) {
    const postUrl = `${SITE_URL}/blog/${post.slug}.html`;
    const postImage = post.imageUrl || `${SITE_URL}/og-image.png`;
    const postExcerpt = post.excerpt || post.title;
    const formattedDate = formatDateShort(post.date);

    const jsonLd = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": postExcerpt,
        "image": postImage,
        "datePublished": post.date,
        "dateModified": post.date,
        "author": { "@type": "Organization", "name": "Saabsa Solutions", "url": SITE_URL },
        "publisher": {
            "@type": "Organization",
            "name": "Saabsa Solutions",
            "url": SITE_URL,
            "logo": { "@type": "ImageObject", "url": `${SITE_URL}/patientreeLogo.png` }
        },
        "mainEntityOfPage": { "@type": "WebPage", "@id": postUrl },
        "url": postUrl,
        "articleSection": post.category || "General",
        "inLanguage": "en-US"
    });

    const heroBlock = post.imageUrl ? `
            <div class="blog-post-hero">
                <img src="${escapeAttr(post.imageUrl)}" alt="${escapeAttr(post.title)}" loading="eager" />
                ${post.photographer ? `
                <div class="blog-post-credit">
                    Photo by <a href="${escapeAttr(post.photographerUrl || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(post.photographer)}</a>
                    on <a href="${escapeAttr(post.pexelsUrl || 'https://www.pexels.com')}" target="_blank" rel="noopener noreferrer">Pexels</a>
                </div>` : ''}
            </div>` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-1PXBREVK1K"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-1PXBREVK1K');
    </script>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="192x192" href="/patientreeLogo.png" />
    <link rel="shortcut icon" href="/favicon.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/patientreeLogo.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <title>${escapeHtml(post.title)} | Saabsa Solutions Blog</title>
    <meta name="description" content="${escapeAttr(postExcerpt)}" />
    <meta name="author" content="Saabsa Solutions" />
    <meta name="robots" content="index, follow" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:title" content="${escapeAttr(post.title)}" />
    <meta property="og:description" content="${escapeAttr(postExcerpt)}" />
    <meta property="og:image" content="${postImage}" />
    <meta property="og:site_name" content="Saabsa Solutions" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(post.title)}" />
    <meta name="twitter:description" content="${escapeAttr(postExcerpt)}" />
    <meta name="twitter:image" content="${postImage}" />
    <link rel="canonical" href="${postUrl}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles/blog.css?v=2" />
    <script type="application/ld+json">${jsonLd}</script>
</head>
<body class="blog-page">

${blogHeader('blog')}

    <main class="blog-post-main">
        <a href="/blog.html" class="blog-back">&larr; Back to Blog</a>
        ${heroBlock}
        <div class="blog-post-meta">
            ${post.date ? `<time datetime="${post.date}">${formattedDate}</time>` : ''}
            ${post.category ? `<span class="blog-post-category">${escapeHtml(post.category)}</span>` : ''}
        </div>
        <h1 class="blog-post-title">${escapeHtml(post.title)}</h1>
        <article class="blog-post-article">
            <div class="blog-content">
                ${post.bodyHtml}
            </div>
        </article>
    </main>

${blogFooter()}

</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Generate posts.json
// ---------------------------------------------------------------------------

function generatePostsJson(posts) {
    const data = {
        posts: posts.map(p => ({
            title: p.title,
            date: p.date,
            category: p.category,
            excerpt: p.excerpt,
            slug: p.slug,
            imageUrl: p.imageMedium || p.imageUrl || '',
            photographer: p.photographer || '',
            photographerUrl: p.photographerUrl || '',
            pexelsUrl: p.pexelsUrl || ''
        }))
    };
    fs.writeFileSync(
        path.join(POSTS_DIR, 'posts.json'),
        JSON.stringify(data, null, 2) + '\n',
        'utf8'
    );
}

// ---------------------------------------------------------------------------
// Update blog.html with static, crawlable links
// ---------------------------------------------------------------------------

function updateBlogIndexPage(posts) {
    if (!fs.existsSync(BLOG_INDEX_PATH)) {
        console.warn('  ! blog.html not found; skipping static listing update');
        return;
    }

    const html = fs.readFileSync(BLOG_INDEX_PATH, 'utf8');
    const replacementBlock = generateBlogListingBlock(posts);
    const pattern = /<!-- Blog Listing Start -->[\s\S]*?<!-- Blog Listing End -->/;

    if (!pattern.test(html)) {
        console.warn('  ! Could not find blog listing block in blog.html; skipping update');
        return;
    }

    const updated = html.replace(pattern, replacementBlock);
    fs.writeFileSync(BLOG_INDEX_PATH, updated, 'utf8');
}

// ---------------------------------------------------------------------------
// Generate sitemap.xml
// ---------------------------------------------------------------------------

function generateSitemap(posts) {
    const today = new Date().toISOString().split('T')[0];

    const staticPages = [
        { loc: '/',              priority: '1.0',  changefreq: 'weekly',  lastmod: today },
        { loc: '/services.html', priority: '0.9',  changefreq: 'monthly', lastmod: today },
        { loc: '/blog.html',     priority: '0.8',  changefreq: 'weekly',  lastmod: today },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
        xml += `  <url>\n`;
        xml += `    <loc>${SITE_URL}${page.loc}</loc>\n`;
        xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `  </url>\n`;
    }

    xml += `  <!-- Individual Blog Posts -->\n`;
    for (const post of posts) {
        xml += `  <url>\n`;
        xml += `    <loc>${SITE_URL}/blog/${post.slug}.html</loc>\n`;
        xml += `    <lastmod>${post.date || today}</lastmod>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `    <changefreq>monthly</changefreq>\n`;
        xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;
    fs.writeFileSync(SITEMAP_PATH, xml, 'utf8');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log('Building blog...\n');

    // Ensure blog/ directory exists
    if (!fs.existsSync(BLOG_DIR)) {
        fs.mkdirSync(BLOG_DIR, { recursive: true });
    }

    const posts = readPosts();
    console.log(`Found ${posts.length} post(s):\n`);

    // Fetch featured images from Pexels
    await enrichPostsWithImages(posts);

    // Generate static HTML for each post
    for (const post of posts) {
        const html = generatePostHtml(post);
        const outPath = path.join(BLOG_DIR, `${post.slug}.html`);
        fs.writeFileSync(outPath, html, 'utf8');
        console.log(`  + blog/${post.slug}.html`);
    }

    // Generate posts.json
    generatePostsJson(posts);
    console.log(`  + _posts/posts.json  (${posts.length} entries)`);

    // Update blog.html with static list (SEO/crawl fallback)
    updateBlogIndexPage(posts);
    console.log(`  + blog.html (static blog listing)`);

    // Generate sitemap
    generateSitemap(posts);
    console.log(`  + sitemap.xml`);

    console.log('\nBuild complete!');
}

main().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});

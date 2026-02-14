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

const ROOT = path.join(__dirname, '..');
const POSTS_DIR = path.join(ROOT, '_posts');
const BLOG_DIR = path.join(ROOT, 'blog');
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
 * Fetch Pexels images for all posts that need them.
 * Respects existing featuredImageUrl and skips if no API key is set.
 */
async function enrichPostsWithImages(posts) {
    if (!PEXELS_API_KEY) {
        console.log('  PEXELS_API_KEY not set — skipping image fetch.\n');
        return;
    }

    console.log('  Fetching images from Pexels...');
    for (const post of posts) {
        // If the post already has a manual image URL, skip Pexels
        if (post.imageUrl) {
            console.log(`    ✓ ${post.slug} (already has image)`);
            continue;
        }

        const keyword = post.imageKeyword;
        if (!keyword) {
            console.log(`    - ${post.slug} (no imageKeyword, skipping)`);
            continue;
        }

        const img = await fetchPexelsImage(keyword);
        if (img) {
            post.imageUrl = img.url;
            post.imageMedium = img.medium;
            post.photographer = img.photographer;
            post.photographerUrl = img.photographerUrl;
            post.pexelsUrl = img.pexelsUrl;
            console.log(`    ✓ ${post.slug} → "${keyword}" (by ${img.photographer})`);
        } else {
            console.log(`    ✗ ${post.slug} → "${keyword}" (no result)`);
        }

        // Small delay to respect Pexels rate limits (200 req/hr)
        await new Promise(r => setTimeout(r, 200));
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
                    imageUrl: meta.featuredImageUrl || '',
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
                    bodyHtml: data.bodyHtml || '',
                    imageKeyword: data.imageKeyword || '',
                    imageUrl: data.featuredImageUrl || '',
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
    const formattedDate = formatDate(post.date);

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

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-1PXBREVK1K"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-1PXBREVK1K');
    </script>

    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="192x192" href="/patientreeLogo.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/patientreeLogo.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/patientreeLogo.png" />
    <link rel="shortcut icon" href="/favicon.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/patientreeLogo.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <!-- SEO -->
    <title>${escapeHtml(post.title)} | Saabsa Solutions Blog</title>
    <meta name="description" content="${escapeAttr(postExcerpt)}" />
    <meta name="author" content="Saabsa Solutions" />
    <meta name="robots" content="index, follow" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${postUrl}" />
    <meta property="og:title" content="${escapeAttr(post.title)}" />
    <meta property="og:description" content="${escapeAttr(postExcerpt)}" />
    <meta property="og:image" content="${postImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeAttr(post.title)}" />
    <meta property="og:site_name" content="Saabsa Solutions" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${postUrl}" />
    <meta name="twitter:title" content="${escapeAttr(post.title)}" />
    <meta name="twitter:description" content="${escapeAttr(postExcerpt)}" />
    <meta name="twitter:image" content="${postImage}" />
    <meta name="twitter:image:alt" content="${escapeAttr(post.title)}" />

    <link rel="canonical" href="${postUrl}" />

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">${jsonLd}</script>

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            background-attachment: fixed;
            color: #1a202c;
            overflow-x: hidden;
        }

        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .section-padding { padding: 80px 20px; }

        .blog-content { line-height: 1.8; }
        .blog-content h1 { font-size: 2.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #1a202c; }
        .blog-content h2 { font-size: 1.875rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #1a202c; }
        .blog-content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1a202c; }
        .blog-content p  { margin-bottom: 1rem; color: #4a5568; font-size: 1.125rem; }
        .blog-content ul, .blog-content ol { margin-left: 1.5rem; margin-bottom: 1rem; }
        .blog-content li { margin-bottom: 0.5rem; color: #4a5568; font-size: 1.125rem; }
        .blog-content a  { color: #667eea; text-decoration: underline; }
        .blog-content code { background: #f7fafc; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: 'Courier New', monospace; font-size: 0.875rem; }
        .blog-content pre  { background: #f7fafc; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; }
        .blog-content blockquote { border-left: 4px solid #667eea; padding-left: 1rem; margin: 1rem 0; color: #4a5568; font-style: italic; }

        .hero-gradient { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); }
    </style>
</head>
<body class="antialiased">

    <!-- Header -->
    <header class="glass-effect sticky top-0 z-50 shadow-lg">
        <div class="container mx-auto px-4 py-4">
            <div class="flex flex-col sm:flex-row justify-between items-center">
                <a href="/index.html" class="mb-4 sm:mb-0 group transition-transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160" role="img" aria-labelledby="logo-title logo-desc" class="h-16 sm:h-20 md:h-24 w-auto min-w-[200px] sm:min-w-[250px] md:min-w-[300px]">
                        <title id="logo-title">Saabsa Solutions logo</title>
                        <desc id="logo-desc">Hex-tech icon with "SAABSA SOLUTIONS" wordmark</desc>
                        <g transform="translate(20,20)">
                            <defs>
                                <linearGradient id="split2" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="50%" stop-color="#0F3D6E"/>
                                    <stop offset="50%" stop-color="#F26A21"/>
                                </linearGradient>
                                <clipPath id="hexClip2">
                                    <path d="M60 6 L101 30 L101 90 L60 114 L19 90 L19 30 Z"/>
                                </clipPath>
                            </defs>
                            <path fill="url(#split2)" d="M60 6 L101 30 L101 90 L60 114 L19 90 L19 30 Z"/>
                            <g clip-path="url(#hexClip2)" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round">
                                <line x1="30" y1="40" x2="90" y2="40"/>
                                <circle cx="30" cy="40" r="4" fill="#FFFFFF"/>
                                <circle cx="90" cy="40" r="4" fill="#FFFFFF"/>
                                <line x1="30" y1="60" x2="90" y2="60"/>
                                <circle cx="30" cy="60" r="4" fill="#FFFFFF"/>
                                <circle cx="90" cy="60" r="4" fill="#FFFFFF"/>
                                <line x1="30" y1="80" x2="90" y2="80"/>
                                <circle cx="30" cy="80" r="4" fill="#FFFFFF"/>
                                <circle cx="90" cy="80" r="4" fill="#FFFFFF"/>
                            </g>
                        </g>
                        <g transform="translate(170,40)">
                            <text x="0" y="45" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="48" font-weight="700" fill="#0F3D6E" letter-spacing="1">SAABSA</text>
                            <text x="0" y="90" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="600" fill="#0F3D6E" opacity="0.85" letter-spacing="2">SOLUTIONS</text>
                        </g>
                    </svg>
                </a>
                <nav class="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm sm:text-base">
                    <a href="/index.html#about" class="font-medium text-gray-700 hover:text-[#0F3D6E] transition-colors">About</a>
                    <a href="/services.html" class="font-medium text-gray-700 hover:text-[#0F3D6E] transition-colors">Services</a>
                    <a href="/blog.html" class="font-medium text-gray-700 hover:text-[#0F3D6E] transition-colors">Blog</a>
                    <a href="/index.html#patientree" class="font-medium text-gray-700 hover:text-[#0F3D6E] transition-colors">Patientree AI</a>
                    <a href="/index.html#contact" class="bg-gradient-to-r from-[#0F3D6E] to-[#F26A21] text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                        Get Started
                    </a>
                </nav>
            </div>
        </div>
    </header>

    <!-- Blog Post Content -->
    <section class="section-padding bg-white">
        <div class="container mx-auto max-w-4xl">
            <div class="mb-6">
                <a href="/blog.html" class="text-[#0F3D6E] font-semibold hover:underline inline-flex items-center gap-2">
                    &larr; Back to Blog
                </a>
            </div>
            ${post.imageUrl ? `
            <div class="mb-8 rounded-3xl overflow-hidden shadow-xl">
                <img src="${escapeAttr(post.imageUrl)}" alt="${escapeAttr(post.title)}" class="w-full h-64 md:h-96 object-cover" loading="eager" />
                ${post.photographer ? `
                <div class="bg-gray-900 bg-opacity-80 px-4 py-2 text-xs text-gray-300">
                    Photo by <a href="${escapeAttr(post.photographerUrl || '#')}" target="_blank" rel="noopener noreferrer" class="text-white hover:underline">${escapeHtml(post.photographer)}</a>
                    on <a href="${escapeAttr(post.pexelsUrl || 'https://www.pexels.com')}" target="_blank" rel="noopener noreferrer" class="text-white hover:underline">Pexels</a>
                </div>` : ''}
            </div>` : ''}
            <div class="glass-effect p-8 md:p-12 rounded-3xl shadow-xl">
                <article>
                    <div class="flex items-center gap-4 mb-6 text-sm text-gray-500">
                        ${post.date ? `<time datetime="${post.date}">${formattedDate}</time>` : ''}
                        ${post.category ? `<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">${escapeHtml(post.category)}</span>` : ''}
                    </div>
                    <h1 class="text-4xl md:text-5xl font-black mb-8 text-gray-900">${escapeHtml(post.title)}</h1>
                    <div class="blog-content">
                        ${post.bodyHtml}
                    </div>
                </article>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-300 py-12">
        <div class="container mx-auto max-w-7xl px-4">
            <div class="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                    <div class="flex items-center space-x-3 mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" class="w-10 h-10">
                            <defs>
                                <linearGradient id="split" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="50%" stop-color="#0F3D6E"/>
                                    <stop offset="50%" stop-color="#F26A21"/>
                                </linearGradient>
                                <clipPath id="hexClip">
                                    <path d="M60 6 L101 30 L101 90 L60 114 L19 90 L19 30 Z"/>
                                </clipPath>
                            </defs>
                            <path fill="url(#split)" d="M60 6 L101 30 L101 90 L60 114 L19 90 L19 30 Z"/>
                            <g clip-path="url(#hexClip)" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round">
                                <line x1="30" y1="40" x2="90" y2="40"/>
                                <circle cx="30" cy="40" r="4" fill="#FFFFFF"/>
                                <circle cx="90" cy="40" r="4" fill="#FFFFFF"/>
                                <line x1="30" y1="60" x2="90" y2="60"/>
                                <circle cx="30" cy="60" r="4" fill="#FFFFFF"/>
                                <circle cx="90" cy="60" r="4" fill="#FFFFFF"/>
                                <line x1="30" y1="80" x2="90" y2="80"/>
                                <circle cx="30" cy="80" r="4" fill="#FFFFFF"/>
                                <circle cx="90" cy="80" r="4" fill="#FFFFFF"/>
                            </g>
                        </svg>
                        <span class="text-xl font-bold text-white">Saabsa Solutions</span>
                    </div>
                    <p class="text-sm font-semibold text-white mb-2">Transforming Ideas into Intelligent Solutions</p>
                    <p class="text-sm text-gray-400 leading-relaxed">
                        <strong>Saabsa Solutions</strong> is an emerging tech company focused on AI and software for healthcare.
                    </p>
                </div>
                <div>
                    <h3 class="text-white font-bold mb-4">Services</h3>
                    <ul class="space-y-2 text-sm">
                        <li><a href="/services.html" class="hover:text-white transition-colors">Custom Development</a></li>
                        <li><a href="/services.html" class="hover:text-white transition-colors">AI Solutions</a></li>
                        <li><a href="/services.html" class="hover:text-white transition-colors">Cloud Services</a></li>
                        <li><a href="/services.html" class="hover:text-white transition-colors">Consulting</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-white font-bold mb-4">Resources</h3>
                    <ul class="space-y-2 text-sm">
                        <li><a href="/blog.html" class="hover:text-white transition-colors">Blog</a></li>
                        <li><a href="/index.html#patientree" class="hover:text-white transition-colors">Patientree AI</a></li>
                        <li><a href="https://www.patientree.com" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">Visit Patientree</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="text-white font-bold mb-4">Connect</h3>
                    <div class="flex space-x-4">
                        <a href="https://www.linkedin.com/company/saabsa-solutions" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-[#0F3D6E] transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                        </a>
                        <a href="https://x.com/SaabsaSolutions" target="_blank" rel="noopener noreferrer" class="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-purple-600 transition-colors">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
                <p>&copy; ${new Date().getFullYear()} Saabsa Solutions. All rights reserved. | <a href="#" class="hover:text-white transition-colors">Privacy Policy</a> | <a href="#" class="hover:text-white transition-colors">Terms of Service</a></p>
            </div>
        </div>
    </footer>

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

    // Generate sitemap
    generateSitemap(posts);
    console.log(`  + sitemap.xml`);

    console.log('\nBuild complete!');
}

main().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});

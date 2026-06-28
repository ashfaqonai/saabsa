/**
 * Shared HTML fragments for Saabsa blog pages (used by build-blog.js).
 */

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${months[month - 1]} ${day}, ${year}`;
}

const BLOG_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 160" role="img" aria-labelledby="logo-title logo-desc">
    <title id="logo-title">Saabsa Solutions logo</title>
    <desc id="logo-desc">Hex-tech icon with SAABSA SOLUTIONS wordmark</desc>
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
            <line x1="30" y1="40" x2="90" y2="40"/><circle cx="30" cy="40" r="4" fill="#FFFFFF"/><circle cx="90" cy="40" r="4" fill="#FFFFFF"/>
            <line x1="30" y1="60" x2="90" y2="60"/><circle cx="30" cy="60" r="4" fill="#FFFFFF"/><circle cx="90" cy="60" r="4" fill="#FFFFFF"/>
            <line x1="30" y1="80" x2="90" y2="80"/><circle cx="30" cy="80" r="4" fill="#FFFFFF"/><circle cx="90" cy="80" r="4" fill="#FFFFFF"/>
        </g>
    </g>
    <g transform="translate(170,40)">
        <text x="0" y="45" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="700" fill="#0F3D6E" letter-spacing="1">SAABSA</text>
        <text x="0" y="90" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="600" fill="#0F3D6E" opacity="0.85" letter-spacing="2">SOLUTIONS</text>
    </g>
</svg>`;

function blogHeader(activeLink) {
    const links = [
        { href: '/index.html#about', label: 'About', id: 'about' },
        { href: '/services.html', label: 'Services', id: 'services' },
        { href: '/blog.html', label: 'Blog', id: 'blog' },
        { href: '/index.html#products', label: 'Products', id: 'products' },
    ];
    const nav = links.map(l => {
        const cls = l.id === activeLink ? 'active' : '';
        return `<a href="${l.href}" class="${cls}">${l.label}</a>`;
    }).join('\n                    ');
    return `    <header class="blog-header">
        <div class="blog-header-inner">
            <a href="/index.html" class="blog-logo" aria-label="Saabsa Solutions home">
                ${BLOG_LOGO_SVG}
            </a>
            <nav class="blog-nav" aria-label="Main">
                ${nav}
                <a href="/index.html#contact" class="blog-nav-cta">Get Started</a>
            </nav>
        </div>
    </header>`;
}

function blogFooter() {
    const year = new Date().getFullYear();
    return `    <footer class="blog-footer">
        <div class="blog-footer-inner">
            <div class="blog-footer-grid">
                <div>
                    <p class="blog-footer-brand">Saabsa Solutions</p>
                    <p class="blog-footer-tagline">Transforming Ideas into Intelligent Solutions</p>
                    <p class="blog-footer-desc">AI-powered products and custom software for organizations worldwide.</p>
                </div>
                <div>
                    <h3>Services</h3>
                    <ul>
                        <li><a href="/services.html">Custom Development</a></li>
                        <li><a href="/services.html">AI Solutions</a></li>
                        <li><a href="/services.html">Cloud Services</a></li>
                        <li><a href="/services.html">Consulting</a></li>
                    </ul>
                </div>
                <div>
                    <h3>Products</h3>
                    <ul>
                        <li><a href="/blog.html">Blog</a></li>
                        <li><a href="/index.html#patientree">Patientree AI</a></li>
                        <li><a href="https://www.dataxpipe.com/" target="_blank" rel="noopener noreferrer">DataXPipe</a></li>
                        <li><a href="https://leasexit.com/" target="_blank" rel="noopener noreferrer">Lease Exit</a></li>
                    </ul>
                </div>
                <div>
                    <h3>Connect</h3>
                    <ul>
                        <li><a href="https://www.linkedin.com/company/saabsa-solutions" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                        <li><a href="https://x.com/SaabsaSolutions" target="_blank" rel="noopener noreferrer">X (Twitter)</a></li>
                        <li><a href="/contact.html">Contact</a></li>
                    </ul>
                </div>
            </div>
            <div class="blog-footer-bottom">
                <p>&copy; ${year} Saabsa Solutions. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
            </div>
        </div>
    </footer>`;
}

function blogResourcesSection() {
    return `            <section class="blog-resources" aria-labelledby="blog-resources-heading">
                <h2 id="blog-resources-heading">Explore our resources</h2>
                <p>Products and services referenced in our articles.</p>
                <div class="blog-resource-links">
                    <a href="/index.html#patientree">Patientree AI</a>
                    <a href="https://www.dataxpipe.com/" target="_blank" rel="noopener noreferrer">DataXPipe</a>
                    <a href="https://leasexit.com/" target="_blank" rel="noopener noreferrer">Lease Exit</a>
                    <a href="/services.html">Services</a>
                    <a href="/contact.html">Contact</a>
                </div>
            </section>`;
}

function featuredImageHtml(post) {
    const url = post.imageUrl || post.imageMedium;
    if (url) {
        return `<img src="${escapeAttr(url)}" alt="${escapeAttr(post.title)}" loading="eager" />`;
    }
    return `<div class="blog-featured-image-placeholder" aria-hidden="true"></div>`;
}

function renderFeaturedPost(post) {
    if (!post) return '';
    const postUrl = `/blog/${post.slug}.html`;
    const excerpt = post.excerpt || post.title;
    return `            <article id="blogFeatured" class="blog-featured">
                <a href="${postUrl}" class="blog-featured-image">
                    ${featuredImageHtml(post)}
                </a>
                <div class="blog-featured-body">
                    <h2 class="blog-featured-title">${escapeHtml(post.title)}</h2>
                    <p class="blog-featured-excerpt">${escapeHtml(excerpt)}</p>
                    <a href="${postUrl}" class="blog-read-more">Read more</a>
                </div>
            </article>`;
}

function cardImageHtml(post) {
    const url = post.imageMedium || post.imageUrl;
    if (url) {
        return `<img src="${escapeAttr(url)}" alt="${escapeAttr(post.title)}" loading="lazy" />`;
    }
    return `<div class="blog-card-image-placeholder" aria-hidden="true"></div>`;
}

function renderCard(post) {
    const postUrl = `/blog/${post.slug}.html`;
    const dateText = post.date ? formatDateShort(post.date) : '';
    const category = post.category || 'General';
    const searchText = `${post.title} ${post.excerpt || ''} ${category}`.toLowerCase();
    return `                <article class="blog-card" data-category="${escapeAttr(category)}" data-search="${escapeAttr(searchText)}">
                    <a href="${postUrl}" class="blog-card-image">${cardImageHtml(post)}</a>
                    <div class="blog-card-body">
                        <h2 class="blog-card-title"><a href="${postUrl}">${escapeHtml(post.title)}</a></h2>
                        <p class="blog-card-date"><time datetime="${post.date || ''}">${dateText}</time></p>
                    </div>
                </article>`;
}

function renderTopicPills(categories) {
    const pills = ['<button type="button" class="blog-topic-btn active" data-topic="all">All</button>'];
    for (const cat of categories) {
        pills.push(`<button type="button" class="blog-topic-btn" data-topic="${escapeAttr(cat)}">${escapeHtml(cat)}</button>`);
    }
    return pills.join('\n                    ');
}

function generateBlogListingBlock(posts) {
    const sorted = [...posts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const featured = sorted[0] || null;
    const rest = sorted.slice(1);
    const categories = [...new Set(sorted.map(p => p.category).filter(Boolean))].sort();

    const gridHtml = rest.length
        ? rest.map(renderCard).join('\n')
        : (featured ? '' : `                <p class="blog-empty">No blog posts yet. Check back soon!</p>`);

    return `<!-- Blog Listing Start -->
            ${featured ? renderFeaturedPost(featured) : ''}

            <div class="blog-toolbar">
                <p class="blog-toolbar-label">Topics</p>
                <div id="blogTopics" class="blog-topics" role="group" aria-label="Filter by topic">
                    ${renderTopicPills(categories)}
                </div>
                <div class="blog-search-wrap">
                    <label for="blogSearch">Search articles</label>
                    <input id="blogSearch" class="blog-search" type="search" placeholder="Search articles" autocomplete="off" />
                </div>
            </div>

            <div id="blogPosts" class="blog-grid">
${gridHtml}
            </div>

            <p id="blogEmpty" class="blog-empty hidden" role="status">No articles found matching your search.</p>
<!-- Blog Listing End -->`;
}

module.exports = {
    escapeHtml,
    escapeAttr,
    formatDateShort,
    blogHeader,
    blogFooter,
    blogResourcesSection,
    generateBlogListingBlock,
    cardImageHtml,
    renderFeaturedPost,
    featuredImageHtml,
};

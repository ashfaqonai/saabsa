/**
 * Client-side blog listing: search, topic filters, Patientree-style card grid.
 */
(function () {
    'use strict';

    var activeTopic = 'all';

    function formatDateShort(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString + 'T12:00:00');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderCard(post) {
        var url = '/blog/' + post.slug + '.html';
        var category = post.category || 'General';
        var searchText = (post.title + ' ' + (post.excerpt || '') + ' ' + category).toLowerCase();
        var imgUrl = post.imageUrl || post.imageMedium || '';
        var imgHtml = imgUrl
            ? '<img src="' + escapeHtml(imgUrl) + '" alt="' + escapeHtml(post.title) + '" loading="lazy" />'
            : '<div class="blog-card-image-placeholder" aria-hidden="true"></div>';
        return (
            '<article class="blog-card" data-category="' + escapeHtml(category) + '" data-search="' + escapeHtml(searchText) + '">' +
            '<a href="' + url + '" class="blog-card-image">' + imgHtml + '</a>' +
            '<div class="blog-card-body">' +
            '<h2 class="blog-card-title"><a href="' + url + '">' + escapeHtml(post.title) + '</a></h2>' +
            '<p class="blog-card-date"><time datetime="' + (post.date || '') + '">' + formatDateShort(post.date) + '</time></p>' +
            '</div></article>'
        );
    }

    function applyFilters() {
        var query = (document.getElementById('blogSearch') || {}).value || '';
        query = query.trim().toLowerCase();
        var items = document.querySelectorAll('#blogPosts .blog-card');
        var visible = 0;
        items.forEach(function (item) {
            var cat = item.getAttribute('data-category') || '';
            var search = item.getAttribute('data-search') || '';
            var topicMatch = activeTopic === 'all' || cat === activeTopic;
            var searchMatch = !query || search.indexOf(query) !== -1;
            var show = topicMatch && searchMatch;
            item.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        var empty = document.getElementById('blogEmpty');
        if (empty) {
            empty.classList.toggle('hidden', visible > 0 || items.length === 0);
        }
    }

    function bindTopicButtons() {
        document.querySelectorAll('.blog-topic-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.blog-topic-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                activeTopic = btn.getAttribute('data-topic') || 'all';
                applyFilters();
            });
        });
    }

    function renderToolbar(categories) {
        var topicHtml = '<button type="button" class="blog-topic-btn active" data-topic="all">All</button>';
        categories.forEach(function (cat) {
            topicHtml += '<button type="button" class="blog-topic-btn" data-topic="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
        });
        return (
            '<div class="blog-toolbar">' +
            '<p class="blog-toolbar-label">Topics</p>' +
            '<div id="blogTopics" class="blog-topics" role="group" aria-label="Filter by topic">' + topicHtml + '</div>' +
            '<div class="blog-search-wrap">' +
            '<label for="blogSearch">Search articles</label>' +
            '<input id="blogSearch" class="blog-search" type="search" placeholder="Search articles" autocomplete="off" />' +
            '</div></div>'
        );
    }

    function renderFromPosts(posts) {
        if (!posts.length) return;
        posts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

        var categories = [];
        posts.forEach(function (p) {
            if (p.category && categories.indexOf(p.category) === -1) categories.push(p.category);
        });
        categories.sort();

        var gridHtml = posts.map(renderCard).join('');
        var listing = document.getElementById('blogListing');
        if (listing) {
            listing.innerHTML =
                renderToolbar(categories) +
                '<div id="blogPosts" class="blog-grid">' + gridHtml + '</div>' +
                '<p id="blogEmpty" class="blog-empty hidden" role="status">No articles found matching your search.</p>';
        }

        bindTopicButtons();
        var search = document.getElementById('blogSearch');
        if (search) search.addEventListener('input', applyFilters);
        applyFilters();
    }

    function injectBlogListJsonLd(posts) {
        var jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Saabsa Solutions Blog',
            description: 'Insights on AI software development, data engineering, and product innovation',
            url: 'https://www.saabsa.com/blog.html',
            publisher: {
                '@type': 'Organization',
                name: 'Saabsa Solutions',
                url: 'https://www.saabsa.com'
            },
            blogPost: posts.map(function (post) {
                return {
                    '@type': 'BlogPosting',
                    headline: post.title,
                    description: post.excerpt || post.title,
                    datePublished: post.date,
                    url: 'https://www.saabsa.com/blog/' + post.slug + '.html',
                    author: { '@type': 'Organization', name: 'Saabsa Solutions' },
                    articleSection: post.category || 'General'
                };
            })
        };
        var scriptTag = document.querySelector('script[type="application/ld+json"]');
        if (!scriptTag) {
            scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            document.head.appendChild(scriptTag);
        }
        scriptTag.textContent = JSON.stringify(jsonLd);
    }

    function initStaticFilters() {
        bindTopicButtons();
        var search = document.getElementById('blogSearch');
        if (search) {
            search.addEventListener('input', applyFilters);
        }
        applyFilters();
    }

    function loadBlogPosts() {
        var hasStaticGrid = document.querySelector('#blogPosts .blog-card');

        fetch('/_posts/posts.json')
            .then(function (res) {
                if (!res.ok) throw new Error('Posts not found');
                return res.json();
            })
            .then(function (data) {
                var posts = data.posts || [];
                if (!posts.length) return;

                if (hasStaticGrid) {
                    initStaticFilters();
                } else {
                    renderFromPosts(posts);
                }
                injectBlogListJsonLd(posts);
            })
            .catch(function () {
                if (hasStaticGrid) {
                    initStaticFilters();
                }
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadBlogPosts);
    } else {
        loadBlogPosts();
    }
})();

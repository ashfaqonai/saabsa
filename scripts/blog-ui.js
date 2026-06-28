/**
 * Client-side blog listing: search, topic filters, optional JSON refresh.
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

    function renderListItem(post) {
        var url = '/blog/' + post.slug + '.html';
        var category = post.category || 'General';
        var searchText = (post.title + ' ' + (post.excerpt || '') + ' ' + category).toLowerCase();
        return (
            '<article class="blog-list-item" data-category="' + escapeHtml(category) + '" data-search="' + escapeHtml(searchText) + '">' +
            '<h2><a href="' + url + '">' + escapeHtml(post.title) + '</a></h2>' +
            '<p class="blog-list-date"><time datetime="' + (post.date || '') + '">' + formatDateShort(post.date) + '</time></p>' +
            '</article>'
        );
    }

    function applyFilters() {
        var query = (document.getElementById('blogSearch') || {}).value || '';
        query = query.trim().toLowerCase();
        var items = document.querySelectorAll('#blogPosts .blog-list-item');
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

    function renderFromPosts(posts) {
        if (!posts.length) return;
        posts.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

        var featured = posts[0];
        var rest = posts.slice(1);
        var categories = [];
        posts.forEach(function (p) {
            if (p.category && categories.indexOf(p.category) === -1) categories.push(p.category);
        });
        categories.sort();

        var topicHtml = '<button type="button" class="blog-topic-btn active" data-topic="all">All</button>';
        categories.forEach(function (cat) {
            topicHtml += '<button type="button" class="blog-topic-btn" data-topic="' + escapeHtml(cat) + '">' + escapeHtml(cat) + '</button>';
        });

        var featuredUrl = '/blog/' + featured.slug + '.html';
        var featuredImg = featured.imageUrl
            ? '<img src="' + escapeHtml(featured.imageUrl) + '" alt="' + escapeHtml(featured.title) + '" loading="eager" />'
            : '<div class="blog-featured-image-placeholder" aria-hidden="true">&#128221;</div>';

        var listHtml = rest.length
            ? rest.map(renderListItem).join('')
            : '<p class="blog-empty">More articles coming soon.</p>';

        var listing = document.getElementById('blogListing');
        if (listing) {
            listing.innerHTML =
                '<article id="blogFeatured" class="blog-featured">' +
                '<a href="' + featuredUrl + '" class="blog-featured-image">' + featuredImg + '</a>' +
                '<div class="blog-featured-body">' +
                '<h2><a href="' + featuredUrl + '">' + escapeHtml(featured.title) + '</a></h2>' +
                '<p>' + escapeHtml(featured.excerpt || featured.title) + '</p>' +
                '<a href="' + featuredUrl + '" class="blog-read-more">Read more</a>' +
                '</div></article>' +
                '<div class="blog-toolbar">' +
                '<p class="blog-toolbar-label">Topics</p>' +
                '<div id="blogTopics" class="blog-topics" role="group" aria-label="Filter by topic">' + topicHtml + '</div>' +
                '<div class="blog-search-wrap">' +
                '<label for="blogSearch">Search articles</label>' +
                '<input id="blogSearch" class="blog-search" type="search" placeholder="Search by title or topic…" autocomplete="off" />' +
                '</div></div>' +
                '<div id="blogPosts" class="blog-list">' + listHtml + '</div>' +
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
        var hasStaticList = document.querySelector('#blogPosts .blog-list-item');

        fetch('/_posts/posts.json')
            .then(function (res) {
                if (!res.ok) throw new Error('Posts not found');
                return res.json();
            })
            .then(function (data) {
                var posts = data.posts || [];
                if (!posts.length) return;

                if (hasStaticList) {
                    initStaticFilters();
                } else {
                    renderFromPosts(posts);
                }
                injectBlogListJsonLd(posts);
            })
            .catch(function () {
                if (hasStaticList) {
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

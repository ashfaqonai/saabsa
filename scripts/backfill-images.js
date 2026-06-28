#!/usr/bin/env node
/** Reassign unique Pexels images to all posts, then rebuild the site. */
const { execSync } = require('child_process');
const { reassignUniqueImages } = require('./blog-images');

const { updated, total } = reassignUniqueImages({ force: true });
console.log(`Reassigned unique images for ${updated}/${total} post(s).\n`);
execSync('node scripts/build-blog.js', { stdio: 'inherit', cwd: require('path').join(__dirname, '..') });

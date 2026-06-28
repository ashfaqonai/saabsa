#!/usr/bin/env node
/** One-shot: add Pexels CDN imageUrl to all posts missing images, then rebuild. */
const { execSync } = require('child_process');
const { backfillAllPostFiles } = require('./blog-images');

const n = backfillAllPostFiles();
console.log(`Backfilled ${n} post(s). Running build-blog.js...\n`);
execSync('node scripts/build-blog.js', { stdio: 'inherit', cwd: require('path').join(__dirname, '..') });

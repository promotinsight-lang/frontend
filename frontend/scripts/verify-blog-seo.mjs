import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { blogPosts } from '../src/content/blog/generatedBlogData.js';

const distDir = path.resolve('dist');

if (!fs.existsSync(distDir)) {
  throw new Error('dist folder not found. Run npm run build before npm run seo:verify.');
}

assertFile('blog/index.html', 'blog index');

for (const post of blogPosts) {
  const relativePath = path.join('blog', post.slug, 'index.html');
  const html = assertFile(relativePath, post.title);

  assertContains(html, '<title>', `${post.slug} title element`);
  assertContains(html, '<meta name="description"', `${post.slug} meta description`);
  assertContains(html, `<link rel="canonical" href="${post.canonicalUrl}"`, `${post.slug} canonical`);
  assertContains(html, '<h1', `${post.slug} h1`);
  assertContains(html, '<article', `${post.slug} article element`);
  assertContains(html, post.contentHtml.split('\n')[0], `${post.slug} article content`);
  assertContains(html, 'content="index,follow"', `${post.slug} indexability`);
  assertContains(html, 'application/ld+json', `${post.slug} JSON-LD`);
  assertContains(html, '<meta property="og:title"', `${post.slug} Open Graph title`);
  assertContains(html, '<meta property="og:description"', `${post.slug} Open Graph description`);
  assertContains(html, `<meta property="og:url" content="${post.canonicalUrl}"`, `${post.slug} Open Graph URL`);
  assertContains(html, '<meta property="og:image"', `${post.slug} Open Graph image`);
  assertContains(html, '<meta name="twitter:card" content="summary_large_image"', `${post.slug} Twitter card`);
  assertContains(html, 'article:published_time', `${post.slug} published date metadata`);
  assert.ok(/<a\s+href="\/blog\/category\/[^"]+\/"/.test(html), `${post.slug} has crawlable category link`);
  assert.ok(/<a\s+href="\/blog\/author\/[^"]+\/"/.test(html), `${post.slug} has crawlable author link`);
  assert.ok(/<img[^>]+width="\d+"[^>]+height="\d+"/.test(html), `${post.slug} images have width and height`);
  assert.ok(/<img[^>]+loading="eager"/.test(html), `${post.slug} primary image is eager loaded`);
  assert.ok(html.includes('loading="lazy"'), `${post.slug} below-fold images are lazy-loaded`);
  assert.ok(!html.includes('<script>alert'), `${post.slug} has no executable injected script from content`);
  assertStructuredData(html, post);
}

console.log(`SEO verification passed for ${blogPosts.length} blog posts.`);

function assertFile(relativePath, label) {
  const filePath = path.join(distDir, relativePath);
  assert.ok(fs.existsSync(filePath), `${label} HTML exists at ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertContains(html, needle, label) {
  assert.ok(html.includes(needle), `${label} is present`);
}

function assertStructuredData(html, post) {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const article = scripts.find((script) => script['@type'] === 'BlogPosting' || script['@type'] === 'Article');
  const breadcrumbs = scripts.find((script) => script['@type'] === 'BreadcrumbList');

  assert.ok(article, `${post.slug} has article JSON-LD`);
  assert.ok(breadcrumbs, `${post.slug} has breadcrumb JSON-LD`);
  assert.equal(article.headline, post.title, `${post.slug} JSON-LD headline matches visible title`);
  assert.equal(article.description, post.metaDescription, `${post.slug} JSON-LD description matches metadata`);
  assert.equal(article.datePublished, post.publishedAt, `${post.slug} JSON-LD published date matches post`);
  assert.equal(article.dateModified, post.updatedAt, `${post.slug} JSON-LD modified date matches post`);
  assert.ok(/^https?:\/\//.test(article.image[0]), `${post.slug} JSON-LD image is absolute`);
  assert.ok(/^https?:\/\//.test(article.publisher.logo.url), `${post.slug} JSON-LD logo is absolute`);
  const keys = collectKeys(article);
  assert.ok(!keys.some((key) => key.toLowerCase().includes('rating')), `${post.slug} JSON-LD has no rating fields`);
  assert.ok(!keys.some((key) => key.toLowerCase() === 'review' || key.toLowerCase() === 'reviews'), `${post.slug} JSON-LD has no review fields`);
}

function collectKeys(value, keys = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, keys));
    return keys;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      keys.push(key);
      collectKeys(child, keys);
    });
  }

  return keys;
}

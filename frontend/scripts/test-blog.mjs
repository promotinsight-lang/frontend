import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  absoluteUrl,
  buildBlogDataset,
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  getSiteUrl,
  loadBlogPosts,
  renderMarkdown,
  slugify,
  validateSlug,
} from './blog-core.mjs';

const siteUrl = getSiteUrl();
const publicDataset = buildBlogDataset({ siteUrl });
const allPosts = loadBlogPosts({ includeDrafts: true, siteUrl });
const publishedPosts = publicDataset.posts;
const firstPost = publishedPosts[0];

assert.ok(publishedPosts.length >= 3, 'loads published blog posts');
assert.ok(allPosts.some((post) => post.status === 'draft'), 'loads draft posts when requested');
assert.ok(!publishedPosts.some((post) => post.status === 'draft'), 'filters drafts from public dataset');

assert.equal(slugify('Cashback Campaign Guide!'), 'cashback-campaign-guide', 'generates slugs');
assert.throws(() => validateSlug('../bad'), /Invalid slug/, 'rejects unsafe slugs');

assert.ok(firstPost.metaTitle.includes('PromotInsight') || firstPost.metaTitle.includes('|'), 'post has metadata title');
assert.equal(firstPost.canonicalUrl, absoluteUrl(firstPost.canonicalPath, siteUrl), 'canonical URL is absolute and canonical');
assert.ok(firstPost.metaDescription.length > 40, 'post has metadata description');

const articleJsonLd = createArticleJsonLd(firstPost, publicDataset.site);
assert.equal(articleJsonLd['@type'], 'BlogPosting', 'uses BlogPosting structured data');
assert.equal(articleJsonLd.headline, firstPost.title, 'structured data headline matches visible title');
assert.equal(articleJsonLd.mainEntityOfPage['@id'], firstPost.canonicalUrl, 'structured data main entity matches canonical URL');

const breadcrumbJsonLd = createBreadcrumbJsonLd([
  { name: 'Home', href: '/' },
  { name: 'Blog', href: '/blog/' },
  { name: firstPost.title, href: firstPost.canonicalPath },
], siteUrl);
assert.equal(breadcrumbJsonLd['@type'], 'BreadcrumbList', 'creates breadcrumb structured data');

const rendered = renderMarkdown(`## Safe Heading

<script>alert("xss")</script>
<iframe src="https://example.com"></iframe>
<img src=x onclick="alert(1)" onerror="alert(2)">
<object data="https://example.com"></object>
<div><strong>malformed

[bad](javascript:alert(1))
[good](/blog/)`);
assert.ok(rendered.html.includes('&lt;script&gt;'), 'escapes script tags');
assert.ok(rendered.html.includes('&lt;iframe'), 'escapes iframe tags');
assert.ok(rendered.html.includes('onclick=&quot;alert(1)&quot;'), 'escapes event handlers as text');
assert.ok(rendered.html.includes('&lt;object'), 'escapes embedded objects');
assert.ok(!rendered.html.includes('<script>'), 'does not render executable script tags');
assert.ok(!rendered.html.includes('<iframe'), 'does not render iframe tags');
assert.ok(!/<[a-z][^>]*\son[a-z]+\s*=/i.test(rendered.html), 'does not render event handler attributes on HTML tags');
assert.ok(!rendered.html.includes('<object'), 'does not render embedded objects');
assert.ok(rendered.html.includes('href="#"'), 'blocks unsafe links');
assert.ok(rendered.html.includes('href="/blog/"'), 'allows safe internal links');
assert.ok(rendered.headings.some((heading) => heading.id === 'safe-heading'), 'generates table of contents headings');

const sitemapPath = 'public/sitemap.xml';
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(sitemap.includes('<loc>https://promotinsight.com/blog/</loc>') || sitemap.includes(`${siteUrl}/blog/`), 'sitemap includes blog index');
  assert.ok(sitemap.includes(firstPost.canonicalUrl), 'sitemap includes published post');
  assert.ok(sitemap.includes(`<lastmod>${firstPost.updatedAt}</lastmod>`), 'sitemap uses real updatedAt for lastmod');
  assert.ok(!sitemap.includes('/internal-campaign-measurement/'), 'sitemap excludes draft posts');
  assert.ok(!sitemap.includes('/login'), 'sitemap excludes auth routes');
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.ok(sitemapUrls.every((url) => !url.includes('?')), 'sitemap excludes query-string URLs');
  assert.doesNotThrow(() => parseSimpleXml(sitemap), 'sitemap is parseable XML');
}

const robotsPath = 'public/robots.txt';
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  assert.ok(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), 'robots points to absolute sitemap URL');
}

const rssPath = 'public/rss.xml';
if (fs.existsSync(rssPath)) {
  const rss = fs.readFileSync(rssPath, 'utf8');
  assert.ok(rss.includes(firstPost.canonicalUrl), 'RSS includes published post URL');
  assert.ok(rss.includes(new Date(firstPost.publishedAt).toUTCString()), 'RSS includes published date');
  assert.ok(rss.includes(firstPost.excerpt), 'RSS includes description');
  assert.ok(!rss.includes('/internal-campaign-measurement/'), 'RSS excludes draft posts');
  assert.doesNotThrow(() => parseSimpleXml(rss), 'RSS is parseable XML');
}

const jsonLdKeys = collectKeys(articleJsonLd);
assert.ok(!jsonLdKeys.some((key) => key.toLowerCase().includes('rating')), 'structured data has no fake ratings');
assert.ok(!jsonLdKeys.some((key) => key.toLowerCase() === 'review' || key.toLowerCase() === 'reviews'), 'structured data has no fake reviews');
assert.ok(/^https?:\/\//.test(articleJsonLd.image[0]), 'structured data image URL is absolute');
assert.ok(/^https?:\/\//.test(articleJsonLd.publisher.logo.url), 'publisher logo URL is absolute');
assert.ok(!Number.isNaN(Date.parse(articleJsonLd.datePublished)), 'datePublished is valid ISO 8601');
assert.ok(!Number.isNaN(Date.parse(articleJsonLd.dateModified)), 'dateModified is valid ISO 8601');

assert.equal(publishedPosts.find((post) => post.slug === 'missing-post'), undefined, 'nonexistent posts resolve as missing');
assert.equal(publishedPosts.find((post) => post.slug === 'internal-campaign-measurement'), undefined, 'draft posts resolve as missing publicly');

console.log('Blog tests passed.');

function parseSimpleXml(xml) {
  const stack = [];
  const tags = xml.match(/<\/?[A-Za-z0-9:_-]+(?:\s[^>]*)?>/g) || [];
  for (const tag of tags) {
    if (tag.startsWith('<?') || tag.endsWith('/>')) continue;
    if (tag.startsWith('</')) {
      const name = tag.slice(2, -1).trim();
      const open = stack.pop();
      if (open !== name) throw new Error(`XML close tag mismatch: ${open} !== ${name}`);
    } else {
      stack.push(tag.slice(1).split(/\s|>/)[0]);
    }
  }
  if (stack.length > 0) throw new Error(`Unclosed XML tag: ${stack.at(-1)}`);
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

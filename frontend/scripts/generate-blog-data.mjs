import fs from 'node:fs';
import path from 'node:path';
import {
  absoluteUrl,
  buildBlogDataset,
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  ensureTrailingSlash,
  escapeHtml,
  getAuthors,
  getCategories,
  getSiteUrl,
  sortPosts,
  toPostSummary,
} from './blog-core.mjs';

loadBuildEnv();

const outFile = path.resolve('src/content/blog/generatedBlogData.js');
const publicDir = path.resolve('public');
const siteUrl = getSiteUrl();
const dataset = await getBlogDataset();

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

writeGeneratedModule();
writeSitemap();
writeRobots();
writeRss();
writeRedirects();

console.log(`Generated ${dataset.posts.length} published blog posts.`);

function loadBuildEnv() {
  const envValues = {};
  const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local'];

  for (const envFile of envFiles) {
    const envPath = path.resolve(envFile);
    if (!fs.existsSync(envPath)) continue;

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separator = line.indexOf('=');
      if (separator === -1) continue;

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
      if (key) envValues[key] = value;
    }
  }

  for (const [key, value] of Object.entries(envValues)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function getBlogDataset() {
  if (process.env.BLOG_CONTENT_SOURCE !== 'api') {
    return buildBlogDataset({ siteUrl });
  }

  const apiBase = String(process.env.BLOG_API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
  if (!apiBase) {
    throw new Error('BLOG_CONTENT_SOURCE=api requires BLOG_API_BASE_URL or VITE_API_BASE_URL.');
  }

  const response = await fetch(`${apiBase}/api/blogs/public`);
  if (!response.ok) {
    throw new Error(`Failed to load backend blog posts: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (!payload.success || !Array.isArray(payload.data)) {
    throw new Error('Backend blog API returned an unexpected response.');
  }

  const posts = sortPosts(payload.data.map((row) => normalizeBackendPost(row, siteUrl)));
  const postSummaries = posts.map(toPostSummary);

  return {
    site: {
      name: 'PromotInsight',
      url: siteUrl,
      logo: absoluteUrl('/favicon.svg', siteUrl),
      language: 'en',
      blogPath: '/blog/',
    },
    posts: posts.map((post, index) => ({
      ...post,
      previousPost: posts[index + 1] ? toPostSummary(posts[index + 1]) : null,
      nextPost: posts[index - 1] ? toPostSummary(posts[index - 1]) : null,
      relatedPosts: post.relatedPostIds
        .map((relatedId) => posts.find((candidate) => String(candidate.id) === String(relatedId) || candidate.slug === relatedId))
        .filter(Boolean)
        .filter((candidate) => candidate.slug !== post.slug)
        .slice(0, 3)
        .map(toPostSummary),
    })),
    postSummaries,
    categories: getCategories(posts),
    authors: getAuthors(posts),
  };
}

function normalizeBackendPost(row, currentSiteUrl) {
  const slug = row.slug;
  const decoratedContent = addHeadingIds(row.content || '');
  const contentHtml = decoratedContent.html;
  const textContent = stripHtml(contentHtml);
  const categoryName = row.category || 'General';
  const authorName = row.author_name || 'Admin';
  const publishedAt = new Date(row.published_at || row.created_at || Date.now()).toISOString();
  const updatedAt = new Date(row.updated_at || row.published_at || row.created_at || Date.now()).toISOString();
  const canonicalPath = `/blog/${slug}/`;

  return {
    id: String(row.id || slug),
    title: row.title || '',
    slug,
    excerpt: row.excerpt || textContent.slice(0, 155),
    content: contentHtml,
    contentHtml,
    headings: decoratedContent.headings,
    metaTitle: row.meta_title || row.title || '',
    metaDescription: row.meta_description || row.excerpt || textContent.slice(0, 155),
    primaryKeyword: row.primary_keyword || '',
    category: {
      slug: row.category_slug || slugifyLocal(categoryName) || 'general',
      name: categoryName,
      description: '',
    },
    author: {
      slug: row.author_slug || slugifyLocal(authorName) || 'admin',
      name: authorName,
      title: row.author_title || 'Editorial Team',
      bio: row.author_bio || 'Practical guidance from the PromotInsight team.',
      avatar: '',
    },
    featuredImage: row.image_url || '/blog/images/default-blog.svg',
    featuredImageWebp: '',
    featuredImageAvif: '',
    featuredImageAlt: row.featured_image_alt || row.title || '',
    featuredImageWidth: Number(row.featured_image_width || 1200),
    featuredImageHeight: Number(row.featured_image_height || 630),
    canonicalUrl: row.canonical_url || absoluteUrl(canonicalPath, currentSiteUrl),
    canonicalPath,
    publishedAt,
    updatedAt,
    status: 'published',
    relatedPostIds: Array.isArray(row.related_post_ids) ? row.related_post_ids.map(String) : [],
    createdAt: new Date(row.created_at || publishedAt).toISOString(),
    readingTime: Math.max(1, Math.ceil(textContent.split(/\s+/).filter(Boolean).length / 220)),
    sourceFile: 'backend-api',
  };
}

function addHeadingIds(html) {
  const headings = [];
  const seen = new Set();
  const decoratedHtml = String(html || '').replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attributes, innerHtml) => {
    const text = stripHtml(innerHtml).trim();
    const baseId = slugifyLocal(text) || 'section';
    let id = baseId;
    let suffix = 2;
    while (seen.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    headings.push({ id, text, level: Number(level) });

    const cleanAttributes = String(attributes || '').replace(/\s+id=(["']).*?\1/i, '');
    return `<h${level}${cleanAttributes} id="${id}">${innerHtml}</h${level}>`;
  });

  return { html: decoratedHtml, headings };
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugifyLocal(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function writeGeneratedModule() {
  const payload = JSON.stringify(dataset, null, 2).replace(/</g, '\\u003c');
  fs.writeFileSync(
    outFile,
    `/* This file is generated by scripts/generate-blog-data.mjs. Do not edit by hand. */\n\nexport const blogData = ${payload};\n\nexport const blogPosts = blogData.posts;\nexport const blogPostSummaries = blogData.postSummaries;\nexport const blogCategories = blogData.categories;\nexport const blogAuthors = blogData.authors;\nexport const blogSite = blogData.site;\n`,
    'utf8',
  );
}

function writeSitemap() {
  const staticRoutes = ['/', '/terms/', '/privacy/', '/support/', '/blog/'];
  const newestPostDate = dataset.posts[0]?.updatedAt || new Date().toISOString();

  const urls = [
    ...staticRoutes.map((route) => ({ loc: absoluteUrl(route, siteUrl), lastmod: newestPostDate })),
    ...dataset.posts.map((post) => ({ loc: post.canonicalUrl, lastmod: post.updatedAt })),
    ...dataset.categories.map((category) => ({
      loc: absoluteUrl(`/blog/category/${category.slug}/`, siteUrl),
      lastmod: category.updatedAt,
    })),
    ...dataset.authors.map((author) => ({
      loc: absoluteUrl(`/blog/author/${author.slug}/`, siteUrl),
      lastmod: author.updatedAt,
    })),
  ];

  const body = urls.map((url) => [
    '  <url>',
    `    <loc>${escapeHtml(url.loc)}</loc>`,
    `    <lastmod>${new Date(url.lastmod).toISOString()}</lastmod>`,
    '  </url>',
  ].join('\n')).join('\n');

  fs.writeFileSync(
    path.join(publicDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    'utf8',
  );
}

function writeRobots() {
  fs.writeFileSync(
    path.join(publicDir, 'robots.txt'),
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /dashboard',
      'Disallow: /login',
      'Disallow: /register',
      'Disallow: /login-form',
      'Disallow: /register-form',
      'Disallow: /reset-password',
      'Disallow: /forgot-password',
      'Disallow: /verification',
      `Sitemap: ${absoluteUrl('/sitemap.xml', siteUrl)}`,
      '',
    ].join('\n'),
    'utf8',
  );
}

function writeRss() {
  const items = dataset.posts.map((post) => [
    '    <item>',
    `      <title>${escapeHtml(post.title)}</title>`,
    `      <link>${escapeHtml(post.canonicalUrl)}</link>`,
    `      <guid>${escapeHtml(post.canonicalUrl)}</guid>`,
    `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`,
    `      <description>${escapeHtml(post.excerpt)}</description>`,
    '    </item>',
  ].join('\n')).join('\n');

  fs.writeFileSync(
    path.join(publicDir, 'rss.xml'),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss version="2.0">',
      '  <channel>',
      `    <title>${escapeHtml(dataset.site.name)} Blog</title>`,
      `    <link>${escapeHtml(absoluteUrl('/blog/', siteUrl))}</link>`,
      '    <description>Guides and updates from PromotInsight.</description>',
      `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
      items,
      '  </channel>',
      '</rss>',
      '',
    ].join('\n'),
    'utf8',
  );
}

function writeRedirects() {
  const lines = [
    '/blogs /blog/ 301!',
    '/blogs/:slug /blog/:slug/ 301!',
    '/blog /blog/ 301!',
    '/blog/:slug /blog/:slug/ 301!',
    '/blog/category/:slug /blog/category/:slug/ 301!',
    '/blog/author/:slug /blog/author/:slug/ 301!',
  ];

  fs.writeFileSync(path.join(publicDir, '_redirects'), `${lines.join('\n')}\n`, 'utf8');
}

export function getGeneratedSeoPayload(post) {
  return {
    articleJsonLd: createArticleJsonLd(post, dataset.site),
    breadcrumbJsonLd: createBreadcrumbJsonLd([
      { name: 'Home', href: '/' },
      { name: 'Blog', href: ensureTrailingSlash(dataset.site.blogPath) },
      { name: post.category.name, href: `/blog/category/${post.category.slug}/` },
      { name: post.title, href: post.canonicalPath },
    ], siteUrl),
  };
}

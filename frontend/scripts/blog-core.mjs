import fs from 'node:fs';
import path from 'node:path';

export const BLOG_CONTENT_DIR = path.resolve('src/content/blog');
export const DEFAULT_SITE_URL = 'https://promotinsight.com';
export const DEFAULT_PUBLISHER = 'PromotInsight';
export const DEFAULT_LOGO = '/favicon.svg';
export const POSTS_PER_PAGE = 6;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getSiteUrl() {
  return trimTrailingSlash(process.env.VITE_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL);
}

export function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

export function ensureTrailingSlash(value) {
  if (value === '/') return '/';
  return `${String(value || '').replace(/\/+$/, '')}/`;
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function validateSlug(slug, label = 'slug') {
  if (!slugPattern.test(slug)) {
    throw new Error(`Invalid ${label}: "${slug}". Use lowercase letters, numbers, and single hyphens.`);
  }
  return slug;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

export function absoluteUrl(url, siteUrl = getSiteUrl()) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${trimTrailingSlash(siteUrl)}/${String(url).replace(/^\/+/, '')}`;
}

export function parseFrontmatter(markdown) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/m.exec(markdown);
  if (!match) {
    throw new Error('Blog post is missing frontmatter.');
  }

  const data = {};
  const lines = match[1].split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    data[key] = parseFrontmatterValue(rawValue);
  }

  return { data, content: match[2].trim() };
}

function parseFrontmatterValue(value) {
  if (value === '') return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  if (value.startsWith('[') || value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value.replace(/^["']|["']$/g, '');
}

export function renderMarkdown(markdown) {
  const headings = [];
  const htmlParts = [];
  const lines = String(markdown || '').split(/\r?\n/);
  let paragraph = [];
  let list = null;
  let codeBlock = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    htmlParts.push(`<p>${renderInlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    htmlParts.push(`<${list.type}>${list.items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')}</${list.type}>`);
    list = null;
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      if (codeBlock) {
        htmlParts.push(`<pre><code>${escapeHtml(codeBlock.lines.join('\n'))}</code></pre>`);
        codeBlock = null;
      } else {
        flushParagraph();
        flushList();
        codeBlock = { lines: [] };
      }
      return;
    }

    if (codeBlock) {
      codeBlock.lines.push(line);
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = stripMarkdown(headingMatch[2]);
      const id = uniqueHeadingId(slugify(text), headings);
      headings.push({ id, text, level });
      htmlParts.push(`<h${level} id="${id}">${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (unordered || ordered) {
      flushParagraph();
      const type = unordered ? 'ul' : 'ol';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((unordered || ordered)[1]);
      return;
    }

    const quote = /^>\s+(.+)$/.exec(trimmed);
    if (quote) {
      flushParagraph();
      flushList();
      htmlParts.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`);
      return;
    }

    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  if (codeBlock) {
    htmlParts.push(`<pre><code>${escapeHtml(codeBlock.lines.join('\n'))}</code></pre>`);
  }

  return { html: htmlParts.join('\n'), headings };
}

function uniqueHeadingId(base, headings) {
  const safeBase = base || 'section';
  const existing = new Set(headings.map((heading) => heading.id));
  let id = safeBase;
  let index = 2;

  while (existing.has(id)) {
    id = `${safeBase}-${index}`;
    index += 1;
  }

  return id;
}

function renderInlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = sanitizeHref(href);
    return `<a href="${escapeAttribute(safeHref)}">${label}</a>`;
  });
  return html;
}

function sanitizeHref(href) {
  const normalized = String(href || '').trim();
  if (/^(https?:\/\/|mailto:|\/)/i.test(normalized)) return normalized;
  return '#';
}

function stripMarkdown(value) {
  return String(value || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`#]/g, '')
    .trim();
}

export function estimateReadingTime(markdown) {
  const words = stripMarkdown(markdown).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function normalizePost(raw, markdown, filePath, siteUrl = getSiteUrl()) {
  const id = String(raw.id || slugify(raw.title));
  const slug = validateSlug(raw.slug ? String(raw.slug) : slugify(raw.title));
  const categorySlug = validateSlug(raw.categorySlug ? String(raw.categorySlug) : slugify(raw.category || 'guides'), 'categorySlug');
  const authorSlug = validateSlug(raw.authorSlug ? String(raw.authorSlug) : slugify(raw.author || 'promotinsight-team'), 'authorSlug');
  const rendered = renderMarkdown(markdown);
  const publishedAt = new Date(raw.publishedAt || raw.createdAt || Date.now()).toISOString();
  const updatedAt = new Date(raw.updatedAt || raw.publishedAt || raw.createdAt || Date.now()).toISOString();
  const createdAt = new Date(raw.createdAt || raw.publishedAt || Date.now()).toISOString();
  const canonicalPath = `/blog/${slug}/`;
  const canonicalUrl = raw.canonicalUrl || absoluteUrl(canonicalPath, siteUrl);
  const featuredImage = raw.featuredImage || '/blog/images/default-blog.svg';

  return {
    id,
    title: String(raw.title || ''),
    slug,
    excerpt: String(raw.excerpt || ''),
    content: markdown,
    contentHtml: rendered.html,
    headings: rendered.headings,
    metaTitle: String(raw.metaTitle || raw.title || ''),
    metaDescription: String(raw.metaDescription || raw.excerpt || ''),
    primaryKeyword: String(raw.primaryKeyword || ''),
    category: {
      slug: categorySlug,
      name: String(raw.categoryName || raw.category || categorySlug),
      description: String(raw.categoryDescription || ''),
    },
    author: {
      slug: authorSlug,
      name: String(raw.authorName || raw.author || DEFAULT_PUBLISHER),
      title: String(raw.authorTitle || 'Editorial Team'),
      bio: String(raw.authorBio || 'Practical guidance from the PromotInsight team.'),
      avatar: String(raw.authorAvatar || ''),
    },
    featuredImage,
    featuredImageWebp: raw.featuredImageWebp || '',
    featuredImageAvif: raw.featuredImageAvif || '',
    featuredImageAlt: String(raw.featuredImageAlt || raw.title || ''),
    featuredImageWidth: Number(raw.featuredImageWidth || 1200),
    featuredImageHeight: Number(raw.featuredImageHeight || 630),
    canonicalUrl,
    canonicalPath,
    publishedAt,
    updatedAt,
    status: raw.status === 'draft' ? 'draft' : 'published',
    relatedPostIds: Array.isArray(raw.relatedPostIds) ? raw.relatedPostIds.map(String) : [],
    createdAt,
    readingTime: estimateReadingTime(markdown),
    sourceFile: path.relative(process.cwd(), filePath).replace(/\\/g, '/'),
  };
}

export function loadBlogPosts({ includeDrafts = false, contentDir = BLOG_CONTENT_DIR, siteUrl = getSiteUrl() } = {}) {
  if (!fs.existsSync(contentDir)) return [];

  const files = fs.readdirSync(contentDir)
    .filter((file) => file.endsWith('.md'))
    .sort();

  const posts = files.map((file) => {
    const filePath = path.join(contentDir, file);
    const parsed = parseFrontmatter(fs.readFileSync(filePath, 'utf8'));
    return normalizePost(parsed.data, parsed.content, filePath, siteUrl);
  });

  const seen = new Set();
  posts.forEach((post) => {
    if (seen.has(post.slug)) throw new Error(`Duplicate blog slug: ${post.slug}`);
    seen.add(post.slug);
  });

  const withRelationships = attachRelationships(posts);
  const filtered = includeDrafts ? withRelationships : withRelationships.filter((post) => post.status === 'published');

  return sortPosts(filtered);
}

export function sortPosts(posts) {
  return [...posts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export function attachRelationships(posts) {
  const sorted = sortPosts(posts);
  return sorted.map((post, index) => {
    const related = post.relatedPostIds
      .map((relatedId) => sorted.find((candidate) => candidate.id === relatedId || candidate.slug === relatedId))
      .filter(Boolean)
      .filter((candidate) => candidate.status === 'published' && candidate.slug !== post.slug)
      .slice(0, 3)
      .map(toPostSummary);

    return {
      ...post,
      previousPost: sorted[index + 1] ? toPostSummary(sorted[index + 1]) : null,
      nextPost: sorted[index - 1] ? toPostSummary(sorted[index - 1]) : null,
      relatedPosts: related,
    };
  });
}

export function toPostSummary(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    category: post.category,
    author: post.author,
    featuredImage: post.featuredImage,
    featuredImageAlt: post.featuredImageAlt,
    featuredImageWidth: post.featuredImageWidth,
    featuredImageHeight: post.featuredImageHeight,
    canonicalPath: post.canonicalPath,
    canonicalUrl: post.canonicalUrl,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    readingTime: post.readingTime,
  };
}

export function getCategories(posts) {
  const map = new Map();
  posts.forEach((post) => {
    const current = map.get(post.category.slug) || { ...post.category, count: 0, updatedAt: post.updatedAt };
    current.count += 1;
    if (new Date(post.updatedAt) > new Date(current.updatedAt)) current.updatedAt = post.updatedAt;
    map.set(post.category.slug, current);
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getAuthors(posts) {
  const map = new Map();
  posts.forEach((post) => {
    const current = map.get(post.author.slug) || { ...post.author, count: 0, updatedAt: post.updatedAt };
    current.count += 1;
    if (new Date(post.updatedAt) > new Date(current.updatedAt)) current.updatedAt = post.updatedAt;
    map.set(post.author.slug, current);
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildBlogDataset({ includeDrafts = false, siteUrl = getSiteUrl() } = {}) {
  const posts = loadBlogPosts({ includeDrafts, siteUrl });
  return {
    site: {
      name: DEFAULT_PUBLISHER,
      url: siteUrl,
      logo: absoluteUrl(DEFAULT_LOGO, siteUrl),
      language: 'en',
      blogPath: '/blog/',
    },
    posts,
    postSummaries: posts.map(toPostSummary),
    categories: getCategories(posts),
    authors: getAuthors(posts),
  };
}

export function createArticleJsonLd(post, site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: [absoluteUrl(post.featuredImage, site.url)],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: absoluteUrl(`/blog/author/${post.author.slug}/`, site.url),
    },
    publisher: {
      '@type': 'Organization',
      name: site.name,
      logo: {
        '@type': 'ImageObject',
        url: site.logo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonicalUrl,
    },
  };
}

export function createBreadcrumbJsonLd(items, siteUrl = getSiteUrl()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href, siteUrl),
    })),
  };
}

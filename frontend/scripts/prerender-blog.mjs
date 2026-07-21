import fs from 'node:fs';
import path from 'node:path';
import {
  absoluteUrl,
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  ensureTrailingSlash,
  escapeAttribute,
  escapeHtml,
  getSiteUrl,
} from './blog-core.mjs';
import { blogAuthors, blogCategories, blogPostSummaries, blogPosts, blogSite } from '../src/content/blog/generatedBlogData.js';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const siteUrl = getSiteUrl();

if (!fs.existsSync(indexPath)) {
  throw new Error('dist/index.html not found. Run vite build before prerendering blog routes.');
}

const shell = fs.readFileSync(indexPath, 'utf8');

writePage('/blog/', renderBlogIndex());

for (const category of blogCategories) {
  const posts = blogPostSummaries.filter((post) => post.category.slug === category.slug);
  writePage(`/blog/category/${category.slug}/`, renderListing({
    title: `${category.name} Articles`,
    description: category.description || `Published PromotInsight articles in ${category.name}.`,
    canonicalPath: `/blog/category/${category.slug}/`,
    posts,
    activeCategory: category.slug,
  }));
}

for (const author of blogAuthors) {
  const posts = blogPostSummaries.filter((post) => post.author.slug === author.slug);
  writePage(`/blog/author/${author.slug}/`, renderListing({
    title: `Articles by ${author.name}`,
    description: author.bio || `Published PromotInsight articles by ${author.name}.`,
    canonicalPath: `/blog/author/${author.slug}/`,
    posts,
    activeAuthor: author.slug,
  }));
}

for (const post of blogPosts) {
  writePage(post.canonicalPath, renderPost(post));
}

console.log(`Prerendered ${blogPosts.length + blogCategories.length + blogAuthors.length + 1} blog HTML routes.`);

function writePage(route, page) {
  const targetDir = path.join(distDir, route.replace(/^\/|\/$/g, ''));
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'index.html'), injectPage(page), 'utf8');
}

function injectPage({ head, body }) {
  return shell
    .replace(/<html([^>]*)>/, '<html$1 lang="en">')
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace('</head>', `${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function renderHead({ title, description, canonicalPath, image = '', type = 'website', jsonLd = [], noindex = false, article = null }) {
  const canonical = absoluteUrl(canonicalPath, siteUrl);
  const imageUrl = image ? absoluteUrl(image, siteUrl) : absoluteUrl(blogPostSummaries[0]?.featuredImage || '/favicon.svg', siteUrl);
  const tags = [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeAttribute(description)}" />`,
    `    <link rel="canonical" href="${escapeAttribute(canonical)}" />`,
    `    <meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}" />`,
    '    <meta property="og:locale" content="en_US" />',
    `    <meta property="og:type" content="${escapeAttribute(type)}" />`,
    `    <meta property="og:title" content="${escapeAttribute(title)}" />`,
    `    <meta property="og:description" content="${escapeAttribute(description)}" />`,
    `    <meta property="og:url" content="${escapeAttribute(canonical)}" />`,
    `    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />`,
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapeAttribute(title)}" />`,
    `    <meta name="twitter:description" content="${escapeAttribute(description)}" />`,
    `    <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />`,
  ];

  if (article) {
    tags.push(
      `    <meta property="article:published_time" content="${escapeAttribute(article.publishedAt)}" />`,
      `    <meta property="article:modified_time" content="${escapeAttribute(article.updatedAt)}" />`,
      `    <meta property="article:author" content="${escapeAttribute(article.author.name)}" />`,
      `    <meta property="article:section" content="${escapeAttribute(article.category.name)}" />`,
    );
  }

  for (const data of jsonLd) {
    tags.push(`    <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);
  }

  return tags.join('\n');
}

function renderBlogIndex() {
  return renderListing({
    title: 'PromotInsight Blog',
    description: 'Guides and updates for running clearer cashback campaigns, improving product promotion results, and helping buyers submit better proof.',
    canonicalPath: '/blog/',
    posts: blogPostSummaries,
  });
}

function renderListing({ title, description, canonicalPath, posts, activeCategory = '', activeAuthor = '' }) {
  const featured = blogPostSummaries[0];
  const head = renderHead({
    title: `${title} | PromotInsight`,
    description,
    canonicalPath,
    image: featured?.featuredImage,
  });

  const body = pageShell(`
    <main class="flex-1">
      <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto max-w-7xl px-4 py-12 md:py-16">
          ${renderBreadcrumb([{ name: 'Home', href: '/' }, { name: 'Blog', href: '/blog/' }])}
          <div class="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 class="max-w-3xl text-4xl font-black leading-tight text-slate-950 md:text-5xl">${escapeHtml(title)}</h1>
              <p class="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">${escapeHtml(description)}</p>
            </div>
            <form role="search" class="relative">
              <label for="blog-search" class="sr-only">Search blog articles</label>
              <input id="blog-search" type="search" placeholder="Search guides" class="h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm" />
            </form>
          </div>
        </div>
      </header>
      <section class="mx-auto max-w-7xl px-4 py-8" aria-label="Blog categories">
        <div class="flex gap-2 overflow-x-auto pb-2">
          <a href="/blog/" class="shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${!activeCategory && !activeAuthor ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700'}">All articles</a>
          ${blogCategories.map((category) => `<a href="/blog/category/${category.slug}/" class="shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${category.slug === activeCategory ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700'}">${escapeHtml(category.name)}</a>`).join('')}
        </div>
      </section>
      ${!activeCategory && !activeAuthor && featured ? renderFeatured(featured) : ''}
      <section class="mx-auto max-w-7xl px-4 pb-16" aria-labelledby="recent-posts">
        <h2 id="recent-posts" class="text-2xl font-black text-slate-950">Recent posts</h2>
        <p class="mt-1 text-sm text-slate-600">${posts.length} article${posts.length === 1 ? '' : 's'} available</p>
        ${posts.length > 0 ? `<div class="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">${posts.map((post, index) => renderCard(post, index === 0)).join('')}</div>` : renderEmptyState()}
      </section>
    </main>
  `);

  return { head, body };
}

function renderPost(post) {
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: 'Blog', href: '/blog/' },
    { name: post.category.name, href: `/blog/category/${post.category.slug}/` },
    { name: post.title, href: post.canonicalPath },
  ];
  const articleJsonLd = createArticleJsonLd(post, blogSite);
  const breadcrumbJsonLd = createBreadcrumbJsonLd(breadcrumbItems, siteUrl);
  const head = renderHead({
    title: post.metaTitle,
    description: post.metaDescription,
    canonicalPath: post.canonicalPath,
    image: post.featuredImage,
    type: 'article',
    article: post,
    jsonLd: [articleJsonLd, breadcrumbJsonLd],
  });
  const showUpdatedDate = new Date(post.updatedAt).toDateString() !== new Date(post.publishedAt).toDateString();

  const body = pageShell(`
    <main class="flex-1">
      <article class="mx-auto max-w-7xl px-4 py-8 md:py-12">
        ${renderBreadcrumb(breadcrumbItems)}
        <header class="mx-auto max-w-4xl text-center">
          <a href="/blog/category/${post.category.slug}/" class="text-sm font-black uppercase tracking-wide text-emerald-700">${escapeHtml(post.category.name)}</a>
          <h1 class="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">${escapeHtml(post.title)}</h1>
          <p class="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">${escapeHtml(post.excerpt)}</p>
          <div class="mt-7 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-slate-500">
            <a href="/blog/author/${post.author.slug}/">${escapeHtml(post.author.name)}</a>
            <time datetime="${escapeAttribute(post.publishedAt)}">Published ${formatDate(post.publishedAt)}</time>
            ${showUpdatedDate ? `<time datetime="${escapeAttribute(post.updatedAt)}">Updated ${formatDate(post.updatedAt)}</time>` : ''}
            <span>${post.readingTime} min read</span>
          </div>
        </header>
        <figure class="mx-auto mt-10 max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <img src="${escapeAttribute(post.featuredImage)}" alt="${escapeAttribute(post.featuredImageAlt)}" width="${post.featuredImageWidth}" height="${post.featuredImageHeight}" loading="eager" class="h-auto w-full object-cover" />
        </figure>
        <div class="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[240px_1fr]">
          <aside class="lg:sticky lg:top-24 lg:self-start" aria-label="Article sidebar">
            ${renderToc(post)}
            ${renderShare(post)}
          </aside>
          <div>
            <section class="blog-prose rounded-lg border border-slate-200 bg-white p-6 text-slate-700 shadow-sm md:p-10">${post.contentHtml}</section>
            ${renderAuthorBox(post)}
            ${renderCta()}
            ${renderPrevNext(post)}
          </div>
        </div>
        ${post.relatedPosts.length > 0 ? `<section class="mx-auto mt-14 max-w-7xl" aria-labelledby="related-articles"><h2 id="related-articles" class="text-2xl font-black text-slate-950">Related articles</h2><div class="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">${post.relatedPosts.map((related) => renderCard(related)).join('')}</div></section>` : ''}
      </article>
    </main>
  `);

  return { head, body };
}

function pageShell(content) {
  return `<div class="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">${renderStaticNav()}${content}${renderStaticFooter()}</div>`;
}

function renderStaticNav() {
  return `
    <nav class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 text-slate-800 shadow-sm">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <a href="/" class="text-xl font-black tracking-tight text-slate-950">Promot<span class="text-emerald-500">Insight</span></a>
        <div class="flex items-center gap-4 text-sm font-black">
          <a href="/" class="text-slate-600">Home</a>
          <a href="/blog/" class="text-emerald-700">Blog</a>
          <a href="/login" class="text-slate-600">Login</a>
        </div>
      </div>
    </nav>
  `;
}

function renderStaticFooter() {
  return `
    <footer class="mt-auto bg-slate-950 py-10 text-slate-300">
      <div class="mx-auto max-w-7xl px-4">
        <div class="text-xl font-black text-white">PromotInsight</div>
        <div class="mt-4 flex flex-wrap gap-5 text-sm font-bold">
          <a href="/terms/">Terms</a>
          <a href="/privacy/">Privacy</a>
          <a href="/support/">Support</a>
          <a href="/rss.xml">RSS</a>
        </div>
      </div>
    </footer>
  `;
}

function renderBreadcrumb(items) {
  return `
    <nav aria-label="Breadcrumb" class="mb-8 text-sm font-semibold text-slate-500">
      <ol class="flex flex-wrap items-center gap-2">
        ${items.map((item, index) => `<li ${index === items.length - 1 ? 'aria-current="page" class="text-slate-700"' : ''}>${index === items.length - 1 ? escapeHtml(item.name) : `<a href="${escapeAttribute(item.href)}" class="hover:text-emerald-700">${escapeHtml(item.name)}</a>`}</li>${index < items.length - 1 ? '<li aria-hidden="true">/</li>' : ''}`).join('')}
      </ol>
    </nav>
  `;
}

function renderFeatured(post) {
  return `
    <section class="mx-auto max-w-7xl px-4 pb-10" aria-labelledby="featured-article">
      <div class="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
        <img src="${escapeAttribute(post.featuredImage)}" alt="${escapeAttribute(post.featuredImageAlt)}" width="${post.featuredImageWidth}" height="${post.featuredImageHeight}" loading="eager" class="h-full w-full object-cover" />
        <div class="p-6 md:p-8 lg:p-10">
          <a href="/blog/category/${post.category.slug}/" class="text-sm font-black uppercase tracking-wide text-emerald-700">Featured in ${escapeHtml(post.category.name)}</a>
          <h2 id="featured-article" class="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl"><a href="${escapeAttribute(post.canonicalPath)}">${escapeHtml(post.title)}</a></h2>
          <p class="mt-4 text-base leading-7 text-slate-600">${escapeHtml(post.excerpt)}</p>
          <div class="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
            <a href="/blog/author/${post.author.slug}/">${escapeHtml(post.author.name)}</a>
            <span>${post.readingTime} min read</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCard(post, priority = false) {
  return `
    <article class="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <a href="${escapeAttribute(post.canonicalPath)}" class="block">
        <div class="aspect-[40/21] w-full overflow-hidden bg-slate-100">
          <img src="${escapeAttribute(post.featuredImage)}" alt="${escapeAttribute(post.featuredImageAlt)}" width="${post.featuredImageWidth}" height="${post.featuredImageHeight}" loading="${priority ? 'eager' : 'lazy'}" class="h-full w-full object-cover" />
        </div>
      </a>
      <div class="flex flex-1 flex-col p-5">
        <div class="mb-3 flex flex-wrap items-center gap-3 text-xs font-bold uppercase text-slate-500">
          <a href="/blog/category/${post.category.slug}/" class="text-emerald-700">${escapeHtml(post.category.name)}</a>
          <time datetime="${escapeAttribute(post.publishedAt)}">${formatDate(post.publishedAt)}</time>
        </div>
        <h2 class="mb-3 text-xl font-black leading-tight text-slate-950"><a href="${escapeAttribute(post.canonicalPath)}">${escapeHtml(post.title)}</a></h2>
        <p class="mb-5 text-sm leading-6 text-slate-600">${escapeHtml(post.excerpt)}</p>
        <footer class="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
          <a href="/blog/author/${post.author.slug}/">${escapeHtml(post.author.name)}</a>
          <span>${post.readingTime} min read</span>
        </footer>
      </div>
    </article>
  `;
}

function renderEmptyState() {
  return `
    <div class="mt-6 rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
      <h2 class="text-xl font-black text-slate-950">No Articles Found</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Try a different search term or browse all published guides.</p>
      <a href="/blog/" class="mt-5 inline-flex rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-black text-white">View all articles</a>
    </div>
  `;
}

function renderToc(post) {
  if (!post.headings.length) return '';
  return `
    <nav class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-label="Table of contents">
      <h2 class="text-sm font-black uppercase tracking-wide text-slate-950">Table of contents</h2>
      <ol class="mt-4 space-y-2 text-sm font-semibold text-slate-600">
        ${post.headings.map((heading) => `<li class="${heading.level === 3 ? 'pl-4' : ''}"><a href="#${escapeAttribute(heading.id)}">${escapeHtml(heading.text)}</a></li>`).join('')}
      </ol>
    </nav>
  `;
}

function renderShare(post) {
  const title = encodeURIComponent(post.title);
  const url = encodeURIComponent(post.canonicalUrl);
  return `
    <section class="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-label="Share article">
      <h2 class="text-sm font-black uppercase tracking-wide text-slate-950">Share</h2>
      <div class="mt-4 grid gap-2">
        <a href="https://www.facebook.com/sharer/sharer.php?u=${url}" class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">Share on Facebook</a>
        <a href="https://www.linkedin.com/shareArticle?mini=true&amp;url=${url}&amp;title=${title}" class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">Share on LinkedIn</a>
        <a href="mailto:?subject=${title}&amp;body=${url}" class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700">Share by email</a>
      </div>
    </section>
  `;
}

function renderAuthorBox(post) {
  return `
    <footer class="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-col gap-4 md:flex-row md:items-start">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-700">${escapeHtml(post.author.name.slice(0, 1))}</div>
        <div>
          <h2 class="text-xl font-black text-slate-950">${escapeHtml(post.author.name)}</h2>
          <p class="mt-1 text-sm font-bold text-emerald-700">${escapeHtml(post.author.title)}</p>
          <p class="mt-3 text-sm leading-6 text-slate-600">${escapeHtml(post.author.bio)}</p>
          <a href="/blog/author/${post.author.slug}/" class="mt-4 inline-flex text-sm font-black text-emerald-700">More articles by ${escapeHtml(post.author.name)}</a>
        </div>
      </div>
    </footer>
  `;
}

function renderCta() {
  return `
    <section class="mt-8 rounded-lg bg-slate-950 p-6 text-white md:p-8" aria-labelledby="blog-cta">
      <h2 id="blog-cta" class="text-2xl font-black">Ready to run a clearer campaign?</h2>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Use PromotInsight to manage promotion applications, buyer proof, seller review, and cashback status in one workflow.</p>
      <a href="/register" class="mt-5 inline-flex rounded-lg bg-emerald-500 px-5 py-3 text-sm font-black text-white">Create an account</a>
    </section>
  `;
}

function renderPrevNext(post) {
  if (!post.previousPost && !post.nextPost) return '';
  return `
    <nav class="mt-8 grid gap-4 md:grid-cols-2" aria-label="Previous and next articles">
      ${post.previousPost ? `<a href="${escapeAttribute(post.previousPost.canonicalPath)}" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><span class="text-xs font-black uppercase tracking-wide text-slate-500">Previous</span><span class="mt-2 block text-base font-black text-slate-950">${escapeHtml(post.previousPost.title)}</span></a>` : '<span></span>'}
      ${post.nextPost ? `<a href="${escapeAttribute(post.nextPost.canonicalPath)}" class="rounded-lg border border-slate-200 bg-white p-5 text-right shadow-sm"><span class="text-xs font-black uppercase tracking-wide text-slate-500">Next</span><span class="mt-2 block text-base font-black text-slate-950">${escapeHtml(post.nextPost.title)}</span></a>` : '<span></span>'}
    </nav>
  `;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

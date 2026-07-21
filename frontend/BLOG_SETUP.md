# Blog Setup

## Architecture Decision

This repository is a React 19 and Vite client-side SPA. Routing is handled by `react-router-dom` in `src/App.jsx`. The checked-out project does not include the Node.js/Express server or database migrations, although the existing app calls an external API through `VITE_API_BASE_URL`.

Because the local app is static and the SEO requirement needs complete blog HTML in the initial HTTP response, the blog uses Markdown files in `src/content/blog` and a production prerender step. The rest of the app stays client-rendered.

## How Rendering Works

`npm run build` runs three steps:

1. `npm run blog:generate` reads Markdown, validates slugs, renders sanitized HTML, filters drafts, and writes `src/content/blog/generatedBlogData.js`.
2. `vite build` builds the normal SPA.
3. `npm run blog:prerender` writes static HTML files into `dist/blog/`, `dist/blog/:slug/`, `dist/blog/category/:categorySlug/`, and `dist/blog/author/:authorSlug/`.

By default, content comes from Markdown files. To prerender admin-created backend posts during deployment, set:

```text
BLOG_CONTENT_SOURCE=api
BLOG_API_BASE_URL=https://your-backend-domain.com
```

`BLOG_API_BASE_URL` may be omitted when `VITE_API_BASE_URL` already points to the backend. Backend API rendering uses `/api/blogs/public`, so the backend must be deployed first and must include the blog SEO fields.

The generated blog HTML includes title, meta description, canonical URL, robots, Open Graph, Twitter card metadata, article dates, article JSON-LD, breadcrumb JSON-LD, H1, article body, and crawlable links before client JavaScript runs.

## How to Create a Blog Post

Create a new Markdown file in `src/content/blog`, for example:

```md
---
id: example-post
title: Example Post
slug: example-post
excerpt: A short summary for cards and metadata.
metaTitle: Example Post | PromotInsight
metaDescription: A unique SEO description of the article.
primaryKeyword: example keyword
category: Seller Growth
categorySlug: seller-growth
categoryName: Seller Growth
author: PromotInsight Editorial
authorSlug: promotinsight-editorial
authorName: PromotInsight Editorial
featuredImage: /blog/images/example.svg
featuredImageAlt: Descriptive image alt text
featuredImageWidth: 1200
featuredImageHeight: 630
publishedAt: 2026-07-21T09:00:00.000Z
updatedAt: 2026-07-21T09:00:00.000Z
status: draft
relatedPostIds: []
createdAt: 2026-07-21T09:00:00.000Z
---

## First Section

Write the article body in Markdown.
```

Use `status: draft` while editing. Change it to `status: published` to include the post in generated public pages.

## How to Update a Post

Edit the Markdown file, update `updatedAt`, then run:

```bash
npm run blog:generate
```

Run a full production build before deployment.

## How to Publish a Post

Set `status: published`, confirm `slug`, `metaTitle`, `metaDescription`, `featuredImageAlt`, `publishedAt`, and `updatedAt`, then run:

```bash
npm test
npm run build
npm run seo:verify
```

## Image Requirements

Use a 1200 by 630 featured image when possible. Set `featuredImageWidth` and `featuredImageHeight` to the real dimensions. The primary article image is not lazy-loaded. Article card images below the top content are lazy-loaded.

If WebP or AVIF variants exist, add `featuredImageWebp` or `featuredImageAvif` to frontmatter.

## Sitemap, Robots, and RSS

`npm run blog:generate` writes:

- `public/sitemap.xml`
- `public/robots.txt`
- `public/rss.xml`
- `public/_redirects`

The sitemap includes public static pages, `/blog/`, published posts, category pages, and author pages. Drafts, auth routes, admin/dashboard routes, preview routes, and query-string URLs are excluded.

`robots.txt` points to the absolute sitemap URL. Set `VITE_SITE_URL` or `SITE_URL` during build if production is not `https://promotinsight.com`.

## Testing Production HTML

Run:

```bash
npm test
npm run build
npm run seo:verify
```

Then inspect generated files such as:

```bash
dist/blog/cashback-campaign-guide/index.html
```

The SEO verifier checks title, meta description, canonical, H1, article content, indexability, JSON-LD, Open Graph image, and published date metadata.

## Structured Data Validation

After deployment, open a published post URL and test it with Google Rich Results Test or Schema.org Validator. Structured data is generated from the same post data shown on the page and does not include ratings, reviews, or unsupported values.

## Google Search Console

Submit:

```text
https://promotinsight.com/sitemap.xml
```

Replace the domain if `VITE_SITE_URL` or `SITE_URL` uses a different production origin.

## Deployment Steps

Use the existing frontend deployment flow, with the production build command now being:

```bash
npm install
npm run build
```

Optional verification before deploying:

```bash
npm run lint
npm test
npm run seo:verify
```

Deploy the generated `dist` directory.

## Redirects

The preferred blog URL style is trailing slash:

- `/blog/`
- `/blog/:slug/`
- `/blog/category/:categorySlug/`
- `/blog/author/:authorSlug/`

`public/_redirects` includes permanent redirect rules for hosts that support Netlify-style redirects. If your production host does not support `_redirects`, add equivalent 301 rules in the host dashboard or server configuration.

## Rollback Steps

Revert the blog files and restore the previous `npm run build` script to `vite build`. If a bad post is published, change its frontmatter to `status: draft`, rebuild, and redeploy.

## Database Migration

Backend SEO blog support requires the backend migration `migrations/add_blog_seo_fields.sql` or the backend startup schema helper. It adds SEO, category, author, canonical, status, related-post, publish-date, and image-dimension fields to the existing `blogs` table.

## Admin Workflow

The existing admin blog UI remains in `AdminDashboard.jsx` under `/dashboard?tab=blogs` and continues to use the existing external API. These aliases now point to that existing admin tab:

- `/admin/blog`
- `/admin/blog/new`
- `/admin/blog/edit/:id`

The admin blog UI posts to the backend `/api/blogs` endpoints. To include admin-created posts in prerendered SEO HTML, build the frontend with `BLOG_CONTENT_SOURCE=api` after the backend has been deployed.

## Environment Variables

No required environment variables were added. Optional:

```text
VITE_SITE_URL=https://promotinsight.com
SITE_URL=https://promotinsight.com
BLOG_CONTENT_SOURCE=api
BLOG_API_BASE_URL=https://backend.example.com
```

These control absolute canonical, image, sitemap, robots, RSS, JSON-LD URLs, and optional backend API content loading at build time.

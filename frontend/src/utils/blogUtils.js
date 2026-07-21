export const BLOG_PAGE_SIZE = 6;

export function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

export function shortDate(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function getPostBySlug(posts, slug) {
  return posts.find((post) => post.slug === slug && post.status === 'published');
}

export function getCategoryBySlug(categories, slug) {
  return categories.find((category) => category.slug === slug);
}

export function getAuthorBySlug(authors, slug) {
  return authors.find((author) => author.slug === slug);
}

export function filterPosts(posts, { query = '', categorySlug = '', authorSlug = '' } = {}) {
  const normalizedQuery = query.trim().toLowerCase();

  return posts.filter((post) => {
    const matchesCategory = !categorySlug || post.category.slug === categorySlug;
    const matchesAuthor = !authorSlug || post.author.slug === authorSlug;
    const matchesQuery = !normalizedQuery || [
      post.title,
      post.excerpt,
      post.category.name,
      post.author.name,
      post.primaryKeyword,
    ].join(' ').toLowerCase().includes(normalizedQuery);

    return matchesCategory && matchesAuthor && matchesQuery;
  });
}

export function paginate(items, page = 1, perPage = BLOG_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const currentPage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const start = (currentPage - 1) * perPage;

  return {
    currentPage,
    totalPages,
    items: items.slice(start, start + perPage),
  };
}

export function setDocumentMeta({ title, description, canonical, robots = 'index,follow', image }) {
  if (typeof document === 'undefined') return;

  document.title = title;
  upsertMeta('description', description);
  upsertMeta('robots', robots);
  upsertLink('canonical', canonical);
  upsertMetaProperty('og:title', title);
  upsertMetaProperty('og:description', description);
  upsertMetaProperty('og:type', 'website');
  if (image) upsertMetaProperty('og:image', image);
  upsertMeta('twitter:card', 'summary_large_image');
  upsertMeta('twitter:title', title);
  upsertMeta('twitter:description', description);
  if (image) upsertMeta('twitter:image', image);
}

function upsertMeta(name, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertMetaProperty(property, content) {
  if (!content) return;
  let tag = document.head.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement('link');
    tag.setAttribute('rel', rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute('href', href);
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Search } from 'lucide-react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import ArticleCard from './ArticleCard';
import { blogAuthors, blogCategories, blogPostSummaries, blogSite } from '../../content/blog/generatedBlogData';
import { filterPosts, paginate, setDocumentMeta } from '../../utils/blogUtils';

export default function BlogListingPage({
  title = 'PromotInsight Blog',
  description = 'Guides and updates for running clearer product campaigns, improving promotion results, and helping buyers submit better proof.',
  categorySlug = '',
  authorSlug = '',
  canonicalPath = '/blog/',
  noResultsTitle = 'No Articles Found',
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const featuredPost = blogPostSummaries[0] || null;

  const filteredPosts = useMemo(() => filterPosts(blogPostSummaries, { query, categorySlug, authorSlug }), [query, categorySlug, authorSlug]);
  const paginated = paginate(filteredPosts, page);

  useEffect(() => {
    setDocumentMeta({
      title: `${title} | PromotInsight`,
      description,
      canonical: `${blogSite.url}${canonicalPath}`,
      robots: 'index,follow',
      image: featuredPost ? `${blogSite.url}${featuredPost.featuredImage}` : undefined,
    });
  }, [canonicalPath, description, featuredPost, title]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <main className="flex-1">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm font-semibold text-slate-500">
              <ol className="flex flex-wrap items-center gap-2">
                <li><Link to="/" className="hover:text-emerald-700 focus:outline-none focus-visible:underline">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link to="/blog/" className="hover:text-emerald-700 focus:outline-none focus-visible:underline">Blog</Link></li>
              </ol>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">{description}</p>
              </div>

              <form role="search" className="relative" onSubmit={(event) => event.preventDefault()}>
                <label htmlFor="blog-search" className="sr-only">Search blog articles</label>
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="blog-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search guides"
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
              </form>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-8" aria-label="Blog categories">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Link to="/blog/" className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${!categorySlug && !authorSlug ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'}`}>
              All articles
            </Link>
            {blogCategories.map((category) => (
              <Link key={category.slug} to={`/blog/category/${category.slug}/`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${category.slug === categorySlug ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'}`}>
                {category.name}
              </Link>
            ))}
          </div>
        </section>

        {featuredPost && !categorySlug && !authorSlug && !query && (
          <section className="mx-auto max-w-7xl px-4 pb-10" aria-labelledby="featured-article">
            <div className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
              <picture className="aspect-[40/21] bg-slate-100 lg:aspect-auto">
                <img
                  src={featuredPost.featuredImage}
                  alt={featuredPost.featuredImageAlt}
                  width={featuredPost.featuredImageWidth}
                  height={featuredPost.featuredImageHeight}
                  loading="eager"
                  className="h-full w-full object-cover"
                />
              </picture>
              <div className="p-6 md:p-8 lg:p-10">
                <Link to={`/blog/category/${featuredPost.category.slug}/`} className="text-sm font-black uppercase tracking-wide text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline">
                  Featured in {featuredPost.category.name}
                </Link>
                <h2 id="featured-article" className="mt-4 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
                  <Link to={featuredPost.canonicalPath} className="hover:text-emerald-700 focus:outline-none focus-visible:underline">
                    {featuredPost.title}
                  </Link>
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">{featuredPost.excerpt}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-500">
                  <Link to={`/blog/author/${featuredPost.author.slug}/`} className="hover:text-emerald-700 focus:outline-none focus-visible:underline">
                    {featuredPost.author.name}
                  </Link>
                  <span>{featuredPost.readingTime} min read</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 pb-16" aria-labelledby="recent-posts">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 id="recent-posts" className="text-2xl font-black text-slate-950">Recent posts</h2>
              <p className="mt-1 text-sm text-slate-600">{filteredPosts.length} article{filteredPosts.length === 1 ? '' : 's'} available</p>
            </div>
          </div>

          {paginated.items.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginated.items.map((post, index) => (
                <ArticleCard key={post.id} post={post} priority={index === 0} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
              <AlertCircle size={42} className="mx-auto mb-4 text-slate-300" aria-hidden="true" />
              <h2 className="text-xl font-black text-slate-950">{noResultsTitle}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Try a different search term or browse all published guides.</p>
              <Link to="/blog/" className="mt-5 inline-flex rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                View all articles
              </Link>
            </div>
          )}

          {paginated.totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Blog pagination">
              {Array.from({ length: paginated.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-current={paginated.currentPage === pageNumber ? 'page' : undefined}
                  className={`h-10 w-10 rounded-lg text-sm font-black transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${paginated.currentPage === pageNumber ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'}`}
                >
                  {pageNumber}
                </button>
              ))}
            </nav>
          )}
        </section>

        <aside className="border-t border-slate-200 bg-white" aria-label="Blog authors">
          <div className="mx-auto max-w-7xl px-4 py-10">
            <h2 className="text-lg font-black text-slate-950">Authors</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {blogAuthors.map((author) => (
                <Link key={author.slug} to={`/blog/author/${author.slug}/`} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                  {author.name} <span className="text-slate-400">({author.count})</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}

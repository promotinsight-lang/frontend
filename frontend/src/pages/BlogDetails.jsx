import { useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Share2, User } from 'lucide-react';
import DOMPurify from 'dompurify';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ArticleCard from '../components/blog/ArticleCard';
import { blogPosts, blogSite } from '../content/blog/generatedBlogData';
import { formatDate, getPostBySlug, setDocumentMeta } from '../utils/blogUtils';

export default function BlogDetails() {
  const { slug } = useParams();
  const post = getPostBySlug(blogPosts, slug);

  useEffect(() => {
    if (!post) {
      setDocumentMeta({
        title: 'Article Not Found | PromotInsight',
        description: 'The requested PromotInsight article could not be found.',
        canonical: `${blogSite.url}/blog/`,
        robots: 'noindex,follow',
      });
      return;
    }

    setDocumentMeta({
      title: post.metaTitle,
      description: post.metaDescription,
      canonical: post.canonicalUrl,
      robots: 'index,follow',
      image: `${blogSite.url}${post.featuredImage}`,
    });
  }, [post]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) return <Navigate to="/blog/" replace />;

  const publishedDate = formatDate(post.publishedAt);
  const updatedDate = formatDate(post.updatedAt);
  const showUpdatedDate = new Date(post.updatedAt).toDateString() !== new Date(post.publishedAt).toDateString();
  const shareText = encodeURIComponent(post.title);
  const shareUrl = encodeURIComponent(post.canonicalUrl);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <main className="flex-1">
        <article className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm font-semibold text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link to="/" className="hover:text-emerald-700 focus:outline-none focus-visible:underline">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/blog/" className="hover:text-emerald-700 focus:outline-none focus-visible:underline">Blog</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to={`/blog/category/${post.category.slug}/`} className="hover:text-emerald-700 focus:outline-none focus-visible:underline">{post.category.name}</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-slate-700">{post.title}</li>
            </ol>
          </nav>

          <header className="mx-auto max-w-4xl text-center">
            <Link to={`/blog/category/${post.category.slug}/`} className="text-sm font-black uppercase tracking-wide text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline">
              {post.category.name}
            </Link>
            <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-5xl">{post.title}</h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">{post.excerpt}</p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-slate-500">
              <Link to={`/blog/author/${post.author.slug}/`} className="inline-flex items-center gap-1.5 hover:text-emerald-700 focus:outline-none focus-visible:underline">
                <User size={16} aria-hidden="true" />
                {post.author.name}
              </Link>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={16} aria-hidden="true" />
                Published {publishedDate}
              </span>
              {showUpdatedDate && <span>Updated {updatedDate}</span>}
              <span className="inline-flex items-center gap-1.5">
                <Clock size={16} aria-hidden="true" />
                {post.readingTime} min read
              </span>
            </div>
          </header>

          <figure className="mx-auto mt-10 max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <picture>
              {post.featuredImageAvif && <source srcSet={post.featuredImageAvif} type="image/avif" />}
              {post.featuredImageWebp && <source srcSet={post.featuredImageWebp} type="image/webp" />}
              <img
                src={post.featuredImage}
                alt={post.featuredImageAlt}
                width={post.featuredImageWidth}
                height={post.featuredImageHeight}
                loading="eager"
                className="h-auto w-full object-cover"
              />
            </picture>
          </figure>

          <div className="mx-auto mt-10 grid max-w-6xl gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Article sidebar">
              {post.headings.length > 0 && (
                <nav className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-label="Table of contents">
                  <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Table of contents</h2>
                  <ol className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                    {post.headings.map((heading) => (
                      <li key={heading.id} className={heading.level === 3 ? 'pl-4' : ''}>
                        <a href={`#${heading.id}`} className="hover:text-emerald-700 focus:outline-none focus-visible:underline">
                          {heading.text}
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}

              <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" aria-label="Share article">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-950">
                  <Share2 size={16} aria-hidden="true" />
                  Share
                </h2>
                <div className="mt-4 grid gap-2">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    Share on Facebook
                  </a>
                  <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    Share on LinkedIn
                  </a>
                  <a href={`mailto:?subject=${shareText}&body=${shareUrl}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    Share by email
                  </a>
                </div>
              </section>
            </aside>

            <div>
              <section
                className="blog-prose rounded-lg border border-slate-200 bg-white p-6 text-slate-700 shadow-sm md:p-10"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.contentHtml) }}
              />

              <footer className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-700">
                    {post.author.name.slice(0, 1)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">{post.author.name}</h2>
                    <p className="mt-1 text-sm font-bold text-emerald-700">{post.author.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{post.author.bio}</p>
                    <Link to={`/blog/author/${post.author.slug}/`} className="mt-4 inline-flex text-sm font-black text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline">
                      More articles by {post.author.name}
                    </Link>
                  </div>
                </div>
              </footer>

              <section className="mt-8 rounded-lg bg-slate-950 p-6 text-white md:p-8" aria-labelledby="blog-cta">
                <h2 id="blog-cta" className="text-2xl font-black">Ready to run a clearer campaign?</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Use PromotInsight to manage promotion applications, buyer proof, seller review, and campaign status in one workflow.</p>
                <Link to="/register" className="mt-5 inline-flex rounded-lg bg-emerald-500 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Create an account
                </Link>
              </section>

              {(post.previousPost || post.nextPost) && (
                <nav className="mt-8 grid gap-4 md:grid-cols-2" aria-label="Previous and next articles">
                  {post.previousPost ? (
                    <Link to={post.previousPost.canonicalPath} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                      <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><ArrowLeft size={14} aria-hidden="true" /> Previous</span>
                      <span className="mt-2 block text-base font-black text-slate-950">{post.previousPost.title}</span>
                    </Link>
                  ) : <span />}
                  {post.nextPost ? (
                    <Link to={post.nextPost.canonicalPath} className="rounded-lg border border-slate-200 bg-white p-5 text-right shadow-sm transition hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                      <span className="inline-flex items-center justify-end gap-2 text-xs font-black uppercase tracking-wide text-slate-500">Next <ArrowRight size={14} aria-hidden="true" /></span>
                      <span className="mt-2 block text-base font-black text-slate-950">{post.nextPost.title}</span>
                    </Link>
                  ) : <span />}
                </nav>
              )}
            </div>
          </div>

          {post.relatedPosts.length > 0 && (
            <section className="mx-auto mt-14 max-w-7xl" aria-labelledby="related-articles">
              <h2 id="related-articles" className="text-2xl font-black text-slate-950">Related articles</h2>
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {post.relatedPosts.map((relatedPost) => (
                  <ArticleCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}

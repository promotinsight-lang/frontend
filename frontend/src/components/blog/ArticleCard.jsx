import { Link } from 'react-router-dom';
import { Clock, User } from 'lucide-react';
import { shortDate } from '../../utils/blogUtils';

export default function ArticleCard({ post, priority = false }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={post.canonicalPath} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
        <div className="aspect-[40/21] w-full overflow-hidden bg-slate-100">
          <picture>
            {post.featuredImageAvif && <source srcSet={post.featuredImageAvif} type="image/avif" />}
            {post.featuredImageWebp && <source srcSet={post.featuredImageWebp} type="image/webp" />}
            <img
              src={post.featuredImage}
              alt={post.featuredImageAlt}
              width={post.featuredImageWidth}
              height={post.featuredImageHeight}
              loading={priority ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </picture>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-bold uppercase text-slate-500">
          <Link to={`/blog/category/${post.category.slug}/`} className="text-emerald-700 hover:text-emerald-800 focus:outline-none focus-visible:underline">
            {post.category.name}
          </Link>
          <span>{shortDate(post.publishedAt)}</span>
        </div>

        <h2 className="mb-3 text-xl font-black leading-tight text-slate-950">
          <Link to={post.canonicalPath} className="hover:text-emerald-700 focus:outline-none focus-visible:underline">
            {post.title}
          </Link>
        </h2>

        <p className="mb-5 line-clamp-3 text-sm leading-6 text-slate-600">{post.excerpt}</p>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
          <Link to={`/blog/author/${post.author.slug}/`} className="inline-flex items-center gap-1.5 hover:text-emerald-700 focus:outline-none focus-visible:underline">
            <User size={14} aria-hidden="true" />
            {post.author.name}
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} aria-hidden="true" />
            {post.readingTime} min read
          </span>
        </footer>
      </div>
    </article>
  );
}

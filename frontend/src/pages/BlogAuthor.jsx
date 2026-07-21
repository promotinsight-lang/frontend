import { Navigate, useParams } from 'react-router-dom';
import BlogListingPage from '../components/blog/BlogListingPage';
import { blogAuthors } from '../content/blog/generatedBlogData';
import { getAuthorBySlug } from '../utils/blogUtils';

export default function BlogAuthor() {
  const { authorSlug } = useParams();
  const author = getAuthorBySlug(blogAuthors, authorSlug);

  if (!author) return <Navigate to="/blog/" replace />;

  return (
    <BlogListingPage
      title={`Articles by ${author.name}`}
      description={author.bio || `Published PromotInsight articles by ${author.name}.`}
      authorSlug={author.slug}
      canonicalPath={`/blog/author/${author.slug}/`}
      noResultsTitle={`No Articles by ${author.name} Found`}
    />
  );
}

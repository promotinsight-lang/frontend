import { Navigate, useParams } from 'react-router-dom';
import BlogListingPage from '../components/blog/BlogListingPage';
import { blogCategories } from '../content/blog/generatedBlogData';
import { getCategoryBySlug } from '../utils/blogUtils';

export default function BlogCategory() {
  const { categorySlug } = useParams();
  const category = getCategoryBySlug(blogCategories, categorySlug);

  if (!category) return <Navigate to="/blog/" replace />;

  return (
    <BlogListingPage
      title={`${category.name} Articles`}
      description={category.description || `Published PromotInsight articles in ${category.name}.`}
      categorySlug={category.slug}
      canonicalPath={`/blog/category/${category.slug}/`}
      noResultsTitle={`No ${category.name} Articles Found`}
    />
  );
}

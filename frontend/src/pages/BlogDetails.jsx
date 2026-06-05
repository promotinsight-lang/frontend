import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function BlogDetails() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`https://backend-6aiq.onrender.com/api/blogs/public/${slug}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setBlog(data.data);
        } else {
          setBlog(null);
        }
      } catch (err) {
        console.error("Failed to fetch blog details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
    window.scrollTo(0, 0); // Scroll to top when page loads
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 w-full mt-8">
        <Link to="/blogs" className="inline-flex items-center gap-1 text-gray-500 hover:text-[#0066ff] font-bold mb-6 transition-colors text-sm">
          <ArrowLeft size={16} /> Back to all articles
        </Link>

        {loading ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-10"></div>
            <div className="h-64 bg-gray-200 rounded w-full mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div> 
            </div>
          </div>
        ) : !blog ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Article Not Found</h3>
            <p className="text-gray-500 mb-6">The article you are looking for does not exist or has been removed.</p>
            <Link to="/blogs" className="bg-[#0066ff] text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700">View Other Articles</Link>
          </div>
        ) : (
          <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {blog.image_url && (
              <div className="w-full h-[300px] md:h-[450px] bg-gray-100">
                <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-6 md:p-12">
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-1.5"><Calendar size={14} className="text-[#0066ff]"/> {new Date(blog.created_at).toLocaleDateString()}</div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-1.5"><User size={14} className="text-[#0066ff]"/> By {blog.author_name}</div>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8 leading-tight">{blog.title}</h1>

              {/* We use dangerouslySetInnerHTML because blog content might have HTML formatting 
                (paragraphs, bold text, links) if you add a rich text editor later.
              */}
              <div 
                className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: blog.content.replace(/\n/g, '<br/>') }}
              />
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
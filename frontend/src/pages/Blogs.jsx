import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch('https://backend-6aiq.onrender.com/api/blogs/public');
        const data = await res.json();
        if (res.ok && data.success) {
          setBlogs(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch blogs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      
      <div className="bg-[#0066ff] pt-12 pb-20 px-4 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">PromotInsight <span className="text-yellow-300">Blog</span></h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">Discover the latest updates, tips for sellers, and guides on how to maximize your cashback as a buyer.</p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12 -mt-12 w-full flex-1">
        {loading ? (
          <div className="text-center py-20 font-bold text-gray-500 animate-pulse bg-white rounded-2xl shadow-sm">Loading articles...</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Articles Found</h3>
            <p className="text-gray-500">Check back later for new updates and guides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map(blog => (
              <div key={blog.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div className="h-52 bg-gray-100 overflow-hidden relative">
                  {blog.image_url ? (
                    <img src={blog.image_url} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FileText size={48} />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex justify-between border-b border-gray-50 pb-2">
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    <span>By {blog.author_name}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-[#0066ff] transition-colors leading-snug">
                    {blog.title}
                  </h3>
                  <div className="mt-auto pt-4">
                    <Link to={`/blog/${blog.slug}`} className="text-[#0066ff] text-sm font-bold flex items-center gap-1 w-max group-hover:gap-2 transition-all">
                      Read Article <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 
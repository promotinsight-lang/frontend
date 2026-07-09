import {  useState, useEffect  } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react'; // ArrowLeft বাদ দেওয়া হয়েছে কারণ এখানে লাগে না
import Navbar from '../components/Navbar';

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/blogs/public`);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {blogs.map(blog => (
              <div key={blog.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                
                {/* 🔴 ১. ছবি রেসপন্সিভ এবং ফুল শো করার জন্য aspect-video ব্যবহার করা হলো */}
                <div className="w-full aspect-video bg-gray-100 overflow-hidden relative border-b border-gray-100">
                  {blog.image_url ? (
                    <img 
                      src={blog.image_url} 
                      alt={blog.title} 
                      className="w-full h-full object-cover sm:object-contain md:object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FileText size={48} />
                    </div>
                  )}
                </div>
                
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex justify-between pb-2">
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                    <span>By {blog.author_name}</span>
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 line-clamp-2 group-hover:text-[#0066ff] transition-colors leading-snug">
                    {blog.title}
                  </h3>
                  
                  {/* 🔴 ২. আর্টিকেলের কিছু লাইন (Excerpt) দেখানোর অপশন */}
                  {blog.content && (
                    <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">
                      {/* HTML ট্যাগ থাকলে তা রিমুভ করে শুধু টেক্সট দেখানো হচ্ছে */}
                      {blog.content.replace(/<[^>]+>/g, '')}
                    </p>
                  )}

                  {/* 🔴 ৩. Read More বাটন আপডেট করা হলো */}
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <Link to={`/blog/${blog.slug}`} className="text-[#0066ff] text-sm font-bold flex items-center justify-between w-full group-hover:text-blue-700 transition-all">
                      Read More <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
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
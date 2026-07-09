import { X } from 'lucide-react';

export default function FullImageModal({ fullImageUrl, onClose }) {
  if (!fullImageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <button 
        className="absolute top-6 right-6 text-white hover:text-red-500 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors"
        onClick={onClose}
      >
        <X size={32}/>
      </button>
      <img 
        src={fullImageUrl} 
        alt="Full Proof" 
        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/20 cursor-default" 
        onClick={(e) => e.stopPropagation()} 
      />
    </div>
  );
}
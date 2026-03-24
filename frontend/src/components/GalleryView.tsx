import React from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Heart, MessageSquare, Share2, Sparkles } from 'lucide-react';
import { Post } from '../types';

interface GalleryViewProps {
  posts: Post[];
  setSelectedPost: (post: Post) => void;
  handleLike: (postId: number) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({ posts, setSelectedPost, handleLike }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900">美学广场</h1>
        </div>
        <p className="text-gray-600 font-serif italic">探索来自世界各地的摄影佳作，汲取视觉灵感。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -8 }}
            onClick={() => setSelectedPost(post)}
            className="group cursor-pointer"
          >
            <div className="aspect-[4/5] relative overflow-hidden rounded-[2.5rem] luxury-shadow bg-white">
              <img
                src={post.analysisHistory.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className={`w-5 h-5 ${post.likesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                      <span className="font-bold">{post.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-bold">{post.comments?.length || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-bold">{post.analysisHistory.nimaScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 px-4 flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-serif text-xl text-gray-900 truncate">{post.title}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">@{post.user.username}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleLike(post.id); }}
                className="p-3 hover:bg-black/5 rounded-full transition-all text-black/20 hover:text-red-500"
              >
                <Heart className={`w-5 h-5 ${post.likesCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-32 bg-white/50 rounded-[3rem] border-2 border-dashed border-black/5 backdrop-blur-sm">
          <ImageIcon className="w-20 h-20 text-black/5 mx-auto mb-6" />
          <h3 className="text-2xl font-serif text-black/40">广场空空如也</h3>
          <p className="text-black/20 mt-2">成为第一个分享杰作的人吧！</p>
        </div>
      )}
    </div>
  );
};

export default GalleryView;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Camera, History, ChevronRight, LogIn, UserPlus, LogOut, User as UserIcon, Heart, MessageCircle, Share2, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

import { AnalysisResult, Post, HistoryItem, User, ExifData } from './types';
import HomeView from './components/HomeView';
import GalleryView from './components/GalleryView';
import DashboardView from './components/DashboardView';
import AdminView from './components/AdminView';
import { extractExif } from './utils/exif';
import { logError } from './utils/logger';

// API Base URL configuration for local/production
const API_BASE_URL = 'http://localhost:8080';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState<'home' | 'dashboard' | 'gallery' | 'admin'>('home');
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareForm, setShareForm] = useState({ title: '', description: '' });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [similarPosts, setSimilarPosts] = useState<Post[]>([]);

  const fetchSimilarPosts = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/similar/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSimilarPosts(data);
      }
    } catch (error) {
      logError('App', 'Failed to fetch similar posts', error);
    }
  };

  useEffect(() => {
    if (selectedPost) {
      fetchSimilarPosts(selectedPost.analysisHistory.id);
    } else {
      setSimilarPosts([]);
    }
  }, [selectedPost]);
  const [commentText, setCommentText] = useState('');
  const [exifData, setExifData] = useState<ExifData | null>(null);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/history`, {
        headers: { 'Authorization': user.token }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      logError('App', 'Failed to fetch history', error);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`, {
        headers: { 'Authorization': user.token }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      logError('App', 'Failed to fetch stats', error);
    }
  };

  useEffect(() => {
    if (user && view === 'dashboard') {
      fetchStats();
    }
  }, [user, view]);

  useEffect(() => {
    if (view === 'gallery') {
      fetchPosts();
    }
  }, [view]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      logError('App', 'Failed to fetch posts', error);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !result?.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user.token
        },
        body: JSON.stringify({
          analysisId: result.id,
          title: shareForm.title,
          description: shareForm.description
        })
      });

      if (response.ok) {
        setIsSharing(false);
        setShareForm({ title: '', description: '' });
        setView('gallery');
        fetchPosts();
      }
    } catch (error) {
      logError('App', 'Failed to share post', error);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
        method: 'POST'
      });
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(p => p.id === postId ? updatedPost : p));
        if (selectedPost?.id === postId) setSelectedPost(updatedPost);
      }
    } catch (error) {
      logError('App', 'Failed to like post', error);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost || !commentText.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user.token
        },
        body: JSON.stringify({
          postId: selectedPost.id,
          content: commentText
        })
      });

      if (response.ok) {
        setCommentText('');
        // Refresh posts to get the new comment
        fetchPosts();
        // Also update selected post locally for immediate feedback if possible
        const newComment = await response.json();
        setSelectedPost({
          ...selectedPost,
          comments: [newComment, ...(selectedPost.comments || [])]
        });
      }
    } catch (error) {
      logError('App', 'Failed to add comment', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await response.json();
      if (response.ok) {
        if (authMode === 'login') {
          const userData = { username: authForm.username, token: data.token };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setAuthMode(null);
        } else {
          alert('注册成功，请登录');
          setAuthMode('login');
        }
      } else {
        alert(data.message || '操作失败');
      }
    } catch (error) {
      alert('网络错误');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setResult(null);
    setSelectedImage(null);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Extract EXIF
      const exif = await extractExif(file);
      setExifData(exif);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getEmbedding = async (base64Image: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Remove data:image/...;base64, prefix
      const base64Data = base64Image.split(',')[1];
      
      const result = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: [{
          parts: [{
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg'
            }
          }]
        }]
      });
      
      return result.embeddings[0].values.join(',');
    } catch (error) {
      logError('App', 'Failed to get embedding', error);
      return null;
    }
  };

  const handleAnalyze = async (clickX?: number, clickY?: number) => {
    if (!selectedImage || !user) {
      if (!user) setAuthMode('login');
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    
    try {
      // 1. 获取图片向量 (Vectorization)
      const vector = await getEmbedding(selectedImage);

      // 2. 发送分析请求
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': user.token
        },
        body: JSON.stringify({
          image_url: selectedImage,
          vector: vector,
          click_x: clickX,
          click_y: clickY
        })
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        if (response.status === 429) {
          alert("请求过于频繁，请一分钟后再试。");
          setIsAnalyzing(false);
          return;
        }
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || '分析失败');
        } else {
          const textError = await response.text();
          logError('App', 'Server error (non-JSON)', textError);
          throw new Error(`服务器错误 (${response.status})。请检查后端日志或确保 Python 模型服务已启动。`);
        }
      }

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        const analysisId = data.id;
        
        // Start polling for status
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API_BASE_URL}/api/status/${analysisId}`, {
              headers: { 'Authorization': user.token }
            });
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (statusData.status === 'COMPLETED') {
                clearInterval(pollInterval);
                setResult({
                  ...statusData.result,
                  nimaScore: statusData.nimaScore,
                  id: analysisId
                });
                setIsAnalyzing(false);
                fetchHistory();
              } else if (statusData.status === 'FAILED') {
                clearInterval(pollInterval);
                setIsAnalyzing(false);
                alert('分析失败，请重试');
              }
            }
          } catch (err) {
            logError('App', 'Polling error', err);
          }
        }, 2000);

      } else {
        throw new Error("服务器未返回有效的 JSON 数据");
      }

    } catch (error) {
      logError('App', 'Analysis process failed', error);
      alert(error instanceof Error ? error.message : '分析过程中发生未知错误');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] font-sans selection:bg-emerald-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Camera className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">LensMaster <span className="text-xs font-sans font-normal text-black/40 ml-1 uppercase tracking-widest">AI</span></span>
          </div>
          
          <nav className="hidden md:flex items-center gap-10">
            <button 
              onClick={() => setView('home')}
              className={`text-sm font-medium transition-all hover:text-black ${view === 'home' ? 'text-black nav-item-active' : 'text-black/40'}`}
            >
              分析工具
            </button>
            <button 
              onClick={() => setView('gallery')}
              className={`text-sm font-medium transition-all hover:text-black ${view === 'gallery' ? 'text-black nav-item-active' : 'text-black/40'}`}
            >
              美学广场
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`text-sm font-medium transition-all hover:text-black ${view === 'dashboard' ? 'text-black nav-item-active' : 'text-black/40'}`}
            >
              个人看板
            </button>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2.5 hover:bg-black/5 rounded-full transition-all text-black/60 hover:text-black relative"
                >
                  <History className="w-5 h-5" />
                  {history.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-black rounded-full border border-white"></span>
                  )}
                </button>
                <div className="flex items-center gap-3 pl-6 border-l border-black/5">
                  <div className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-black/60" />
                  </div>
                  <span className="text-sm font-medium">@{user.username}</span>
                  <button 
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-50 rounded-full transition-all text-black/40 hover:text-red-500"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setAuthMode('login'); setAuthForm({ username: '', password: '' }); }}
                  className="px-5 py-2 text-sm font-medium hover:text-black transition-all text-black/60 flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> 登录
                </button>
                <button 
                  onClick={() => { setAuthMode('register'); setAuthForm({ username: '', password: '' }); }}
                  className="btn-luxury text-sm flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> 开启创作
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {view === 'home' && (
          <HomeView 
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            isAnalyzing={isAnalyzing}
            result={result}
            setResult={setResult}
            onFileChange={onFileChange}
            handleAnalyze={handleAnalyze}
            user={user}
            setIsSharing={setIsSharing}
            exifData={exifData}
          />
        )}

        {view === 'dashboard' && stats && (
          <DashboardView stats={stats} />
        )}

        {view === 'gallery' && (
          <GalleryView 
            posts={posts}
            setSelectedPost={setSelectedPost}
            handleLike={handleLike}
          />
        )}

        {view === 'admin' && (
          <AdminView />
        )}
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {isSharing && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSharing(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-white z-[110] rounded-[3rem] p-12 luxury-shadow"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="space-y-1">
                  <h3 className="text-3xl font-serif">分享到广场</h3>
                  <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.2em]">Share your creation with the world</p>
                </div>
                <button onClick={() => setIsSharing(false)} className="p-3 hover:bg-black/5 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleShare} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-4">Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="给您的作品起个优雅的名字"
                      className="input-luxury"
                      value={shareForm.title}
                      onChange={e => setShareForm({...shareForm, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-4">Inspiration</label>
                    <textarea 
                      required
                      placeholder="分享您的拍摄心得或创作背景..."
                      className="input-luxury min-h-[160px] py-4 resize-none"
                      value={shareForm.description}
                      onChange={e => setShareForm({...shareForm, description: e.target.value})}
                    />
                  </div>
                </div>
                <button className="w-full btn-luxury h-16 text-lg flex items-center justify-center gap-3 tracking-widest">
                  <Share2 className="w-5 h-5" /> 立即发布
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Post Detail Modal - QQ Zone Style */}
      <AnimatePresence>
        {selectedPost && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[120]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-10 z-[130] flex flex-col md:flex-row overflow-hidden rounded-[2.5rem] bg-[#FDFCFB] luxury-shadow"
            >
              {/* Left Side: Image Viewer */}
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden group/viewer">
                {/* Blurred Background */}
                <div 
                  className="absolute inset-0 opacity-30 blur-3xl scale-125"
                  style={{ 
                    backgroundImage: `url(${selectedPost.analysisHistory.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                
                <img 
                  src={selectedPost.analysisHistory.imageUrl} 
                  alt={selectedPost.title}
                  className="relative z-10 max-w-full max-h-full object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />

                <button 
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-8 left-8 z-20 bg-white/10 hover:bg-white/20 text-white p-4 rounded-full backdrop-blur-md transition-all md:hidden"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Right Side: Interaction Sidebar */}
              <div className="w-full md:w-[450px] lg:w-[550px] flex flex-col h-full bg-white border-l border-black/5">
                {/* Header */}
                <div className="p-8 border-b border-black/5 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-xl z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-serif leading-none">@{selectedPost.user.username}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 mt-1">Aesthetic Creator</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedPost(null)} 
                    className="p-3 hover:bg-black/5 rounded-full transition-all hidden md:block"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-12">
                  {/* Title & Description */}
                  <div className="space-y-6">
                    <h2 className="text-4xl font-serif tracking-tighter leading-tight">{selectedPost.title}</h2>
                    <p className="text-black/60 leading-relaxed italic serif text-lg">"{selectedPost.description}"</p>
                    
                    <div className="flex items-center gap-8 pt-4">
                      <button 
                        onClick={() => handleLike(selectedPost.id)}
                        className="flex items-center gap-3 group"
                      >
                        <div className={`p-3 rounded-2xl transition-all ${selectedPost.likesCount > 0 ? 'bg-red-50 text-red-500' : 'bg-black/5 text-black/20 group-hover:bg-red-50 group-hover:text-red-400'}`}>
                          <Heart className={`w-6 h-6 ${selectedPost.likesCount > 0 ? 'fill-red-500' : ''}`} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg leading-none">{selectedPost.likesCount}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-black/30">Likes</span>
                        </div>
                      </button>
                      
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-black/5 text-black/20">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg leading-none">{selectedPost.comments?.length || 0}</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-black/30">Comments</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aesthetic Analysis */}
                  <div className="space-y-8 pt-12 border-t border-black/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-black/10"></div>
                        <h5 className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/20">Aesthetic DNA</h5>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-600">{selectedPost.analysisHistory.nimaScore.toFixed(2)}</span>
                      </div>
                    </div>

                    {(() => {
                      const analysis = JSON.parse(selectedPost.analysisHistory.analysisResult);
                      return (
                        <div className="space-y-10">
                          <div className="p-6 bg-black/[0.02] rounded-[2rem] border border-black/5 italic serif text-black/80 leading-relaxed">
                            {analysis.overall}
                          </div>

                          <div className="grid gap-8">
                            {[
                              { label: 'Composition', text: analysis.composition, color: 'blue' },
                              { label: 'Lighting', text: analysis.lighting, color: 'orange' },
                              { label: 'Color', text: analysis.color, color: 'purple' }
                            ].map((item, i) => (
                              <div key={i} className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <span className={`text-[10px] font-bold uppercase tracking-widest text-${item.color}-500/60`}>0{i+1}. {item.label}</span>
                                  <div className={`flex-1 h-[1px] bg-${item.color}-500/10`}></div>
                                </div>
                                <p className="text-sm text-black/60 leading-relaxed font-light">{item.text}</p>
                              </div>
                            ))}
                          </div>

                          {analysis.suggestions && (
                            <div className="space-y-6 pt-6">
                              <h6 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60">Master Suggestions</h6>
                              <div className="grid gap-3">
                                {analysis.suggestions.map((s: string, i: number) => (
                                  <div key={i} className="flex gap-4 items-start p-4 bg-emerald-50/20 rounded-2xl border border-emerald-500/5">
                                    <span className="text-[10px] font-mono text-emerald-500 mt-0.5">0{i+1}</span>
                                    <p className="text-xs text-black/60 leading-relaxed">{s}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Similar Works */}
                  <div className="space-y-8 pt-12 border-t border-black/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-black/10"></div>
                        <h5 className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/20">Similar Aesthetic</h5>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {similarPosts.map(p => (
                        <div 
                          key={p.id} 
                          className="group/similar aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer relative luxury-shadow bg-black/5"
                          onClick={() => setSelectedPost(p)}
                        >
                          <img src={p.analysisHistory.imageUrl} className="w-full h-full object-cover group-hover/similar:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/similar:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                            <Sparkles className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Discussions */}
                  <div className="space-y-8 pt-12 border-t border-black/5">
                    <h5 className="text-[10px] font-bold uppercase tracking-[0.4em] text-black/20">Discussions</h5>
                    <div className="space-y-8">
                      {selectedPost.comments?.map(comment => (
                        <div key={comment.id} className="space-y-3 group/comment">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-black/5 rounded-xl flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-black/30" />
                              </div>
                              <span className="text-xs font-bold">@{comment.user.username}</span>
                            </div>
                            <span className="text-[10px] text-black/20 font-mono">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-black/70 leading-relaxed pl-10">{comment.content}</p>
                        </div>
                      ))}
                      {(!selectedPost.comments || selectedPost.comments.length === 0) && (
                        <div className="py-12 text-center bg-black/[0.01] rounded-[2rem] border border-dashed border-black/5">
                          <MessageCircle className="w-8 h-8 text-black/5 mx-auto mb-3" />
                          <p className="text-xs text-black/30 italic">暂无评论，分享您的见解...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comment Input */}
                <div className="p-8 border-t border-black/5 bg-white sticky bottom-0">
                  <form onSubmit={handleAddComment} className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder={user ? "发表你的美学见解..." : "登录后发表评论"}
                      disabled={!user}
                      className="flex-1 bg-black/[0.02] border border-black/5 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-black outline-none disabled:opacity-50 transition-all"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={!user || !commentText.trim()}
                      className="px-8 py-4 bg-black text-white rounded-2xl text-sm font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-black/80 transition-all shadow-lg active:scale-95"
                    >
                      发送
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {authMode && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAuthMode(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#FDFCFB] z-[110] rounded-[2.5rem] p-12 luxury-shadow"
            >
              <button 
                onClick={() => setAuthMode(null)}
                className="absolute top-8 right-8 p-2 hover:bg-black/5 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-4 mb-10">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Camera className="text-white w-8 h-8" />
                </div>
                <h3 className="text-4xl">{authMode === 'login' ? '欢迎回来' : '加入 LensMaster'}</h3>
                <p className="text-sm text-black/40">
                  {authMode === 'login' ? '登录以继续您的美学探索之旅' : '开启您的 AI 驱动摄影美学分析'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-4">Username</label>
                    <input 
                      type="text" 
                      required
                      placeholder="您的用户名"
                      className="input-luxury"
                      value={authForm.username}
                      onChange={e => setAuthForm({...authForm, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black/40 ml-4">Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="您的密码"
                      className="input-luxury"
                      value={authForm.password}
                      onChange={e => setAuthForm({...authForm, password: e.target.value})}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full btn-luxury h-14 text-lg">
                  {authMode === 'login' ? '登录' : '立即注册'}
                </button>
              </form>
              <div className="mt-10 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-sm text-black/40 hover:text-black transition-all"
                >
                  {authMode === 'login' ? '还没有账号？立即注册' : '已有账号？返回登录'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-light">历史记录</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-black/5 rounded-full">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {history.length === 0 ? (
                  <p className="text-black/40 text-center py-12">暂无历史记录</p>
                ) : (
                      history.map((item) => (
                        <div 
                          key={item.id} 
                          className="group cursor-pointer space-y-3"
                          onClick={() => {
                            setSelectedImage(item.imageUrl);
                            setResult(JSON.parse(item.analysisResult));
                            setShowHistory(false);
                          }}
                        >
                          <div className="aspect-video rounded-2xl overflow-hidden border border-black/5 relative">
                            <img src={item.imageUrl} alt="History" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            {item.nimaScore && (
                              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-lg font-bold">
                                {item.nimaScore.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs text-black/40">
                            <span>{new Date(item.createdAt).toLocaleString()}</span>
                            <span className="group-hover:text-black transition-colors">查看详情 →</span>
                          </div>
                        </div>
                      ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-black/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-black/20">
        <div>© 2026 LensMaster AI • Aesthetic Photography Analysis</div>
        <div className="flex gap-8">
          <button onClick={() => setView('home')} className="hover:text-black transition-colors">Home</button>
          <button onClick={() => setView('gallery')} className="hover:text-black transition-colors">Gallery</button>
          <button onClick={() => setView('admin')} className="hover:text-black transition-colors">Admin Logs</button>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, unit }: { title: string, value: any, unit: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
      <div className="text-sm text-black/40 mb-2">{title}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        <span className="text-xs font-medium text-black/40">{unit}</span>
      </div>
    </div>
  );
}

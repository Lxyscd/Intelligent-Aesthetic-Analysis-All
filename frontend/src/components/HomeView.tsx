import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Sparkles, Loader2, ImageIcon, Layout, Sun, Palette, Share2, Grid3X3, Info, Camera, Crop, BarChart3 } from 'lucide-react';
import { AnalysisResult, User, ExifData } from '../types';

interface HomeViewProps {
  selectedImage: string | null;
  setSelectedImage: (img: string | null) => void;
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  setResult: (res: AnalysisResult | null) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyze: (clickX?: number, clickY?: number) => void;
  user: User | null;
  setIsSharing: (val: boolean) => void;
  exifData: ExifData | null;
}

export default function HomeView({
  selectedImage,
  setSelectedImage,
  isAnalyzing,
  result,
  setResult,
  onFileChange,
  handleAnalyze,
  user,
  setIsSharing,
  exifData
}: HomeViewProps) {
  const [showGrid, setShowGrid] = useState(false);
  const [showExif, setShowExif] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [clickPos, setClickPos] = useState<{ x: number, y: number } | null>(null);

  const onImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (isAnalyzing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickPos({ x, y });
    handleAnalyze(x, y);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-stretch">
      {/* Left Column: Upload & Preview */}
      <section className="flex flex-col h-full">
        <div className="flex-1 flex flex-col space-y-6">
          <div 
            className={`relative h-[500px] w-full rounded-[2.5rem] border border-black/5 transition-all overflow-hidden luxury-shadow bg-white flex items-center justify-center
              ${selectedImage ? 'p-6' : 'border-dashed border-black/10 hover:border-black/20'}`}
          >
            {selectedImage ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black/[0.02] rounded-2xl">
                <div className="relative group max-w-full max-h-full">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className={`max-w-full max-h-[440px] rounded-xl object-contain shadow-xl transition-all ${!isAnalyzing ? 'cursor-crosshair hover:ring-4 hover:ring-emerald-400/30' : ''}`}
                    onClick={onImageClick}
                  />
                  
                  {/* Click Indicator */}
                  <AnimatePresence>
                    {clickPos && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute w-8 h-8 border-2 border-emerald-400 rounded-full pointer-events-none z-20 flex items-center justify-center"
                        style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%`, transform: 'translate(-50%, -50%)' }}
                      >
                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Visual Overlay: Rule of Thirds */}
                  <AnimatePresence>
                    {showGrid && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                      >
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="border border-white/30 border-dashed" />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* EXIF Overlay */}
                  <AnimatePresence>
                    {showExif && (exifData || result?.estimated_exif) && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-6 left-6 right-6 glass-card p-6 rounded-2xl border border-white/20 text-white"
                      >
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest">
                          <div className="space-y-1">
                            <p className="opacity-40 text-[8px]">{exifData ? 'Camera' : 'AI Estimated Camera'}</p>
                            <p>{exifData ? `${exifData.make} ${exifData.model || 'Unknown'}` : 'AI Analysis Model'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="opacity-40 text-[8px]">{exifData ? 'Settings' : 'AI Estimated Settings'}</p>
                            <p>
                              f/{exifData?.fNumber || result?.estimated_exif?.fNumber || '--'} • 
                              {exifData?.exposureTime || result?.estimated_exif?.exposureTime || '--'}s • 
                              ISO {exifData?.iso || result?.estimated_exif?.iso || '--'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Crop Suggestion Overlay */}
                  <AnimatePresence>
                    {showCrop && result?.recommended_crop && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none flex items-center justify-center p-8"
                      >
                        <div className="relative w-full h-full">
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute border-2 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)] bg-emerald-400/10 rounded-lg"
                            style={{
                              left: `${result.recommended_crop.x}%`,
                              top: `${result.recommended_crop.y}%`,
                              width: `${result.recommended_crop.width}%`,
                              height: `${result.recommended_crop.height}%`,
                            }}
                          >
                            <div className="absolute -top-8 left-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                              AI 建议构图 / AI Recommended Crop
                            </div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="bg-white/80 hover:bg-white text-black p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-black/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowGrid(!showGrid)}
                    className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-black/5 ${showGrid ? 'bg-black text-white' : 'bg-white/80 text-black'}`}
                    title="Toggle Rule of Thirds"
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  {(exifData || result?.estimated_exif) && (
                    <button 
                      onClick={() => setShowExif(!showExif)}
                      className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-black/5 ${showExif ? 'bg-black text-white' : 'bg-white/80 text-black'}`}
                      title={exifData ? "Show Metadata" : "Show AI Estimated Metadata"}
                    >
                      <Info className="w-5 h-5" />
                    </button>
                  )}
                  {result?.recommended_crop && (
                    <button 
                      onClick={() => setShowCrop(!showCrop)}
                      className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-black/5 ${showCrop ? 'bg-emerald-500 text-white' : 'bg-white/80 text-black'}`}
                      title="Show Recommended Crop"
                    >
                      <Crop className="w-5 h-5" />
                    </button>
                  )}
                  {result?.cv_metrics && (
                    <button 
                      onClick={() => setShowMetrics(!showMetrics)}
                      className={`p-3 rounded-full backdrop-blur-md transition-all shadow-lg border border-black/5 ${showMetrics ? 'bg-blue-500 text-white' : 'bg-white/80 text-black'}`}
                      title="Show CV Metrics"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group">
                <div className="w-24 h-24 bg-black/[0.02] rounded-[2.5rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-all duration-500">
                  <Upload className="w-8 h-8 text-black/20" />
                </div>
                <span className="text-xl font-serif italic text-black/40">点击或拖拽影像</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-black/20 mt-4">JPG, PNG, WebP up to 10MB</span>
                <input type="file" className="hidden" onChange={onFileChange} accept="image/*" />
              </label>
            )}
          </div>

          <div className="h-24 shrink-0">
            {selectedImage && !result && !isAnalyzing && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => handleAnalyze()}
                className="w-full btn-luxury h-20 text-xl flex items-center justify-center gap-4 tracking-widest"
              >
                <Sparkles className="w-6 h-6" />
                {user ? '开启深度美学解析' : '登录以开始分析'}
              </motion.button>
            )}

            {isAnalyzing && (
              <div className="w-full h-20 bg-black/[0.02] text-black/40 rounded-[2.5rem] font-medium flex flex-col items-center justify-center gap-1 border border-black/5">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">正在为您分析 / Analyzing for you...</span>
                </div>
                <p className="text-[8px] opacity-40 uppercase tracking-tighter">任务已进入云端队列处理 / Task queued for cloud processing</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Right Column: Results */}
      <section className="flex flex-col h-full">
        <div className="flex-1 flex flex-col space-y-6">
          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="flex-1 flex flex-col"
                >
                  <div className="h-[500px] luxury-shadow rounded-[2.5rem] bg-white overflow-hidden border border-black/5 flex flex-col">
                    <div className="p-10 flex-1 flex flex-col space-y-8 overflow-y-auto custom-scrollbar">
                      <div className="flex items-end justify-between border-b border-black/5 pb-6">
                        <div className="space-y-2">
                          <h3 className="text-4xl font-serif">美学报告</h3>
                          <p className="text-[10px] text-black/30 font-bold uppercase tracking-[0.3em]">Aesthetic Evaluation Report</p>
                        </div>
                        <div className="text-right">
                          <div className="text-7xl font-serif font-bold italic leading-none">{result.nimaScore?.toFixed(1)}</div>
                          <div className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-2">Overall Score</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-8 flex-1">
                        {showMetrics && result.cv_metrics && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100/50 space-y-4"
                          >
                            <div className="flex items-center gap-2 text-blue-600">
                              <BarChart3 className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">CV 算法交叉验证 / CV Cross-Validation</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-[8px] text-blue-400 uppercase font-bold">Color Balance (RGB)</p>
                                <p className="text-xs font-mono">{Math.round(result.cv_metrics.avg_r)}, {Math.round(result.cv_metrics.avg_g)}, {Math.round(result.cv_metrics.avg_b)}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[8px] text-blue-400 uppercase font-bold">Composition Energy</p>
                                <p className="text-xs font-mono">{result.cv_metrics.composition_energy.toFixed(2)}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {result.subject_analysis && (
                          <div className="space-y-6 p-8 bg-emerald-50/20 border border-emerald-500/10 rounded-[2rem]">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-emerald-600">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">主体分析 / Subject Analysis</span>
                              </div>
                              {result.subject_analysis.subject_found && (
                                <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-bold rounded-full uppercase tracking-widest">
                                  {result.subject_analysis.subject_name}
                                </span>
                              )}
                            </div>
                            
                            {!result.subject_analysis.subject_found ? (
                              <p className="text-sm text-black/40 italic">{result.subject_analysis.subject_description}</p>
                            ) : (
                              <div className="space-y-6">
                                <p className="text-sm text-black/60 leading-relaxed">{result.subject_analysis.subject_description}</p>
                                
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-emerald-600/60">曝光提升建议 / Exposure Boost</p>
                                    <ul className="space-y-2">
                                      {result.subject_analysis.exposure_suggestions?.map((s, i) => (
                                        <li key={i} className="text-xs text-black/50 flex gap-2">
                                          <span className="text-emerald-500">•</span> {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-blue-600/60">互动增长建议 / Engagement Tips</p>
                                    <ul className="space-y-2">
                                      {result.subject_analysis.engagement_suggestions?.map((s, i) => (
                                        <li key={i} className="text-xs text-black/50 flex gap-2">
                                          <span className="text-blue-500">•</span> {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-black/30">
                            <Layout className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">构图逻辑 / Composition</span>
                          </div>
                          <p className="text-base leading-relaxed text-black/60 font-light">{result.composition}</p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-black/30">
                            <Sun className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">光影叙事 / Lighting</span>
                          </div>
                          <p className="text-base leading-relaxed text-black/60 font-light">{result.lighting}</p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-black/30">
                            <Palette className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">色彩情绪 / Color</span>
                          </div>
                          <p className="text-base leading-relaxed text-black/60 font-light">{result.color}</p>
                        </div>

                        {result.recommended_crop && (
                          <div className="space-y-4 p-6 bg-emerald-50/30 border border-emerald-100/50 rounded-[2rem]">
                            <div className="flex items-center gap-3 text-emerald-600">
                              <Crop className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">二次构图建议 / Re-composition</span>
                            </div>
                            <p className="text-sm leading-relaxed text-emerald-800/70 italic">"{result.recommended_crop.reason}"</p>
                            <button 
                              onClick={() => setShowCrop(!showCrop)}
                              className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline"
                            >
                              {showCrop ? '隐藏裁剪框' : '在原图上预览裁剪'}
                            </button>
                          </div>
                        )}
                      </div>

                      {result.exif && (
                        <div className="p-8 bg-black/5 rounded-[2rem] space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-black/30">
                              <Camera className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">拍摄参数 / EXIF</span>
                            </div>
                            <span className="text-[10px] font-bold text-black/20">{result.exif.make} {result.exif.model}</span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div className="space-y-1">
                              <p className="text-[8px] text-black/30 uppercase font-bold">Aperture</p>
                              <p className="text-xs font-mono">f/{result.exif.fNumber}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] text-black/30 uppercase font-bold">Shutter</p>
                              <p className="text-xs font-mono">{result.exif.exposureTime}s</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] text-black/30 uppercase font-bold">ISO</p>
                              <p className="text-xs font-mono">{result.exif.iso}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] text-black/30 uppercase font-bold">Focal</p>
                              <p className="text-xs font-mono">{result.exif.focalLength}mm</p>
                            </div>
                          </div>
                          {(result.exif as any).lensRecommendation && (
                            <div className="pt-4 border-t border-black/5">
                              <p className="text-[10px] text-emerald-600 font-medium italic">
                                💡 {(result.exif as any).lensRecommendation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-6 pt-10 border-t border-black/5">
                        <div className="flex items-center gap-3 text-black/30">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">进化建议 / Suggestions</span>
                        </div>
                        <div className="grid gap-4">
                          {result.suggestions.slice(0, 2).map((s, i) => (
                            <div key={i} className="flex items-start gap-5 p-6 bg-black/[0.01] border border-black/5 rounded-[1.5rem] transition-all hover:bg-black/[0.02]">
                              <div className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-[10px] mt-0.5 shrink-0 font-bold">{i+1}</div>
                              <p className="text-sm text-black/50 leading-relaxed line-clamp-2">{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons: Moved Outside */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-8 flex gap-6"
                  >
                    <button 
                      onClick={() => setIsSharing(true)}
                      className="flex-1 btn-luxury h-20 flex items-center justify-center gap-4 text-lg tracking-widest shadow-xl"
                    >
                      <Share2 className="w-5 h-5" />
                      分享作品 / Share
                    </button>
                    <button 
                      onClick={() => { setSelectedImage(null); setResult(null); setClickPos(null); }}
                      className="px-12 h-20 border border-black/10 rounded-[2rem] text-sm font-medium hover:bg-black/5 transition-all uppercase tracking-widest bg-white/50 backdrop-blur-sm"
                    >
                      重置 / Reset
                    </button>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-8 p-16 border border-black/5 rounded-[2.5rem] bg-black/[0.01]">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <ImageIcon className="w-8 h-8 text-black/5" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-serif italic text-black/20">等待影像注入</h3>
                    <p className="text-[10px] text-black/10 max-w-[240px] leading-relaxed uppercase tracking-widest font-bold">Upload a photograph to reveal its aesthetic DNA</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
          <div className="h-24 shrink-0" /> {/* Symmetry Spacer */}
        </div>
      </section>
    </div>
  );
}

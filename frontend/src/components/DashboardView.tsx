import React from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Camera, 
  Award, 
  Clock, 
  ChevronRight,
  Star,
  Sparkles,
  Layout
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

interface DashboardViewProps {
  stats: {
    trend: { date: string; score: number }[];
    radar: { subject: string; A: number }[];
    totalAnalyses: number;
    avgScore: number;
  };
}

const DashboardView: React.FC<DashboardViewProps> = ({ stats }) => {
  const statCards = [
    { label: '累计分析', value: stats.totalAnalyses, icon: Camera, color: 'bg-black', trend: 'Total' },
    { label: '平均美学分', value: stats.avgScore.toFixed(1), icon: Award, color: 'bg-emerald-500', trend: 'Avg' },
    { label: '社区排名', value: 'Top 15%', icon: TrendingUp, color: 'bg-blue-500', trend: 'Rank' },
    { label: '获赞总数', value: '1.2k', icon: Sparkles, color: 'bg-purple-500', trend: 'Likes' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Layout className="text-white w-6 h-6" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-gray-900">个人看板</h1>
        </div>
        <p className="text-gray-600 font-serif italic">追踪您的美学成长轨迹，洞察视觉表达的深度。</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] luxury-shadow border border-black/5 flex flex-col gap-6"
          >
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/30 mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-serif font-bold text-gray-900">{stat.value}</h3>
                <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 luxury-shadow border border-black/5">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-2xl font-serif">美学趋势</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Aesthetic Growth Curve</p>
            </div>
            <div className="flex gap-2">
              <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest bg-black text-white rounded-full shadow-lg">Recent 7</button>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000005" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#00000040', fontWeight: 'bold' }}
                />
                <YAxis 
                  domain={[0, 10]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#00000040', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    padding: '15px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-[3rem] p-10 luxury-shadow border border-black/5">
          <div className="space-y-1 mb-10">
            <h3 className="text-2xl font-serif">美学基因</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Aesthetic DNA Profile</p>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.radar}>
                <PolarGrid stroke="#00000005" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fontSize: 10, fill: '#00000060', fontWeight: 'bold' }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Aesthetic"
                  dataKey="A"
                  stroke="#000000"
                  fill="#000000"
                  fillOpacity={0.05}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 pt-8 border-t border-black/5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-black/30">
              <span>Dominant Trait</span>
              <span className="text-black">色彩表达 (Color)</span>
            </div>
            <div className="mt-4 w-full h-1 bg-black/5 rounded-full overflow-hidden">
              <div className="w-[90%] h-full bg-black"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;

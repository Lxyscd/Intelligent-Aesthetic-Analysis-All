import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, AlertCircle, Info, Clock, RefreshCw } from 'lucide-react';

interface SystemLog {
  id: number;
  level: string;
  message: string;
  stackTrace?: string;
  source: string;
  createdAt: string;
}

export default function AdminView() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F0] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif italic mb-2">System Logs</h1>
            <p className="text-black/40 text-sm uppercase tracking-widest">Admin Dashboard</p>
          </div>
          <button 
            onClick={fetchLogs}
            className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-4">
          {logs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-black/[0.03]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    log.level === 'ERROR' ? 'bg-red-50 text-red-500' : 
                    log.level === 'WARN' ? 'bg-amber-50 text-amber-500' : 
                    'bg-blue-50 text-blue-500'
                  }`}>
                    {log.level === 'ERROR' ? <AlertCircle className="w-5 h-5" /> : 
                     log.level === 'WARN' ? <Info className="w-5 h-5" /> : 
                     <Terminal className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-wider">{log.level}</p>
                    <p className="text-[10px] text-black/40 uppercase tracking-widest">{log.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-black/40 font-bold uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
              
              <p className="text-sm text-black/70 mb-4">{log.message}</p>
              
              {log.stackTrace && (
                <details className="mt-4">
                  <summary className="text-[10px] font-bold uppercase tracking-widest text-black/40 cursor-pointer hover:text-black transition-colors">
                    View Stack Trace
                  </summary>
                  <pre className="mt-4 p-4 bg-black/5 rounded-2xl text-[10px] font-mono overflow-x-auto text-black/60">
                    {log.stackTrace}
                  </pre>
                </details>
              )}
            </motion.div>
          ))}
          
          {logs.length === 0 && !loading && (
            <div className="text-center py-20 opacity-20">
              <Terminal className="w-12 h-12 mx-auto mb-4" />
              <p className="uppercase tracking-[0.2em] text-xs font-bold">No logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

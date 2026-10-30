"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, HardDrive, Tag, Package, LockKeyhole } from "lucide-react";

interface DownloadItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
  version: string;
  file_size: string;
}

export default function DownloadsPage() {
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/downloads")
      .then(res => res.json())
      .then(data => {
        if (data.success) setItems(data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F5]">
       <div className="container mx-auto max-w-6xl px-6 pt-28 pb-20">
         <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-100 border-[3px] border-slate-900 rounded-full shadow-[3px_3px_0px_0px_#1E293B] font-bold text-sm"
            >
              <Package className="w-4 h-4 text-orange-600" />
              <span className="text-slate-900">Download Center</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Trung tâm <span className="text-cyan-500">Tải Xuống</span>
            </h1>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto font-medium">
              Cập nhật các phiên bản Mod Menu, Tools và Bot mới nhất.
            </p>
         </div>

         {loading ? (
           <div className="text-center">
              <div className="clay-card inline-flex items-center gap-3 px-8 py-4">
                <div className="w-6 h-6 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-600 font-bold">Đang tải danh sách...</span>
              </div>
           </div>
         ) : items.length === 0 ? (
           <div className="text-center">
              <div className="clay-card inline-block px-12 py-8">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400 italic font-medium">Chưa có bản tải xuống nào.</p>
              </div>
           </div>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {items.map((item, idx) => (
               <motion.div
                 key={item.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 whileHover={{ y: -4 }}
                 className="clay-card p-6 flex flex-col"
               >
                 <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] bg-slate-100 shrink-0">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-1 flex-wrap">
                            {item.version && (
                                <span className="flex items-center gap-1 bg-cyan-100 text-cyan-600 px-2 py-1 rounded-lg border-2 border-cyan-300">
                                    <Tag className="w-3 h-3" /> {item.version}
                                </span>
                            )}
                             {item.file_size && (
                                <span className="flex items-center gap-1 bg-slate-100 border-2 border-slate-200 px-2 py-1 rounded-lg">
                                    <HardDrive className="w-3 h-3" /> {item.file_size}
                                </span>
                            )}
                        </div>
                    </div>
                 </div>
                 
                 <p className="text-slate-600 text-sm mb-6 line-clamp-2 grow font-medium">
                    {item.description}
                 </p>

                 <a 
                    href="/tools"
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-cyan-500 text-white font-bold py-3 rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px flex items-center justify-center gap-2 transition-all"
                 >
                    <Download className="w-4 h-4" /> Tải Xuống
                 </a>
               </motion.div>
             ))}
           </div>
         )}
       </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, HardDrive, Tag } from "lucide-react";

interface DownloadItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
  download_url: string;
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
    <div className="min-h-screen bg-slate-50 py-12 px-4">
       <div className="container mx-auto max-w-6xl">
         <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Trung tâm <span className="text-blue-600">Tải Xuống</span>
            </h1>
            <p className="text-slate-500 text-lg">
              Cập nhật các phiên bản Mod Menu, Tools và Bot mới nhất.
            </p>
         </div>

         {loading ? (
           <div className="text-center text-slate-400">Đang tải danh sách...</div>
         ) : items.length === 0 ? (
           <div className="text-center text-slate-400 italic">Chưa có bản tải xuống nào.</div>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             {items.map((item, idx) => (
               <motion.div
                 key={item.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: idx * 0.1 }}
                 className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-lg hover:shadow-xl transition-all flex flex-col"
               >
                 <div className="flex items-start gap-4 mb-4">
                    <img src={item.image_url} alt={item.title} className="w-16 h-16 rounded-2xl object-cover bg-slate-100" />
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                            {item.version && (
                                <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                                    <Tag className="w-3 h-3" /> {item.version}
                                </span>
                            )}
                             {item.file_size && (
                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                                    <HardDrive className="w-3 h-3" /> {item.file_size}
                                </span>
                            )}
                        </div>
                    </div>
                 </div>
                 
                 <p className="text-slate-500 text-sm mb-6 line-clamp-2 grow">
                    {item.description}
                 </p>

                 <a 
                    href={item.download_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
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

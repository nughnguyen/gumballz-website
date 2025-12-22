"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  ArrowRight, 
  Layout,
  ShoppingCart,
  Download,
  Key,
  Globe
} from "lucide-react";
import Link from "next/link";

export default function HubPage() {
  const features = [
    {
      title: "Store & Payment",
      description: "Nạp Coiz tự động, an toàn và nhanh chóng 24/7.",
      icon: <ShoppingCart className="w-8 h-8 text-blue-500" />,
      href: "/store",
      color: "bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "Key System",
      description: "Quản lý và lấy key kích hoạt cho các sản phẩm.",
      icon: <Key className="w-8 h-8 text-purple-500" />,
      href: "/keys",
      color: "bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Downloads",
      description: "Tải xuống các phiên bản APK và Tools mới nhất.",
      icon: <Download className="w-8 h-8 text-green-500" />,
      href: "#", // Placeholder
      color: "bg-green-500/10 border-green-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-400/20 blur-[100px] rounded-full pointer-events-none" />

      <main className="relative z-10 container mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-bold shadow-sm mb-6 text-slate-600 border border-slate-200"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Secure Ecosystem Hub</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6"
          >
            GumballZ <span className="text-blue-600">System</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 font-medium leading-relaxed"
          >
            Trung tâm quản lý, thanh toán và phát triển công cụ cho hệ sinh thái GumballZ.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
            >
              <Link 
                href={feature.href}
                className={`group block p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 p-32 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 transition-colors ${feature.color.replace('border', 'bg').replace('/20', '')}`} />
                
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${feature.color} border`}>
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 font-medium pr-8">
                    {feature.description}
                  </p>

                  <div className="mt-8 flex items-center text-sm font-bold text-slate-400 group-hover:text-blue-500 transition-colors uppercase tracking-wider">
                    Truy cập <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 text-center text-slate-400 text-sm font-medium"
        >
          &copy; 2024 GumballZ System. All rights reserved. <br/>
          <span className="flex items-center justify-center gap-2 mt-2 opacity-50">
            <Globe className="w-3 h-3" /> Protected by GumballZ Security
          </span>
        </motion.div>
      </main>
    </div>
  );
}

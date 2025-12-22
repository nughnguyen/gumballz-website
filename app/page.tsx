"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Globe,
  Zap,
  Bot,
  Gamepad2,
  Cpu
} from "lucide-react";
import Link from "next/link";

export default function HubPage() {

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none" />
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-400/20 blur-[100px] rounded-full pointer-events-none" />

      <main className="relative z-10 container mx-auto px-6 py-24">
        {/* Header Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-bold shadow-sm mb-6 text-slate-600 border border-slate-200"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Secure Ecosystem Hub</span>
          </motion.div>
          
            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
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
              className="text-xl text-slate-500 font-medium leading-relaxed mb-10"
            >
              Hệ sinh thái toàn diện: Mod Menu, Discord Bot, và Tools hỗ trợ game thủ.
            </motion.p>
        </div>

        {/* Info / Ad Section - Replacing the old navigation cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Feature 1: Mod Menu */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-lg relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">GumballZ Mod Menu</h3>
              <p className="text-slate-500 mb-6">
                Trải nghiệm game đỉnh cao với Menu Mod an toàn, cập nhật liên tục. Hỗ trợ Hack Map, Cam xa và nhiều tính năng độc quyền.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Anti-Ban</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Auto-Update</span>
              </div>
            </div>
          </motion.div>

          {/* Feature 2: Discord Bot */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-lg relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
             <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Discord Bot</h3>
              <p className="text-slate-500 mb-6">
                Bot giải trí, quản lý server và tích hợp hệ thống thanh toán tự động. Mini-games câu cá, nối từ và nhiều hơn nữa.
              </p>
               <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">24/7 Hosting</span>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Economy</span>
              </div>
            </div>
          </motion.div>

           {/* Feature 3: Coiz System */}
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-8 md:p-12 shadow-xl relative overflow-hidden text-white"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-bold mb-4">
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span>Hệ thống thanh toán</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Nạp Coiz - Không giới hạn</h3>
                  <p className="text-blue-100 mb-8 max-w-xl mx-auto md:mx-0">
                    Sử dụng Coiz để mua Key Mod, vật phẩm trong game Discord và nhiều đặc quyền khác. Tỉ lệ nạp hấp dẫn, xử lý tự động trong tích tắc.
                  </p>
                  <Link href="/store" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
                    Nạp Ngay
                  </Link>
                </div>
                
                {/* Visual placeholder for Coiz/Payment */}
                <div className="w-full md:w-auto flex justify-center">
                   <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center transform rotate-6">
                      <span className="text-5xl font-black">C</span>
                   </div>
                </div>
             </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 text-center text-slate-400 text-sm font-medium"
        >
          &copy; 2024 GumballZ System. All rights reserved. <br/>
          <span className="flex items-center justify-center gap-2 mt-2 opacity-50">
            <Globe className="w-3 h-3" /> Protected by GumballZ Security • Powered by Nguyen Quoc Hung
          </span>
        </motion.div>
      </main>
    </div>
  );
}

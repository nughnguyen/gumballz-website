"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Code2,
  Terminal,
  Key,
  Shield,
  Zap,
  Cpu,
  Download,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function RobloxPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-red-200 rounded-full blur-[150px] opacity-30" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-200 rounded-full blur-[150px] opacity-30" />
      </div>

      <main className="relative z-10 pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 border-2 border-slate-900 rounded-full font-bold text-red-600 text-sm shadow-[3px_3px_0px_0px_#1E293B]"
            >
              <Terminal className="w-4 h-4" />
              <span>Roblox Scripting Hub</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-slate-900"
            >
              GumballZ <span className="text-red-500">Roblox</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 max-w-2xl mx-auto font-medium"
            >
              Thư viện script mạnh mẽ, tối ưu hóa cho mọi tựa game. Tự do sáng
              tạo và thống trị server với GumballZ Library.
            </motion.p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid lg:grid-cols-2 gap-8 mb-20">
            {/* Documentation Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="clay-card p-10 bg-white group hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-blue-100 border-[3px] border-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1E293B]">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <div className="px-3 py-1 bg-blue-500 text-white text-xs font-bold border-2 border-slate-900 rounded-full shadow-[2px_2px_0px_0px_#1E293B]">
                  LEARN
                </div>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">
                Documentation
              </h3>
              <p className="text-slate-600 font-medium mb-8 text-lg">
                Hướng dẫn chi tiết cách sử dụng GumballZ Library. API
                references, examples và best practices cho developers.
              </p>

              <Link
                href="/roblox/docs"
                className="inline-flex w-full items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white font-bold rounded-xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#94A3B8] hover:shadow-[2px_2px_0px_0px_#94A3B8] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <span>Xem Tài Liệu</span>
                <ExternalLink className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Get Key Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="clay-card p-10 bg-white group hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-red-100 border-[3px] border-slate-900 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_#1E293B]">
                  <Key className="w-8 h-8 text-red-600" />
                </div>
                <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold border-2 border-slate-900 rounded-full shadow-[2px_2px_0px_0px_#1E293B]">
                  REQUIRED
                </div>
              </div>

              <h3 className="text-3xl font-black text-slate-900 mb-4 group-hover:text-red-500 transition-colors">
                Get Script Key
              </h3>
              <p className="text-slate-600 font-medium mb-8 text-lg">
                Lấy key kích hoạt script. Miễn phí với quảng cáo hoặc mua key
                VIP để bỏ qua link rút gọn và hỗ trợ dev.
              </p>

              <Link
                href="/keys?type=roblox"
                className="inline-flex w-full items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white font-bold rounded-xl border-[3px] border-slate-900 shadow-[4px_4px_0px_0px_#1E293B] hover:shadow-[2px_2px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <span>Lấy Key Ngay</span>
                <Zap className="w-5 h-5 fill-current" />
              </Link>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="clay-card p-6 bg-slate-50">
              <Shield className="w-10 h-10 text-slate-900 mb-4" />
              <h4 className="text-xl font-black text-slate-900 mb-2">
                Secure Execution
              </h4>
              <p className="text-slate-600 text-sm">
                Được bảo vệ bởi hệ thống anti-tamper và obfuscation hàng đầu.
              </p>
            </div>

            <div className="clay-card p-6 bg-slate-50">
              <Cpu className="w-10 h-10 text-slate-900 mb-4" />
              <h4 className="text-xl font-black text-slate-900 mb-2">
                Optimized Core
              </h4>
              <p className="text-slate-600 text-sm">
                Hiệu suất cao, nhẹ nhàng và không gây drop FPS khi sử dụng.
              </p>
            </div>

            <div className="clay-card p-6 bg-slate-50">
              <Code2 className="w-10 h-10 text-slate-900 mb-4" />
              <h4 className="text-xl font-black text-slate-900 mb-2">
                Easy API
              </h4>
              <p className="text-slate-600 text-sm">
                API đơn giản, dễ học cho người mới bắt đầu viết script.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

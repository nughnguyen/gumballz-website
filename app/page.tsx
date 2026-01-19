"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Gamepad2,
  Bot,
  Star,
  Sparkles,
  Target,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  Crown,
  Gem,
  Zap,
  Rocket,
  Trophy,
  Clock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HubPage() {

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-cyan-200 rounded-full blur-[120px] opacity-40" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-200 rounded-full blur-[120px] opacity-40" />
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-200 rounded-full blur-[120px] opacity-40" />
      </div>

      <main className="relative z-10">
        {/* Hero Section - Cream/Beige Background */}
        <section className="bg-[#FFF9F5] px-6 py-12 pt-28">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
              {/* Content */}
              <div className="space-y-8">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm mx-auto"
                >
                  <Bot className="w-4 h-4 text-cyan-600" />
                  <span className="text-slate-900 font-bold text-sm">Hệ sinh thái dịch vụ Roblox & Game Mobile</span>
                </motion.div>

                {/* Headline */}
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-black leading-tight text-slate-900"
                >
                  Nâng Tầm Trải Nghiệm <br />
                  <span className="text-cyan-500">GumballZ Hub</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium"
                >
                  Cung cấp giải pháp toàn diện cho game thủ: Mod Menu cao cấp, Roblox Scripts tối ưu, hệ thống Coiz tiện lợi và kho Minigames giải trí đa dạng.
                </motion.p>

                {/* Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap justify-center gap-4"
                >
                  <Link
                    href="/keys"
                    className="clay-button inline-flex items-center gap-2 text-lg px-8 py-4"
                  >
                    <Sparkles className="w-6 h-6" />
                    Lấy Key Miễn Phí
                  </Link>
                  <Link
                    href="/roblox"
                    className="clay-button-secondary inline-flex items-center gap-2 text-lg px-8 py-4"
                  >
                    Khám Phá Roblox Hub
                  </Link>
                </motion.div>

                {/* Stats */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap justify-center gap-10 pt-8"
                >
                  <div className="text-center">
                    <div className="text-4xl font-black text-slate-900">100k+</div>
                    <div className="text-sm text-slate-600 font-bold uppercase tracking-wide mt-1">Người Dùng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-slate-900">24/7</div>
                    <div className="text-sm text-slate-600 font-bold uppercase tracking-wide mt-1">Hỗ Trợ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-slate-900">Top 1</div>
                    <div className="text-sm text-slate-600 font-bold uppercase tracking-wide mt-1">Uy Tín</div>
                  </div>
                </motion.div>
              </div>

              {/* Right: Floating Dashboard Card - REMOVED per request */}
              
            </div>
          </div>
        </section>

        {/* Popular Features Section - White Background */}
        <section className="bg-white px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="container mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4" id="features">
                Tính Năng <span className="text-cyan-500">Nổi Bật</span>
              </h2>
              <p className="text-lg text-slate-600 font-medium">
                Khám phá hệ sinh thái dịch vụ đa dạng và mạnh mẽ của GumballZ
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature Card 1: Minigames Hub */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="clay-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-pink-300 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Minigames Hub</h3>
                      <p className="text-sm text-slate-600">Thế giới giải trí</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-200 border-2 border-slate-900 rounded-full">
                    <Sparkles className="w-4 h-4 text-slate-900" />
                    <span className="text-sm font-bold text-slate-900">HOT</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Trải nghiệm kho game đa dạng tại GumballZ Games! Tranh tài cùng bạn bè, leo bảng xếp hạng và rinh về ngàn phần quà giá trị mỗi ngày.
                </p>
                <Link
                  href="https://gumballzgames.vercel.app"
                  target="_blank"
                  className="w-full py-2.5 bg-cyan-500 text-white font-bold rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_#1E293B] transition-all text-center block text-sm"
                >
                  Chơi Ngay
                </Link>
              </motion.div>

              {/* Feature Card 2: Coiz System */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="clay-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-300 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center">
                      <Gem className="w-8 h-8 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Hệ Thống Coiz</h3>
                      <p className="text-sm text-slate-600">Tiền tệ quyền năng</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-yellow-200 border-2 border-slate-900 rounded-full">
                    <Trophy className="w-4 h-4 text-slate-900 fill-slate-900" />
                    <span className="text-sm font-bold text-slate-900">NEW</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Nạp Coiz dễ dàng, tích lũy không giới hạn. Sử dụng Coiz để đổi Key VIP, mua vật phẩm giới hạn và tận hưởng đặc quyền thượng đỉnh.
                </p>
                <Link
                  href="/store"
                  className="w-full py-2.5 bg-cyan-500 text-white font-bold rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_#1E293B] transition-all text-center block text-sm"
                >
                  Nạp Coiz
                </Link>
              </motion.div>

              {/* Feature Card 3: Auto Payment */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="clay-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-yellow-300 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center">
                      <Zap className="w-8 h-8 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Auto Payment</h3>
                      <p className="text-sm text-slate-600">Xử lý siêu tốc</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-cyan-200 border-2 border-slate-900 rounded-full">
                    <Rocket className="w-4 h-4 text-slate-900" />
                    <span className="text-sm font-bold text-slate-900">FAST</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Hệ thống thanh toán tự động 24/7 qua QR Code. An toàn tuyệt đối, giao dịch trong vài giây và nhận ngay Coiz/Key vào tài khoản.
                </p>
                <Link
                  href="/history"
                  className="w-full py-2.5 bg-cyan-500 text-white font-bold rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_#1E293B] transition-all text-center block text-sm"
                >
                  Tra Cứu
                </Link>
              </motion.div>

              {/* Feature Card 4: Community */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="clay-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-cyan-200 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center">
                      <Users className="w-8 h-8 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Cộng Đồng</h3>
                      <p className="text-sm text-slate-600">Discord lớn mạnh</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-purple-200 border-2 border-slate-900 rounded-full">
                    <Users className="w-4 h-4 text-slate-900" />
                    <span className="text-sm font-bold text-slate-900">ACTIVE</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Gia nhập ngôi nhà chung GumballZ Hub. Nơi quy tụ anh em game thủ, cùng nhau chia sẻ tool, giao lưu kết bạn và nhận giveaway mỗi tuần.
                </p>
                <Link
                  href="https://discord.gg/gumballz"
                  target="_blank"
                  className="w-full py-2.5 bg-cyan-500 text-white font-bold rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_#1E293B] transition-all text-center block text-sm"
                >
                  Tham Gia
                </Link>
              </motion.div>

              {/* Feature Card 5: Support */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="clay-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-300 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Hỗ Trợ 24/7</h3>
                      <p className="text-sm text-slate-600">Tận tâm & Uy tín</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-cyan-200 border-2 border-slate-900 rounded-full">
                    <Clock className="w-4 h-4 text-slate-900" />
                    <span className="text-sm font-bold text-slate-900">24/7</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Đội ngũ Support chuyên nghiệp luôn túc trực để giải đáp mọi thắc mắc và xử lý các vấn đề kỹ thuật của bạn một cách nhanh nhất.
                </p>
                <Link
                  href="https://discord.gg/gumballz"
                  target="_blank"
                  className="w-full py-2.5 bg-cyan-500 text-white font-bold rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_#1E293B] transition-all text-center block text-sm"
                >
                  Liên Hệ
                </Link>
              </motion.div>

              {/* Feature Card 6: Docs */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="clay-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-orange-300 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Tài Liệu</h3>
                      <p className="text-sm text-slate-600">Wiki hướng dẫn</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-200 border-2 border-slate-900 rounded-full">
                    <BookOpen className="w-4 h-4 text-slate-900" />
                    <span className="text-sm font-bold text-slate-900">DOCS</span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm font-medium">
                  Thư viện kiến thức chi tiết từ A-Z. Hướng dẫn sử dụng Mod Menu, viết Script và tích hợp API cho Developers. Đầy đủ và dễ hiểu.
                </p>
                <Link
                  href="/roblox/docs"
                  className="w-full py-2.5 bg-cyan-500 text-white font-bold rounded-xl border-[3px] border-slate-900 shadow-[3px_3px_0px_0px_#1E293B] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_0px_#1E293B] transition-all text-center block text-sm"
                >
                  Xem Docs
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Why Choose Us Section - Cream/Beige Background */}
        <section className="bg-[#FFF9F5] px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="container mx-auto"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                Tại Sao Chọn <span className="text-cyan-500">GumballZ Hub?</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Hàng ngàn game thủ đã tin tưởng và sử dụng GumballZ Hub
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Feature 1 */}
              <div className="clay-card p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-cyan-200 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-10 h-10 text-slate-900" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Anti-Ban 100%</h3>
                <p className="text-slate-600">
                  Công nghệ bảo mật tiên tiến đảm bảo tài khoản của bạn luôn an toàn. 
                  Chúng tôi cam kết bảo vệ game thủ với tỷ lệ thành công 100%.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="clay-card p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-purple-200 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center mx-auto">
                  <Zap className="w-10 h-10 text-slate-900" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Cập Nhật Liên Tục</h3>
                <p className="text-slate-600">
                  Luôn cập nhật các tính năng mới nhất và vá lỗi thường xuyên. 
                  Đội ngũ phát triển làm việc 24/7 để mang đến trải nghiệm tốt nhất.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="clay-card p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-pink-200 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center mx-auto">
                  <Users className="w-10 h-10 text-slate-900" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Hỗ Trợ 24/7</h3>
                <p className="text-slate-600">
                  Đội ngũ hỗ trợ chuyên nghiệp luôn sẵn sàng giải đáp mọi thắc mắc. 
                  Phản hồi nhanh chóng qua Discord, Email và Live Chat.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="clay-card p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-yellow-200 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center mx-auto">
                  <Trophy className="w-10 h-10 text-slate-900" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Hiệu Suất Cao</h3>
                <p className="text-slate-600">
                  Tối ưu hóa hiệu suất để không ảnh hưởng đến FPS khi chơi game. 
                  Mod menu hoạt động mượt mà trên mọi thiết bị.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="clay-card p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-green-200 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center mx-auto">
                  <Award className="w-10 h-10 text-slate-900" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Dễ Sử Dụng</h3>
                <p className="text-slate-600">
                  Giao diện thân thiện, dễ dàng cài đặt chỉ trong 3 bước đơn giản. 
                  Không cần kiến thức kỹ thuật, ai cũng có thể sử dụng.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="clay-card p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-orange-200 border-[3px] border-slate-900 rounded-2xl shadow-[3px_3px_0px_0px_#1E293B] flex items-center justify-center mx-auto">
                  <Rocket className="w-10 h-10 text-slate-900" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Giá Cả Hợp Lý</h3>
                <p className="text-slate-600">
                  Gói dịch vụ linh hoạt phù hợp với mọi túi tiền. 
                  Cam kết hoàn tiền 100% nếu không hài lòng.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Final CTA - Light Cyan/Blue Background */}
        <section className="bg-cyan-50 px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="container mx-auto"
          >
            <div className="clay-card p-12 md:p-16 text-center bg-gradient-to-br from-cyan-100 to-cyan-200 relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-300/30 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300/30 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 border-2 border-slate-900 rounded-full font-bold text-white text-sm mb-8 shadow-[3px_3px_0px_0px_#1E293B]">
                  <Crown className="w-4 h-4" />
                  Ưu Đãi Đặc Biệt
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6">
                  Sẵn Sàng Bắt Đầu Chưa?
                </h2>
                <p className="text-xl text-slate-700 mb-10 max-w-2xl mx-auto font-medium">
                  Tham gia cùng 2 triệu+ game thủ đang sử dụng GumballZ Hub. 
                  Trải nghiệm miễn phí ngay hôm nay!
                </p>
                <div className="flex flex-wrap gap-4 justify-center mb-12">
                  <Link
                    href="/store"
                    className="px-10 py-4 bg-cyan-500 text-white font-black rounded-2xl border-[3px] border-slate-900 shadow-[5px_5px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#1E293B] transition-all text-lg inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-6 h-6" />
                    Bắt Đầu Miễn Phí
                  </Link>
                  <Link
                    href="/contact"
                    className="px-10 py-4 bg-white text-slate-900 font-black rounded-2xl border-[3px] border-slate-900 shadow-[5px_5px_0px_0px_#1E293B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#1E293B] transition-all text-lg"
                  >
                    Liên Hệ Hỗ Trợ
                  </Link>
                </div>
                
                {/* Features List */}
                <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 text-slate-900 justify-center">
                    <div className="w-10 h-10 bg-cyan-500 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1E293B]">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">Anti-Ban 100%</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-900 justify-center">
                    <div className="w-10 h-10 bg-cyan-500 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1E293B]">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">Cập Nhật Liên Tục</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-900 justify-center">
                    <div className="w-10 h-10 bg-cyan-500 border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_#1E293B]">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">Hỗ Trợ 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

      </main>
    </div>
  );
}

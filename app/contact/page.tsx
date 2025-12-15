import Link from "next/link";
import { ArrowLeft, Mail, Github, MessageCircle, ExternalLink, User } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-800 flex flex-col">
      <div className="max-w-4xl mx-auto px-4 py-12 w-full flex-1">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Developer Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1 mb-6 shadow-xl shadow-blue-500/20">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <User className="w-16 h-16 text-slate-300" />
                        {/* If you have an avatar URL, replace User icon with <img src="..." /> */}
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Nguyễn Quốc Hưng</h1>
                <p className="text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full text-sm inline-block mb-6">
                    Multi-field Developer
                </p>
                
                <p className="text-slate-500 mb-8 leading-relaxed max-w-sm">
                    Tác giả của hệ sinh thái GumballZ và hệ thống thanh toán tự động. Đam mê xây dựng các sản phẩm công nghệ hữu ích cho cộng đồng.
                </p>

                <div className="flex gap-4">
                    <a 
                        href="https://github.com/nughnguyen" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-900 hover:text-white transition-all duration-300"
                    >
                        <Github className="w-6 h-6" />
                    </a>
                    <a 
                        href="https://discord.com/users/561443914062757908" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                    >
                        <MessageCircle className="w-6 h-6" />
                    </a>
                    <a 
                        href="mailto:hungnq.august.work@gmail.com" 
                        className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300"
                    >
                        <Mail className="w-6 h-6" />
                    </a>
                </div>
            </div>

            {/* Links & Portfolio */}
            <div className="space-y-6">
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                        Thông tin liên hệ
                    </h2>
                    
                    <div className="space-y-6">
                        <ContactItem 
                            icon={<MessageCircle className="w-5 h-5" />}
                            label="Discord Support"
                            value="NughNguyen#0000"
                            link="https://discord.com/users/561443914062757908"
                        />
                        <ContactItem 
                            icon={<Github className="w-5 h-5" />}
                            label="Github Repositories"
                            value="github.com/nughnguyen"
                            link="https://github.com/nughnguyen"
                        />
                         <ContactItem 
                            icon={<Mail className="w-5 h-5" />}
                            label="Email"
                            value="hungnq.august.work@gmail.com"
                            link="mailto:hungnq.august.work@gmail.com"
                        />
                    </div>
                </div>

                <a 
                    href="https://quochung.id.vn" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-600/20 group hover:shadow-blue-600/30 transition-all"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">Xem Portfolio</h3>
                        <ExternalLink className="w-5 h-5 opacity-80 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-blue-100 text-sm">Khám phá các dự án cá nhân và kỹ năng lập trình của tôi.</p>
                </a>
            </div>
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value, link }: { icon: React.ReactNode, label: string, value: string, link: string }) {
    return (
        <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group p-3 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                {icon}
            </div>
            <div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-0.5">{label}</div>
                <div className="text-slate-800 font-semibold group-hover:text-blue-700 transition-colors">{value}</div>
            </div>
        </a>
    )
}

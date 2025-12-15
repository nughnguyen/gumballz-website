import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-800">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Chính Sách Bảo Mật</h1>
          </div>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">1. Thu thập thông tin</h2>
              <p>
                Để thực hiện giao dịch, chúng tôi chỉ thu thập và lưu trữ các thông tin cần thiết tối thiểu, bao gồm:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Discord ID:</strong> Để xác định tài khoản nhận Coinz.</li>
                <li><strong>Mã giao dịch ngân hàng:</strong> Để đối soát và xử lý nạp tiền tự động.</li>
                <li><strong>Lịch sử nạp:</strong> Thời gian và số tiền nạp để phục vụ việc tra cứu và hỗ trợ.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">2. Sử dụng thông tin</h2>
              <p>
                Thông tin của bạn chỉ được sử dụng cho mục đích duy nhất là xử lý giao dịch nạp Coinz vào hệ thống Bot Discord. Chúng tôi <strong>tuyệt đối không</strong> chia sẻ, bán hoặc trao đổi thông tin cá nhân của bạn với bất kỳ bên thứ ba nào.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">3. Bảo mật dữ liệu</h2>
              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Lock className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <p className="text-sm">
                    Mọi dữ liệu giao dịch đều được mã hóa và lưu trữ an toàn trên hệ thống cơ sở dữ liệu của Supabase. Chúng tôi áp dụng các biện pháp kỹ thuật để ngăn chặn truy cập trái phép.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">4. Quyền của người dùng</h2>
              <p>
                Bạn có quyền yêu cầu chúng tôi cung cấp thông tin về lịch sử giao dịch của mình hoặc yêu cầu xóa dữ liệu cá nhân (nếu không ảnh hưởng đến tính toàn vẹn của hệ thống quản lý số dư) bằng cách liên hệ với quản trị viên.
              </p>
            </section>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
            Hiệu lực từ: 15/12/2025
          </div>
        </div>
      </div>
    </div>
  );
}

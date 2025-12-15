import Link from "next/link";
import { ArrowLeft, Shield, FileText } from "lucide-react";

export default function TermsPage() {
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
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <FileText className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Điều Khoản Sử Dụng</h1>
          </div>

          <div className="prose prose-slate max-w-none space-y-6 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">1. Giới thiệu</h2>
              <p>
                Chào mừng bạn đến với GumballZ Payment Gateway. Khi sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản được quy định dưới đây. Hệ thống này được xây dựng nhằm mục đích giải trí trong cộng đồng Discord.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">2. Quy định nạp Coinz</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Coinz là đơn vị tiền tệ ảo chỉ có giá trị sử dụng trong hệ thống bot Discord GumballZ.</li>
                <li>Coinz <strong>không</strong> có giá trị quy đổi ngược lại thành tiền mặt hoặc các loại tài sản thực khác.</li>
                <li>Mọi giao dịch nạp Coinz là tự nguyện và không thể hoàn tiền (non-refundable) sau khi đã thanh toán thành công.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">3. Trách nhiệm người dùng</h2>
              <p>
                Bạn chịu trách nhiệm bảo mật thông tin tài khoản Discord của mình. Chúng tôi không chịu trách nhiệm cho bất kỳ tổn thất nào do việc bạn để lộ thông tin hoặc nhập sai ID người nhận khi thực hiện giao dịch.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">4. Xử lý sự cố</h2>
              <p>
                Trong trường hợp chuyển khoản nhưng không nhận được Coinz sau 15 phút, vui lòng liên hệ với đội ngũ hỗ trợ qua kênh Discord hoặc mục Liên hệ trên website để được giải quyết. Bạn cần cung cấp mã giao dịch và bằng chứng thanh toán.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-3">5. Thay đổi điều khoản</h2>
              <p>
                Chúng tôi có quyền thay đổi, cập nhật các điều khoản này bất cứ lúc nào mà không cần báo trước. Việc bạn tiếp tục sử dụng dịch vụ đồng nghĩa với việc chấp thuận các thay đổi đó.
              </p>
            </section>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
            Cập nhật lần cuối: 15/12/2025
          </div>
        </div>
      </div>
    </div>
  );
}

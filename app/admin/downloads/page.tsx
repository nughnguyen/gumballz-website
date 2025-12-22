"use client";

import { useState } from "react";
import { Download, Plus, Save, Lock, Layout } from "lucide-react";

export default function AdminDownloads() {
  const [secret, setSecret] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    download_url: "",
    version: "",
    file_size: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, secret })
      });
      const result = await res.json();
      
      if (result.success) {
        alert("Đã thêm bản tải xuống thành công!");
        setFormData({ title: "", description: "", image_url: "", download_url: "", version: "", file_size: "" });
      } else {
        alert("Lỗi: " + result.error);
      }
    } catch (err) {
      alert("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
       <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Layout className="text-green-500" /> Quản Lý Downloads
        </h1>

        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Admin Secret</label>
              <input type="password" required value={secret} onChange={e => setSecret(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" placeholder="gumballzAdminSecret123" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Tên App/Tool</label>
                   <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" placeholder="GumballZ Mod Menu" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-400 mb-1">Phiên Bản</label>
                   <input type="text" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" placeholder="v1.0.5" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Mô tả ngắn</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" placeholder="Hack map, anti-ban,..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ảnh Icon (Link hoặc Upload)</label>
              <div className="flex gap-2">
                 <input type="text" required value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})}
                  className="grow bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" placeholder="https://... hoặc upload ảnh bên cạnh" />
                 
                 <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                setFormData({...formData, image_url: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                        }
                    }} />
                 </label>
              </div>
              {formData.image_url && formData.image_url.startsWith("data:") && (
                  <img src={formData.image_url} alt="Preview" className="w-16 h-16 mt-2 rounded-xl object-cover border border-slate-600" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Link Tải (APK/File)</label>
                    <input type="url" required value={formData.download_url} onChange={e => setFormData({...formData, download_url: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" placeholder="https://mediafire..." />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Dung lượng</label>
                    <input type="text" value={formData.file_size} onChange={e => setFormData({...formData, file_size: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2" placeholder="50 MB" />
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                {loading ? "Đang lưu..." : <><Plus className="w-5 h-5" /> Thêm mới </>}
            </button>
        </form>
       </div>
    </div>
  );
}

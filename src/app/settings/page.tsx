"use client";
import React, { useState, useEffect } from "react";
import Head from "next/head";

export default function SettingsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPassword, setSenderPassword] = useState("");
  const [managersBcc, setManagersBcc] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const resC = await fetch("/api/contacts");
      const dataC = await resC.json();
      if (dataC.contacts) setContacts(dataC.contacts);

      const resS = await fetch("/api/settings");
      const dataS = await resS.json();
      setSenderEmail(dataS.senderEmail || "");
      setSenderPassword(dataS.senderPassword || "");
      setManagersBcc(dataS.managersBcc || "");
    } catch (e) {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setLoading(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setName("");
      setEmail("");
      fetchData();
    } else {
      alert(data.error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa liên hệ này?")) return;
    await fetch(`/api/contacts?id=${id}`, { method: "DELETE" });
    fetchData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderEmail, senderPassword, managersBcc })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) setMessage("Lưu cấu hình thành công!");
    else setMessage("Lỗi: " + data.error);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <Head><title>Cấu hình Cảnh báo & Email</title></Head>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">⚙️ Cấu hình Cảnh báo & Email</h1>
          <a href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-700 shadow-lg font-semibold transition-all flex items-center gap-2">⬅️ Trở về Dashboard</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Cài đặt Server */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col h-full">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">📧 Tài khoản Gửi Email (Bot)</h2>
            <p className="text-sm text-gray-400 mb-4">Hệ thống sẽ sử dụng tài khoản Gmail này để tự động gửi thông báo đến nhân viên. Bạn cần tạo App Password (Mật khẩu ứng dụng) cho Gmail này.</p>
            
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4 flex-grow">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Gmail gửi đi</label>
                <input type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} placeholder="bot.canhbao@gmail.com" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Mật khẩu ứng dụng (App Password)</label>
                <input type="password" value={senderPassword} onChange={e => setSenderPassword(e.target.value)} placeholder="xxxx xxxx xxxx xxxx" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Email Quản lý (BCC) - Tùy chọn</label>
                <input type="text" value={managersBcc} onChange={e => setManagersBcc(e.target.value)} placeholder="Ngăn cách bằng dấu phẩy: a@..., b@..." className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                <p className="text-xs text-gray-500 mt-1">Các email này sẽ nhận được 1 bản sao ẩn danh (BCC) của mọi thư cảnh báo.</p>
              </div>
              
              <div className="mt-auto pt-4">
                <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2">
                  {loading ? "⏳ Đang lưu..." : "💾 Lưu Cấu Hình Server"}
                </button>
                {message && <div className="text-center text-sm font-semibold text-emerald-400 mt-3 bg-emerald-400/10 py-2 rounded-lg">{message}</div>}
              </div>
            </form>
          </div>

          {/* Danh bạ */}
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col h-full">
            <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">👥 Danh bạ Nhân viên</h2>
            <p className="text-sm text-gray-400 mb-4">Ánh xạ Tên nhân viên (phải nhập khớp với tên trên báo cáo) sang địa chỉ Email nhận thông báo.</p>
            
            <form onSubmit={handleAddContact} className="flex flex-col gap-3 mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700 shadow-inner">
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Tên nhân viên (VD: Nguyễn Văn A)" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm transition-colors" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Địa chỉ Email (VD: a@gmail.com)" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 text-sm transition-colors" />
              <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm shadow-md transition-all flex justify-center items-center gap-2">
                ➕ Thêm Liên Hệ
              </button>
            </form>

            <div className="flex-grow max-h-[300px] overflow-y-auto pr-2 custom-scrollbar bg-gray-900/30 rounded-xl border border-gray-700/50 p-2">
              {contacts.length === 0 && <p className="text-gray-500 text-center py-8 font-medium">Chưa có liên hệ nào trong danh bạ.</p>}
              {contacts.map(c => (
                <div key={c.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 mb-2 shadow-sm hover:border-gray-600 transition-colors">
                  <div>
                    <div className="font-bold text-gray-200">{c.name}</div>
                    <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">✉️ {c.email}</div>
                  </div>
                  <button onClick={() => handleDeleteContact(c.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-2 rounded-lg transition-all font-semibold text-sm border border-transparent hover:border-red-400/30">
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}} />
    </div>
  );
}

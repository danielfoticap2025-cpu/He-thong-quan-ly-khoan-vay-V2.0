"use client";
import React, { useState, useEffect } from "react";
import Head from "next/head";

export default function SettingsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPassword, setSenderPassword] = useState("");
  const [managersBcc, setManagersBcc] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      const resC = await fetch("/api/companies");
      const dataC = await resC.json();
      if (dataC.companies) setCompanies(dataC.companies);

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

  const handleSaveCompany = async (id: string) => {
    setLoading(true);
    const res = await fetch("/api/companies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, phuTrachName: editName, phuTrachEmail: editEmail })
    });
    const data = await res.json();
    setLoading(false);
    
    if (data.success) {
      setEditingId(null);
      fetchData();
    } else {
      alert(data.error);
    }
  };

  const startEditing = (company: any) => {
    setEditingId(company.id);
    setEditName(company.phuTrachName || "");
    setEditEmail(company.phuTrachEmail || "");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <Head><title>Cấu hình Cảnh báo & Email</title></Head>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">⚙️ Cấu hình Hệ thống Cảnh báo</h1>
          <a href="/" className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg border border-gray-700 shadow-lg font-semibold transition-all flex items-center gap-2">⬅️ Trở về Dashboard</a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cài đặt Server */}
          <div className="lg:col-span-1 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col h-fit">
            <h2 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">📧 Tài khoản Gửi Email (Bot)</h2>
            <p className="text-sm text-gray-400 mb-4">Hệ thống sẽ dùng Gmail này để tự động gửi thông báo.</p>
            
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-4">
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
              </div>
              
              <div className="pt-2">
                <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2">
                  {loading ? "⏳ Đang lưu..." : "💾 Lưu Cấu Hình Server"}
                </button>
                {message && <div className="text-center text-sm font-semibold text-emerald-400 mt-3 bg-emerald-400/10 py-2 rounded-lg">{message}</div>}
              </div>
            </form>
          </div>

          {/* Danh sách Công ty */}
          <div className="lg:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col h-full">
            <h2 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">🏢 Gán Nhân viên theo Công ty</h2>
            <p className="text-sm text-gray-400 mb-4">Các khoản vay của Công ty nào sẽ được gửi thẳng vào Email của nhân viên được gán ở đây.</p>
            
            <div className="flex-grow max-h-[600px] overflow-y-auto pr-2 custom-scrollbar bg-gray-900/30 rounded-xl border border-gray-700/50 p-2">
              {companies.length === 0 && <p className="text-gray-500 text-center py-8 font-medium">Chưa có công ty nào được lấy về từ RPA.</p>}
              
              {companies.map(c => (
                <div key={c.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-3 shadow-sm hover:border-gray-600 transition-colors">
                  {editingId === c.id ? (
                    <div className="flex flex-col gap-3">
                      <div className="font-bold text-blue-300 text-lg">{c.name} {c.companyName ? `(${c.companyName})` : ''}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Tên nhân viên phụ trách" className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 text-sm" />
                        <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Địa chỉ Email" className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 text-sm" />
                      </div>
                      <div className="flex gap-2 justify-end mt-1">
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors">Hủy</button>
                        <button onClick={() => handleSaveCompany(c.id)} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 font-bold rounded-lg text-sm transition-colors">Lưu lại</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                      <div>
                        <div className="font-bold text-gray-200 text-lg">{c.name} {c.companyName ? `(${c.companyName})` : ''}</div>
                        <div className="text-sm mt-2 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-24">Phụ trách:</span> 
                            <span className={c.phuTrachName ? "text-blue-300 font-semibold" : "text-gray-600 italic"}>{c.phuTrachName || "Chưa gán"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-24">Email:</span> 
                            <span className={c.phuTrachEmail ? "text-emerald-300" : "text-gray-600 italic"}>{c.phuTrachEmail || "Chưa gán"}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => startEditing(c)} className="w-fit h-fit text-blue-400 hover:text-blue-300 bg-blue-400/10 hover:bg-blue-400/20 px-4 py-2 rounded-lg transition-all font-semibold text-sm border border-transparent hover:border-blue-400/30 whitespace-nowrap">
                        ✏️ Chỉnh sửa
                      </button>
                    </div>
                  )}
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

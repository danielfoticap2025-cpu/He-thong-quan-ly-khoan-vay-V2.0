"use client";

import { useEffect, useState, useMemo } from "react";
interface SheetMetadata {
  id: string;
  name: string;
  companyName: string;
}

interface Loan {
  stt?: string;
  ngayVay?: string;
  ngayDenHan?: string;
  soTien?: string;
  loaiTien?: string;
  donVi?: string;
  thoiHan?: string;
  laiSuat?: string;
  laiCongDon?: string;
}

function isDueSoon(dateStr: string) {
  if (!dateStr) return false;
  const parts = dateStr.split("/");
  let dueDateObj: Date;
  if (parts.length === 3) {
    dueDateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  } else {
    dueDateObj = new Date(dateStr);
  }
  if (isNaN(dueDateObj.getTime())) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = dueDateObj.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 10;
}

export default function Home() {
  const [sheets, setSheets] = useState<SheetMetadata[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<SheetMetadata | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  
  const [loans, setLoans] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedBankTab, setSelectedBankTab] = useState<string>("VCB");

  const [exchangeRate, setExchangeRate] = useState<number>(25000);
  const [globalSummary, setGlobalSummary] = useState<any>(null);

  const localSummary = useMemo(() => {
    let totalVND = 0;
    let totalUSD = 0;
    loans.forEach(loan => {
       const amountStr = (loan.soTien || "").replace(/\./g, "").trim();
       const amount = parseInt(amountStr, 10);
       if (!isNaN(amount)) {
          const type = (loan.loaiTien || "").toString().trim().toUpperCase();
          if (type === "USD") totalUSD += amount;
          else totalVND += amount;
       }
    });
    return {
      totalVND,
      totalUSD,
      totalConvertedVND: totalVND + (totalUSD * exchangeRate),
      exchangeRate
    };
  }, [loans, exchangeRate]);

  const fetchGlobalSummary = async () => {
    try {
      const res = await fetch("/api/summary", { cache: 'no-store' });
      if (res.ok) {
        setGlobalSummary(await res.json());
      }
    } catch(e) {}
  };

  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n || 0);

  const formatLoanMoney = (val: string) => {
    if (!val) return "-";
    const num = parseInt(val.replace(/\./g, "").trim(), 10);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const formatInterest = (val: string) => {
    if (!val || val === "0" || val === "-") return "-";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num) + '%';
  };

  const filteredLoans = useMemo(() => {
    if (selectedBankTab === "ALL") return loans;
    return loans.filter(loan => (loan.donVi || "").toUpperCase().includes(selectedBankTab));
  }, [loans, selectedBankTab]);

  const getBankTotal = (bankId: string) => {
    let totalVND = 0;
    loans.forEach(loan => {
      if (bankId === "ALL" || (loan.donVi || "").toUpperCase().includes(bankId)) {
        const amountStr = (loan.soTien || "").replace(/\./g, "").trim();
        const amount = parseInt(amountStr, 10);
        if (!isNaN(amount)) {
           if ((loan.loaiTien || "").toUpperCase() === "USD") {
               totalVND += (amount * 26500);
           } else {
               totalVND += amount;
           }
        }
      }
    });
    return totalVND;
  };

  const SummaryBlocks = ({ summary, title }: { summary: any, title?: string }) => {
    if (!summary) return null;
    return (
      <div className="mb-8 p-6 bg-gray-800/80 rounded-2xl border border-gray-700 shadow-xl w-full backdrop-blur-sm">
        {title && <h3 className="text-xl font-bold text-gray-200 mb-4">{title}</h3>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-700 shadow-inner">
             <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Tổng dư nợ quy đổi VND</div>
             <div className="text-3xl font-bold text-emerald-400">{formatMoney(summary.totalConvertedVND)} <span className="text-lg font-normal">VND</span></div>
          </div>
          <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-700 shadow-inner">
             <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Dư nợ VND</div>
             <div className="text-3xl font-bold text-blue-400">{formatMoney(summary.totalVND)} <span className="text-lg font-normal">VND</span></div>
          </div>
          <div className="bg-gray-900/80 p-5 rounded-xl border border-gray-700 shadow-inner">
             <div className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-2">Dư nợ USD quy đổi</div>
             <div className="text-3xl font-bold text-purple-400">{formatMoney(summary.totalUSD * summary.exchangeRate)} <span className="text-lg font-normal">VND</span></div>
             <div className="text-sm text-gray-500 mt-2 font-medium">(Dư nợ gốc: {formatMoney(summary.totalUSD)} USD)</div>
          </div>
        </div>
      </div>
    );
  };


  const fetchSheets = async () => {
    try {
      const res = await fetch("/api/sheets", { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data.sheets && data.sheets.length > 0) {
        setSheets(data.sheets);
      } else {
        setErrorMsg(data.error || "Không tìm thấy công ty nào.");
      }
    } catch (e) {
      setErrorMsg("Không thể tải danh sách công ty.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput, sheet: selectedSheet?.id })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        // Lưu session storage để khỏi nhập lại (tùy chọn)
        sessionStorage.setItem(`auth_${selectedSheet?.id}`, "true");
      } else {
        setAuthError(data.error || "Mật khẩu không đúng.");
      }
    } catch (e) {
      setAuthError("Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    if (!selectedSheet) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/loans?sheet=${encodeURIComponent(selectedSheet.id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Lỗi tải dữ liệu");
      } else {
        setLoans(data.loans || []);
        setExchangeRate(data.exchangeRate || 25000);
      }
    } catch (e: any) {
      setErrorMsg("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async () => {
    if (!confirm("Bạn có chắc chắn muốn phát lệnh kiểm tra và GỬI EMAIL cảnh báo cho TẤT CẢ công ty ngay bây giờ?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cron");
      const data = await res.json();
      alert(`Đã hoàn tất!\n- Đã quét: ${data.totalDueLoans} khoản vay đến hạn (toàn hệ thống).\n- Đã gửi cho: ${data.sentPhuTrachCount} Phụ trách và ${data.sentKiemSoatCount} Kiểm soát.`);
    } catch (e) {
      alert("Có lỗi xảy ra khi gửi email.");
    }
    setLoading(false);
  };

  // Khởi tạo lấy danh sách sheets
  useEffect(() => {
    fetchSheets();
    fetchGlobalSummary();
  }, []);

  // Xử lý khi chọn sheet khác
  useEffect(() => {
    if (selectedSheet) {
      setIsAuthenticated(false);
      setPasswordInput("");
      setAuthError("");
      setLoans([]);
      setSelectedBankTab("VCB");
    }
  }, [selectedSheet]);

  // Nếu auth đổi thành true thì load data
  useEffect(() => {
    if (isAuthenticated && selectedSheet) {
      fetchLoans();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Hệ thống quản lý khoản vay các công ty
            </h1>
            {selectedSheet && (
              <p className="text-xl text-blue-300 mt-2 font-medium">
                {selectedSheet.companyName || selectedSheet.name}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-4">
            {selectedSheet && (
              <button 
                onClick={() => setSelectedSheet(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg shadow-lg font-semibold transition-all flex items-center gap-2"
              >
                ⬅️ Chọn công ty khác
              </button>
            )}
            <button 
              onClick={handleSendEmails}
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-lg shadow-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "⏳ Đang gửi..." : "📧 Gửi thông báo phụ trách khoản vay"}
            </button>
          </div>
        </header>

        {errorMsg && !selectedSheet && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-6 rounded-xl mb-8 flex items-start gap-4 shadow-lg">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-red-400 mb-1">Cần cấu hình kết nối</h3>
              <p className="text-red-200/80">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Màn hình chọn công ty */}
        {!selectedSheet && (
          <>
            <SummaryBlocks summary={globalSummary} title="Thống kê tổng hợp toàn hệ thống" />
            <div className="mb-8 flex flex-col items-start gap-4">
              {sheets
                .filter(sheet => sheet.id !== "VCB" && sheet.id !== "BIDV") // Ẩn các ngân hàng bị lưu nhầm từ trước
                .map((sheet) => (
                <button
                  key={sheet.id}
                  onClick={() => setSelectedSheet(sheet)}
                  className="bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg text-left w-full max-w-md flex items-center justify-between group"
                >
                  <span>{sheet.companyName || sheet.name}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">➡️</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Nội dung bên dưới tùy thuộc trạng thái auth */}
        {selectedSheet && !isAuthenticated && (
          <div className="max-w-md mx-auto mt-20 bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-xl font-bold text-gray-200">{selectedSheet.companyName || selectedSheet.name}</h2>
              <p className="text-gray-400 text-sm mt-2">Vui lòng nhập mật khẩu để xem dữ liệu</p>
            </div>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Nhập mật khẩu..." 
                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                autoFocus
              />
              {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : "Mở khóa"}
              </button>
            </form>
          </div>
        )}

        {selectedSheet && isAuthenticated && (
          <>
            <SummaryBlocks summary={localSummary} title="Thống kê dữ liệu khoản vay" />
            
            <div className="flex justify-between items-end mb-6 mt-4">
              <div className="bg-gray-800 px-6 py-3 rounded-xl shadow-lg border border-gray-700 flex items-center gap-3">
                <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Tổng số khoản vay:</span>
                <span className="text-2xl font-bold text-blue-400">{loans.length}</span>
              </div>
              
              <button 
                onClick={fetchLoans}
                disabled={loading}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white px-5 py-2 rounded-lg shadow-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "⏳ Đang tải..." : "🔄 Đồng bộ dữ liệu"}
              </button>
            </div>

            {errorMsg && (
              <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-6 rounded-xl mb-8 flex items-start gap-4 shadow-lg">
                <div className="text-2xl">⚠️</div>
                <div>
                  <p className="text-red-200/80">{errorMsg}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setSelectedBankTab("VCB")}
                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex flex-col items-center justify-center ${selectedBankTab === "VCB" ? "bg-green-600 text-white border-green-500" : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"} border`}
              >
                <span>Vietcombank</span>
                <span className="text-sm font-normal opacity-80 mt-1">{formatMoney(getBankTotal("VCB"))} VND</span>
              </button>
              <button 
                onClick={() => setSelectedBankTab("BIDV")}
                className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex flex-col items-center justify-center ${selectedBankTab === "BIDV" ? "bg-blue-600 text-white border-blue-500" : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700"} border`}
              >
                <span>BIDV</span>
                <span className="text-sm font-normal opacity-80 mt-1">{formatMoney(getBankTotal("BIDV"))} VND</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-700 bg-gray-800 shadow-xl w-fit mx-auto max-w-full">
              <table className="text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-900/80 border-b border-gray-700 text-gray-400 uppercase text-xs tracking-wider">
                      <th className="p-4 font-semibold text-center">STT</th>
                      <th className="p-4 font-semibold text-center">Ngày Vay</th>
                      <th className="p-4 font-semibold text-center">Ngày Đến Hạn</th>
                      <th className="p-4 font-semibold text-right">Số Tiền</th>
                      <th className="p-4 font-semibold text-center">Loại Tiền</th>
                      <th className="p-4 font-semibold text-center">Thời Hạn</th>
                      <th className="p-4 font-semibold text-center">Lãi Suất</th>
                      <th className="p-4 font-semibold text-right">Lãi C.Dồn</th>
                      <th className="p-4 font-semibold text-center">Đơn Vị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-gray-500">
                          <p className="text-lg">Đang tải dữ liệu...</p>
                        </td>
                      </tr>
                    ) : filteredLoans.length === 0 && !errorMsg ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-gray-500">
                          <div className="text-4xl mb-3">📭</div>
                          <p>Không có dữ liệu khoản vay nào để hiển thị.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLoans.map((loan, idx) => (
                        <tr key={idx} className="hover:bg-gray-700/40 transition-colors group">
                          <td className="p-4 text-gray-400 text-center">{loan.stt || "-"}</td>
                          <td className="p-4 text-gray-400 text-center">{loan.ngayVay || "-"}</td>
                          <td className={`p-4 text-center ${isDueSoon(loan.ngayDenHan || "") ? 'font-bold text-red-400' : 'text-gray-300'}`}>{loan.ngayDenHan || "-"}</td>
                          <td className="p-4 text-gray-300 text-right">{formatLoanMoney(loan.soTien)}</td>
                          <td className="p-4 text-gray-400 text-center">{loan.loaiTien || "-"}</td>
                          <td className="p-4 text-gray-300 text-center">{loan.thoiHan || "-"}</td>
                          <td className="p-4 text-purple-300 text-center font-medium">{formatInterest(loan.laiSuat)}</td>
                          <td className="p-4 text-orange-300 text-right">{formatLoanMoney(loan.laiCongDon)}</td>
                          <td className={`p-4 text-center ${loan.donVi?.toUpperCase().includes('BIDV') ? 'text-blue-400 font-semibold' : loan.donVi?.toUpperCase().includes('VCB') ? 'text-green-400 font-semibold' : 'text-gray-400'}`}>
                             {loan.donVi?.toUpperCase().includes('BIDV') ? 'BIDV' : loan.donVi?.toUpperCase().includes('VCB') ? 'VCB' : loan.donVi}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
          </>
        )}
      </div>
      
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Phát triển bởi <span className="font-semibold text-gray-400 text-lg">N.TL</span></p>
      </footer>
    </div>
  );
}

// Đoạn mã giả lập Robot (RPA) gửi dữ liệu vào Web App
// Yêu cầu: Node.js 18+
// Chạy bằng lệnh: node rpa-bot.js

async function runFakeRPA() {
  const data = {
    apiKey: "my-secret-rpa-key", // Phải khớp với RPA_API_KEY trên Web App
    companyId: "BIDV_HO_CHI_MINH",
    companyName: "BIDV - Chi nhánh Hồ Chí Minh",
    exchangeRate: 25450, // Lấy tỷ giá giả lập
    loans: [
      {
        stt: "1",
        ngayVay: "12/01/2024",
        ngayDenHan: "12/01/2025",
        soTien: "500000000",
        loaiTien: "VND",
        donVi: "BIDV",
        thoiHan: "12 tháng",
        laiSuat: "8.5",
      },
      {
        stt: "2",
        ngayVay: "05/06/2024",
        ngayDenHan: "05/06/2025",
        soTien: "15000",
        loaiTien: "USD",
        donVi: "BIDV",
        thoiHan: "12 tháng",
        laiSuat: "4.0",
      }
    ]
  };

  console.log("🚀 Bắt đầu gửi dữ liệu khoản vay lên Web App...");
  try {
    // Thay đổi URL này thành URL thật trên Vercel sau khi deploy
    // Ví dụ: "https://ten-web-cua-ban.vercel.app/api/rpa-sync"
    const response = await fetch("http://localhost:3000/api/rpa-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (response.ok) {
        console.log("✅ Thành công! Kết quả từ Web App:", result);
    } else {
        console.log("❌ Thất bại! Lỗi từ Web App:", result);
    }
  } catch (err) {
    console.error("⚠️ Không kết nối được Web App. Bạn đã chạy 'npm run dev' chưa?", err.message);
  }
}

runFakeRPA();

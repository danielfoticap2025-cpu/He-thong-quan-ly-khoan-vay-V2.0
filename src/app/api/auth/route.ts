import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, sheet } = body;

    // Mật khẩu chung (Dành cho admin xem tất cả)
    const globalPassword = process.env.APP_PASSWORD || "Admin@8888";

    // Phân quyền: Mật khẩu riêng cho từng công ty
    let companyPassword = null;
    const companyId = (sheet || "").toLowerCase();

    if (companyId.includes("tamphuc")) {
      companyPassword = "123456";
    } else if (companyId.includes("phuocthinh")) {
      companyPassword = "234567";
    } else if (companyId.includes("nangluong") || companyId.includes("nlsh")) {
      companyPassword = "345689";
    }

    // Nếu công ty có mật khẩu riêng, ưu tiên kiểm tra mật khẩu đó
    if (companyPassword && password === companyPassword) {
      return NextResponse.json({ success: true });
    }

    // Nếu không có mật khẩu riêng, hoặc nhập sai mật khẩu riêng nhưng đúng mật khẩu tổng, vẫn cho phép
    if (password === globalPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Sai mật khẩu" }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

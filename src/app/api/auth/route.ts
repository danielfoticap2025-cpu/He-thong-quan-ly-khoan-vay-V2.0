import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const validPassword = process.env.APP_PASSWORD || "123456";

    if (password === validPassword) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Sai mật khẩu" }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

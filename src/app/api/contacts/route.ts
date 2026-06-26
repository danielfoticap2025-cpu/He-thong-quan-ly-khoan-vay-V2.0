import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ success: true, contacts: [] });
}

export async function POST(request: Request) {
  return NextResponse.json({ success: true, contact: null });
}

export async function DELETE(request: Request) {
  return NextResponse.json({ success: true });
}

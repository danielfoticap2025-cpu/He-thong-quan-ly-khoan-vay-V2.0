import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ contacts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();
    if (!name || !email) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

    const newContact = await prisma.contact.create({
      data: { name: name.trim(), email: email.trim() }
    });
    return NextResponse.json({ success: true, contact: newContact });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: "Tên nhân viên đã tồn tại" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });

    await prisma.contact.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

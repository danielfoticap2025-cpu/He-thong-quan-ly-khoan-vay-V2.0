import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET all companies to display on settings page
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: {
        NOT: {
          name: {
            startsWith: 'Ngân hàng',
            mode: 'insensitive'
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, companies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT to update phuTrachName and phuTrachEmail for a specific company
export async function PUT(request: Request) {
  try {
    const { id, phuTrachName, phuTrachEmail } = await request.json();
    if (!id) return NextResponse.json({ error: "Thiếu ID công ty" }, { status: 400 });

    const updated = await prisma.company.update({
      where: { id },
      data: {
        phuTrachName: phuTrachName?.trim() || null,
        phuTrachEmail: phuTrachEmail?.trim() || null,
      }
    });

    return NextResponse.json({ success: true, company: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

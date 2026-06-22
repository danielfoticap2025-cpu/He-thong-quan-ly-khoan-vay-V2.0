import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheet = searchParams.get("sheet");

  if (!sheet) {
    return NextResponse.json({ error: "Missing sheet parameter" }, { status: 400 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: { companyId: sheet },
      include: { loans: true }
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key: "EXCHANGE_RATE" }
    });
    
    const exchangeRate = setting ? parseInt(setting.value, 10) : 26500;

    return NextResponse.json({
      loans: company.loans,
      exchangeRate
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

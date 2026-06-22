import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const loans = await prisma.loan.findMany();
    
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "EXCHANGE_RATE" }
    });
    const exchangeRate = setting ? parseInt(setting.value, 10) : 26500;

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

    return NextResponse.json({
      totalVND,
      totalUSD,
      totalConvertedVND: totalVND + (totalUSD * exchangeRate),
      exchangeRate
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

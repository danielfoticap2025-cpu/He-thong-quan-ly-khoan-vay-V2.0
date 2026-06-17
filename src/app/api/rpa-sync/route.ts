import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const RPA_API_KEY = process.env.RPA_API_KEY || "my-secret-rpa-key";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey, companyId, companyName, loans, exchangeRate } = body;

    if (apiKey !== RPA_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!companyId || !loans) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const company = await prisma.company.upsert({
      where: { companyId },
      update: { name: companyName || companyId, companyName: companyName || companyId },
      create: { companyId, name: companyName || companyId, companyName: companyName || companyId }
    });

    await prisma.loan.deleteMany({
      where: { congTyId: company.id }
    });

    if (loans.length > 0) {
      const loansData = loans.map((loan: any) => ({
        stt: loan.stt,
        ngayVay: loan.ngayVay,
        ngayDenHan: loan.ngayDenHan,
        soTien: loan.soTien,
        loaiTien: loan.loaiTien,
        donVi: loan.donVi,
        thoiHan: loan.thoiHan,
        laiSuat: loan.laiSuat,
        laiCongDon: loan.laiCongDon,
        congTyId: company.id
      }));

      await prisma.loan.createMany({
        data: loansData
      });
    }

    if (exchangeRate) {
      await prisma.systemSetting.upsert({
        where: { key: "EXCHANGE_RATE" },
        update: { value: exchangeRate.toString() },
        create: { key: "EXCHANGE_RATE", value: exchangeRate.toString() }
      });
    }

    return NextResponse.json({ success: true, message: `Synced ${loans.length} loans for ${companyId}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

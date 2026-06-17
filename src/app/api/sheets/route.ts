import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const companies = await prisma.company.findMany();
    
    const sheets = companies.map(c => ({
      id: c.companyId,
      name: c.name,
      companyName: c.companyName || c.name
    }));

    return NextResponse.json({ sheets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const senderEmail = await prisma.systemSetting.findUnique({ where: { key: "SENDER_EMAIL" } });
    const senderPassword = await prisma.systemSetting.findUnique({ where: { key: "SENDER_PASSWORD" } });
    const managersBcc = await prisma.systemSetting.findUnique({ where: { key: "MANAGERS_BCC" } });

    return NextResponse.json({
      senderEmail: senderEmail?.value || "",
      senderPassword: senderPassword?.value || "",
      managersBcc: managersBcc?.value || ""
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { senderEmail, senderPassword, managersBcc } = await request.json();

    const upsertSetting = async (key: string, value: string) => {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    };

    if (senderEmail !== undefined) await upsertSetting("SENDER_EMAIL", senderEmail.trim());
    if (senderPassword !== undefined) await upsertSetting("SENDER_PASSWORD", senderPassword.trim());
    if (managersBcc !== undefined) await upsertSetting("MANAGERS_BCC", managersBcc.trim());

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

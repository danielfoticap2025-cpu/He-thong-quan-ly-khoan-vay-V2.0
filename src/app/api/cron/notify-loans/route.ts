import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return null;
}

function getDaysDiff(targetDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function GET(request: Request) {
  try {
    // 1. Fetch config from DB
    const senderEmailSetting = await prisma.systemSetting.findUnique({ where: { key: "SENDER_EMAIL" } });
    const senderPasswordSetting = await prisma.systemSetting.findUnique({ where: { key: "SENDER_PASSWORD" } });
    const managersBccSetting = await prisma.systemSetting.findUnique({ where: { key: "MANAGERS_BCC" } });
    
    const senderEmail = senderEmailSetting?.value || "";
    const senderPassword = senderPasswordSetting?.value || "";
    const managersBcc = managersBccSetting?.value ? managersBccSetting.value.split(',').map(s => s.trim()) : [];

    // 2. Fetch all companies and their loans
    const companies = await prisma.company.findMany({
      include: { loans: true }
    });

    const TARGET_DAYS = [10, 3, 1, 0];
    const notificationsToSent: Record<string, { companyName: string, toEmail: string, personName: string, loans: any[] }> = {};

    for (const company of companies) {
      if (!company.phuTrachEmail) continue; // Skip companies without an assigned email

      const dueLoans = [];
      for (const loan of company.loans) {
        if (!loan.ngayDenHan) continue;
        
        const dueDate = parseDate(loan.ngayDenHan);
        if (!dueDate) continue;

        const diff = getDaysDiff(dueDate);
        if (TARGET_DAYS.includes(diff)) {
          dueLoans.push({ ...loan, daysLeft: diff });
        }
      }

      if (dueLoans.length > 0) {
        notificationsToSent[company.id] = {
          companyName: company.name,
          toEmail: company.phuTrachEmail,
          personName: company.phuTrachName || "Bạn",
          loans: dueLoans
        };
      }
    }

    const results = [];

    // Send Emails
    if (senderEmail && senderPassword) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: senderEmail,
          pass: senderPassword,
        },
      });

      for (const [companyId, data] of Object.entries(notificationsToSent)) {
        
        // Build HTML table
        let htmlTable = `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #d32f2f;">Xin chào ${data.personName},</h2>
            <p>Dưới đây là danh sách các khoản vay <b>sắp đến hạn</b> của công ty <b>${data.companyName}</b> cần bạn theo dõi và xử lý gấp:</p>
            <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">
              <tr style="background-color: #f8f9fa; text-align: left;">
                <th>STT (Khế ước)</th>
                <th>Số tiền</th>
                <th>Loại tiền</th>
                <th>Ngày đến hạn</th>
                <th>Trạng thái</th>
              </tr>
        `;

        data.loans.forEach(l => {
          let statusText = "";
          if (l.daysLeft === 0) statusText = "<span style='color:red; font-weight:bold;'>ĐẾN HẠN HÔM NAY</span>";
          else if (l.daysLeft === 1) statusText = "<span style='color:#e65100; font-weight:bold;'>Ngày mai đến hạn</span>";
          else statusText = `<span style='color:#f57c00; font-weight:bold;'>Còn ${l.daysLeft} ngày</span>`;

          htmlTable += `
              <tr>
                <td>${l.stt || 'N/A'}</td>
                <td style="font-weight:bold;">${l.soTien || '0'}</td>
                <td>${l.loaiTien || 'VND'}</td>
                <td>${l.ngayDenHan}</td>
                <td>${statusText}</td>
              </tr>
          `;
        });

        htmlTable += `
            </table>
            <br>
            <p style="font-style: italic; color: #666;">Tin nhắn này được gửi tự động từ Hệ Thống Quản Lý Khoản Vay.</p>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"Hệ Thống Cảnh Báo" <${senderEmail}>`,
            to: data.toEmail,
            bcc: managersBcc,
            subject: `🚨 [CẢNH BÁO] Có ${data.loans.length} khoản vay sắp đến hạn - Công ty ${data.companyName}`,
            html: htmlTable
          });
          results.push({ company: data.companyName, status: "Sent", email: data.toEmail, loansCount: data.loans.length });
        } catch (err: any) {
          results.push({ company: data.companyName, status: "Error", email: data.toEmail, error: err.message });
        }
      }
    } else {
       for (const [companyId, data] of Object.entries(notificationsToSent)) {
         results.push({ company: data.companyName, status: "Simulation (Sender Email/Password not configured in DB)", loansCount: data.loans.length });
       }
    }

    return NextResponse.json({ success: true, message: "Cron job executed successfully", results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

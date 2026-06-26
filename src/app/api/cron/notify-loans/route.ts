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

      const formatCurrency = (val: string) => {
        if (!val) return "0";
        const num = parseInt(val.toString().replace(/[^0-9]/g, ''), 10);
        if (isNaN(num)) return val;
        return num.toLocaleString('vi-VN').replace(/,/g, '.');
      };

      for (const [companyId, data] of Object.entries(notificationsToSent)) {
        
        // Build HTML table
        let htmlTable = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-top: 0;">Xin chào <span style="color: #2563eb;">${data.personName}</span>,</h2>
            <p style="font-size: 16px; color: #475569; line-height: 1.5;">Dưới đây là danh sách các khoản vay <b>sắp đến hạn</b> của <b>${data.companyName}</b>:</p>
            
            <div style="overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; margin-top: 20px;">
              <table style="border-collapse: collapse; width: 100%; min-width: 600px;">
                <thead>
                  <tr style="background-color: #f8fafc; text-align: left; border-bottom: 2px solid #e2e8f0;">
                    <th style="padding: 14px 16px; color: #334155; font-weight: 600; font-size: 14px;">STT (Khế ước)</th>
                    <th style="padding: 14px 16px; color: #334155; font-weight: 600; font-size: 14px;">Số tiền</th>
                    <th style="padding: 14px 16px; color: #334155; font-weight: 600; font-size: 14px;">Loại tiền</th>
                    <th style="padding: 14px 16px; color: #334155; font-weight: 600; font-size: 14px;">Ngày đến hạn</th>
                    <th style="padding: 14px 16px; color: #334155; font-weight: 600; font-size: 14px;">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
        `;

        data.loans.forEach((l, index) => {
          let statusText = "";
          if (l.daysLeft === 0) statusText = "<span style='color: #dc2626; font-weight: 700; background-color: #fee2e2; padding: 4px 8px; border-radius: 4px;'>ĐẾN HẠN HÔM NAY</span>";
          else if (l.daysLeft === 1) statusText = "<span style='color: #ea580c; font-weight: 600;'>Ngày mai đến hạn</span>";
          else statusText = `<span style='color: #d97706; font-weight: 500;'>Còn ${l.daysLeft} ngày</span>`;

          const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';

          htmlTable += `
                  <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px 16px; color: #475569; font-size: 14px;">${l.stt || 'N/A'}</td>
                    <td style="padding: 12px 16px; color: #0f172a; font-weight: 600; font-size: 15px;">${formatCurrency(l.soTien)}</td>
                    <td style="padding: 12px 16px; color: #64748b; font-size: 14px;">${l.loaiTien || 'VND'}</td>
                    <td style="padding: 12px 16px; color: #475569; font-size: 14px; font-weight: 500;">${l.ngayDenHan}</td>
                    <td style="padding: 12px 16px; font-size: 14px;">${statusText}</td>
                  </tr>
          `;
        });

        htmlTable += `
                </tbody>
              </table>
            </div>
            
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
              <p style="color: #059669; font-size: 16px; font-weight: bold; margin-bottom: 8px;">Chúc bạn ngày mới vui vẻ và làm việc hiệu quả!</p>
              <p style="font-style: italic; color: #94a3b8; font-size: 12px; margin-top: 12px;">Tin nhắn này được gửi tự động từ Hệ Thống Quản Lý Khoản Vay.</p>
            </div>
          </div>
        `;

        try {
          await transporter.sendMail({
            from: `"Hệ Thống Cảnh Báo" <${senderEmail}>`,
            to: data.toEmail,
            bcc: managersBcc,
            subject: `🚨 Các khoản vay sắp đến hạn - ${data.companyName}`,
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

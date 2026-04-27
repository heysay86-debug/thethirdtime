import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { adminAuth } from '@/src/middleware/admin-auth';

const INQUIRIES_PATH = path.join(
  process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : path.join(process.cwd(), 'data'),
  'inquiries.json'
);

interface Inquiry {
  id: string;
  nickname: string;
  email: string;
  category: string;
  message: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  status?: 'open' | 'done';
}

const NOTIFY_EMAIL = 'info@betterdan.net';

async function sendNotificationEmail(inquiry: Inquiry) {
  try {
    const subject = `[제3의시간][${inquiry.category}] ${inquiry.nickname || '익명'} 님의 문의`;
    const body = [
      `문의 유형: ${inquiry.category}`,
      `닉네임: ${inquiry.nickname || '(미입력)'}`,
      `이메일: ${inquiry.email || '(미입력)'}`,
      `접수 시각: ${inquiry.createdAt}`,
      `문의 ID: ${inquiry.id}`,
      '',
      '--- 문의 내용 ---',
      inquiry.message,
    ].join('\n');

    // ImprovMX 포워딩을 활용: 자기 자신에게 보내면 Gmail로 전달됨
    // Node.js 내장 fetch로 간단한 mailto 대안 — Resend/SendGrid 없이 SMTP 직접 사용
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"제3의시간" <${process.env.GMAIL_USER}>`,
      to: NOTIFY_EMAIL,
      subject,
      text: body,
      replyTo: inquiry.email || undefined,
    });
  } catch (err) {
    console.error('[Contact] 이메일 발송 실패:', err);
    // 이메일 실패해도 문의 접수는 성공 처리
  }
}

function loadInquiries(): Inquiry[] {
  try {
    if (fs.existsSync(INQUIRIES_PATH)) {
      return JSON.parse(fs.readFileSync(INQUIRIES_PATH, 'utf-8'));
    }
  } catch {}
  return [];
}

function saveInquiries(inquiries: Inquiry[]) {
  const dir = path.dirname(INQUIRIES_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(INQUIRIES_PATH, JSON.stringify(inquiries, null, 2), 'utf-8');
}

// GET — 어드민 조회
export async function GET(request: NextRequest) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const inquiries = loadInquiries();
  return NextResponse.json({ inquiries: inquiries.reverse() });
}

// PATCH — 어드민 답변
export async function PATCH(request: NextRequest) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, reply } = await request.json();
  if (!id || !reply) {
    return NextResponse.json({ error: 'id와 reply 필요' }, { status: 400 });
  }
  const inquiries = loadInquiries();
  const inquiry = inquiries.find(i => i.id === id);
  if (!inquiry) {
    return NextResponse.json({ error: '문의를 찾을 수 없음' }, { status: 404 });
  }
  inquiry.reply = reply;
  inquiry.repliedAt = new Date().toISOString();
  inquiry.status = 'done';
  saveInquiries(inquiries);
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, email, category, message } = body as {
      nickname?: string;
      email?: string;
      category?: string;
      message?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: '문의 내용을 입력해 주세요.' },
        { status: 400 }
      );
    }

    if (message.trim().length > 2000) {
      return NextResponse.json(
        { error: '문의 내용은 2000자 이내로 작성해 주세요.' },
        { status: 400 }
      );
    }

    if (email && typeof email === 'string' && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { error: '올바른 이메일 형식을 입력해 주세요.' },
          { status: 400 }
        );
      }
    }

    const inquiry: Inquiry = {
      id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      nickname: (nickname && typeof nickname === 'string') ? nickname.trim().slice(0, 50) : '',
      email: (email && typeof email === 'string') ? email.trim().slice(0, 100) : '',
      category: (category && typeof category === 'string') ? category.trim() : '기타',
      message: message.trim(),
      createdAt: new Date().toISOString(),
      status: 'open',
    };

    const inquiries = loadInquiries();
    inquiries.push(inquiry);
    saveInquiries(inquiries);

    // 이메일 알림 (비동기, 실패해도 접수는 성공)
    sendNotificationEmail(inquiry).catch(() => {});

    return NextResponse.json({ success: true, id: inquiry.id });
  } catch {
    return NextResponse.json(
      { error: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}

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
  message: string;
  createdAt: string;
  reply?: string;
  repliedAt?: string;
  status?: 'open' | 'done';
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
    const { nickname, email, message } = body as {
      nickname?: string;
      email?: string;
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
      message: message.trim(),
      createdAt: new Date().toISOString(),
      status: 'open',
    };

    const inquiries = loadInquiries();
    inquiries.push(inquiry);
    saveInquiries(inquiries);

    return NextResponse.json({ success: true, id: inquiry.id });
  } catch {
    return NextResponse.json(
      { error: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}

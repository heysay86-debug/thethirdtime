import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function authCheck(req: NextRequest): boolean {
  const token = req.nextUrl.searchParams.get('token');
  return token === process.env.ADMIN_TOKEN;
}

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const client = getClient();
  if (!client) return NextResponse.json({ error: 'Supabase 미설정' }, { status: 500 });

  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');
  const search = req.nextUrl.searchParams.get('search') || '';

  const { data, error } = await client.storage
    .from('reports')
    .list('', {
      limit,
      offset,
      sortBy: { column: 'created_at', order: 'desc' },
      search: search || undefined,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    files: (data || []).map(f => ({
      name: f.name,
      size: f.metadata?.size || 0,
      created: f.created_at,
      updated: f.updated_at,
    })),
    count: data?.length || 0,
  });
}

// 다운로드 URL 생성
export async function POST(req: NextRequest) {
  if (!authCheck(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const client = getClient();
  if (!client) return NextResponse.json({ error: 'Supabase 미설정' }, { status: 500 });

  const { fileName } = await req.json();
  if (!fileName) return NextResponse.json({ error: 'fileName required' }, { status: 400 });

  const { data, error } = await client.storage
    .from('reports')
    .createSignedUrl(fileName, 3600); // 1시간 유효

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: data.signedUrl });
}

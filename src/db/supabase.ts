/**
 * Supabase 클라이언트 (서버 전용)
 *
 * service_role 키 사용 — RLS 우회, 서버에서만 사용.
 * 프론트엔드에 절대 노출 금지.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

/**
 * PDF를 Supabase Storage에 업로드
 */
export async function uploadPdf(fileName: string, buffer: Buffer): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const path = `${fileName}.pdf`;
  const { error } = await client.storage
    .from('reports')
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    console.error('[Supabase] PDF 업로드 실패:', error.message);
    return null;
  }

  console.log(`[Supabase] PDF 업로드: ${path}`);
  return path;
}

/**
 * PDF 다운로드 URL 생성 (1시간 유효)
 */
export async function getPdfUrl(fileName: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const path = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const { data, error } = await client.storage
    .from('reports')
    .createSignedUrl(path, 3600);

  if (error) return null;
  return data.signedUrl;
}

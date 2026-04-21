/**
 * PDF 사본 저장
 *
 * 1차: Supabase Storage (클라우드, 영구 보관)
 * 2차: 로컬 /data/pdfs/ (Supabase 미설정 시 폴백)
 */

import fs from 'fs';
import path from 'path';
import { uploadPdf, getPdfUrl } from './supabase';

const PDF_DIR = process.env.PDF_DIR || path.join(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : '/data', 'pdfs');

export async function savePdfCopy(fileName: string, buffer: Buffer): Promise<void> {
  // Supabase Storage 업로드 시도
  const uploaded = await uploadPdf(fileName, buffer);

  // 로컬 폴백 (Supabase 실패 시에도 로컬에 저장)
  try {
    if (!fs.existsSync(PDF_DIR)) fs.mkdirSync(PDF_DIR, { recursive: true });
    const filePath = path.join(PDF_DIR, `${fileName}.pdf`);
    fs.writeFileSync(filePath, buffer);
    console.log(`[PDF] 로컬 저장: ${filePath} (${(buffer.length / 1024).toFixed(1)}KB)`);
  } catch {}
}

export { getPdfUrl };

/**
 * PDF 사본 저장
 * /data/pdfs/ 디렉터리에 리포트번호.pdf로 저장
 */

import fs from 'fs';
import path from 'path';

const PDF_DIR = process.env.PDF_DIR || path.join(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : '/data', 'pdfs');

export function savePdfCopy(fileName: string, buffer: Buffer): void {
  if (!fs.existsSync(PDF_DIR)) {
    fs.mkdirSync(PDF_DIR, { recursive: true });
  }
  const filePath = path.join(PDF_DIR, `${fileName}.pdf`);
  fs.writeFileSync(filePath, buffer);
  console.log(`[PDF] 사본 저장: ${filePath} (${(buffer.length / 1024).toFixed(1)}KB)`);
}

export function listPdfs(): Array<{ name: string; size: number; created: string }> {
  if (!fs.existsSync(PDF_DIR)) return [];
  return fs.readdirSync(PDF_DIR)
    .filter(f => f.endsWith('.pdf'))
    .map(f => {
      const stat = fs.statSync(path.join(PDF_DIR, f));
      return { name: f, size: stat.size, created: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.created.localeCompare(a.created));
}

export function getPdfPath(fileName: string): string | null {
  const filePath = path.join(PDF_DIR, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
  return fs.existsSync(filePath) ? filePath : null;
}

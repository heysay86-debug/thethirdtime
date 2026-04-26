/**
 * Auth Adapter — magic link 이메일 저장/인증 인터페이스
 *
 * 현재: stub (로컬 저장만)
 * 추후: Supabase Auth magic link로 교체
 *
 * 개인정보 최소 수집: 이메일만 수집, 사주 데이터와 분리 저장
 */

export interface SaveResultRequest {
  email: string;
  reportNo: string;
}

export interface SaveResultResponse {
  success: boolean;
  message: string;
}

/**
 * 결과 저장 요청 — 이메일과 리포트 번호를 연결
 * 추후 magic link 전송 + Supabase Auth로 교체
 */
export async function requestSaveResult(req: SaveResultRequest): Promise<SaveResultResponse> {
  try {
    const res = await fetch('/api/auth/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error('save failed');
    return await res.json();
  } catch {
    return { success: false, message: '저장에 실패했습니다.' };
  }
}

/**
 * 저장된 결과 목록 조회 (보관함)
 * 추후 magic link 인증 후 조회로 교체
 */
export async function getSavedResults(_email: string): Promise<string[]> {
  // stub: 추후 구현
  return [];
}

// 이 파일의 값들은 전부 "브라우저에 공개돼도 안전한" 값입니다.
// - Supabase anon 키: DB 접근 권한은 RLS(Row Level Security) 정책이 별도로 막아줍니다.
// - 토스 클라이언트 키: 원래 브라우저에서 쓰라고 만든 공개용 키입니다.
// 절대 여기 두면 안 되는 값(시크릿 키 등)은 Supabase Edge Function 안에만 있습니다.

export const SUPABASE_URL = "https://sdomeulovcabkqsiytbf.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_BYp8k0-HWJzFCirhm0E4UQ_acfDmLeA";

// 토스페이먼츠 공식 문서가 제공하는 "범용 테스트 키" (가입 없이 누구나 사용 가능, 테스트 모드 전용)
export const TOSS_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

export const CONFIRM_PAYMENT_URL = `${SUPABASE_URL}/functions/v1/confirm-payment`;

export const ADMIN_EMAIL = "admin@admin.com";

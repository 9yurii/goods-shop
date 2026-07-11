import { supabase } from "./supabaseClient.js";

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// 로그인이 안 되어 있으면 loginPath로 보내버립니다. (각 페이지에서 상대경로를 넘겨주세요)
export async function requireAuth(loginPath) {
  const session = await getSession();
  if (!session) {
    location.href = loginPath;
    return null;
  }
  return session;
}

// 로그인 + 관리자 계정인지 둘 다 확인합니다. 아니면 homePath로 돌려보냅니다.
export async function requireAdmin(loginPath, homePath) {
  const session = await requireAuth(loginPath);
  if (!session) return null;

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) {
    location.href = homePath;
    return null;
  }
  return session;
}

export async function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signInWithPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  await supabase.auth.signOut();
}

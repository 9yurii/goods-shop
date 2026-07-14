import { supabase } from "./supabaseClient.js";

// basePath: index.html에서 부를 땐 "", pages/ 안에서 부를 땐 "../"
export async function renderNav(basePath) {
  const el = document.getElementById("nav-placeholder");
  if (!el) return;

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  let rightLinks = `
    <a href="${basePath}pages/login.html">로그인</a>
    <a class="nav-cta" href="${basePath}pages/signup.html">회원가입</a>
  `;

  if (session) {
    let adminLink = "";
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin) {
      adminLink = `<a class="nav-admin" href="${basePath}pages/admin.html">관리자</a>`;
    }
    rightLinks = `
      ${adminLink}
      <a href="${basePath}pages/my-orders.html">내 결제 내역</a>
      <button id="nav-logout-btn" class="nav-link-btn">로그아웃</button>
    `;
  }

  el.innerHTML = `
    <nav class="nav">
      <a class="nav-brand" href="${basePath}index.html">
        <span class="nav-logo">🛍️</span>굿즈샵
      </a>
      <div class="nav-links">${rightLinks}</div>
    </nav>
  `;

  const logoutBtn = document.getElementById("nav-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      location.href = `${basePath}index.html`;
    });
  }
}

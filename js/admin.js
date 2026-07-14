import { supabase } from "./supabaseClient.js";
import { renderNav } from "./nav.js";
import { requireAdmin } from "./auth.js";

renderNav("../");

const tbody = document.getElementById("orders-tbody");
const emptyState = document.getElementById("empty-state");

function won(n) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleString("ko-KR") : "-";
}

// HTML 특수문자를 무해한 글자로 바꿉니다.
// 화면에 innerHTML 로 넣는 값에 <script> 같은 게 섞여 실행되는 것을 막습니다.
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function init() {
  const session = await requireAdmin("./login.html?redirect=admin.html", "../index.html");
  if (!session) return;

  const { data: orders, error } = await supabase.rpc("admin_list_orders");

  if (error) {
    emptyState.textContent = "전체 결제 내역을 불러오지 못했습니다: " + error.message;
    emptyState.style.display = "block";
    return;
  }

  if (!orders || orders.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  tbody.innerHTML = orders
    .map(
      (o) => `
      <tr>
        <td data-label="구매자">${esc(o.user_email)}</td>
        <td data-label="상품">${esc(o.product_name)}</td>
        <td data-label="금액">${won(o.amount)}</td>
        <td data-label="상태"><span class="badge badge-${esc(o.status)}">${esc(o.status)}</span></td>
        <td data-label="결제수단">${esc(o.method ?? "-")}</td>
        <td data-label="승인일시">${fmtDate(o.approved_at)}</td>
        <td data-label="주문일시">${fmtDate(o.created_at)}</td>
      </tr>
    `
    )
    .join("");
}

init();

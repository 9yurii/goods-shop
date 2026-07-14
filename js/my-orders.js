import { supabase } from "./supabaseClient.js";
import { renderNav } from "./nav.js";
import { requireAuth } from "./auth.js";

renderNav("../");

const tbody = document.getElementById("orders-tbody");
const emptyState = document.getElementById("empty-state");

function won(n) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString("ko-KR");
}

// HTML 특수문자를 무해한 글자로 바꿉니다 (innerHTML 삽입 시 코드 실행 방지).
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function init() {
  const session = await requireAuth("./login.html?redirect=my-orders.html");
  if (!session) return;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("order_id, product_name, amount, status, method, approved_at, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    emptyState.textContent = "결제 내역을 불러오지 못했습니다: " + error.message;
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
        <td data-label="상품">${esc(o.product_name)}</td>
        <td data-label="금액">${won(o.amount)}</td>
        <td data-label="상태"><span class="badge badge-${esc(o.status)}">${esc(o.status)}</span></td>
        <td data-label="결제수단">${esc(o.method ?? "-")}</td>
        <td data-label="주문일시">${fmtDate(o.created_at)}</td>
      </tr>
    `
    )
    .join("");
}

init();

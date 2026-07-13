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
        <td data-label="구매자">${o.user_email}</td>
        <td data-label="상품">${o.product_name}</td>
        <td data-label="금액">${won(o.amount)}</td>
        <td data-label="상태"><span class="badge badge-${o.status}">${o.status}</span></td>
        <td data-label="결제수단">${o.method ?? "-"}</td>
        <td data-label="승인일시">${fmtDate(o.approved_at)}</td>
        <td data-label="주문일시">${fmtDate(o.created_at)}</td>
      </tr>
    `
    )
    .join("");
}

init();

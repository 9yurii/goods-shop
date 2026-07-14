import { renderNav } from "./nav.js";
import { getSession } from "./auth.js";
import { CONFIRM_PAYMENT_URL } from "./config.js";

renderNav("../");

const box = document.getElementById("result-box");

function won(n) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

// HTML 특수문자를 무해한 글자로 바꿉니다 (innerHTML 삽입 시 코드 실행 방지).
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function renderSuccess(order) {
  // 영수증 링크는 http(s) 주소일 때만 겁니다 (javascript: 같은 위험한 주소 차단).
  const receiptOk = /^https?:\/\//i.test(order.receipt_url ?? "");
  box.innerHTML = `
    <div class="icon">✅</div>
    <h2>결제가 완료됐습니다</h2>
    <dl>
      <div><dt>상품</dt><dd>${esc(order.product_name)}</dd></div>
      <div><dt>결제 금액</dt><dd>${won(order.amount)}</dd></div>
      <div><dt>주문번호</dt><dd style="font-size:12px;">${esc(order.order_id)}</dd></div>
      ${order.method ? `<div><dt>결제수단</dt><dd>${esc(order.method)}</dd></div>` : ""}
    </dl>
    ${receiptOk ? `<a class="btn btn-ghost" href="${esc(order.receipt_url)}" target="_blank" rel="noopener">영수증 보기</a>` : ""}
    <a class="btn btn-primary btn-block" style="margin-top:12px;" href="./my-orders.html">내 결제 내역 보기</a>
  `;
}

function renderFail(message) {
  box.innerHTML = `
    <div class="icon">❌</div>
    <h2>결제에 실패했습니다</h2>
    <p style="color:var(--text-sub);">${esc(message)}</p>
    <a class="btn btn-primary btn-block" style="margin-top:20px;" href="../index.html">상품 목록으로</a>
  `;
}

async function init() {
  const params = new URLSearchParams(location.search);
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = params.get("amount");

  if (paymentKey && orderId && amount) {
    const session = await getSession();
    if (!session) {
      renderFail("로그인 정보가 만료되었습니다. 다시 로그인 후 내 결제 내역에서 확인해주세요.");
      return;
    }

    try {
      const res = await fetch(CONFIRM_PAYMENT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        renderFail(json.error ?? "결제 승인 중 문제가 발생했습니다.");
        return;
      }

      renderSuccess(json.order);
    } catch (err) {
      renderFail("결제 승인 요청 중 오류가 발생했습니다: " + err.message);
    }
    return;
  }

  const code = params.get("code");
  const message = params.get("message");
  renderFail(message || (code ? `오류 코드: ${code}` : "결제가 취소되었거나 알 수 없는 오류가 발생했습니다."));
}

init();

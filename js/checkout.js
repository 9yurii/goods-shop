import { supabase } from "./supabaseClient.js";
import { renderNav } from "./nav.js";
import { requireAuth } from "./auth.js";
import { TOSS_CLIENT_KEY } from "./config.js";

renderNav("../");

const summaryBox = document.getElementById("checkout-summary");
const payArea = document.getElementById("pay-area");
const errorBox = document.getElementById("checkout-error");
const payButton = document.getElementById("payment-button");

function won(n) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add("show");
}

async function init() {
  const session = await requireAuth(`./login.html?redirect=${encodeURIComponent("checkout.html" + location.search)}`);
  if (!session) return;

  const params = new URLSearchParams(location.search);
  const productId = params.get("productId");
  if (!productId) {
    showError("잘못된 접근입니다. 상품을 다시 선택해주세요.");
    return;
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    showError("상품 정보를 불러오지 못했습니다.");
    return;
  }

  if (product.stock <= 0) {
    showError("품절된 상품입니다.");
    return;
  }

  // DB의 image_url 은 "assets/images/tshirt.svg" 처럼 사이트 최상단 기준입니다.
  // 이 페이지는 pages/ 폴더 안에 있으므로 한 단계 위로 올라가는 "../" 를 붙입니다.
  const imgSrc = !product.image_url
    ? ""
    : product.image_url.startsWith("http")
      ? product.image_url
      : `../${product.image_url}`;

  summaryBox.innerHTML = `
    <img src="${imgSrc}" alt="${product.name}" />
    <div>
      <div style="font-weight:700;">${product.name}</div>
      <div style="color:var(--text-sub); font-size:13px; margin:4px 0;">${product.description ?? ""}</div>
      <div style="font-weight:800;">${won(product.price)}</div>
    </div>
  `;

  // 결제 요청 전에 먼저 주문을 PENDING 상태로 만들어 둡니다.
  // (Edge Function이 이 주문번호로 실제 결제 금액을 대조 검증하기 때문에 순서가 중요합니다)
  const orderId = `order_${crypto.randomUUID()}`;

  const { error: insertError } = await supabase.from("orders").insert({
    order_id: orderId,
    user_id: session.user.id,
    product_id: product.id,
    product_name: product.name,
    amount: product.price,
    status: "PENDING",
  });

  if (insertError) {
    showError("주문 생성에 실패했습니다: " + insertError.message);
    return;
  }

  payArea.style.display = "block";

  const paymentWidget = PaymentWidget(TOSS_CLIENT_KEY, session.user.id);
  const paymentMethodWidget = paymentWidget.renderPaymentMethods(
    "#payment-method",
    { value: product.price },
    { variantKey: "DEFAULT" }
  );
  paymentWidget.renderAgreement("#agreement", { variantKey: "AGREEMENT" });

  paymentMethodWidget.on("ready", () => {
    payButton.disabled = false;
  });

  payButton.addEventListener("click", () => {
    const successUrl = new URL("checkout-result.html", location.href).href;
    const failUrl = new URL("checkout-result.html", location.href).href;

    paymentWidget.requestPayment({
      orderId,
      orderName: product.name,
      successUrl,
      failUrl,
      customerEmail: session.user.email,
      customerName: session.user.email,
    });
  });
}

init();

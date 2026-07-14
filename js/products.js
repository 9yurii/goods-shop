import { supabase } from "./supabaseClient.js";
import { renderNav } from "./nav.js";

renderNav("");

const grid = document.getElementById("product-grid");

function won(n) {
  return Number(n).toLocaleString("ko-KR") + "원";
}

// DB의 image_url 은 "assets/images/tshirt.svg" 처럼 사이트 최상단 기준으로 저장돼 있습니다.
// 이 파일(index.html)은 최상단에 있으므로 앞에 "./" 를 붙입니다.
function imgSrc(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `./${url}`;
}

async function loadProducts() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    grid.innerHTML = `<p class="empty-state">상품을 불러오지 못했습니다: ${error.message}</p>`;
    return;
  }

  if (!products || products.length === 0) {
    grid.innerHTML = `<p class="empty-state">등록된 상품이 없습니다.</p>`;
    return;
  }

  grid.innerHTML = products
    .map((p) => {
      const soldOut = p.stock <= 0;
      return `
        <div class="product-card">
          <img src="${imgSrc(p.image_url)}" alt="${p.name}" loading="lazy" />
          <div class="body">
            <div class="name">${p.name}</div>
            <div class="desc">${p.description ?? ""}</div>
            <div class="price">${won(p.price)}</div>
            <div class="stock">${soldOut ? "품절" : `재고 ${p.stock}개`}</div>
            <a class="btn btn-primary btn-block" ${soldOut ? "aria-disabled='true' style='pointer-events:none;background:#cbd5e1;'" : ""}
               href="pages/checkout.html?productId=${p.id}">
              ${soldOut ? "품절" : "구매하기"}
            </a>
          </div>
        </div>
      `;
    })
    .join("");
}

loadProducts();

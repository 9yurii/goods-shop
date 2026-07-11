import { supabase } from "./supabaseClient.js";
import { renderNav } from "./nav.js";

renderNav("");

const grid = document.getElementById("product-grid");

function won(n) {
  return Number(n).toLocaleString("ko-KR") + "원";
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
          <img src="${p.image_url ?? ""}" alt="${p.name}" loading="lazy" />
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

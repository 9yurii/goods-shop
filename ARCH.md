# ARCH.md — 상세 구조

[CLAUDE.md](./CLAUDE.md)의 요약을 먼저 읽고 오세요. 여기는 실제로 코드를 고칠 때 필요한 세부 사항입니다.

## 1. 전체 그림

```
브라우저(정적 사이트, GitHub Pages)
  ├─ Supabase Auth       회원가입/로그인 (이메일+비밀번호, 이메일 인증 없음)
  ├─ Supabase Postgres    products / orders / admins 테이블 (RLS로 보호)
  ├─ Supabase RPC          is_admin(), admin_list_orders()
  ├─ Supabase Edge Function  confirm-payment (결제 승인 — 시크릿 키를 다루는 유일한 서버 코드)
  └─ 토스페이먼츠           결제창 UI + 결제 승인 API
```

이 저장소(goods-shop)는 위 그림에서 "브라우저" 부분(정적 프론트엔드)만 담당합니다. 나머지는 Supabase 프로젝트(`sdomeulovcabkqsiytbf`, 리전 ap-northeast-2)에 이미 배포되어 있습니다.

## 2. DB 스키마

```sql
products (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  description text,
  price       integer,
  image_url   text,
  stock       integer default 100,
  created_at  timestamptz default now()
)

orders (
  id           uuid primary key default gen_random_uuid(),
  order_id     text,        -- 토스 주문번호, 6~64자, 영숫자/-/_ 만 허용 (checkout.js에서 order_<uuid> 형태로 생성)
  user_id      uuid,        -- auth.users.id
  product_id   uuid references products(id),
  product_name text,        -- 주문 시점의 상품명 스냅샷
  amount       integer,
  status       text default 'PENDING',  -- PENDING | DONE | FAILED
  payment_key  text,        -- 토스가 발급하는 결제 고유키 (승인 후 채워짐)
  method       text,        -- 결제수단 (카드, 가상계좌 등, 승인 후 채워짐)
  receipt_url  text,        -- 영수증 링크 (승인 후 채워짐)
  approved_at  timestamptz, -- 승인 시각 (승인 후 채워짐)
  fail_reason  text,        -- 실패 사유 (실패 시에만)
  created_at   timestamptz default now()
)

admins (
  user_id    uuid primary key references auth.users(id),
  created_at timestamptz default now()
)
```

시드 데이터: `products`에 5개(바이브코딩 티셔츠 25000/재고50, 바이브코딩 에코백 15000/80, 개발자 스티커팩 5000/200, 코드 머그컵 12000/60, 미니 키링 8000/150), `admins`에 `admin@admin.com` 1건.

## 3. RLS (Row Level Security) 정책

| 테이블 | 동작 | 조건 |
|---|---|---|
| products | SELECT | 누구나 (`true`) |
| orders | INSERT | `user_id = auth.uid() AND status = 'PENDING'` — 본인 명의로, PENDING 상태로만 생성 가능 |
| orders | SELECT | `user_id = auth.uid() OR is_admin()` — 본인 주문 또는 관리자 |
| orders | UPDATE | **정책 없음(클라이언트에서 불가능)** — 상태 전환은 오직 confirm-payment Edge Function(service_role)만 수행 |

## 4. RPC 함수

- **`is_admin()`** → `boolean`. `admins` 테이블에 `auth.uid()`가 있는지 확인. `SECURITY DEFINER`.
- **`admin_list_orders()`** → 관리자가 아니면 예외 발생(42501). 관리자면 전체 `orders`를 `auth.users`와 조인해서 `order_id, user_email, product_name, amount, status, method, approved_at, created_at`을 반환. 관리자 페이지는 반드시 이 함수를 써야 함 — `orders` 테이블을 직접 SELECT하면 RLS 때문에 본인 것만 보임.

## 5. Edge Function: confirm-payment

- URL: `https://sdomeulovcabkqsiytbf.supabase.co/functions/v1/confirm-payment`
- Method: `POST` (CORS `OPTIONS` 자동 처리, `Access-Control-Allow-Origin: *`)
- Header: `Authorization: Bearer <supabase access_token>` 필수 (함수 내부에서 수동으로 JWT 검증)
- Body: `{ "paymentKey": string, "orderId": string, "amount": number }`

동작 순서:
1. JWT 없거나 유효하지 않으면 `401`
2. 필수값 누락/형식 오류면 `400`
3. `orderId`로 `orders` 조회, 없으면 `404`, 본인 주문 아니면 `403`
4. 이미 `status='DONE'`이면 `{ ok:true, alreadyDone:true, order }` (재요청해도 안전 — 새로고침 대비)
5. `status`가 `PENDING`이 아니면 `409`
6. **`orders.amount`와 요청의 `amount`가 다르면** → 주문을 `FAILED`로 바꾸고 `400` (결제 금액 조작 방어)
7. 토스 승인 API 호출: `POST https://api.tosspayments.com/v1/payments/confirm`, `Authorization: Basic base64(시크릿키+":")`, body `{paymentKey, orderId, amount}`
8. 토스가 실패 응답 → 주문 `FAILED` 처리 후 `400`
9. 토스가 성공 응답 → 주문을 `DONE`으로 갱신(`payment_key`, `method`, `receipt_url`=`toss.receipt.url`, `approved_at`) 후 `{ ok:true, order }` 반환

이 함수는 `service_role` 키로 DB에 접근하므로 RLS를 우회합니다 — 그래서 클라이언트 UPDATE 권한이 없어도 상태를 바꿀 수 있는 유일한 경로입니다.

## 6. 설정값 (js/config.js)

| 이름 | 값(형태) | 왜 공개해도 안전한가 |
|---|---|---|
| `SUPABASE_URL` | `https://sdomeulovcabkqsiytbf.supabase.co` | 그냥 주소일 뿐 |
| `SUPABASE_ANON_KEY` | `sb_publishable_...` | RLS가 실제 접근 권한을 제어함 |
| `TOSS_CLIENT_KEY` | `test_gck_docs_...` | 토스가 브라우저용으로 공개 배포한 테스트 키 (토스 공식 샘플 저장소 `tosspayments/payment-widget-sample`에 게시된 값) |
| `CONFIRM_PAYMENT_URL` | Edge Function URL | 공개 엔드포인트, 내부에서 JWT/소유권/금액을 검증함 |

**주의**: `TOSS_CLIENT_KEY`(클라이언트 키)와 Edge Function 환경변수 `TOSS_SECRET_KEY`(시크릿 키)는 반드시 같은 키 쌍이어야 승인이 성공합니다. 현재 둘 다 토스 공식 문서 테스트 키 쌍(`test_gck_docs_...` / `test_gsk_docs_...`)으로 맞춰져 있습니다. 나중에 실제 가맹점 키로 바꾸려면 두 곳을 함께 바꿔야 합니다.

## 7. 토스페이먼츠 연동 흐름

```
[checkout.html]
  1. 로그인 확인 (안 되어 있으면 로그인 페이지로)
  2. productId로 상품 조회
  3. orders에 INSERT (order_id 새로 생성, status=PENDING, amount=상품가격)
     ← 이 순서가 중요: Edge Function이 나중에 이 행을 찾아서 금액을 대조하기 때문
  4. 토스 결제위젯(PaymentWidget) 초기화, 결제수단/약관 UI 렌더링
  5. "결제하기" 클릭 → widget.requestPayment({orderId, orderName, amount, successUrl, failUrl, ...})
  6. 토스 결제창으로 이동 (우리 사이트를 벗어남)

[토스 결제창에서 테스트 결제 진행 → 성공/실패에 따라 리다이렉트]
  성공: successUrl?paymentKey=...&orderId=...&amount=...
  실패: failUrl?code=...&message=...
  (이 프로젝트는 successUrl과 failUrl을 둘 다 checkout-result.html로 지정 —
   페이지 안에서 쿼리 파라미터를 보고 성공/실패를 구분함)

[checkout-result.html]
  - paymentKey가 있으면: confirm-payment Edge Function 호출 (Bearer 토큰 + paymentKey/orderId/amount)
    → 성공 시 "결제 완료" 화면, 실패 시 에러 메시지
  - code/message만 있으면: 토스 단계에서 이미 실패/취소된 것 → 에러 메시지만 표시
    (이 경우 DB에는 아무 것도 기록하지 않음 — orders 행은 PENDING인 채로 남음, 아래 8번 참고)
```

## 8. 페이지 목록

| 경로 | 인증 | 호출하는 Supabase API | 설명 |
|---|---|---|---|
| `index.html` | 불필요 | `products` SELECT | 상품 목록 |
| `pages/signup.html` | 불필요 | `auth.signUp` | 회원가입 (즉시 로그인됨) |
| `pages/login.html` | 불필요 | `auth.signInWithPassword` | 로그인 |
| `pages/checkout.html?productId=` | 필요 | `products` SELECT, `orders` INSERT, 토스 위젯 | 주문 생성 + 결제 |
| `pages/checkout-result.html` | 필요(세션 필요) | Edge Function `confirm-payment` | 결제 승인 확정 |
| `pages/my-orders.html` | 필요 | `orders` SELECT (본인 것) | 내 결제 내역 |
| `pages/admin.html` | 필요 + 관리자 | RPC `is_admin`, `admin_list_orders` | 전체 결제 내역 |

## 9. 주문 상태 전이

- `PENDING`: 주문 생성 직후 기본값. 사용자가 토스 결제창까지 갔다가 완료하지 않고 이탈해도 이 상태로 영구히 남습니다 (v1에서는 정리 로직 없음 — 알려진 한계).
- `PENDING → DONE`: confirm-payment가 토스 승인에 성공했을 때만.
- `PENDING → FAILED`: confirm-payment에서 금액 불일치를 발견했거나, 토스 승인 API 자체가 실패를 응답했을 때만.
- `DONE`은 최종 상태이며 재승인 요청이 와도 그대로 유지됩니다(멱등 처리).

## 10. 알려진 한계 / 나중에 추가하면 좋은 것

- 재고(`stock`)는 화면 표시용일 뿐, 구매해도 자동으로 줄지 않습니다.
- 장바구니 없음 — 상품 1개씩만 구매 가능.
- 결제 취소/환불 UI 없음 (필요하면 Supabase 대시보드에서 직접 처리).
- 상품 추가/수정/삭제 UI 없음 — Supabase 대시보드의 테이블 편집기에서 직접 관리.
- 토스 결제창에서 이탈해 완료하지 않은 주문(`PENDING`)이 계속 쌓일 수 있음 — 자동 정리 로직 없음.

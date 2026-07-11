# CLAUDE.md

이 문서는 이 프로젝트를 처음 보는 사람(AI 포함)이 5분 안에 감을 잡을 수 있도록 쓴 요약입니다. 자세한 내용은 [ARCH.md](./ARCH.md)를 보세요.

## 이게 뭔가요

코딩 관련 굿즈(티셔츠, 에코백, 스티커, 머그컵, 키링)를 파는 아주 작은 온라인 쇼핑몰입니다. 결제는 **토스페이먼츠 테스트 모드**로 동작하며, 실제 돈은 나가지 않습니다.

## 기술 스택

- **프론트엔드**: 순수 HTML/CSS/JavaScript. 빌드 도구(webpack, npm 등) 없음. 브라우저가 파일을 그대로 읽습니다.
- **백엔드**: Supabase (DB + 로그인/회원가입 + Edge Function). **이미 다 구축되어 있습니다.** 이 저장소는 프론트엔드만 담당합니다.
- **결제**: 토스페이먼츠 결제위젯(테스트 모드).
- **호스팅**: GitHub Pages.

## 절대 잊으면 안 되는 것

1. **백엔드는 건드리지 마세요.** Supabase의 테이블(products/orders/admins), 보안 규칙(RLS), 함수(is_admin, admin_list_orders, confirm-payment)는 이미 완성되어 있습니다. 구조를 바꾸고 싶으면 먼저 [ARCH.md](./ARCH.md)를 정독하세요.
2. **경로는 항상 상대경로로 쓰세요.** 이 사이트는 `https://9yurii.github.io/goods-shop/` 처럼 "하위 폴더"에서 서비스됩니다. `/assets/...`처럼 `/`로 시작하는 절대경로를 쓰면 깨집니다. `./assets/...`, `../assets/...`처럼 쓰세요.
3. **장바구니 없음, 단품 구매만.** 상품 목록에서 "구매하기"를 누르면 바로 그 상품 1개를 결제하는 흐름입니다.
4. **결제는 테스트 모드입니다.** 실제 카드 정보를 넣지 마세요. 토스 결제창에 뜨는 테스트 안내를 따라 진행하면 됩니다.

## 폴더 구조

```
index.html            상품 목록 (홈)
assets/css/style.css  공통 스타일
js/config.js          공개해도 되는 설정값 (Supabase URL/키, 토스 클라이언트 키)
js/supabaseClient.js  Supabase 클라이언트 생성
js/auth.js            로그인/회원가입/로그아웃/접근 제어 함수
js/nav.js             상단 네비게이션 렌더링
js/*.js               각 페이지 전용 로직
pages/*.html          로그인/회원가입/결제/내역/관리자 페이지
```

## 로컬에서 실행하는 법

이 사이트는 파일을 더블클릭해서(`file://`) 열면 **작동하지 않습니다.** 반드시 로컬 웹 서버를 통해 열어야 합니다. 예:

```bash
# 이 폴더 안에서
npx serve .
# 또는
python -m http.server
```

그 다음 터미널에 뜨는 주소(예: http://localhost:3000)로 접속하세요.

## 배포하는 법

`main` 브랜치에 push하면 GitHub Pages가 자동으로 반영합니다 (수동 빌드 단계 없음). 배포 주소: `https://9yurii.github.io/goods-shop/`

## 관리자 계정

- 이메일: `admin@admin.com`
- 비밀번호: `superadmin`

이 계정으로 로그인하면 상단 메뉴에 "관리자" 링크가 나타나고, 모든 사용자의 결제 내역을 볼 수 있습니다.

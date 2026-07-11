import { renderNav } from "./nav.js";
import { signUp } from "./auth.js";

renderNav("../");

const form = document.getElementById("signup-form");
const errorBox = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add("show");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.remove("show");
  submitBtn.disabled = true;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { data, error } = await signUp(email, password);

  if (error) {
    showError(error.message);
    submitBtn.disabled = false;
    return;
  }

  if (!data.session) {
    // 이론상 이메일 인증이 꺼져 있어 바로 세션이 오지만, 혹시 안 오면 로그인 페이지로 안내
    location.href = "./login.html";
    return;
  }

  location.href = "../index.html";
});

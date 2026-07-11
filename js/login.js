import { renderNav } from "./nav.js";
import { signInWithPassword } from "./auth.js";

renderNav("../");

const form = document.getElementById("login-form");
const errorBox = document.getElementById("form-error");
const submitBtn = document.getElementById("submit-btn");

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.add("show");
}

const params = new URLSearchParams(location.search);
const redirect = params.get("redirect");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.classList.remove("show");
  submitBtn.disabled = true;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await signInWithPassword(email, password);

  if (error) {
    showError(error.message === "Invalid login credentials" ? "이메일 또는 비밀번호가 올바르지 않습니다." : error.message);
    submitBtn.disabled = false;
    return;
  }

  location.href = redirect ? redirect : "../index.html";
});

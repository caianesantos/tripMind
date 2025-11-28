const TOKEN_KEY = "tripmind_token";
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const logoutBtn = document.querySelector(".logout-link");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        clearToken();
        window.location.href = "login.html";
    });
}

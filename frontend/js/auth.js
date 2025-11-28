const API_BASE = "http://localhost:8000/api";
const TOKEN_KEY = "tripmind_token";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
document.querySelectorAll(".btn-navegar").forEach((btn) => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.target;
        if (target) {
            window.location.href = target;
        }
    });
});

const setLoading = (btn, loading, text = null) => {
    if (!btn) return;
    if (loading) {
        btn.dataset.originalText = btn.textContent;
        btn.textContent = text ?? "Enviando...";
        btn.disabled = true;
    } else {
        btn.textContent = text ?? btn.dataset.originalText ?? btn.textContent;
        btn.disabled = false;
    }
};

const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);

const handleError = async (response) => {
    let detail = "Erro inesperado. Tente novamente.";
    try {
        const data = await response.json();
        if (typeof data === "string") detail = data;
        if (data?.detail) detail = data.detail;
        if (Array.isArray(data)) detail = data.join(", ");
        if (typeof data === "object" && !Array.isArray(data) && !data.detail) {
            detail = Object.values(data).flat().join(" | ");
        }
    } catch (e) {
        // mantém mensagem padrão
    }
    throw new Error(detail);
};

const postJson = async (endpoint, payload) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res);
    return res.json();
};

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector("#email")?.value.trim();
        const password = loginForm.querySelector("#senha")?.value;
        const submitBtn = loginForm.querySelector("button[type='submit']");
        setLoading(submitBtn, true, "Entrando...");
        try {
            const data = await postJson("/auth/login/", { email, password });
            saveToken(data.token);
            alert("Login realizado com sucesso!");
            window.location.href = "paginaInicial.html";
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const first_name = registerForm.querySelector("#nome")?.value.trim();
        const email = registerForm.querySelector("#email")?.value.trim();
        const password = registerForm.querySelector("#senha")?.value;
        const phone = registerForm.querySelector("#telefone")?.value.trim();
        const submitBtn = registerForm.querySelector("button[type='submit']");
        setLoading(submitBtn, true, "Criando...");
        try {
            const data = await postJson("/auth/register/", { email, password, phone, first_name });
            saveToken(data.token);
            alert("Conta criada! Você já está logado.");
            window.location.href = "paginaInicial.html";
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

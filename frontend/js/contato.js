const API_BASE = "http://localhost:8000/api";
const TOKEN_KEY = "tripmind_token";

const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const handleError = async (response) => {
    let detail = "Erro inesperado. Tente novamente.";
    try {
        const data = await response.json();
        if (data?.detail) detail = data.detail;
        else if (Array.isArray(data)) detail = data.join(", ");
        else if (typeof data === "object") detail = Object.values(data).flat().join(" | ");
        else if (typeof data === "string") detail = data;
    } catch (e) {
        // keep default
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

const form = document.getElementById("contact-form");
const statusEl = document.querySelector(".status");
const logoutLink = document.querySelector(".logout-link");

const renderStatus = (msg, hidden = false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("hidden", hidden);
};

if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
        e.preventDefault();
        clearToken();
        window.location.href = "login.html";
    });
}

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nome = document.getElementById("nome")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const assunto = document.getElementById("assunto")?.value.trim();
        const mensagem = document.getElementById("mensagem")?.value.trim();
        const submitBtn = form.querySelector(".btn-primary");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Enviando...";
        }
        renderStatus("", true);
        try {
            await postJson("/support/", {
                name: nome,
                email: email,
                subject: assunto,
                message: mensagem,
            });
            renderStatus("Mensagem enviada! Vamos retornar em breve.", false);
            form.reset();
        } catch (err) {
            renderStatus(err.message, false);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Enviar";
            }
        }
    });
}

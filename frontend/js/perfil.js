const API_BASE = "http://localhost:8000/api";
const TOKEN_KEY = "tripmind_token";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);
const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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

const getJson = async (endpoint, token = null) => {
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Token ${token}`;
    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!res.ok) await handleError(res);
    return res.json();
};

const deleteResource = async (endpoint, token = null) => {
    const headers = {};
    if (token) headers["Authorization"] = `Token ${token}`;
    const res = await fetch(`${API_BASE}${endpoint}`, { method: "DELETE", headers });
    if (!res.ok) await handleError(res);
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

const logoutLinks = document.querySelectorAll(".logout-link");
logoutLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        clearToken();
        window.location.href = "login.html";
    });
});

const userNameEl = document.querySelector(".user-name");
const userEmailEl = document.querySelector(".user-email");
const profileEmailNews = document.querySelector(".profile-email-news");
let profileEmail = "";

const loadProfile = async () => {
    const token = getToken();
    if (!token) {
        if (userNameEl) userNameEl.textContent = "Faça login para ver seu perfil";
        if (profileEmailNews) profileEmailNews.textContent = "";
        return;
    }
    try {
        const data = await getJson("/auth/me/", token);
        if (userNameEl) userNameEl.textContent = data.first_name || data.email || "Olá, viajante!";
        if (userEmailEl) userEmailEl.textContent = data.email || "";
        profileEmail = data.email || "";
        if (profileEmailNews) profileEmailNews.textContent = profileEmail || "—";
    } catch (err) {
        if (userNameEl) userNameEl.textContent = "Erro ao carregar perfil";
        profileEmail = "";
    }
};

const statusSaved = document.querySelector(".status-saved");
const cardsSaved = document.querySelector(".cards-saved");
const btnRefreshSaved = document.querySelector(".btn-refresh-saved");

const renderSavedStatus = (msg, hidden = false) => {
    if (!statusSaved) return;
    statusSaved.textContent = msg;
    statusSaved.classList.toggle("hidden", hidden);
};

const renderSaved = (items) => {
    if (!cardsSaved) return;
    if (!items.length) {
        cardsSaved.innerHTML = "";
        renderSavedStatus("Nenhum roteiro salvo ainda.", false);
        return;
    }
    renderSavedStatus("", true);
    cardsSaved.innerHTML = items
        .map(
            (item) => `
            <div class="saved-card">
                <h3>${item.itinerary.destination || "Destino"}</h3>
                <div class="meta">
                    <span>${item.itinerary.origin || "Origem"} → ${item.itinerary.destination || ""}</span>
                    <span>${item.itinerary.start_date || ""} a ${item.itinerary.end_date || ""}</span>
                    <span class="orcamento">${formatCurrency(item.itinerary.total_budget || 0)}</span>
                </div>
                <div class="actions">
                    <button class="btn-delete" data-id="${item.id}">Excluir</button>
                </div>
            </div>
        `
        )
        .join("");

    cardsSaved.querySelectorAll(".btn-delete").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const token = getToken();
            if (!token) {
                alert("Faça login para excluir um roteiro.");
                return;
            }
            const id = btn.dataset.id;
            btn.disabled = true;
            btn.textContent = "Excluindo...";
            try {
                await deleteResource(`/itineraries/saved/${id}/`, token);
                await loadSaved();
            } catch (err) {
                alert(err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = "Excluir";
            }
        });
    });
};

const loadSaved = async () => {
    const token = getToken();
    if (!token) {
        renderSavedStatus("Faça login para ver seus roteiros salvos.", false);
        if (cardsSaved) cardsSaved.innerHTML = "";
        return;
    }
    renderSavedStatus("Carregando...", false);
    if (btnRefreshSaved) btnRefreshSaved.disabled = true;
    try {
        const data = await getJson("/itineraries/saved/", token);
        renderSaved(data || []);
    } catch (err) {
        renderSavedStatus(err.message || "Não foi possível carregar os roteiros.", false);
    } finally {
        if (btnRefreshSaved) btnRefreshSaved.disabled = false;
    }
};

if (btnRefreshSaved) {
    btnRefreshSaved.addEventListener("click", loadSaved);
}

const newsletterForm = document.querySelector(".newsletter-form");
const newsletterStatus = document.querySelector(".newsletter-status");
if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const aceito = document.getElementById("aceito-news")?.checked;
        if (!aceito) {
            if (newsletterStatus) {
                newsletterStatus.textContent = "Marque para confirmar que deseja receber.";
                newsletterStatus.classList.remove("hidden");
            }
            return;
        }
        const email = profileEmail;
        if (!email) {
            if (newsletterStatus) {
                newsletterStatus.textContent = "Faça login para usar seu email no cadastro.";
                newsletterStatus.classList.remove("hidden");
            }
            return;
        }
        const button = newsletterForm.querySelector("button");
        if (button) {
            button.disabled = true;
            button.textContent = "Enviando...";
        }
        if (newsletterStatus) {
            newsletterStatus.textContent = "";
            newsletterStatus.classList.add("hidden");
        }
        try {
            await postJson("/newsletter/subscribe/", { email });
            if (newsletterStatus) {
                newsletterStatus.textContent = "Inscrição realizada!";
                newsletterStatus.classList.remove("hidden");
            }
            document.getElementById("aceito-news").checked = false;
        } catch (err) {
            if (newsletterStatus) {
                newsletterStatus.textContent = err.message;
                newsletterStatus.classList.remove("hidden");
            }
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Quero receber";
            }
        }
    });
}

loadProfile();
loadSaved();

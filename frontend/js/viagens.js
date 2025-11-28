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

const statusEl = document.querySelector(".status");
const cardsEl = document.querySelector(".cards");
const refreshBtn = document.querySelector(".btn-refresh");
const logoutBtn = document.querySelector(".logout-link");

const renderStatus = (msg, hidden = false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("hidden", hidden);
};

const renderCards = (items) => {
    if (!cardsEl) return;
    if (!items.length) {
        cardsEl.innerHTML = "";
        renderStatus("Nenhum roteiro salvo ainda.", false);
        return;
    }
    renderStatus("", true);
    cardsEl.innerHTML = items
        .map(
            (item) => `
            <div class="card" data-id="${item.id}">
                <h3>${item.itinerary.destination || "Destino"}</h3>
                <div class="meta">
                    <span>${item.itinerary.origin || "Origem"} → ${item.itinerary.destination || ""}</span>
                    <span>${item.itinerary.start_date || ""} a ${item.itinerary.end_date || ""}</span>
                    <span class="orcamento">${formatCurrency(item.itinerary.total_budget || 0)}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-delete" data-id="${item.id}">Excluir</button>
                </div>
            </div>
        `
        )
        .join("");

    cardsEl.querySelectorAll(".btn-delete").forEach((btn) => {
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
        renderStatus("Faça login para ver suas viagens salvas.", false);
        if (cardsEl) cardsEl.innerHTML = "";
        return;
    }
    renderStatus("Carregando...", false);
    if (refreshBtn) refreshBtn.disabled = true;
    try {
        const data = await getJson("/itineraries/saved/", token);
        renderCards(data || []);
    } catch (err) {
        renderStatus(err.message || "Não foi possível carregar suas viagens.", false);
    } finally {
        if (refreshBtn) refreshBtn.disabled = false;
    }
};

if (refreshBtn) {
    refreshBtn.addEventListener("click", loadSaved);
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        clearToken();
        window.location.href = "login.html";
    });
}

loadSaved();

const API_BASE = "http://localhost:8000/api";
const TOKEN_KEY = "tripmind_token";

const getToken = () => localStorage.getItem(TOKEN_KEY);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);
const FALLBACK_CITIES = [
    "São Paulo - SP (Brasil)",
    "Rio de Janeiro - RJ (Brasil)",
    "Recife - PE (Brasil)",
    "Salvador - BA (Brasil)",
    "Lisboa (Portugal)",
    "Madrid (Espanha)",
    "Paris (França)",
    "Roma (Itália)",
    "Londres (Reino Unido)",
    "Buenos Aires (Argentina)",
];

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const normalizeText = (text = "") => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const handleError = async (response) => {
    let detail = "Erro inesperado. Tente novamente.";
    try {
        const data = await response.json();
        if (data?.detail) detail = data.detail;
        else if (Array.isArray(data)) detail = data.join(", ");
        else if (typeof data === "object") detail = Object.values(data).flat().join(" | ");
        else if (typeof data === "string") detail = data;
    } catch (e) {
        // fallback
    }
    throw new Error(detail);
};

const postJson = async (endpoint, payload, token = null) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Token ${token}`;
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });
    if (!res.ok) await handleError(res);
    return res.json();
};

const getJson = async (endpoint, token = null) => {
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Token ${token}`;
    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!res.ok) await handleError(res);
    return res.json();
};

const debounce = (fn, delay = 350) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

const normalizeLocation = (item) => {
    const city =
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.municipality ||
        item.display_name?.split(",")?.[0]?.trim() ||
        "";
    const state = item.address?.state || item.address?.county || "";
    const country = item.address?.country || "";
    const labelParts = [];
    if (city) labelParts.push(city);
    if (state) labelParts.push(state);
    const label = `${labelParts.join(" - ")}${country ? ` (${country})` : ""}`;
    return { value: city || label, label };
};

const fetchLocations = async (term) => {
    if (!term || term.trim().length < 2) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(
        term
    )}`;
    const res = await fetch(url, {
        headers: {
            "Accept-Language": "pt-BR",
            "User-Agent": "TripMind/1.0 (contact@tripmind.local)",
        },
    });
    if (!res.ok) throw new Error("Não foi possível buscar locais agora.");
    const data = await res.json();
    return data.map(normalizeLocation).filter((i) => i.value);
};

const uniqueByLabel = (items) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = normalizeText(item.label || item.value);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const renderSuggestions = (items, datalistEl) => {
    if (!datalistEl) return;
    const unique = uniqueByLabel(items).slice(0, 10);
    datalistEl.innerHTML = unique.map((item) => `<option value="${item.value}">${item.label}</option>`).join("");
};

const origemInput = document.getElementById("origem");
const destinoInput = document.getElementById("destino");

const suggestionBox = document.createElement("div");
suggestionBox.className = "auto-sugestoes hidden";
document.body.appendChild(suggestionBox);

let lastTermNorm = "";
let lastFetchId = 0;
let currentInput = null;

const positionBox = (input) => {
    if (!input) return;
    const rect = input.getBoundingClientRect();
    suggestionBox.style.width = `${rect.width}px`;
    suggestionBox.style.left = `${rect.left + window.scrollX}px`;
    suggestionBox.style.top = `${rect.bottom + window.scrollY + 6}px`;
};

const hideBox = () => {
    suggestionBox.classList.add("hidden");
    suggestionBox.innerHTML = "";
    currentInput = null;
};

const showSuggestions = (items, input) => {
    if (!input) return;
    suggestionBox.innerHTML = items
        .map((item) => `<button type="button" data-value="${item.value}">${item.label}</button>`)
        .join("");
    suggestionBox.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
            input.value = btn.dataset.value || btn.textContent;
            hideBox();
        });
    });
    positionBox(input);
    suggestionBox.classList.remove("hidden");
};

const updateSuggestions = debounce(async (input) => {
    if (!input) return;
    currentInput = input;
    const term = input.value || "";
    const termNorm = normalizeText(term);
    if (termNorm === lastTermNorm && !suggestionBox.classList.contains("hidden")) return;
    lastTermNorm = termNorm;
    const fetchId = ++lastFetchId;
    const fallbackMatches = FALLBACK_CITIES.filter((c) => normalizeText(c).includes(termNorm)).map((c) => ({
        value: c,
        label: c,
    }));
    try {
        const results = await fetchLocations(term);
        if (fetchId !== lastFetchId) return;
        if (results.length) {
            const combined = uniqueByLabel([...fallbackMatches, ...results]);
            showSuggestions(combined.length ? combined : results, input);
            return;
        }
    } catch (err) {
        if (fetchId !== lastFetchId) return;
    }
    const fallbackItems = fallbackMatches.length
        ? fallbackMatches
        : FALLBACK_CITIES.map((c) => ({ value: c, label: c }));
    showSuggestions(uniqueByLabel(fallbackItems), input);
}, 250);

const attachAutocomplete = (input) => {
    if (!input) return;
    input.addEventListener("input", () => updateSuggestions(input));
    input.addEventListener("focus", () => updateSuggestions(input));
    input.addEventListener("blur", () => {
        setTimeout(hideBox, 120);
    });
};

attachAutocomplete(origemInput);
attachAutocomplete(destinoInput);

// Minhas viagens salvas
const salvosSection = document.querySelector(".salvos");
if (salvosSection) {
    const btnLoad = salvosSection.querySelector(".btn-carregar-salvos");
    const statusEl = salvosSection.querySelector(".salvos-status");
    const listEl = salvosSection.querySelector(".salvos-list");

    const renderStatus = (msg, hidden = false) => {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.classList.toggle("hidden", hidden);
    };

    const renderList = (items) => {
        if (!listEl) return;
        if (!items.length) {
            listEl.innerHTML = "";
            renderStatus("Nenhum roteiro salvo ainda.", false);
            return;
        }
        renderStatus("", true);
        listEl.innerHTML = items
            .map(
                (item) => `
                <div class="salvo-card">
                    <h4>${item.itinerary.destination || "Destino"}</h4>
                    <div class="salvo-meta">
                        <span>${item.itinerary.origin || "Origem"} → ${item.itinerary.destination || ""}</span>
                        <span>${item.itinerary.start_date || ""} a ${item.itinerary.end_date || ""}</span>
                        <span class="salvo-orcamento">${formatCurrency(item.itinerary.total_budget || 0)}</span>
                    </div>
                </div>
            `
            )
            .join("");
    };

    const carregarSalvos = async () => {
        const token = getToken();
        if (!token) {
            renderStatus("Faça login para ver seus roteiros salvos.", false);
            if (listEl) listEl.innerHTML = "";
            return;
        }
        renderStatus("Carregando...", false);
        if (btnLoad) btnLoad.disabled = true;
        try {
            const data = await getJson("/itineraries/saved/", token);
            renderList(data || []);
        } catch (err) {
            renderStatus(err.message || "Não foi possível carregar os roteiros.", false);
        } finally {
            if (btnLoad) btnLoad.disabled = false;
        }
    };

    if (btnLoad) {
        btnLoad.addEventListener("click", carregarSalvos);
    }

    carregarSalvos();
}

// Menu hambúrguer: logout
const menuBtn = document.getElementById("menu");
const menuDropdown = document.querySelector(".menu-dropdown");
if (menuBtn && menuDropdown) {
    menuBtn.addEventListener("click", () => {
        menuDropdown.classList.toggle("hidden");
    });

    const logoutBtn = menuDropdown.querySelector('[data-action="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            clearToken();
            alert("Você saiu da sua conta.");
            window.location.href = "login.html";
        });
    }

    document.addEventListener("click", (e) => {
        if (!menuDropdown.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
            menuDropdown.classList.add("hidden");
        }
    });
}

// Carrossel com arraste e auto slide
const carrossel = document.querySelector(".carrossel-destinos");
if (carrossel) {
    let isDown = false;
    let startX;
    let scrollLeft;

    const start = (pageX) => {
        isDown = true;
        startX = pageX - carrossel.offsetLeft;
        scrollLeft = carrossel.scrollLeft;
    };

    carrossel.addEventListener("mousedown", (e) => start(e.pageX));
    carrossel.addEventListener("touchstart", (e) => start(e.touches[0].pageX));

    const end = () => (isDown = false);
    carrossel.addEventListener("mouseleave", end);
    carrossel.addEventListener("mouseup", end);
    carrossel.addEventListener("touchend", end);

    const move = (pageX) => {
        if (!isDown) return;
        const x = pageX - carrossel.offsetLeft;
        const walk = (x - startX) * 2;
        carrossel.scrollLeft = scrollLeft - walk;
    };

    carrossel.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        move(e.pageX);
    });
    carrossel.addEventListener("touchmove", (e) => {
        if (!isDown) return;
        move(e.touches[0].pageX);
    });

    setInterval(() => {
        carrossel.scrollLeft += 300;
        if (carrossel.scrollLeft + carrossel.clientWidth >= carrossel.scrollWidth) {
            carrossel.scrollLeft = 0;
        }
    }, 3000);
}

// Hover nos cards do carrossel
document.querySelectorAll(".carrossel-destinos > div").forEach((card) => {
    card.addEventListener("mouseenter", () => {
        card.style.transform = "scale(1.05)";
        card.style.transition = "0.3s ease";
        card.style.boxShadow = "0 10px 25px rgba(0,0,0,0.4)";
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "scale(1)";
        card.style.boxShadow = "none";
    });
});

// Botão voltar ao topo
const btnTopo = document.createElement("button");
btnTopo.innerText = "↑";
btnTopo.style.position = "fixed";
btnTopo.style.right = "20px";
btnTopo.style.bottom = "20px";
btnTopo.style.width = "45px";
btnTopo.style.height = "45px";
btnTopo.style.borderRadius = "50%";
btnTopo.style.border = "none";
btnTopo.style.background = "#0077B6";
btnTopo.style.color = "white";
btnTopo.style.fontSize = "22px";
btnTopo.style.cursor = "pointer";
btnTopo.style.opacity = "0";
btnTopo.style.transition = "0.4s ease";
btnTopo.style.zIndex = "999";
document.body.appendChild(btnTopo);

window.addEventListener("scroll", () => {
    btnTopo.style.opacity = window.scrollY > 300 ? "1" : "0";
});

btnTopo.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

// Trocar origem e destino
const btnTroca = document.getElementById("btnTroca");

if (btnTroca && origemInput && destinoInput) {
    btnTroca.addEventListener("click", (e) => {
        e.preventDefault();
        const origem = origemInput.value;
        const destino = destinoInput.value;
        origemInput.value = destino;
        destinoInput.value = origem;
        origemInput.classList.add("trocou");
        destinoInput.classList.add("trocou");
        setTimeout(() => {
            origemInput.classList.remove("trocou");
            destinoInput.classList.remove("trocou");
        }, 300);
    });
}

// Newsletter -> API
const newsletterForms = document.querySelectorAll(".newsletter-form");
newsletterForms.forEach((form) => {
    const emailInput = form.querySelector("input[type='email'], input[type='text']");
    const button = form.querySelector("button");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput?.value.trim();
        if (!validarEmail(email || "")) {
            alert("Digite um email válido.");
            return;
        }
        const original = button?.innerHTML;
        if (button) {
            button.disabled = true;
            button.innerHTML = "•••";
        }
        try {
            await postJson("/newsletter/subscribe/", { email });
            if (button) {
                button.innerHTML = "✓";
                button.style.background = "#4CAF50";
            }
            emailInput.value = "";
        } catch (err) {
            alert(err.message);
        } finally {
            setTimeout(() => {
                if (button) {
                    button.disabled = false;
                    button.innerHTML = original;
                    button.style.background = "";
                }
            }, 1200);
        }
    });
});

// Busca e geração de roteiro (IA mock)
const buscaForm = document.querySelector(".busca form");
if (buscaForm) {
    const resultado = document.getElementById("resultado-roteiro");
    const salvarBtn = resultado?.querySelector(".btn-salvar-roteiro");
    const listaTransporte = resultado?.querySelector(".lista-transporte");
    const listaHospedagem = resultado?.querySelector(".lista-hospedagem");
    const resumoEl = resultado?.querySelector(".resultado-resumo");
    const periodoEl = resultado?.querySelector(".resultado-periodo");
    const totalEl = resultado?.querySelector(".resultado-total");
    const statusEl = resultado?.querySelector(".resultado-status");
    let ultimoItinerario = null;

    const renderItinerary = (data) => {
        if (!resultado) return;
        ultimoItinerario = data;
        resultado.classList.remove("hidden");
        if (statusEl) statusEl.textContent = "Roteiro pronto";
        if (resumoEl) resumoEl.textContent = data.ai_summary || "Roteiro gerado com sucesso.";
        if (periodoEl) periodoEl.textContent = `Período: ${data.start_date} a ${data.end_date}`;
        if (totalEl) totalEl.textContent = `Orçamento estimado: ${formatCurrency(data.total_budget)}`;

        if (listaTransporte) {
            listaTransporte.innerHTML = (data.transport_options || [])
                .map(
                    (t) =>
                        `<li>${t.type || "Transporte"} - ${t.provider || ""} (${formatCurrency(
                            t.price || t.price_per_night || 0
                        )})</li>`
                )
                .join("");
        }

        if (listaHospedagem) {
            listaHospedagem.innerHTML = (data.lodging_options || [])
                .map(
                    (h) =>
                        `<li>${h.name || "Hospedagem"} - ${formatCurrency(
                            h.price_per_night || h.price || 0
                        )} / noite</li>`
                )
                .join("");
        }

        if (salvarBtn) salvarBtn.dataset.itineraryId = data.id;
    };

    buscaForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            origin: document.getElementById("origem")?.value || "",
            destination: document.getElementById("destino")?.value || "",
            start_date: document.getElementById("data-ida")?.value || "",
            end_date: document.getElementById("data-volta")?.value || "",
            budget_level: document.getElementById("orcamento")?.value || "intermediario",
        };

        const submitBtn = buscaForm.querySelector(".btn-buscar");
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Buscando...";
        }

        try {
            const data = await postJson("/itineraries/search/", payload, getToken());
            renderItinerary(data);
        } catch (err) {
            alert(err.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = "Buscar";
            }
        }
    });

    if (salvarBtn) {
        salvarBtn.addEventListener("click", async () => {
            const token = getToken();
            if (!token) {
                alert("Faça login para salvar o roteiro no seu perfil.");
                return;
            }
            const itineraryId = salvarBtn.dataset.itineraryId;
            if (!itineraryId) {
                alert("Gere um roteiro antes de salvar.");
                return;
            }
            salvarBtn.disabled = true;
            salvarBtn.textContent = "Salvando...";
            try {
                await postJson("/itineraries/save/", { itinerary_id: itineraryId }, token);
                salvarBtn.textContent = "Salvo!";
            } catch (err) {
                alert(err.message);
                salvarBtn.textContent = "Salvar no meu perfil";
            } finally {
                setTimeout(() => {
                    salvarBtn.disabled = false;
                    salvarBtn.textContent = "Salvar no meu perfil";
                }, 1200);
            }
        });
    }
}

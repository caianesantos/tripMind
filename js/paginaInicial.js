//  CARROSSEL: AUTO-SLIDE 
const carrossel = document.querySelector(".carrossel-destinos");

let isDown = false;
let startX;
let scrollLeft;

// Arrastar com mouse
carrossel.addEventListener("mousedown", (e) => {
    isDown = true;
    startX = e.pageX - carrossel.offsetLeft;
    scrollLeft = carrossel.scrollLeft;
});

carrossel.addEventListener("mouseleave", () => {
    isDown = false;
});

carrossel.addEventListener("mouseup", () => {
    isDown = false;
});

carrossel.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carrossel.offsetLeft;
    const walk = (x - startX) * 2;
    carrossel.scrollLeft = scrollLeft - walk;
});

// Arrastar com touch (mobile)
carrossel.addEventListener("touchstart", (e) => {
    isDown = true;
    startX = e.touches[0].pageX - carrossel.offsetLeft;
    scrollLeft = carrossel.scrollLeft;
});

carrossel.addEventListener("touchend", () => {
    isDown = false;
});

carrossel.addEventListener("touchmove", (e) => {
    if (!isDown) return;
    const x = e.touches[0].pageX - carrossel.offsetLeft;
    const walk = (x - startX) * 2;
    carrossel.scrollLeft = scrollLeft - walk;
});

// Auto slide
setInterval(() => {
    carrossel.scrollLeft += 300;

    if (carrossel.scrollLeft + carrossel.clientWidth >= carrossel.scrollWidth) {
        carrossel.scrollLeft = 0;
    }
}, 3000);

// VALIDAÇÃO DO EMAIL 
const newsletterForm = document.querySelector(".newsletter-form");
const emailInput = newsletterForm.querySelector("input");

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// LOADING E SUCESSO 
newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!validarEmail(email)) {
        alert("Digite um email válido.");
        return;
    }

    const botao = newsletterForm.querySelector("button");
    const original = botao.innerHTML;

    botao.disabled = true;
    botao.innerHTML = "•••";

    setTimeout(() => {
        botao.innerHTML = "✓";
        botao.style.background = "#4CAF50";

        setTimeout(() => {
            botao.disabled = false;
            botao.innerHTML = original;
            botao.style.background = "";
            emailInput.value = "";
        }, 1500);

    }, 1200);
});

//  ANIMAÇÃO HOVER NOS CARDS 
document.querySelectorAll(".card-destino").forEach(card => {
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

// BOTÃO VOLTAR AO TOPO 
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
    if (window.scrollY > 300) {
        btnTopo.style.opacity = "1";
    } else {
        btnTopo.style.opacity = "0";
    }
});

btnTopo.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth",
    });
});

// TROCAR ORIGEM E DESTINO
const origemInput = document.getElementById("origem");
const destinoInput = document.getElementById("destino");
const btnTroca = document.getElementById("btnTroca");

btnTroca.addEventListener("click", (e) => {
    e.preventDefault();

    let origem = origemInput.value;
    let destino = destinoInput.value;

    // troca
    origemInput.value = destino;
    destinoInput.value = origem;

    // animação rápida
    origemInput.classList.add("trocou");
    destinoInput.classList.add("trocou");

    setTimeout(() => {
        origemInput.classList.remove("trocou");
        destinoInput.classList.remove("trocou");
    }, 300);
});

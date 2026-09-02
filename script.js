const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("nav");

menu.addEventListener("click", () => {
    nav.classList.toggle("show");
});

document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
        nav.classList.remove("show");
    });
});

document.querySelectorAll(".faq-question").forEach(button => {
    button.addEventListener("click", () => {
        const answer = button.nextElementSibling;
        answer.classList.toggle("open");
    });
});

// Work gallery: data-driven rendering + lightbox
(() => {
    const grid = document.getElementById("gallery-grid");
    const lightbox = document.getElementById("gallery-lightbox");
    if (!grid || !lightbox) return;

    const image = lightbox.querySelector(".gallery-lightbox-image");
    const closeButton = lightbox.querySelector(".gallery-lightbox-close");
    const prevButton = lightbox.querySelector(".gallery-lightbox-prev");
    const nextButton = lightbox.querySelector(".gallery-lightbox-next");
    let items = [];
    let currentIndex = 0;

    function escapeHtml(value = "") {
        return String(value).replace(/[&<>'"]/g, char => ({
            "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;"
        })[char]);
    }

    function renderGallery() {
        grid.innerHTML = items.map((item, index) => `
            <button class="gallery-item" type="button" data-index="${index}" aria-label="Open ${escapeHtml(item.caption || 'gallery image')}">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt || item.caption || 'Cornerstone Tactical engraving work')}" loading="lazy">
            </button>
        `).join("");

        grid.querySelectorAll(".gallery-item").forEach(button => {
            button.addEventListener("click", () => openLightbox(Number(button.dataset.index)));
        });
    }

    function showImage(index) {
        if (!items.length) return;
        currentIndex = (index + items.length) % items.length;
        image.src = items[currentIndex].image;
        image.alt = items[currentIndex].alt || items[currentIndex].caption || "Cornerstone Tactical engraving work";
    }

    function openLightbox(index) {
        showImage(index);
        lightbox.classList.add("open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("gallery-open");
        closeButton.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove("open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("gallery-open");
        image.src = "";
        const current = grid.querySelector(`[data-index="${currentIndex}"]`);
        if (current) current.focus();
    }

    fetch("data/gallery.json", { cache: "no-store" })
        .then(response => {
            if (!response.ok) throw new Error(`Gallery data returned ${response.status}`);
            return response.json();
        })
        .then(data => {
            items = Array.isArray(data.items) ? data.items.filter(item => item && item.image) : [];
            renderGallery();
        })
        .catch(error => {
            console.error("Unable to load gallery:", error);
            grid.innerHTML = '<p class="gallery-load-error">Gallery is temporarily unavailable.</p>';
        });

    closeButton.addEventListener("click", closeLightbox);
    prevButton.addEventListener("click", () => showImage(currentIndex - 1));
    nextButton.addEventListener("click", () => showImage(currentIndex + 1));
    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", event => {
        if (!lightbox.classList.contains("open")) return;
        if (event.key === "Escape") closeLightbox();
        if (event.key === "ArrowLeft") showImage(currentIndex - 1);
        if (event.key === "ArrowRight") showImage(currentIndex + 1);
    });
})();

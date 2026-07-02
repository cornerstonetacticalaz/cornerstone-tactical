const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("nav");

menu.addEventListener("click", () => {
    nav.classList.toggle("show");
});
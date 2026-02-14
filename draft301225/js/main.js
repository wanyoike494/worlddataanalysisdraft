// Mobile menu toggle
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
    navLinks.style.display =
        navLinks.style.display === "flex" ? "none" : "flex";
});

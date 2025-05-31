document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("theme-toggle");
    const darkIcon = document.getElementById("dark-icon");
    const lightIcon = document.getElementById("light-icon");

    function updateIcons(theme) {
        if (darkIcon && lightIcon) {
            darkIcon.style.display = theme === "dark" ? "none" : "inline-block";
            lightIcon.style.display = theme === "dark" ? "inline-block" : "none";
        }
    }

    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    updateIcons(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const currentTheme = document.body.getAttribute("data-theme") || "light";
            const newTheme = currentTheme === "light" ? "dark" : "light";
            document.body.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateIcons(newTheme);
        });
    }
});
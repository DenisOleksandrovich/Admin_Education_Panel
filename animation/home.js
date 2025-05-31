document.addEventListener('DOMContentLoaded', function() {
  const mainContent = document.getElementById('main-content');

  const blockedLinks = document.querySelectorAll('.blocked-link');
  blockedLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      showAlert('Увійдіть в систему для доступу до цієї сторінки');
    });
  });

  window.showAlert = function(message) {
    const alertBox = document.getElementById('alertBox');
    alertBox.textContent = message;
    alertBox.style.display = 'block';
    
    setTimeout(() => {
      alertBox.style.display = 'none';
    }, 3000);
  };
});

document.addEventListener("DOMContentLoaded", function () {
    // Переключение бокового меню
    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("sidebar-toggle");

    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            sidebar.classList.toggle("show");
        });
    }

    document.addEventListener("click", function (event) {
        if (!sidebar.contains(event.target) && !toggleButton.contains(event.target)) {
            sidebar.classList.remove("show");
        }
    });

    // Подсветка активной ссылки в навигации
    let links = document.querySelectorAll(".nav-link");
    links.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add("active");
        }
    });
});
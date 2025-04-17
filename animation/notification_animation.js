document.addEventListener("DOMContentLoaded", function () {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
    });
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const userId = 1; // Текущий пользователь
  const container = document.querySelector(".notification-list");

  try {
    const response = await fetch(`http://localhost:3000/api/notifications/${userId}`);
    const data = await response.json();

    data.notifications.forEach(notification => {
      const createdAt = new Date(notification.created_at).toLocaleString();

      let icon = '🔔';
      let priority = 'priority-medium';
      let title = 'Нове повідомлення';

      switch (notification.type) {
        case 'assignment':
          icon = '📝';
          priority = 'priority-medium';
          title = 'Нове завдання';
          break;
        case 'event':
          icon = '📅';
          priority = 'priority-high';
          title = 'Скоро подія';
          break;
        case 'grade':
          icon = '✅';
          priority = 'priority-low';
          title = 'Оцінка';
          break;
        case 'message':
          icon = '💬';
          priority = 'priority-low';
          title = 'Повідомлення';
          break;
        case 'system':
          icon = '⚙️';
          priority = 'priority-low';
          title = 'Системне повідомлення';
          break;
      }

      container.innerHTML += `
        <div class="notification-item unread ${priority}">
          <div class="notification-icon large-card-text">${icon}</div>
          <div class="notification-content">
            <div class="notification-header">
              <h3 class="notification-title large-card-text">
                <span class="unread-badge large-card-text"></span>${title}
              </h3>
              <span class="notification-time card-main-text">${createdAt}</span>
            </div>
            <p class="notification-message card-main-text">${notification.message}</p>
          </div>
        </div>`;
    });

  } catch (error) {
    console.error('Помилка при завантаженні повідомлень:', error);
  }
});

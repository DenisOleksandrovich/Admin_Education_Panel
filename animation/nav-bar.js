document.addEventListener("DOMContentLoaded", function () {
    const sidebarContent = `
      <div class="user-profile" onclick="window.location.href='account.html'">
        <img src="icons/portfolio-photo.jpg" alt="Фото студента" class="user-photo">
        <div class="user-details">
            <span class="menu-nav-text user-name">Дерус Денис Олександрович</span>
            <span class="menu-nav-text user-list-number"> 5 * АС-224</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="menu-nav-text nav-section-title">Головне</div>
          <a href="index.html" class="nav-link">
            <span class="nav-icon">📊</span>
            <span class="menu-nav-text">Огляд</span>
          </a>
          <a href="students.html" class="nav-link">
            <span class="nav-icon">👥</span>
            <span class="menu-nav-text">Студенти</span>
          </a>
          <a href="teachers.html" class="nav-link">
            <span class="nav-icon">👨‍🏫</span>
            <span class="menu-nav-text">Викладачі</span>
          </a>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Управління</div>
          <a href="tasks.html" class="nav-link">
            <span class="nav-icon">✅</span>
            <span class="menu-nav-text">Завдання</span>
          </a>
          <a href="calendar.html" class="nav-link">
            <span class="nav-icon">📆</span>
            <span class="menu-nav-text">Календар</span>
          </a>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Налаштування</div>
          <a href="account.html" class="nav-link">
            <span class="nav-icon">👤</span>
            <span class="menu-nav-text">Профіль</span>
          </a>
          <a href="notification.html" class="nav-link">
            <span class="nav-icon">🔔</span>
            <span class="menu-nav-text">Сповіщення</span>
          </a>
          <a href="safety_page.html" class="nav-link">
            <span class="nav-icon">🔒</span>
            <span class="menu-nav-text">Безпека</span>
          </a>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-support" onclick="toggleChat()">
          <div class="support-icon">💬</div>
          <div class="support-info">
            <div class="menu-nav-text support-title">Підтримка</div>
            <div class="menu-nav-text support-text">Чат і соц. мережі</div>
          </div>
        </div>
      </div>
    `;

    const sidebarElement = document.createElement("div");
    sidebarElement.innerHTML = sidebarContent;
    const sidebar = document.getElementById("sidebar");
    sidebar.appendChild(sidebarElement);

    const userPhoto = document.querySelector(".user-photo");
    const userDetails = document.querySelector(".user-details");
    const userName = document.querySelector(".user-name");
    const fullName = "Дерус Денис Олександрович";
    
    userPhoto.onload = function() {
        if (userPhoto.complete && userPhoto.naturalWidth !== 0) {
            userPhoto.style.display = "block";
            userDetails.style.display = "block";
        } else {
            handleImageError();
        }
    };
    
    userPhoto.onerror = handleImageError;
    
    function handleImageError() {
        userPhoto.style.display = "none";
        userDetails.style.display = "block";
        let initials = fullName.split(" ").map(word => word[0]).join("").toUpperCase();
        userName.textContent = initials;
    }
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






document.addEventListener("DOMContentLoaded", function () {
    const chatContainer = document.getElementById("chatContainer");
    const chatToggle = document.getElementById("chatToggle");

    if (!chatContainer) {
        console.error("Контейнер chatContainer не найден.");
        return;
    }

    // Контент боковой панели
    const sidebarContent = `
        <div class="chat-header">
            <span>Підтримка</span>
            <button class="chat-close" onclick="toggleChat()">×</button>
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="chat-placeholder" id="chatPlaceholder">
                <img src="icons/hello-sticker.png" alt="Привітання" class="chat-sticker">
                <p>Як ми можемо вам допомогти?</p>
            </div>
        </div>
        <div class="chat-input-container">
            <textarea id="chatInput" placeholder="Введіть повідомлення..."></textarea>
            <button id="sendButton">➤</button>
        </div>
    `;

    // Добавляем содержимое в контейнер
    chatContainer.innerHTML = sidebarContent;

    // Функция открытия/закрытия чата
    function toggleChat() {
        chatContainer.classList.toggle("show");
    }
    window.toggleChat = toggleChat;

    // Функция для эмуляции анимации "клиент печатает..."
    function showTypingAnimation(chatMessages) {
        const typingElement = document.createElement("div");
        typingElement.className = "chat-typing";
        typingElement.textContent = "...";
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingElement;
    }

    // Функция отправки сообщения
    function sendMessage() {
        const chatInput = document.getElementById("chatInput");
        const chatMessages = document.getElementById("chatMessages");
        const chatPlaceholder = document.getElementById("chatPlaceholder");

        if (!chatInput || !chatMessages) {
            console.error("Элементы чата не найдены.");
            return;
        }

        const message = chatInput.value.trim();
        if (!message) return;

        // Если есть placeholder (приветствие) — удаляем его
        if (chatPlaceholder) {
            chatPlaceholder.remove();
        }

        // Создаем элемент с сообщением пользователя
        const messageElement = document.createElement("div");
        messageElement.className = "chat-message user-message";
        messageElement.textContent = message.replace(/<[^>]*>/g, "");
        chatMessages.appendChild(messageElement);

        chatInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Показ анимации "клиент печатает..."
        const typingAnimation = showTypingAnimation(chatMessages);

        // Через 2 секунды убрать анимацию и показать сообщение о передаче запроса в поддержку
        setTimeout(() => {
            typingAnimation.remove();
            const supportReply = document.createElement("div");
            supportReply.className = "chat-message support-message";
            supportReply.textContent = "Ваш запит передано в службу підтримки.";
            chatMessages.appendChild(supportReply);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 2000);
    }

    // Обработчик для кнопки отправки
    const sendButton = document.getElementById("sendButton");
    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    }

    // Отправка сообщения по нажатию Enter (без Shift)
    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
        chatInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    // Обработчик для кнопки открытия чата
    if (chatToggle) {
        chatToggle.addEventListener("click", toggleChat);
    }

    document.addEventListener("click", function (event) {
        const clickedOutsideChat = !chatContainer.contains(event.target);
        const clickedOutsideToggle = !chatToggle || !chatToggle.contains(event.target);
    
        if (clickedOutsideChat && clickedOutsideToggle) {
            chatContainer.classList.remove("show");
        }
    });
});



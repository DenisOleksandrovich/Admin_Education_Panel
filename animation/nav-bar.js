document.addEventListener("DOMContentLoaded", function () {
    let chatContainer = document.getElementById("chatContainer");
    if (!chatContainer) {
        chatContainer = document.createElement("div");
        chatContainer.id = "chatContainer";
        chatContainer.className = "chat-container";
        document.body.appendChild(chatContainer);
    }

    window.toggleChat = function() {
        chatContainer.classList.toggle("show");
    };

    const chatContent = `
        <div class="chat-header">
            <span class="card-title">Підтримка</span>
            <button class="chat-close card-main-text" onclick="toggleChat()">×</button>
        </div>
        <div class="chat-messages card-main-text" id="chatMessages">
            <div class="chat-placeholder card-main-text" id="chatPlaceholder">
                <img src="icons/hello-sticker.png" alt="Привітання" class="chat-sticker">
                <p class="card-main-text">Як ми можемо вам допомогти?</p>
            </div>
        </div>
        <div class="chat-input-container">
            <textarea id="chatInput" placeholder="Введіть повідомлення..." class="card-main-text"></textarea>
            <button id="sendButton" class="card-main-text">➤</button>
        </div>
    `;

    chatContainer.innerHTML = chatContent;

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
        <div class="sidebar-support" id="support-chat-toggle">
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

    const supportChatToggle = document.getElementById("support-chat-toggle");
    if (supportChatToggle) {
        supportChatToggle.addEventListener("click", window.toggleChat);
    }

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

    const toggleButton = document.getElementById("sidebar-toggle");

    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            sidebar.classList.toggle("show");
        });
    }

    document.addEventListener("click", function (event) {
        if (!sidebar.contains(event.target) && (!toggleButton || !toggleButton.contains(event.target))) {
            sidebar.classList.remove("show");
        }
    });

    let links = document.querySelectorAll(".nav-link");
    links.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add("active");
        }
    });

    function showTypingAnimation(chatMessages) {
        const typingElement = document.createElement("div");
        typingElement.className = "chat-typing";
        typingElement.textContent = "...";
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingElement;
    }

    function sendMessage() {
        const chatInput = document.getElementById("chatInput");
        const chatMessages = document.getElementById("chatMessages");
        const chatPlaceholder = document.getElementById("chatPlaceholder");

        if (!chatInput || !chatMessages) {
            console.error("Елементи чату не знайдено.");
            return;
        }

        const message = chatInput.value.trim();
        if (!message) return;

        if (chatPlaceholder) {
            chatPlaceholder.remove();
        }

        const messageElement = document.createElement("div");
        messageElement.className = "chat-message user-message card-main-text";
        messageElement.textContent = message.replace(/<[^>]*>/g, "");
        chatMessages.appendChild(messageElement);

        chatInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const typingAnimation = showTypingAnimation(chatMessages);

        setTimeout(() => {
            typingAnimation.remove();
            const supportReply = document.createElement("div");
            supportReply.className = "chat-message support-message card-main-text";
            supportReply.textContent = "Ваш запит передано в службу підтримки.";
            chatMessages.appendChild(supportReply);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 2000);
    }

    const sendButton = document.getElementById("sendButton");
    if (sendButton) {
        sendButton.addEventListener("click", sendMessage);
    }

    const chatInput = document.getElementById("chatInput");
    if (chatInput) {
        chatInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    document.addEventListener("click", function (event) {
        const clickedOutsideChat = !chatContainer.contains(event.target);
        const clickedOutsideToggle = !supportChatToggle || !supportChatToggle.contains(event.target);
    
        if (clickedOutsideChat && clickedOutsideToggle) {
            chatContainer.classList.remove("show");
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    // Боковое меню с возможностью перетаскивания
    const sidebar = document.getElementById("sidebar");
    const toggleButton = document.getElementById("sidebar-toggle");

    if (toggleButton) {
        toggleButton.addEventListener("click", function() {
            sidebar.classList.toggle("show");
        });
    }

    if (sidebar && toggleButton) {
        // Создаем элементы для перетаскивания и изменения размера
        const dragHandle = document.createElement('div');
        dragHandle.className = 'sidebar-drag-handle';
        sidebar.appendChild(dragHandle);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'sidebar-resize-handle';
        sidebar.appendChild(resizeHandle);

        // Переменные для drag and drop
        let isDragging = false;
        let isResizing = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Обработчики событий для перетаскивания
        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Обработчики событий для изменения размера
        resizeHandle.addEventListener('mousedown', resizeStart);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', resizeEnd);

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === dragHandle) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, sidebar);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;

            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        function resizeStart(e) {
            isResizing = true;
        }

        function resize(e) {
            if (isResizing) {
                const newWidth = e.clientX - sidebar.getBoundingClientRect().left;
                const newHeight = e.clientY - sidebar.getBoundingClientRect().top;

                sidebar.style.width = `${newWidth}px`;
                sidebar.style.height = `${newHeight}px`;
            }
        }

        function resizeEnd() {
            isResizing = false;
        }

        // Закрытие меню при клике вне его области
        document.addEventListener("click", function (event) {
            if (!sidebar.contains(event.target) && !toggleButton.contains(event.target)) {
                sidebar.classList.remove("show");
            }
        });
    }

    // Темная/светлая тема
    const themeToggle = document.getElementById("theme-toggle");
    const darkIcon = document.getElementById("dark-icon");
    const lightIcon = document.getElementById("light-icon");

    if (themeToggle && darkIcon && lightIcon) {
        function updateIcons(theme) {
            darkIcon.style.display = theme === "dark" ? "none" : "inline-block";
            lightIcon.style.display = theme === "dark" ? "inline-block" : "none";
        }

        themeToggle.addEventListener("click", function () {
            const body = document.body;
            const newTheme = body.getAttribute("data-theme") === "light" ? "dark" : "light";

            body.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);

            updateIcons(newTheme);
        });

        const savedTheme = localStorage.getItem("theme") || "light";
        document.body.setAttribute("data-theme", savedTheme);
        updateIcons(savedTheme);
    }

    // Чат
    const chatToggle = document.getElementById("chatToggle");
    const chatContainer = document.getElementById("chatContainer");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const chatSend = document.getElementById("chatSend");

    function toggleChat() {
        if (chatContainer) {
            chatContainer.classList.toggle("show");
        }
    }

    function sendMessage() {
        if (!chatInput || !chatMessages) {
            console.error("Элементы чата не найдены.");
            return;
        }

        let message = chatInput.value.trim();
        if (!message) return;

        let sanitizedMessage = message.replace(/<[^>]*>/g, "");
        let messageElement = document.createElement("div");
        messageElement.className = "chat-message";
        messageElement.textContent = sanitizedMessage;
        chatMessages.appendChild(messageElement);

        chatInput.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chatToggle) {
        chatToggle.addEventListener("click", toggleChat);
    }

    if (chatSend) {
        chatSend.addEventListener("click", sendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    // Закрытие чата при клике вне его области
    document.addEventListener("click", function (event) {
        if (chatContainer && !chatContainer.contains(event.target) && !chatToggle.contains(event.target)) {
            chatContainer.classList.remove("show");
        }
    });

    window.toggleChat = toggleChat;
    window.sendMessage = sendMessage;

    // Подсветка активной ссылки в навигации
    let links = document.querySelectorAll(".nav-link");
    links.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add("active");
        }
    });

    // Отображение календаря
    const calendarTable = document.querySelector(".calendar tbody");
    if (calendarTable) {
        generateCalendar();
    }

    // Выделение текущего дня
    let today = new Date();
    let day = today.getDate();
    let cells = document.querySelectorAll(".calendar .current-month");

    cells.forEach(cell => {
        if (parseInt(cell.textContent, 10) === day) {
            cell.classList.add("today");
        }
    });

    // Проверка фото пользователя
    let userPhoto = document.querySelector(".user-photo");
    let userDetails = document.querySelector(".user-details");
    let userName = userDetails?.querySelector(".user-name");
    let fullName = "Дерус Денис Олександрович";

    if (userPhoto && userDetails && userName) {
        if (!userPhoto.complete || userPhoto.naturalWidth === 0) {
            userPhoto.style.display = "none";
            userDetails.style.display = "block";
            let initials = fullName.split(" ").map(word => word[0]).join("").toUpperCase();
            userName.textContent = initials;
        }
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const chatContainer = document.getElementById("chatContainer");
    const chatToggle = document.getElementById("chatToggle");

    if (chatContainer) {
        // Создаем элементы для перетаскивания и изменения размера
        const dragHandle = document.createElement('div');
        dragHandle.className = 'chat-drag-handle';
        chatContainer.appendChild(dragHandle);

        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'chat-resize-handle';
        chatContainer.appendChild(resizeHandle);

        // Переменные для drag and drop
        let isDragging = false;
        let isResizing = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        // Максимальные размеры окна чата
        const MAX_WIDTH = window.innerWidth - 40;
        const MAX_HEIGHT = window.innerHeight - 40;
        const MIN_WIDTH = 320;
        const MIN_HEIGHT = 300;

        function dragStart(e) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === dragHandle) {
                isDragging = true;
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                // Ограничения по краям экрана
                currentX = Math.max(0, Math.min(currentX, window.innerWidth - chatContainer.offsetWidth));
                currentY = Math.max(0, Math.min(currentY, window.innerHeight - chatContainer.offsetHeight));

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, chatContainer);
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;

            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        function resizeStart(e) {
            isResizing = true;
        }

        function resize(e) {
            if (isResizing) {
                // Вычисляем новую ширину и высоту
                const newWidth = Math.max(MIN_WIDTH, Math.min(e.clientX - chatContainer.getBoundingClientRect().left, MAX_WIDTH));
                const newHeight = Math.max(MIN_HEIGHT, Math.min(e.clientY - chatContainer.getBoundingClientRect().top, MAX_HEIGHT));

                chatContainer.style.width = `${newWidth}px`;
                chatContainer.style.height = `${newHeight}px`;
            }
        }

        function resizeEnd() {
            isResizing = false;
        }

        // Обработчики событий для перетаскивания
        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        // Обработчики событий для изменения размера
        resizeHandle.addEventListener('mousedown', resizeStart);
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', resizeEnd);
    }
});

// Функция генерации календаря
function generateCalendar() {
    const calendarTable = document.querySelector(".calendar tbody");

    if (!calendarTable) {
        console.error("Ошибка: контейнер календаря не найден.");
        return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    calendarTable.innerHTML = "";

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDateOfPrevMonth = new Date(year, month, 0).getDate();

    let dayCounter = 1;
    let rows = "";
    let firstWeekday = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let row = 0; row < 6; row++) {
        let cells = "";

        for (let col = 0; col < 7; col++) {
            let cellClass = "current-month";
            let cellDate;

            if (row === 0 && col < firstWeekday) {
                cellDate = lastDateOfPrevMonth - firstWeekday + col + 1;
                cellClass = "other-month";
            } else if (dayCounter > lastDateOfMonth) {
                cellDate = dayCounter - lastDateOfMonth;
                cellClass = "other-month";
                dayCounter++;
            } else {
                cellDate = dayCounter;
                if (cellDate === today) {
                    cellClass += " today";
                }
                dayCounter++;
            }

            cells += `<td class="${cellClass}">${cellDate}</td>`;
        }

        rows += `<tr>${cells}</tr>`;
    }

    calendarTable.innerHTML = rows;
}
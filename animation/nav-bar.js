import { getAuthHeaders, showNotification, getUserInfo } from './authUtils.js';

document.addEventListener("DOMContentLoaded", async function () {
    let chatContainer = document.getElementById("chatContainer");
    if (!chatContainer) {
        chatContainer = document.createElement("div");
        chatContainer.id = "chatContainer";
        chatContainer.className = "chat-container";
        document.body.appendChild(chatContainer);
    }

    const chatContent = `
        <div class="chat-header"><span class="card-title" id="chatTitle">Підтримка</span><button class="chat-close card-main-text" id="chatCloseButton">×</button></div>
        <div class="chat-messages card-main-text" id="chatMessages"><div class="chat-placeholder card-main-text" id="chatPlaceholder"><img src="icons/hello-sticker.png" alt="Привітання" class="chat-sticker"><p class="card-main-text">Як ми можемо вам допомогти?</p></div></div>
        <div class="chat-input-container" id="chatInputContainerGlobal"><textarea id="chatInput" placeholder="Введіть повідомлення..." class="card-main-text"></textarea><button id="sendButton" class="card-main-text">➤</button></div>
    `;
    if(chatContainer) chatContainer.innerHTML = chatContent;

    const sidebarBaseContent = `
      <div class="user-profile" id="userProfileLink">
        <img src="" alt="Фото користувача" class="user-photo" id="userPhoto" style="display: none;">
        <div class="user-initials" id="userInitials" style="display: none;"></div>
        <div class="user-details">
            <span class="menu-nav-text user-name" id="userName">Завантаження...</span>
            <span class="l-card-text user-list-number" id="userSecondaryInfo"></span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section" id="nav-section-main"><a href="home.html" class="nav-link"><span class="nav-icon">🏠</span><span class="menu-nav-text">Головна</span></a> <a href="index.html" class="nav-link"><span class="nav-icon">📊</span><span class="menu-nav-text">Огляд</span></a><a href="students.html" class="nav-link"><span class="nav-icon">👥</span><span class="menu-nav-text">Студенти</span></a><a href="teachers.html" class="nav-link"><span class="nav-icon">👨‍🏫</span><span class="menu-nav-text">Викладачі</span></a></div>
        <div class="nav-section" id="nav-section-tools"><a href="tasks.html" class="nav-link"><span class="nav-icon">✅</span><span class="menu-nav-text">Завдання</span></a><a href="calendar.html" class="nav-link"><span class="nav-icon">📆</span><span class="menu-nav-text">Календар</span></a></div>
        <div class="nav-section" id="nav-section-account"><a href="account.html" class="nav-link"><span class="nav-icon">👤</span><span class="menu-nav-text">Профіль</span></a><a href="notification.html" class="nav-link"><span class="nav-icon">🔔</span><span class="menu-nav-text">Сповіщення</span><span class="notification-badge-menu card-main-text" id="notificationBadgeMenu" style="display: none;"></span></a><a href="safety_page.html" class="nav-link"><span class="nav-icon">🔒</span><span class="menu-nav-text">Безпека</span></a></div>
        <div class="nav-section" id="nav-section-admin" style="display: none;">
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-support" id="support-chat-toggle"><div class="support-icon">💬</div><div class="support-info"><div class="menu-nav-text support-title">Підтримка</div><div class="menu-nav-text support-text">Чат і соц. мережі</div></div></div>
        <button class="logout-button" id="logoutButton" style="display: none;"><i class="fas fa-sign-out-alt"></i><span class="menu-nav-text">Вийти</span></button>
      </div>
    `;

    const sidebarElement = document.createElement("div");
    sidebarElement.innerHTML = sidebarBaseContent;
    const sidebar = document.getElementById("sidebar");
    if(sidebar) {
        sidebar.innerHTML = '';
        sidebar.appendChild(sidebarElement);
    }

    const userProfileLink = document.getElementById("userProfileLink");
    const userPhotoElement = document.getElementById("userPhoto");
    const userInitialsElement = document.getElementById("userInitials");
    const userNameElement = document.getElementById("userName");
    const userSecondaryInfoElement = document.getElementById("userSecondaryInfo");
    const logoutButton = document.getElementById('logoutButton');
    const notificationBadgeMenu = document.getElementById('notificationBadgeMenu');
    const supportChatToggle = document.getElementById("support-chat-toggle");
    const toggleButton = document.getElementById("sidebar-toggle");
    
    const smallChatSendButton = document.getElementById("sendButton");
    const smallChatInput = document.getElementById("chatInput");
    const smallChatCloseButton = document.getElementById("chatCloseButton");
    const smallChatTitleElement = document.getElementById("chatTitle");
    const smallChatInputContainerGlobal = document.getElementById("chatInputContainerGlobal");
    const smallChatMessages = document.getElementById("chatMessages");
    const smallChatPlaceholder = document.getElementById("chatPlaceholder");

    const adminNavSection = document.getElementById("nav-section-admin");

    const BACKEND_URL = 'http://localhost:3000';
    const WS_PROTO = window.location.protocol === "https:" ? "wss:" : "ws:";
    const WS_URL = `ws://localhost:3000`;
    
    window.currentUserAccountId = null;
    let currentUserRole = null;
    let socket = null;
    
    let adminSelectedTargetAccountId = null;
    let currentAdminChatUserName = '';

    let adminFullChatOverlayElement = null;
    let adminConversationsListDiv = null;
    let adminMessagesViewDiv = null;
    let adminMessageInputEl = null;
    let adminSendButtonEl = null;
    let adminChatTitleEl = null;
    let adminChatInputArea = null;

    function getUserInitialsFromName(fullName) {
        if (!fullName || typeof fullName !== 'string') return '?';
        const initials = fullName.split(" ")
            .map(word => word ? word[0] : '')
            .filter(char => char) 
            .slice(0, 2)    
            .join("").toUpperCase();
        return initials || '?'; 
    }

    function createAdminFullChatDOM() {
        if (document.getElementById('adminFullChatOverlayGlobal')) {
            adminFullChatOverlayElement = document.getElementById('adminFullChatOverlayGlobal');
            adminConversationsListDiv = document.getElementById('adminConversationsListGlobal');
            adminMessagesViewDiv = document.getElementById('adminChatMessagesViewGlobal');
            adminMessageInputEl = document.getElementById('adminChatMessageInputGlobal');
            adminSendButtonEl = document.getElementById('adminChatSendButtonGlobal');
            adminChatTitleEl = document.getElementById('adminFullChatTitleGlobal');
            adminChatInputArea = document.getElementById('adminChatInputAreaGlobal');
            
            const closeBtn = document.getElementById('adminFullChatCloseButtonGlobal');
            if (closeBtn) {
                closeBtn.removeEventListener('click', closeAdminFullChatInterface);
                closeBtn.addEventListener('click', closeAdminFullChatInterface);
            }
            if(adminFullChatOverlayElement) {
                 adminFullChatOverlayElement.removeEventListener('click', handleAdminFullChatOverlayClick);
                 adminFullChatOverlayElement.addEventListener('click', handleAdminFullChatOverlayClick);
            }
            if(adminSendButtonEl) {
                adminSendButtonEl.removeEventListener('click', sendAdminFullChatMessageViaWebSocket);
                adminSendButtonEl.addEventListener('click', sendAdminFullChatMessageViaWebSocket);
            }
            if(adminMessageInputEl) {
                adminMessageInputEl.removeEventListener('keypress', handleAdminFullChatInputKeypress);
                adminMessageInputEl.addEventListener('keypress', handleAdminFullChatInputKeypress);
            }
            return;
        }

        adminFullChatOverlayElement = document.createElement('div');
        adminFullChatOverlayElement.id = 'adminFullChatOverlayGlobal';
        adminFullChatOverlayElement.className = 'admin-full-chat-overlay';
        adminFullChatOverlayElement.style.display = 'none';

        const chatInterface = document.createElement('div');
        chatInterface.className = 'admin-full-chat-interface';
        chatInterface.innerHTML = `
            <div class="admin-full-chat-header">
                <h2 id="adminFullChatTitleGlobal" class="card-title">Чати Підтримки</h2>
                <button id="adminFullChatCloseButtonGlobal" class="chat-close card-main-text">&times;</button>
            </div>
            <div class="admin-full-chat-body">
                <div class="admin-conversations-panel">
                    <div id="adminConversationsListGlobal" class="admin-conversations-list-area">
                        <p class="card-main-text">Завантаження діалогів...</p>
                    </div>
                </div>
                <div class="admin-messages-panel">
                    <div id="adminChatMessagesViewGlobal" class="admin-chat-messages-view-area">
                        <div class="chat-placeholder card-main-text" id="adminChatPlaceholderGlobal">
                            <img src="icons/hello-sticker.png" alt="Вітання" class="chat-sticker">
                            <p>Оберіть діалог для перегляду.</p>
                        </div>
                    </div>
                    <div class="admin-chat-input-area" id="adminChatInputAreaGlobal" style="display: none;">
                        <div class="chat-input-wrapper">
                            <textarea id="adminChatMessageInputGlobal" placeholder="Введіть відповідь..." class="chat-textarea"></textarea>
                        </div>
                        <button id="adminChatSendButtonGlobal" class="chat-send-button">➤</button>
                    </div>
                 </div>
            </div>
        `;
        adminFullChatOverlayElement.appendChild(chatInterface);
        document.body.appendChild(adminFullChatOverlayElement);

        adminConversationsListDiv = document.getElementById('adminConversationsListGlobal');
        adminMessagesViewDiv = document.getElementById('adminChatMessagesViewGlobal');
        adminMessageInputEl = document.getElementById('adminChatMessageInputGlobal');
        adminSendButtonEl = document.getElementById('adminChatSendButtonGlobal');
        adminChatTitleEl = document.getElementById('adminFullChatTitleGlobal');
        adminChatInputArea = document.getElementById('adminChatInputAreaGlobal');

        document.getElementById('adminFullChatCloseButtonGlobal').addEventListener('click', closeAdminFullChatInterface);
        adminFullChatOverlayElement.addEventListener('click', handleAdminFullChatOverlayClick);
        adminSendButtonEl.addEventListener('click', sendAdminFullChatMessageViaWebSocket);
        adminMessageInputEl.addEventListener('keypress', handleAdminFullChatInputKeypress);
    }

    function handleAdminFullChatOverlayClick(event) {
        if (event.target === adminFullChatOverlayElement) {
            closeAdminFullChatInterface();
        }
    }
    function handleAdminFullChatInputKeypress(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendAdminFullChatMessageViaWebSocket();
        }
    }

    async function openAdminFullChatInterface() {
        createAdminFullChatDOM();
        if (adminFullChatOverlayElement) adminFullChatOverlayElement.style.display = 'flex';
        if (adminMessageInputEl) adminMessageInputEl.value = '';
        if(adminChatInputArea) adminChatInputArea.style.display = 'none';
        await loadAdminConversationsForFullChat();
    }

    function closeAdminFullChatInterface() {
        if (adminFullChatOverlayElement) adminFullChatOverlayElement.style.display = 'none';
        adminSelectedTargetAccountId = null;
        if (adminChatTitleEl) adminChatTitleEl.textContent = 'Чати Підтримки';
        if (adminMessagesViewDiv) {
            adminMessagesViewDiv.innerHTML = `
                <div class="chat-placeholder card-main-text" id="adminChatPlaceholderGlobal">
                    <img src="icons/hello-sticker.png" alt="Вітання" class="chat-sticker">
                    <p>Оберіть діалог для перегляду.</p>
                </div>`;
        }
        if(adminChatInputArea) adminChatInputArea.style.display = 'none';
    }

    async function loadAdminConversationsForFullChat() {
        if (!adminConversationsListDiv) return;
        adminConversationsListDiv.innerHTML = '<p class="card-main-text">Завантаження діалогів...</p>';
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/conversations`, { headers: getAuthHeaders() });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
                throw new Error(errData.error || `Помилка ${response.status}`);
            }
            const data = await response.json();
             if (!data.success || !data.conversations) {
                 throw new Error(data.error || 'Не вдалося отримати список діалогів.');
            }
            const conversations = data.conversations;
            adminConversationsListDiv.innerHTML = '';

            if (conversations && conversations.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'admin-chat-conversations-ul';
                conversations.forEach(convo => {
                    const li = document.createElement('li');
                    li.className = 'admin-conversation-list-item card-main-text';
                    const currentConvoAccountId = convo.account_id;
                    if (typeof currentConvoAccountId === 'undefined') {
                        li.innerHTML = "Помилка даних діалогу";
                        ul.appendChild(li);
                        return;
                    }
                    li.dataset.accountId = currentConvoAccountId;
                    let displayName = convo.userName || convo.userEmail || `Користувач ID: ${currentConvoAccountId}`;
                    li.dataset.userName = displayName;
                    const userInitials = getUserInitialsFromName(displayName);
                    li.innerHTML = `
                        <div class="uns-avatar">${userInitials}</div>
                        <div class="admin-convo-details">
                            <span class="admin-convo-list-user card-main-text">${displayName}</span>
                            <span class="admin-convo-list-lastmsg card-mini-text">${convo.lastMessage ? (convo.lastMessage.substring(0, 25) + (convo.lastMessage.length > 25 ? '...' : '')) : '<i class="card-mini-text">(Порожньо)</i>'}</span>
                        </div>
                        ${convo.unreadCount > 0 ? `<span class="admin-convo-list-unread card-main-text">${convo.unreadCount}</span>` : ''}
                    `;
                    li.addEventListener('click', () => {
                        document.querySelectorAll('.admin-conversation-list-item.selected').forEach(el => el.classList.remove('selected'));
                        li.classList.add('selected');
                        adminSelectedTargetAccountId = currentConvoAccountId;
                        currentAdminChatUserName = displayName;
                        loadMessagesForAdminFullChat(currentConvoAccountId, displayName);
                    });
                    ul.appendChild(li);
                });
                adminConversationsListDiv.appendChild(ul);
            } else {
                adminConversationsListDiv.innerHTML = '<p class="card-main-text">Немає активних діалогів.</p>';
            }
        } catch (error) {
            if (adminConversationsListDiv) {
                 adminConversationsListDiv.innerHTML = `<p class="card-main-text error-text">Не вдалося завантажити діалоги: ${error.message}</p>`;
            }
        }
    }

    async function loadMessagesForAdminFullChat(targetAccountId, targetUserName) {
        if (!adminMessagesViewDiv || !targetAccountId) return;
        adminMessagesViewDiv.innerHTML = '';
        if (adminChatTitleEl) adminChatTitleEl.textContent = `Чат з ${targetUserName}`;
        const loadingMessages = showTypingAnimation(adminMessagesViewDiv);
        if(adminChatInputArea) adminChatInputArea.style.display = 'flex';

        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'mark_messages_as_read',
                chattingWithAccountId: targetAccountId 
            }));
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/messages/${targetAccountId}`, { headers: getAuthHeaders() });
            if(loadingMessages) loadingMessages.remove();
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
                throw new Error(errData.error || `Помилка ${response.status}`);
            }
            const data = await response.json();
            if (data.success && data.messages) {
                if (data.messages.length > 0) {
                    data.messages.forEach(msg => {
                        const isSentByCurrentAdmin = (msg.sender_type === 'admin' && msg.sender_id === window.currentUserAccountId);
                        appendMessageToAdminFullChat(msg.message_text, isSentByCurrentAdmin, msg.timestamp);
                    });
                } else {
                     adminMessagesViewDiv.innerHTML = '<div class="chat-placeholder card-main-text" style="display:flex;"><p>Повідомлень немає. Напишіть першим!</p></div>';
                }
            } else {
                throw new Error(data.error || 'Не вдалося завантажити повідомлення.');
            }
        } catch (error) {
            if(loadingMessages) loadingMessages.remove();
            if (adminMessagesViewDiv) {
                adminMessagesViewDiv.innerHTML = `<p class="card-main-text error-text" style="text-align:center;">Помилка: ${error.message}</p>`;
            }
        } finally {
            if (adminMessagesViewDiv) adminMessagesViewDiv.scrollTop = adminMessagesViewDiv.scrollHeight;
        }
    }

    function appendMessageToAdminFullChat(text, isSentByAdmin, timestamp) {
        if (!adminMessagesViewDiv) return;
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message card-main-text ${isSentByAdmin ? 'user-message' : 'support-message'}`;
        const textElement = document.createElement('span');
        textElement.textContent = text.replace(/<[^>]*>/g, "");
        messageElement.appendChild(textElement);
        if (timestamp) {
            const timeElement = document.createElement('span');
            timeElement.className = 'chat-message-time card-mini-text';
            try {
                 timeElement.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch(e) { timeElement.textContent = "";}
            messageElement.appendChild(timeElement);
        }
        const placeholder = adminMessagesViewDiv.querySelector('.chat-placeholder');
        if (placeholder) placeholder.remove();
        adminMessagesViewDiv.appendChild(messageElement);
        adminMessagesViewDiv.scrollTop = adminMessagesViewDiv.scrollHeight;
    }
    
    function sendAdminFullChatMessageViaWebSocket() {
        if (!adminMessageInputEl || !adminSendButtonEl || !adminSelectedTargetAccountId || !socket || socket.readyState !== WebSocket.OPEN) {
            showNotification("Неможливо відправити повідомлення. WebSocket не підключено або чат не обрано.", "error");
            return;
        }
        const messageText = adminMessageInputEl.value.trim();
        if (!messageText) return;
        adminMessageInputEl.value = '';
        socket.send(JSON.stringify({
            type: 'chat_message',
            text: messageText,
            targetAccountId: adminSelectedTargetAccountId
        }));
    }
    
    window.toggleChat = async function() {
        if (currentUserRole === 'admin') {
            openAdminFullChatInterface();
        } else if (chatContainer) {
            const isOpening = !chatContainer.classList.contains("show");
            chatContainer.classList.toggle("show");
            if (isOpening) {
                await loadChatHistoryForSmallChat();
            } else {
                if (smallChatTitleElement) smallChatTitleElement.textContent = 'Підтримка';
                if (smallChatMessages) smallChatMessages.innerHTML = '';
                if (smallChatInputContainerGlobal) smallChatInputContainerGlobal.style.display = 'flex';
                if (smallChatPlaceholder) {
                    smallChatPlaceholder.innerHTML = `<img src="icons/hello-sticker.png" alt="Привітання" class="chat-sticker"><p class="card-main-text">Як ми можемо вам допомогти?</p>`;
                    smallChatPlaceholder.style.display = 'flex';
                }
            }
        }
    };

    if(smallChatCloseButton) {
        smallChatCloseButton.addEventListener('click', () => {
             if (chatContainer) chatContainer.classList.remove("show");
        });
    }

    window.logout = function() {
        localStorage.clear();
        sessionStorage.clear();
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
        }
        window.location.href = 'login.html';
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', window.logout);
    }

    function handleImageError(fullName) {
         if (userPhotoElement) userPhotoElement.style.display = "none";
         if (userInitialsElement) {
             let initials = '?';
             if(fullName){
                 initials = fullName.split(" ")
                     .map(word => word ? word[0] : '')
                     .filter(char => char)
                     .slice(0, 2)
                     .join("").toUpperCase();
                 initials = initials || '?';
             }
             userInitialsElement.textContent = initials;
             userInitialsElement.style.display = "flex";
         }
         if (userNameElement && fullName) {
             userNameElement.textContent = fullName;
         } else if (userNameElement) {
             userNameElement.textContent = "Гість";
         }
    }

    function handleLoggedOutState(reason = "Unknown reason") {
        if (userNameElement) userNameElement.textContent = "Гість";
        if (userSecondaryInfoElement) userSecondaryInfoElement.textContent = "Будь ласка, увійдіть";
        if (logoutButton) logoutButton.style.display = 'none';
        if (adminNavSection) adminNavSection.style.display = 'none';
        if (userProfileLink) {
            userProfileLink.onclick = () => { window.location.href = 'login.html'; };
            userProfileLink.style.cursor = 'pointer';
        }
        if (notificationBadgeMenu) notificationBadgeMenu.style.display = 'none';
        handleImageError(null);
        const currentPage = window.location.pathname.split('/').pop().toLowerCase();
        const publicPages = ['login.html', 'registration.html', '', 'index.html', 'forgot_password.html'];
        if (!publicPages.includes(currentPage) && currentPage !== 'login.html') {
            window.location.href = 'login.html';
        }
    }

    function initializeWebSocket(token) {
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }
        socket = new WebSocket(WS_URL);
        socket.onopen = function() {
            if (token) {
                socket.send(JSON.stringify({ type: 'auth', token: token }));
            } else {
                socket.close();
            }
        };
        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'auth_success':
                    showNotification(data.message, "success");
                    break;
                case 'auth_failure':
                    showNotification(data.message, "error");
                    break;
                case 'new_chat_message':
                    const isSmallChatVisible = chatContainer && chatContainer.classList.contains("show");
                    const isAdminChatVisible = adminFullChatOverlayElement && adminFullChatOverlayElement.style.display === 'flex';

                    if (currentUserRole === 'admin' && isAdminChatVisible && data.account_id === adminSelectedTargetAccountId) {
                        const isSentByCurrentAdmin = data.sender_id === window.currentUserAccountId && data.sender_type === 'admin';
                        appendMessageToAdminFullChat(data.message_text, isSentByCurrentAdmin, data.timestamp);
                    } else if (currentUserRole !== 'admin' && isSmallChatVisible && data.account_id === window.currentUserAccountId) {
                         const isSentByCurrentUser = data.sender_id === window.currentUserAccountId && data.sender_type !== 'admin';
                        appendMessageToSmallChat(data.message_text, isSentByCurrentUser, data.timestamp);
                    } else {
                         const fromUser = data.sender_id !== window.currentUserAccountId;
                         if (fromUser) {
                             showNotification(`Нове повідомлення від ${data.sender_type === 'admin' ? 'Підтримки' : 'користувача'}`, "info");
                         }
                    }
                    if (currentUserRole === 'admin') {
                         updateConversationUnreadCount(data.account_id, (data.sender_type !== 'admin' && (!isAdminChatVisible || data.account_id !== adminSelectedTargetAccountId)));
                         if(isAdminChatVisible || data.sender_type !== 'admin') { 
                            loadAdminConversationsForFullChat();
                        }
                    } else if (currentUserRole !== 'admin' && data.sender_type === 'admin' && !isSmallChatVisible) {
                         const supportToggleIcon = supportChatToggle ? supportChatToggle.querySelector('.support-icon') : null;
                         if(supportToggleIcon && !supportToggleIcon.classList.contains('has-unread')) {
                             supportToggleIcon.classList.add('has-unread');
                         }
                    }
                    break;
                case 'update_conversation_list':
                    if (currentUserRole === 'admin') {
                        loadAdminConversationsForFullChat();
                    }
                    break;
                case 'messages_marked_read_ack':
                    if (currentUserRole === 'admin' && data.targetAccountId) {
                       updateConversationUnreadCount(data.targetAccountId, false);
                       if (adminFullChatOverlayElement && adminFullChatOverlayElement.style.display === 'flex') {
                           loadAdminConversationsForFullChat();
                       }
                    }
                    break;
                case 'error':
                    showNotification(`Помилка WebSocket: ${data.content || data.message}`, "error");
                    break;
                default:
                    break;
            }
        };
        socket.onclose = function(event) {
            socket = null;
            setTimeout(() => {
                const currentToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                if (currentToken && window.currentUserAccountId) initializeWebSocket(currentToken);
            }, 5000);
        };
        socket.onerror = function(error) {
        };
    }
    
    function updateConversationUnreadCount(accountId, incrementOrSetToZero) {
        if (!adminConversationsListDiv) return;
        const convoItem = adminConversationsListDiv.querySelector(`li[data-account-id="${accountId}"]`);
        if (convoItem) {
            let unreadSpan = convoItem.querySelector('.admin-convo-list-unread');
            if (incrementOrSetToZero === true) {
                if (!unreadSpan) {
                    unreadSpan = document.createElement('span');
                    unreadSpan.className = 'admin-convo-list-unread card-main-text';
                    const detailsDiv = convoItem.querySelector('.admin-convo-details');
                    if(detailsDiv && detailsDiv.nextSibling) {
                        detailsDiv.parentNode.insertBefore(unreadSpan, detailsDiv.nextSibling);
                    } else {
                         convoItem.appendChild(unreadSpan);
                    }
                }
                let currentCount = parseInt(unreadSpan.textContent) || 0;
                unreadSpan.textContent = currentCount + 1;
                unreadSpan.style.display = 'inline-flex';
            } else { 
                if (unreadSpan) {
                    unreadSpan.remove();
                }
            }
        }
    }

    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (token) {
        if (logoutButton) logoutButton.style.display = 'flex';
        if (userProfileLink) {
            userProfileLink.onclick = () => { window.location.href = 'account.html'; };
            userProfileLink.style.cursor = 'pointer';
         }
        try {
            const profileResponse = await fetch(`${BACKEND_URL}/api/user/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
            });
            if (profileResponse.ok) {
                const data = await profileResponse.json();
                if (data.success && data.profile && data.account) {
                    const profile = data.profile;
                    const account = data.account;
                    currentUserRole = account.role;
                    const fullName = profile.full_name || 'User';
                    window.currentUserAccountId = account.account_id;
                    if(userNameElement) userNameElement.textContent = fullName;
                    if (profile.avatar && userPhotoElement) {
                        userPhotoElement.src = profile.avatar;
                        userPhotoElement.alt = `Фото ${fullName}`;
                        userPhotoElement.style.display = 'block';
                        if(userInitialsElement) userInitialsElement.style.display = 'none';
                        userPhotoElement.onerror = () => { handleImageError(fullName); };
                    } else {
                        handleImageError(fullName);
                    }
                    let secondaryText = '';
                    let roleDisplayName = '';
                    switch(currentUserRole) {
                        case 'student': roleDisplayName = 'Студент'; break;
                        case 'supervisor': roleDisplayName = 'Викладач'; break;
                        case 'admin': roleDisplayName = 'Адмін'; break;
                        default: roleDisplayName = currentUserRole;
                    }
                    const userIdToShow = profile.student_id || profile.supervisor_id || account.account_id || 'N/A';
                    if (currentUserRole === 'student') {
                        const groupName = profile.group_name || 'Група?';
                        secondaryText = `${roleDisplayName} (ID: ${userIdToShow}) ${groupName}`;
                    } else if (currentUserRole === 'supervisor') {
                         secondaryText = `${roleDisplayName} (ID: ${userIdToShow}) ${profile.position ? ' (' + profile.position + ')' : ''}`;
                    } else {
                         secondaryText = `${roleDisplayName} (ID: ${userIdToShow})`;
                    }
                    if(userSecondaryInfoElement) userSecondaryInfoElement.textContent = secondaryText;
                    const storage = localStorage.getItem('authToken') ? localStorage : sessionStorage;
                    storage.setItem('userName', fullName);
                    storage.setItem('userRole', currentUserRole);
                    if(currentUserRole === 'student' && profile.group_name) {
                        storage.setItem('userGroup', profile.group_name);
                    }

                    if (currentUserRole === 'admin' && adminNavSection) {
                        adminNavSection.innerHTML = `
                            <a href="accounting_admin_panel.html" class="nav-link"><span class="nav-icon">⚙️</span><span class="menu-nav-text">Адмін Панель</span></a>
                            <a href="#" id="adminOpenSupportChatsLink" class="nav-link"><span class="nav-icon">📨</span><span class="menu-nav-text">Чати Підтримки</span></a>
                        `;
                        adminNavSection.style.display = 'block';
                        const adminOpenSupportChatsButton = document.getElementById('adminOpenSupportChatsLink');
                        if (adminOpenSupportChatsButton) {
                            adminOpenSupportChatsButton.addEventListener('click', (e) => {
                                e.preventDefault();
                                openAdminFullChatInterface();
                            });
                        }
                    } else if (adminNavSection) {
                         adminNavSection.style.display = 'none';
                    }
                     try {
                         const countResponse = await fetch(`${BACKEND_URL}/api/notifications/unread/count`, {
                             headers: { 'Authorization': `Bearer ${token}` }
                         });
                         if(countResponse.ok) {
                             const countData = await countResponse.json();
                             if(countData.success && notificationBadgeMenu) {
                                 const unreadCount = countData.unreadCount || 0;
                                 notificationBadgeMenu.textContent = unreadCount > 99 ? '99+' : (unreadCount > 0 ? unreadCount : '');
                                 notificationBadgeMenu.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
                             }
                         }
                     } catch (countError) {
                     }
                     if(window.currentUserAccountId) {
                        initializeWebSocket(token);
                     }
                } else {
                    handleLoggedOutState("Invalid profile data structure");
                }
            } else if (profileResponse.status === 401 || profileResponse.status === 403) {
                 window.logout();
                 return;
            } else {
                 handleLoggedOutState(`Profile fetch failed with status ${profileResponse.status}`);
            }
        } catch (error) {
            handleLoggedOutState(`Network error: ${error.message}`);
        }
    } else {
        handleLoggedOutState("No token found");
    }

    if (supportChatToggle) {
        supportChatToggle.addEventListener("click", async () => {
            if (currentUserRole === 'admin') {
                openAdminFullChatInterface();
            } else if (chatContainer) {
                const isOpening = !chatContainer.classList.contains("show");
                chatContainer.classList.toggle("show");
                if (isOpening) {
                    await loadChatHistoryForSmallChat();
                     const supportToggleIcon = supportChatToggle ? supportChatToggle.querySelector('.support-icon') : null;
                     if(supportToggleIcon) supportToggleIcon.classList.remove('has-unread');
                } else {
                    if (smallChatTitleElement) smallChatTitleElement.textContent = 'Підтримка';
                    if (smallChatMessages) smallChatMessages.innerHTML = '';
                    if (smallChatInputContainerGlobal) smallChatInputContainerGlobal.style.display = 'flex';
                    if (smallChatPlaceholder) {
                        smallChatPlaceholder.innerHTML = `<img src="icons/hello-sticker.png" alt="Привітання" class="chat-sticker"><p class="card-main-text">Як ми можемо вам допомогти?</p>`;
                        smallChatPlaceholder.style.display = 'flex';
                    }
                }
            }
        });
    }

    if (toggleButton && sidebar) {
        toggleButton.addEventListener("click", function () {
            sidebar.classList.toggle("show");
        });
    }

    document.addEventListener("click", function (event) {
        if (sidebar && toggleButton && !sidebar.contains(event.target) && !toggleButton.contains(event.target)) {
            sidebar.classList.remove("show");
        }
        
        const isClickInsideSmallChat = chatContainer && chatContainer.contains(event.target);
        const isClickOnSupportToggle = supportChatToggle && supportChatToggle.contains(event.target);

        if (!isClickInsideSmallChat && !isClickOnSupportToggle && chatContainer && chatContainer.classList.contains("show")) {
            const isAdminChatLink = document.getElementById('adminOpenSupportChatsLink');
            const isClickOnAdminChatLink = isAdminChatLink && isAdminChatLink.contains(event.target);
            if (!isClickOnAdminChatLink) { 
                 chatContainer.classList.remove("show");
            }
        }
    });

    let links = document.querySelectorAll(".sidebar-nav .nav-link");
    const currentPath = window.location.pathname.split('/').pop();
    links.forEach(link => {
        const linkPath = link.getAttribute('href');
         if (linkPath === currentPath || (linkPath === 'index.html' && (currentPath === '' || currentPath === 'index.html'))) {
             link.classList.add("active");
         } else {
             link.classList.remove("active");
         }
    });

    function showTypingAnimation(chatMessagesContainer) {
         const typingElement = document.createElement("div");
         typingElement.className = "chat-typing";
         typingElement.textContent = "...";
         if (chatMessagesContainer) chatMessagesContainer.appendChild(typingElement);
         if (chatMessagesContainer) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
         return typingElement;
    }

    async function loadChatHistoryForSmallChat() { 
        if (!smallChatMessages || !smallChatPlaceholder || !window.currentUserAccountId) return;
        const currentToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (!currentToken) return;

        if (smallChatPlaceholder) smallChatPlaceholder.style.display = 'none';
        if (smallChatInputContainerGlobal) smallChatInputContainerGlobal.style.display = 'flex';
        if (smallChatTitleElement) smallChatTitleElement.textContent = 'Підтримка';
        smallChatMessages.innerHTML = '';
        const loadingHistory = showTypingAnimation(smallChatMessages);
        try {
            const response = await fetch(`${BACKEND_URL}/api/chat/messages/${window.currentUserAccountId}`, {
                headers: getAuthHeaders()
            });
            if(loadingHistory) loadingHistory.remove();
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.messages) {
                    if (data.messages.length > 0) {
                        data.messages.forEach(msg => {
                            const isSentByCurrentUser = (msg.sender_id === window.currentUserAccountId && msg.sender_type !== 'admin');
                            appendMessageToSmallChat(msg.message_text, isSentByCurrentUser, msg.timestamp);
                        });
                    } else {
                         if (smallChatPlaceholder) {
                            smallChatPlaceholder.innerHTML = `<img src="icons/hello-sticker.png" alt="Привітання" class="chat-sticker"><p class="card-main-text">Повідомлень ще немає. Напишіть першим!</p>`;
                            smallChatPlaceholder.style.display = 'flex';
                         }
                    }
                } else {
                    const errorText = data.error || "Не вдалося завантажити історію чату.";
                     if (smallChatPlaceholder) {
                         smallChatPlaceholder.innerHTML = `<img src="icons/hello-sticker.png" alt="Помилка" class="chat-sticker"><p class="card-main-text">${errorText}</p>`;
                         smallChatPlaceholder.style.display = 'flex';
                     }
                }
            } else {
                const errorData = await response.json().catch(() => ({error: "Не вдалося завантажити історію чату."}));
                if (smallChatPlaceholder) {
                    smallChatPlaceholder.innerHTML = `<img src="icons/hello-sticker.png" alt="Помилка" class="chat-sticker"><p class="card-main-text">${errorData.error}</p>`;
                    smallChatPlaceholder.style.display = 'flex';
                }
            }
        } catch (error) {
            if(loadingHistory) loadingHistory.remove();
            if (smallChatPlaceholder) {
                smallChatPlaceholder.innerHTML = `<img src="icons/hello-sticker.png" alt="Помилка" class="chat-sticker"><p class="card-main-text">Помилка мережі при завантаженні історії.</p>`;
                smallChatPlaceholder.style.display = 'flex';
            }
        }
         finally { if (smallChatMessages) smallChatMessages.scrollTop = smallChatMessages.scrollHeight; }
    }
    
    function appendMessageToSmallChat(text, isSentByCurrentUser, timestamp) {
        if (!smallChatMessages) return;
        const messageElement = document.createElement("div");
        messageElement.className = `chat-message card-main-text ${isSentByCurrentUser ? 'user-message' : 'support-message'}`;
        const textElement = document.createElement('span');
        textElement.textContent = text.replace(/<[^>]*>/g, "");
        messageElement.appendChild(textElement);
        if (timestamp) {
            const timeElement = document.createElement('span');
            timeElement.className = 'chat-message-time card-mini-text';
            try {
                 timeElement.textContent = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch(e){ timeElement.textContent = ""; }
            messageElement.appendChild(timeElement);
        }
        const placeholder = smallChatMessages.querySelector('.chat-placeholder');
        if (placeholder) placeholder.remove();
        smallChatMessages.appendChild(messageElement);
        smallChatMessages.scrollTop = smallChatMessages.scrollHeight;
    }

    function sendMessageForSmallChatViaWebSocket() { 
        if (!smallChatInput || !smallChatMessages || !smallChatSendButton || !socket || socket.readyState !== WebSocket.OPEN) {
            showNotification("Неможливо відправити повідомлення. WebSocket не підключено.", "error");
            return;
        }
        const messageText = smallChatInput.value.trim();
        if (!messageText) return;
        if (smallChatPlaceholder) smallChatPlaceholder.style.display = 'none';
        smallChatInput.value = "";
        socket.send(JSON.stringify({
            type: 'chat_message',
            text: messageText
        }));
    }

    if (smallChatSendButton) smallChatSendButton.addEventListener("click", sendMessageForSmallChatViaWebSocket);
    if (smallChatInput) smallChatInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessageForSmallChatViaWebSocket(); }
    });

    createAdminFullChatDOM(); 
});
const BACKEND_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');

    if (!token || !userId || !userRole) {
        console.log("Відсутня інформація про сесію, перенаправлення на login.html...");
        window.location.href = 'login.html';
        return;
    }

    console.log(`Сторінка акаунту: User ID: ${userId}, Role: ${userRole}`);

    async function loadAndDisplayUserData() {
        showLoadingIndicator();
        try {
            // Завантажуємо профіль, логи та сесії паралельно
            const [profileResponse, logsResponse, sessionsResponse] = await Promise.all([
                fetch(`${BACKEND_URL}/api/user/profile`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                 }),
                fetch(`${BACKEND_URL}/api/account/activity-logs`, { // Запит логів
                     method: 'GET',
                     headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                 }),
                fetch(`${BACKEND_URL}/api/account/sessions`, { // Запит сесій
                     method: 'GET',
                     headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                })
            ]);

            // Перевірка відповідей
            if (!profileResponse.ok) {
                 handleAuthError(profileResponse.status); // Обробка помилок авторизації
                 throw new Error(`Помилка профілю: ${profileResponse.status}`);
             }
            if (!logsResponse.ok) throw new Error(`Помилка логів: ${logsResponse.status}`);
            if (!sessionsResponse.ok) throw new Error(`Помилка сесій: ${sessionsResponse.status}`);

            // Парсимо JSON відповіді
            const apiResponseData = await profileResponse.json();
            const logsData = await logsResponse.json();
            const sessionsData = await sessionsResponse.json();

            // Перевірка успішності запитів
            if (apiResponseData.success && logsData.success && sessionsData.success) {
                console.log("Всі дані акаунту завантажено:", { apiResponseData, logsData, sessionsData });
                // Відображаємо дані
                displayUserData(apiResponseData, logsData.logs, sessionsData.sessions);
            } else {
                // Збираємо повідомлення про помилки
                let errorMessages = [];
                if (!apiResponseData.success) errorMessages.push(apiResponseData.error || "Профіль");
                if (!logsData.success) errorMessages.push(logsData.error || "Логи");
                if (!sessionsData.success) errorMessages.push(sessionsData.error || "Сесії");
                throw new Error(`Не вдалося завантажити: ${errorMessages.join(', ')}`);
            }
        } catch (error) {
            console.error("Не вдалося завантажити дані:", error);
            displayPageError(`Помилка завантаження даних (${error.message}). Спробуйте оновити сторінку.`);
            // Ховаємо картки при помилці
            hideElement('profileViewMode');
            hideElement('logsCard');
            hideElement('sessionsCard');
            hideElement('supervisorCard');
        } finally {
             hideLoadingIndicator(); // Завжди ховаємо індикатор завантаження
        }
    }

    // Функція для відображення помилок на сторінці
    function displayPageError(message) {
        const errorContainer = document.getElementById('pageErrorContainer'); // Потрібно додати цей елемент в HTML, якщо його немає
         if (errorContainer) {
             errorContainer.textContent = message;
             errorContainer.style.display = 'block';
             // Додаткові стилі для помилки
             errorContainer.style.color = 'red';
             errorContainer.style.padding = '10px';
             errorContainer.style.border = '1px solid red';
             errorContainer.style.marginBottom = '15px';
         } else {
            // Якщо контейнера немає, показуємо стандартний alert
            alert(message);
         }
    }

     // Функція для обробки помилок авторизації (401, 403)
     function handleAuthError(status) {
         if (status === 401 || status === 403) {
             console.log("Токен недійсний або недостатньо прав, вихід...");
             // Очищаємо дані сесії та перенаправляємо на сторінку входу
             localStorage.clear();
             sessionStorage.clear();
             window.location.href = 'login.html';
         }
     }

    // Функція для відображення всіх даних користувача
    function displayUserData(apiResponseData, logs, sessions) {
        const { account, profile, supervisor } = apiResponseData;
        const userRole = account?.role;

        if (!account) {
            console.error("Account data is missing.");
            displayPageError("Не вдалося завантажити дані акаунту.");
            return;
        }

        // Відображення основної інформації профілю
        displayProfileInfo(profile, account);

        // Відображення логів активності
        const logsCard = document.getElementById('logsCard');
        const activityInfoList = logsCard?.querySelector('.logs-list');
        const noActivityData = document.getElementById('noLogsData');

        if (logsCard && activityInfoList && noActivityData) {
            showElement(logsCard);
            activityInfoList.innerHTML = ''; // Очищаємо список перед додаванням нових логів
            if (logs && logs.length > 0) {
                // Показуємо тільки перші 10 логів у картці
                logs.slice(0, 10).forEach(log => {
                    const item = document.createElement('li');
                    item.className = 'activity-item';
                    // Вибираємо іконку залежно від типу дії
                    let icon = '📝'; // За замовчуванням
                    if (log.action?.toLowerCase().includes('login')) icon = '🔑';
                    else if (log.action?.toLowerCase().includes('update')) icon = '🔄';
                    else if (log.action?.toLowerCase().includes('create')) icon = '➕';
                    else if (log.action?.toLowerCase().includes('delete')) icon = '🗑️';
                    else if (log.action?.toLowerCase().includes('upload') || log.action?.toLowerCase().includes('завантажено')) icon = '📤';
                    else if (log.action?.toLowerCase().includes('comment') || log.action?.toLowerCase().includes('коментар')) icon = '💬';
                    else if (log.action?.toLowerCase().includes('grade') || log.action?.toLowerCase().includes('оцінк')) icon = '🏆';
                    else if (log.action?.toLowerCase().includes('block') || log.action?.toLowerCase().includes('заблоковано')) icon = '🚫';

                    // Формуємо HTML для елемента списку логів
                    item.innerHTML = `
                        <div class="activity-icon card-large-text">${icon}</div>
                        <div class="activity-info">
                            <div class="activity-title l-card-text">${log.action || 'Дія'}</div>
                            <div class="activity-content card-main-text">${log.description || ''}</div>
                            <div class="activity-meta card-main-text">${new Date(log.timestamp).toLocaleString()}</div>
                        </div>`;
                    activityInfoList.appendChild(item);
                });
                hideElement(noActivityData); // Ховаємо повідомлення "Немає даних"
                showElement(activityInfoList); // Показуємо список логів
            } else {
                // Якщо логів немає
                showElement(noActivityData); // Показуємо повідомлення "Немає даних"
                hideElement(activityInfoList); // Ховаємо порожній список
            }
        } else {
            if (logsCard) hideElement(logsCard); // Ховаємо картку, якщо елементи не знайдені
            console.warn("Елементи для логів активності не знайдено.");
        }

        // Відображення історії сесій
        const sessionsCard = document.getElementById('sessionsCard');
        const sessionsInfoList = sessionsCard?.querySelector('.sessions-list');
        const noSessionsData = document.getElementById('noSessionsData');

        if (sessionsCard && sessionsInfoList && noSessionsData) {
            showElement(sessionsCard);
            sessionsInfoList.innerHTML = ''; // Очищаємо список сесій
            if (sessions && sessions.length > 0) {
                // Показуємо тільки перші 5 сесій у картці
                sessions.slice(0, 5).forEach(session => {
                    const item = document.createElement('li');
                    // Додаємо класи для поточної та схожих сесій
                    item.className = `session-item ${session.isCurrent ? 'is-current-session' : ''} ${session.isSimilar ? 'is-similar-session' : ''}`;

                    // Визначаємо тип пристрою та браузер з User Agent
                    const userAgent = session.user_agent || 'N/A';
                    let deviceType = 'Пристрій невідомий';
                    if (userAgent.toLowerCase().includes('mobile')) deviceType = 'Мобільний';
                    else if (userAgent.toLowerCase().includes('tablet')) deviceType = 'Планшет';
                    else if (userAgent.toLowerCase().includes('windows') || userAgent.toLowerCase().includes('macintosh') || userAgent.toLowerCase().includes('linux')) deviceType = 'Комп\'ютер';

                    let browser = 'Браузер невідомий';
                    if (userAgent.includes('Firefox/')) browser = 'Firefox';
                    else if (userAgent.includes('Chrome/') && !userAgent.includes('Edg/')) browser = 'Chrome';
                    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) browser = 'Safari';
                    else if (userAgent.includes('Edg/')) browser = 'Edge';
                    else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) browser = 'Internet Explorer';

                    // Визначаємо статус сесії
                    let statusText = 'Невідомо';
                    let statusIcon = '<i class="fas fa-question-circle"></i>';
                    let statusClass = 'status-unknown';
                    switch(session.status) {
                        case 'active': statusText = 'Активна'; statusIcon = '<i class="fas fa-circle"></i>'; statusClass = 'status-active'; break;
                        case 'logged_out': statusText = 'Завершена'; statusIcon = '<i class="fas fa-sign-out-alt"></i>'; statusClass = 'status-logged_out'; break;
                        case 'blocked': statusText = 'Заблокована'; statusIcon = '<i class="fas fa-ban"></i>'; statusClass = 'status-blocked'; break;
                        default: statusText = session.status; // Якщо статус невідомий
                    }

                    // Додаємо кнопку блокування для активних сесій (крім поточної)
                    const blockButtonHtml = (!session.isCurrent && session.status === 'active') ?
                       `<div class="session-actions">
                            <button class="btn btn-danger btn-sm" onclick="blockSession(${session.session_id})" title="Заблокувати цю сесію">
                                <i class="fas fa-ban" class="card-main-text"></i>
                            </button>
                        </div>` : ''; // Якщо сесія поточна або неактивна, кнопка не додається

                    // Формуємо HTML для елемента списку сесій
                    item.innerHTML = `
                        <div class="session-details">
                             <span class="session-time card-main-text"><i class="fas fa-sign-in-alt"></i> Вхід: ${new Date(session.login_time).toLocaleString()}${session.isCurrent ? '<strong class="current-session-marker">(Поточна)</strong>' : ''}${session.isSimilar ? '<em class="similar-session-marker">(Схожа)</em>' : ''}</span>
                             ${session.logout_time ? `<span class="session-time card-main-text"><i class="fas fa-sign-out-alt"></i> Вихід: ${new Date(session.logout_time).toLocaleString()}</span>` : ''}
                             <span class="session-ip l-card-text"><i class="fas fa-map-marker-alt"></i> IP: ${session.ip_address || 'N/A'}</span>
                             <span class="session-agent l-card-text"><i class="fas fa-desktop"></i> Пристрій: ${deviceType} (${browser})</span>
                             <span class="session-status card-main-text ${statusClass}">${statusIcon} ${statusText}</span>
                         </div>
                         ${blockButtonHtml}`; // Додаємо кнопку блокування
                    sessionsInfoList.appendChild(item);
                });
                hideElement(noSessionsData); // Ховаємо повідомлення "Немає даних"
                showElement(sessionsInfoList); // Показуємо список
            } else {
                // Якщо сесій немає
                showElement(noSessionsData); // Показуємо повідомлення "Немає даних"
                hideElement(sessionsInfoList); // Ховаємо порожній список
            }
        } else {
            if(sessionsCard) hideElement(sessionsCard); // Ховаємо картку, якщо елементи не знайдені
            console.warn("Елементи для списку сесій не знайдено.");
        }

        // Відображення інформації про керівника (тільки для студентів)
        const supervisorCard = document.getElementById('supervisorCard');
        if (userRole !== 'student') {
             // Ховаємо картку керівника для викладачів та адмінів
             if (supervisorCard) hideElement(supervisorCard);
        } else {
             // Знаходимо елементи для відображення даних керівника
             const advisorPhoto = document.getElementById('advisorPhoto');
             const advisorDetailsDiv = document.getElementById('advisorDetails');
             const advisorNameEl = advisorDetailsDiv?.querySelector('.advisor-name');
             const advisorTitleEl = advisorDetailsDiv?.querySelector('.advisor-title');
             const advisorContacts = advisorDetailsDiv?.querySelectorAll('.advisor-contact');
             const noSupervisorData = document.getElementById('noSupervisorData');

             if (supervisorCard && advisorPhoto && advisorDetailsDiv && advisorNameEl && advisorTitleEl && advisorContacts && noSupervisorData) {
                 if (supervisor) { // Якщо дані керівника є
                     showElement(supervisorCard);
                     hideElement(noSupervisorData);
                     showElement(advisorDetailsDiv);
                     // Заповнюємо дані
                     advisorNameEl.textContent = supervisor.full_name || 'Ім\'я не вказано';
                     advisorTitleEl.textContent = supervisor.position || supervisor.department || 'Посада/кафедра не вказано';
                     advisorContacts.forEach(contactP => {
                         const icon = contactP.querySelector('i');
                         if (icon?.classList.contains('fa-envelope')) contactP.innerHTML = `<i class="fas fa-envelope"></i> ${supervisor.email || 'Email не вказано'}`;
                         else if (icon?.classList.contains('fa-phone')) contactP.innerHTML = `<i class="fas fa-phone"></i> ${supervisor.phone || 'Телефон не вказано'}`;
                         // Можна додати інші контакти, якщо вони є в базі
                     });
                     // Встановлюємо фото (аватар)
                     if (supervisor.avatar) {
                          advisorPhoto.src = supervisor.avatar;
                          // Обробник помилки завантаження фото
                          advisorPhoto.onerror = () => { advisorPhoto.src = 'icons/supervisors.png'; };
                      } else {
                          // Фото за замовчуванням
                          advisorPhoto.src = 'icons/supervisors.png';
                      }
                 } else {
                     // Якщо керівника не призначено
                     showElement(supervisorCard);
                     hideElement(advisorDetailsDiv);
                     showElement(noSupervisorData);
                     advisorPhoto.src = 'icons/no-supervisor.png';
                 }
             } else {
                  console.warn("Елементи для відображення керівника не знайдено.");
                  if(supervisorCard) hideElement(supervisorCard);
             }
        }

        // Заповнення полів форми редагування
        const editFullNameInput = document.getElementById('edit_full_name');
        const editStudentCardInput = document.getElementById('edit_student_card');
        const editDepartmentInput = document.getElementById('edit_department');
        const editPhoneInput = document.getElementById('phone');
        const editEmailInput = document.getElementById('email');
        const studentCardGroup = document.getElementById('studentCardGroup'); // Група поля студ. квитка

        // Ховаємо поле студ. квитка для не-студентів
        if(userRole !== 'student' && studentCardGroup) {
             hideElement(studentCardGroup);
             if (editStudentCardInput) editStudentCardInput.required = false; // Робимо необов'язковим
        } else if (studentCardGroup) {
             showElement(studentCardGroup);
             if (editStudentCardInput) editStudentCardInput.required = true; // Робимо обов'язковим
        }

        // Заповнюємо значення полів з отриманих даних
        if (profile) {
            if (editFullNameInput) editFullNameInput.value = profile.full_name || '';
            // Заповнюємо студ. квиток тільки для студентів
            if (editStudentCardInput && userRole === 'student') editStudentCardInput.value = profile.student_card_number || '';
            if (editDepartmentInput) editDepartmentInput.value = profile.department || '';
            if (editPhoneInput) editPhoneInput.value = profile.phone || '';
        }
        if (account) {
            if (editEmailInput) editEmailInput.value = account.email || '';
        }
    }

    // Функція для відображення інформації профілю в режимі перегляду
    function displayProfileInfo(profile, account) {
        const profileInfoDiv = document.querySelector('#profileViewMode .profile-info');
        if (!profileInfoDiv) { console.error("Element .profile-info not found."); return; }
        profileInfoDiv.innerHTML = ''; // Очищаємо перед заповненням

        if (!profile || !account) {
            profileInfoDiv.innerHTML = '<p class="error-message visible">Не вдалося завантажити основні дані профілю.</p>';
            return;
        }

        // Створюємо об'єкт з полями для відображення
        let fields = {};
        fields['ПІБ:'] = profile?.full_name;
        fields['Email:'] = account.email;
        fields['Телефон:'] = profile?.phone;
        fields['Факультет/Відділ:'] = profile?.department;

        // Додаємо специфічні поля для ролі
        if (account.role === 'student') {
            fields['Група:'] = profile?.group_name || 'Не вказано';
            fields['Спеціальність:'] = profile?.specialty || 'Не вказано';
            fields['Курс:'] = profile?.course || 'Не вказано';
            fields['Студентський квиток:'] = profile?.student_card_number;
        } else if (account.role === 'supervisor' || account.role === 'admin') {
            fields['Посада:'] = profile?.position || 'Не вказано';
            fields['Спеціалізація:'] = profile?.specialization || 'Не вказано';
            fields['Статус:'] = profile?.teacher_status || 'Не вказано';
        }

        // Додаємо рядки в HTML для кожного заповненого поля
        for (const label in fields) {
            if (fields[label] !== undefined && fields[label] !== null && String(fields[label]).trim() !== '') {
                const row = document.createElement('div');
                row.className = 'profile-row';
                row.innerHTML = `<div class="profile-label l-card-text">${label}</div><div class="profile-value card-main-text">${fields[label]}</div>`;
                profileInfoDiv.appendChild(row);
            }
        }
         // Додаємо дату створення акаунту та останнього входу
         if(account.created_at){
             const row = document.createElement('div');
             row.className = 'profile-row';
             row.innerHTML = `<div class="profile-label l-card-text">Акаунт створено:</div><div class="profile-value card-main-text date-meta">${new Date(account.created_at).toLocaleDateString()}</div>`;
             profileInfoDiv.appendChild(row);
         }
         if(account.last_login){
             const row = document.createElement('div');
             row.className = 'profile-row';
             row.innerHTML = `<div class="profile-label l-card-text">Останній вхід:</div><div class="profile-value card-main-text date-meta">${new Date(account.last_login).toLocaleString()}</div>`;
             profileInfoDiv.appendChild(row);
         }
    }

    // Перемикання в режим редагування
    window.toggleEditMode = function() {
        const viewMode = document.getElementById('profileViewMode');
        const editMode = document.getElementById('profileEditMode');
        // Перезавантажуємо дані перед редагуванням, щоб мати найсвіжіші значення
        loadAndDisplayUserData();
        if (viewMode) hideElement(viewMode);
        if (editMode) showElement(editMode);
    }

    // Скасування редагування
    window.cancelEdit = function() {
        const viewMode = document.getElementById('profileViewMode');
        const editMode = document.getElementById('profileEditMode');
        if (viewMode) showElement(viewMode);
        if (editMode) hideElement(editMode);
    }

    // Збереження змін профілю
    window.saveProfile = async function() {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const currentRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
        let updateUrl = '';
        let payload = {};

        // Збираємо значення з полів форми
        const fullNameInput = document.getElementById('edit_full_name');
        const studentCardInput = document.getElementById('edit_student_card');
        const departmentInput = document.getElementById('edit_department');
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');

        const full_name = fullNameInput?.value.trim();
        const student_card_number = studentCardInput?.value.trim();
        const department = departmentInput?.value.trim();
        const phone = phoneInput?.value.trim();
        const email = emailInput?.value.trim();

        // Валідація обов'язкових полів
        if (!full_name || !department || !phone || !email) { alert('Будь ласка, заповніть ПІБ, Факультет/Відділ, Телефон та Email.'); return; }

        // Визначаємо URL та дані для відправки залежно від ролі
        if (currentRole === 'student') {
             // Валідація студ. квитка для студента
             if (!student_card_number) { alert('Будь ласка, заповніть номер студентського квитка.'); return; }
             updateUrl = `${BACKEND_URL}/api/account/student-profile`;
             payload = { full_name, student_card_number, department, phone, email };
        } else if (currentRole === 'supervisor' || currentRole === 'admin') {
             // Для викладача/адміна студ. квиток не потрібен
             updateUrl = `${BACKEND_URL}/api/account/supervisor-profile`;
             // Можливо, потрібно додати інші поля для викладача (position, specialization etc.)
             payload = { full_name, department, phone, email /*, position, specialization, teacher_status */ };
        } else { alert('Не вдалося визначити роль для збереження.'); return; }

        // Валідація email та телефону
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) { alert('Некоректний email.'); return; }
        const phoneRegex = /^\+?[0-9\s\-()]{10,}$/; // Проста валідація телефону
        if (!phoneRegex.test(phone)) { alert('Некоректний телефон.'); return; }

        console.log("Відправка даних для збереження:", payload);
        showLoadingIndicator(); // Показуємо індикатор завантаження
        try {
            // Відправляємо PUT запит на оновлення
            const response = await fetch(updateUrl, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json(); // Парсимо відповідь

            // Обробка результату
            if (response.ok && result.success) {
                alert('Профіль успішно оновлено!');
                cancelEdit(); // Виходимо з режиму редагування
                loadAndDisplayUserData(); // Оновлюємо відображення даних
            } else {
                // Показуємо помилку
                alert(`Помилка оновлення: ${result.error || response.statusText || 'Невідома помилка'}`);
            }
        } catch (error) {
            console.error("Помилка мережі при збереженні профілю:", error);
            alert('Помилка мережі при збереженні профілю. Спробуйте ще раз.');
        } finally {
            hideLoadingIndicator(); // Ховаємо індикатор завантаження
        }
    }

    // --- ОНОВЛЕНА ФУНКЦІЯ БЛОКУВАННЯ СЕСІЇ ---
    window.blockSession = async function(sessionId) {
         console.log(`Спроба блокування сесії: ${sessionId}`);
         // Запитуємо підтвердження у користувача
         if (!confirm(`Ви впевнені, що хочете заблокувати сесію з ID: ${sessionId}?`)) {
             return; // Якщо користувач натиснув "Скасувати"
         }

        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        // Payload тепер містить тільки session_id
        const payload = { session_id: sessionId };

        showLoadingIndicator(); // Показуємо індикатор
        try {
            // Відправляємо POST запит на новий ендпоінт
            const response = await fetch(`${BACKEND_URL}/api/account/sessions/block`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) // Надсилаємо тільки ID сесії
            });
            const result = await response.json(); // Парсимо відповідь

            // Обробка результату
            if (response.ok && result.success) {
                alert(result.message || 'Сесію успішно заблоковано!');
                loadAndDisplayUserData(); // Оновлюємо список сесій
            } else {
                 // Обробка специфічних помилок (напр., блокування поточної сесії)
                 if (response.status === 403) {
                     alert(result.error || 'Неможливо виконати дію.');
                 } else {
                     // Інші помилки
                     alert(`Помилка блокування: ${result.error || response.statusText || 'Невідома помилка'}`);
                 }
            }
        } catch (error) {
            console.error("Помилка мережі при блокуванні сесії:", error);
            alert('Помилка мережі при блокуванні сесії. Спробуйте ще раз.');
        } finally {
            hideLoadingIndicator(); // Ховаємо індикатор
        }
    }
    // --- КІНЕЦЬ ОНОВЛЕНОЇ ФУНКЦІЇ ---

    // Допоміжні функції для показу/приховування елементів та індикатора
    function showElement(elementOrId) {
        const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
        if (element) element.style.display = ''; // Показуємо елемент (скидаємо display: none)
    }
    function hideElement(elementOrId) {
        const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
        if (element) element.style.display = 'none'; // Ховаємо елемент
    }
    function showLoadingIndicator() {
        let indicator = document.getElementById('loadingIndicator');
        // Створюємо індикатор, якщо його немає
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'loadingIndicator';
            indicator.textContent = 'Завантаження...';
            // Стилі для індикатора
            Object.assign(indicator.style, {
                position: 'fixed', top: '10px', right: '10px', padding: '10px 15px',
                backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', borderRadius: '5px',
                zIndex: '1001', fontSize: '0.9em', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            });
            document.body.appendChild(indicator);
        }
        indicator.style.display = 'block'; // Показуємо індикатор
     }
     function hideLoadingIndicator() {
         const indicator = document.getElementById('loadingIndicator');
         if (indicator) indicator.style.display = 'none'; // Ховаємо індикатор
     }

    // Завантажуємо дані при першому завантаженні сторінки
    loadAndDisplayUserData();

});

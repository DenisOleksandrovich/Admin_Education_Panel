document.addEventListener("DOMContentLoaded", function () {
  const BACKEND_URL = 'http://localhost:3000';

  let currentLoggedInUserId = null;

  const container = document.querySelector(".notification-list");
  const searchInput = document.getElementById("notificationSearch");
  const markAllReadLink = document.getElementById("mark-all-read-link");
  const clearSearchBtn = document.getElementById("clearSearch");
  const addNotificationBtn = document.getElementById("addNottificationBtn");
  const notificationBadge = document.getElementById("notificationBadge");

  const typeFilterButton = document.getElementById("typeFilterButton");
  const typeFilterDropdown = document.getElementById("typeFilterDropdown");
  const typeFilterButtonText = document.getElementById("typeFilterButtonText");

  const sortButton = document.getElementById("sortButton");
  const sortDropdown = document.getElementById("sortDropdown");
  const sortButtonText = document.getElementById("sortButtonText");

  const readStatusFilterButton = document.getElementById("readStatusFilterButton");
  const readStatusFilterDropdown = document.getElementById("readStatusFilterDropdown");
  const readStatusFilterButtonText = document.getElementById("readStatusFilterButtonText");

  const typeTranslations = {
     'assignment': 'Завдання',
     'event': 'Подія',
     'grade': 'Оцінка',
     'message': 'Повідомлення',
     'system': 'Системне',
     '': 'Всі типи'
  };
  const sortTranslations = {
      'date_desc': 'Спочатку нові',
      'date_asc': 'Спочатку старі',
      'title_asc': 'Назва (А-Я)',
      'title_desc': 'Назва (Я-А)'
  };
  const readStatusTranslations = {
       'all': 'Всі статуси',
       'unread': 'Непрочитані',
       'read': 'Прочитані'
  };

  let currentFilters = {
    q: '',
    type: '',
    status: 'all',
    sort_by: 'date',
    sort_direction: 'desc'
  };
  
  async function performAuthenticatedFetch(url, options = {}) {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) {
          console.error("Токен авторизації ('authToken') не знайдено для запиту:", url);
          if (container && url.includes('/api/notifications/me')) { 
             container.innerHTML = '<p class="card-main-text error-message">Будь ласка, авторизуйтесь для перегляду сповіщень.</p>';
          }
          throw new Error("Токен авторизації не знайдено.");
      }
      const headers = {
          ...options.headers,
          'Authorization': `Bearer ${token}`
      };
      if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
      }
      // Переконуємося, що URL є повним, якщо він відносний
      const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
      return fetch(fullUrl, { ...options, headers });
  }


  async function updateUserSpecificUI() {
    if (!addNotificationBtn) return;
    addNotificationBtn.style.display = 'none'; 

    try {
        // ВИПРАВЛЕНО: Використовуємо performAuthenticatedFetch, який додасть BACKEND_URL
        const response = await performAuthenticatedFetch('/api/user/profile');
        if (!response.ok) {
            return;
        }
        const userData = await response.json();
        const userRole = userData.account?.role;

        if (userRole === 'admin' || userRole === 'supervisor') {
            addNotificationBtn.style.display = 'block';
        }
    } catch (error) {
        // Error already logged in performAuthenticatedFetch or non-critical for this UI element
    }
  }

  async function loadAndRenderNotifications() {
    if (!container) return;
    container.innerHTML = '<p class="card-main-text" style="padding: 1rem; text-align: center;">Завантаження сповіщень...</p>';

    try {
      const params = new URLSearchParams();
      if (currentFilters.q) params.set('q', currentFilters.q);
      if (currentFilters.type) params.set('type', currentFilters.type);
      if (currentFilters.status && currentFilters.status !== 'all') params.set('status', currentFilters.status);
      if (currentFilters.sort_by) params.set('sort_by', currentFilters.sort_by);
      if (currentFilters.sort_direction) params.set('sort_direction', currentFilters.sort_direction);
      const queryString = params.toString();
      
      // ВИПРАВЛЕНО: URL тепер формується з BACKEND_URL через performAuthenticatedFetch
      const fetchUrl = `/api/notifications/me${queryString ? '?' + queryString : ''}`;
      
      const response = await performAuthenticatedFetch(fetchUrl);

      if (!response.ok) {
           const errorData = await response.json().catch(() => ({ message: response.statusText, error: 'Невідома помилка сервера' }));
           throw new Error(`Помилка сервера: ${response.status} - ${errorData.error || errorData.message}`);
      }
      const data = await response.json();
      renderNotifications(data.notifications);
      updateUnreadCount(data.notifications);

    } catch (error) {
      if (container) {
          container.innerHTML = `<p class="card-main-text error-message">Не вдалося завантажити сповіщення: ${error.message}. Спробуйте пізніше.</p>`;
      }
       updateUnreadCount([]);
    }
  }

  function renderNotifications(notifications) {
      container.innerHTML = '';
      if (!notifications || notifications.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <img src="..\\icons\\no-result.png" alt="Немає результатів" style="max-width: 150px; margin-bottom: 1rem;">
            <p class="card-main-text">Сповіщень за заданими фільтрами немає.</p>
          </div>
        `;
        return;
      }
      notifications.forEach(notification => {
        const createdAt = new Date(notification.created_at).toLocaleString('uk-UA', { dateStyle: 'short', timeStyle: 'short' });
        const isRead = notification.is_read;
        let icon = '🔔';
        let priorityClass = 'priority-medium';
        let typeText = typeTranslations[notification.type] || notification.type?.charAt(0).toUpperCase() + notification.type?.slice(1) || 'Інше';

        switch (notification.type) {
            case 'assignment': icon = '📝'; priorityClass = 'priority-medium'; break;
            case 'event': icon = '📅'; priorityClass = 'priority-high'; break;
            case 'grade': icon = '✅'; priorityClass = 'priority-low'; break;
            case 'message': icon = '💬'; priorityClass = 'priority-low'; break;
            case 'system': icon = '⚙️'; priorityClass = 'priority-low'; break;
        }

        const item = document.createElement('div');
        item.className = `notification-item ${isRead ? '' : 'unread'} ${priorityClass}`;
        item.dataset.notificationId = notification.notification_id;

        item.innerHTML = `
          <div class="notification-icon large-card-text">${icon}</div>
          <div class="notification-content">
            <div class="notification-header">
              <h3 class="notification-title large-card-text">
                ${!isRead ? '<span class="unread-badge" title="Непрочитано"></span>' : ''}
                ${notification.title || 'Без заголовка'}
              </h3>
              <div class="notification-meta"> 
                <span class="notification-time card-main-text">${createdAt}</span>
                <span class="notification-type-badge card-main-text" title="Тип: ${typeText}">${typeText}</span>
              </div>
            </div>
            <p class="notification-message card-main-text">${notification.message || ''}</p>
            ${notification.link ? `<a href="${notification.link}" target="_blank" class="notification-link card-main-text">Детальніше</a>` : ''}
            <div class="notification-actions">
                 ${generateActionButtons(notification)}
            </div>
          </div>
        `;

         if (!isRead) {
            item.addEventListener('click', (event) => {
                 if (!event.target.closest('a, button')) {
                    handleMarkAsRead(event);
                }
            }, { once: true });
         }

        addActionEventListeners(item, notification);
        container.appendChild(item);
      });
  }

  function updateUnreadCount(notifications) {
      const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
      if (notificationBadge) {
          notificationBadge.textContent = unreadCount > 0 ? unreadCount : '';
          notificationBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
      }
  }

  function generateActionButtons(notification) {
    return `
          <button class="notification-btn btn-accept card-main-text" data-action="accept" title="Прийняти">
              <i class="fas fa-check"></i>
          </button>
          <button class="notification-btn btn-later card-main-text" data-action="later" title="Пізніше">
              <i class="fas fa-clock"></i>
          </button>
          <button class="notification-btn btn-reject card-main-text" data-action="reject" title="Відхилити">
              <i class="fas fa-times"></i>
          </button>
          <button class="notification-btn btn-calendar card-main-text" data-action="calendar" title="Додати в календар">
              <i class="fas fa-calendar-plus"></i>
          </button>
          <button class="notification-btn btn-delete card-main-text" data-action="delete" title="Видалити сповіщення">
              <i class="fas fa-trash"></i>
          </button>
      `;
  }
  
  function addActionEventListeners(itemElement, notification) {
     const buttons = itemElement.querySelectorAll('.notification-actions button[data-action]');
     buttons.forEach(button => {
         button.addEventListener('click', (event) => {
             event.stopPropagation();
             const action = button.dataset.action;
             const notificationId = notification.notification_id;
             switch (action) {
                 case 'accept': alert(`Прийнято сповіщення #${notificationId}`); break;
                 case 'later': alert(`Нагадати пізніше про сповіщення #${notificationId}`); break;
                 case 'reject':
                     alert(`Відхилено сповіщення #${notificationId}`);
                     itemElement.remove(); updateUnreadCountAfterAction();
                     break;
                 case 'calendar': alert(`Додати в календар сповіщення #${notificationId}`); break;
                 case 'delete':
                      if (confirm(`Ви впевнені, що хочете видалити сповіщення #${notificationId}?`)) {
                           alert(`Видалення сповіщення #${notificationId}`);
                           itemElement.remove(); updateUnreadCountAfterAction();
                      }
                      break;
                 default: console.warn(`Невідома дія: ${action}`);
             }
         });
     });
  }
  
  async function updateUnreadCountAfterAction() {
       await loadAndRenderNotifications();
   }

  async function handleMarkAsRead(event) {
      const item = event.currentTarget;
       const notificationId = item.dataset.notificationId;
       if (!notificationId || item.classList.contains('processing-read')) return;
       item.classList.add('processing-read');
       try {
          // ВИПРАВЛЕНО: URL тепер формується з BACKEND_URL через performAuthenticatedFetch
          const readResponse = await performAuthenticatedFetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
          if (readResponse.ok) {
               item.classList.remove('unread');
               item.querySelector('.unread-badge')?.remove();
               updateUnreadCountAfterAction();
          } else {
               const errorData = await readResponse.json().catch(() => ({}));
               alert(`Помилка при позначці сповіщення #${notificationId} як прочитаного.`);
          }
       } catch (err) {
           alert('Помилка мережі. Не вдалося позначити сповіщення як прочитане.');
       } finally {
            item.classList.remove('processing-read');
       }
   }

  async function populateTypeFilter() {
      if (!typeFilterDropdown) return;
    try {
        // ВИПРАВЛЕНО: URL тепер формується з BACKEND_URL через performAuthenticatedFetch
        const response = await performAuthenticatedFetch('/api/notification-types');
        if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
        const data = await response.json();
        if (data.types && data.types.length > 0) {
            const firstItem = typeFilterDropdown.querySelector('a[data-type=""]');
            typeFilterDropdown.innerHTML = '';
            if(firstItem) typeFilterDropdown.appendChild(firstItem); 
            data.types.forEach(type => {
                const link = document.createElement('a');
                link.href = '#';
                link.classList.add('dropdown-item');
                link.dataset.type = type;
                link.textContent = typeTranslations[type] || type.charAt(0).toUpperCase() + type.slice(1);
                typeFilterDropdown.appendChild(link);
            });
             addDropdownItemListeners(typeFilterDropdown, handleTypeFilterSelect);
             typeFilterDropdown.querySelector('a[data-type=""]')?.classList.add('selected');
        }
    } catch (error) {
        // Error not critical for main functionality
    }
   }

  function handleTypeFilterSelect(event) {
      event.preventDefault();
      const selectedType = event.target.dataset.type;
      if (currentFilters.type === selectedType) return;
      currentFilters.type = selectedType;
      typeFilterButtonText.textContent = typeTranslations[selectedType] || selectedType.charAt(0).toUpperCase() + selectedType.slice(1);
      typeFilterButton.classList.toggle('active', !!selectedType);
      typeFilterDropdown.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
      event.target.classList.add('selected');
      closeAllDropdowns();
      loadAndRenderNotifications();
   }
  
  function handleSortSelect(event) {
      event.preventDefault();
      const selectedSort = event.target.dataset.sort;
      const currentSort = `${currentFilters.sort_by}_${currentFilters.sort_direction}`;
       if (currentSort === selectedSort) return;
      const [sortBy, sortDir] = selectedSort.split('_');
      currentFilters.sort_by = sortBy;
      currentFilters.sort_direction = sortDir;
      sortButtonText.textContent = sortTranslations[selectedSort] || 'Сортування';
      sortDropdown.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
      event.target.classList.add('selected');
      closeAllDropdowns();
      loadAndRenderNotifications();
   }
  
  function handleReadStatusSelect(event) {
      event.preventDefault();
      const selectedStatus = event.target.dataset.status;
      if (currentFilters.status === selectedStatus) return;
      currentFilters.status = selectedStatus;
      readStatusFilterButtonText.textContent = readStatusTranslations[selectedStatus] || 'Статус';
      readStatusFilterButton.classList.toggle('active', selectedStatus !== 'all');
      readStatusFilterDropdown.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('selected'));
      event.target.classList.add('selected');
      closeAllDropdowns();
      loadAndRenderNotifications();
   }

  function addDropdownItemListeners(dropdownElement, handler) {
      if (!dropdownElement) return;
      dropdownElement.removeEventListener('click', delegateDropdownClick);
      dropdownElement.addEventListener('click', delegateDropdownClick);
  }
  
  function delegateDropdownClick(event) {
       if (event.target.matches('a.dropdown-item')) {
           if (this.id === 'typeFilterDropdown') handleTypeFilterSelect(event);
           else if (this.id === 'sortDropdown') handleSortSelect(event);
           else if (this.id === 'readStatusFilterDropdown') handleReadStatusSelect(event);
       }
   }

  function closeAllDropdowns(exceptButton = null) {
      document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
           const correspondingButton = dropdown.previousElementSibling;
          if (correspondingButton !== exceptButton) {
              dropdown.classList.remove('show');
              correspondingButton?.classList.remove('open');
          }
      });
   }
  
  function toggleDropdown(buttonElement, dropdownElement) {
       if (!buttonElement || !dropdownElement) return;
       const isOpening = !dropdownElement.classList.contains('show');
       closeAllDropdowns(buttonElement);
       dropdownElement.classList.toggle('show', isOpening);
       buttonElement.classList.toggle('open', isOpening);
   }

  if (typeFilterButton && typeFilterDropdown) {
       typeFilterButton.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(typeFilterButton, typeFilterDropdown); });
       addDropdownItemListeners(typeFilterDropdown, handleTypeFilterSelect);
  }

  if (sortButton && sortDropdown) {
      sortButton.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(sortButton, sortDropdown); });
      addDropdownItemListeners(sortDropdown, handleSortSelect);
      sortDropdown.querySelector(`a[data-sort="${currentFilters.sort_by}_${currentFilters.sort_direction}"]`)?.classList.add('selected');
  }

  if (readStatusFilterButton && readStatusFilterDropdown) {
      readStatusFilterButton.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(readStatusFilterButton, readStatusFilterDropdown); });
      addDropdownItemListeners(readStatusFilterDropdown, handleReadStatusSelect);
      readStatusFilterDropdown.querySelector(`a[data-status="${currentFilters.status}"]`)?.classList.add('selected');
  }

  if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', () => {
          clearTimeout(searchTimeout);
          clearSearchBtn.style.display = searchInput.value ? 'flex' : 'none';
          searchTimeout = setTimeout(() => {
            currentFilters.q = searchInput.value.trim();
            loadAndRenderNotifications();
          }, 500);
        });
        clearSearchBtn.style.display = searchInput.value ? 'flex' : 'none';
   }

  if (clearSearchBtn && searchInput) {
      clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          clearSearchBtn.style.display = 'none';
          if (currentFilters.q !== '') {
             currentFilters.q = '';
             loadAndRenderNotifications();
          }
      });
   }

  if (addNotificationBtn) {
        addNotificationBtn.addEventListener('click', () => {
          window.location.href = 'notification_create.html';
      });
   }

  if (markAllReadLink) {
      markAllReadLink.addEventListener('click', async (event) => {
          event.preventDefault();
          const hasUnread = !!container.querySelector('.notification-item.unread');
          if (!hasUnread) {
               alert('У вас немає непрочитаних сповіщень.');
               return;
           }
          if (confirm('Ви впевнені, що хочете позначити ВСІ видимі сповіщення як прочитані?')) {
              try {
                  // ВИПРАВЛЕНО: URL тепер формується з BACKEND_URL через performAuthenticatedFetch
                  const response = await performAuthenticatedFetch('/api/notifications/read-all', { method: 'PUT' });
                  if (response.ok) {
                      const result = await response.json();
                      alert(result.message || 'Всі сповіщення позначено як прочитані.');
                      loadAndRenderNotifications();
                  } else {
                      const errorData = await response.json().catch(() => ({}));
                      alert('Не вдалося позначити всі сповіщення як прочитані.');
                  }
              } catch (error) {
                  alert('Помилка мережі. Не вдалося виконати дію.');
              }
          }
      });
   }

  document.addEventListener('click', (event) => {
      if (!event.target.closest('.filter-wrapper')) {
          closeAllDropdowns();
      }
   });

  populateTypeFilter();
  loadAndRenderNotifications();
  updateUserSpecificUI();
});

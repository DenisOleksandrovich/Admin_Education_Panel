document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('taskSearch');
  const clearSearchButton = document.getElementById('clearSearch');
  const groupFilter = document.getElementById('groupFilter');
  const typeFilter = document.getElementById('typeFilter');
  const sortFilter = document.getElementById('sortFilter');
  const filterButtons = document.querySelectorAll('.filter-button');

  let allAssignments = [];

  async function fetchAssignments() {
    try {
      const response = await fetch('http://localhost:3000/assignments');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      allAssignments = data;
      populateTypeFilter(data); // нове: заповнюємо типи завдань
      return data;
    } catch (err) {
      console.error('Помилка при завантаженні завдань:', err);
      return [];
    }
  }

  async function fetchStudyGroups() {
    try {
      const response = await fetch('http://localhost:3000/api/study-groups');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const groups = await response.json();

      groupFilter.innerHTML = `<option value="">Усі групи</option>`;
      groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.group_name;
        option.textContent = group.group_name;
        groupFilter.appendChild(option);
      });
    } catch (err) {
      console.error('Помилка при завантаженні груп:', err);
    }
  }

  function populateTypeFilter(assignments) {
    const uniqueTypes = [...new Set(assignments.map(task => task.type).filter(Boolean))];
    typeFilter.innerHTML = `<option value="">Усі типи</option>`;
    uniqueTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      typeFilter.appendChild(option);
    });
  }

  function setupFilterListeners() {
    searchInput.addEventListener('input', applyFilters);
    clearSearchButton.addEventListener('click', () => {
      searchInput.value = '';
      applyFilters();
    });
    groupFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
    sortFilter.addEventListener('change', applyFilters);

    filterButtons.forEach(button => {
      button.addEventListener('click', function () {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        applyFilters();
      });
    });
  }

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const groupValue = groupFilter.value;
    const typeValue = typeFilter.value;
    const sortValue = sortFilter.value;
    const statusFilter = document.querySelector('.filter-button.active')?.dataset.filter || 'all';

    let filteredAssignments = allAssignments.filter(task => {
      const title = task.title?.toLowerCase() || '';
      const description = task.description?.toLowerCase() || '';
      const taskGroups = task.groups?.split(',').map(g => g.trim()) || [];
      const taskType = task.type || '';
      const status = task.status?.toLowerCase() || 'pending';
      const isOverdue = task.days_remaining < 0;

      const matchesSearch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm);
      const matchesGroup = !groupValue || taskGroups.includes(groupValue);
      const matchesType = !typeValue || taskType === typeValue;

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          matchesStatus = status === 'опубліковано' && !isOverdue;
        } else if (statusFilter === 'review') {
          matchesStatus = status === 'на перевірці';
        } else if (statusFilter === 'completed') {
          matchesStatus = status === 'виконано';
        } else if (statusFilter === 'overdue') {
          matchesStatus = isOverdue || status === 'протерміновано';
        }
      }

      return matchesSearch && matchesGroup && matchesType && matchesStatus;
    });

    sortAssignments(filteredAssignments, sortValue);
    renderAssignments(filteredAssignments);
  }

  function sortAssignments(assignments, sortOption) {
    switch (sortOption) {
      case 'deadline-asc':
        assignments.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
      case 'deadline-desc':
        assignments.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
        break;
      case 'name-asc':
        assignments.sort((a, b) => a.title.localeCompare(b.title, 'uk'));
        break;
      case 'name-desc':
        assignments.sort((a, b) => b.title.localeCompare(a.title, 'uk'));
        break;
      case 'date-asc':
        assignments.sort((a, b) => new Date(a.created_at || a.creation_date) - new Date(b.created_at || b.creation_date));
        break;
      case 'date-desc':
        assignments.sort((a, b) => new Date(b.created_at || b.creation_date) - new Date(a.created_at || a.creation_date));
        break;
    }
  }

  function createTaskCard(task) {
    const deadline = new Date(task.deadline);
    const formattedDeadline = deadline.toLocaleDateString('uk-UA');

    const card = document.createElement('div');
    card.className = 'task-card';
    card.dataset.taskId = task.assignment_id;
    card.dataset.status = task.status ? task.status.toLowerCase() : 'pending';

    let statusText = '';
    let statusClass = '';
    switch (card.dataset.status) {
      case 'протерміновано':
        statusText = 'Пропущений термін';
        statusClass = 'status-overdue';
        break;
      case 'виконано':
        statusText = 'Прийнято';
        statusClass = 'status-completed';
        break;
      case 'на перевірці':
        statusText = 'На перевірці';
        statusClass = 'status-in-review';
        break;
      case 'опубліковано':
      case 'pending':
      default:
        statusText = 'Очікує виконання';
        statusClass = 'status-pending';
        break;
    }

    card.innerHTML = `
      <div class="task-card-header">
        <h4 class="task-card-title large-card-text">Завдання #${task.assignment_id}: ${task.title}</h4>
      </div>
      <p class="task-card-description card-main-text"><span class="description-topic">♦</span> ${task.description}</p>
      <p class="task-type card-main-text"><span class="type-topic">■</span> ${task.type || 'Невідомо'}</p>
      <div class="task-card-documents card-main-text">
        ${task.attachments?.length > 0 ? `
          <ul class="document-list">
            ${task.attachments.map(url => `
              <li class="card-main-text">
                <a href="${url}" target="_blank">${url.split('/').pop()}</a>
              </li>`).join('')}
          </ul>` : ''}
      </div>
      <div class="task-progress">
        <div class="card-main-text progress-bar"><div class="progress" style="width: 0%"></div></div>
        <div class="task-info">
          <span class="progress-text card-main-text">Не розпочато</span>
          <span class="task-card-deadline card-main-text ${task.days_remaining <= 3 ? ' urgent' : ''}">
            Дедлайн: ${formattedDeadline}
          </span>
        </div>
      </div>
      <div class="task-card-footer">
        <span class="task-card-status ${statusClass} card-main-text">${statusText}</span>
        <div class="task-card-actions">
          <button class="task-action-button view-task" title="Переглянути деталі"><i class="fas fa-eye"></i></button>
          <button class="task-action-button submit-task" title="Здати роботу"><i class="fas fa-upload"></i></button>
          <button class="task-action-button edit-task" title="Редагувати" data-role="advisor"><i class="fas fa-edit"></i></button>
        </div>
      </div>
    `;
    return card;
  }

  function renderAssignments(assignments) {
    const pendingContainer = document.querySelector('#pendingTasks .task-grid');
    const reviewContainer = document.querySelector('#reviewTasks .task-grid');
    const completedContainer = document.querySelector('#completedTasks .task-grid');
    const overdueContainer = document.querySelector('#overdueTasks .task-grid');

    [pendingContainer, reviewContainer, completedContainer, overdueContainer].forEach(c => c.innerHTML = '');

    const now = new Date();

    assignments.forEach(task => {
      if (!task.deadline) return;

      const deadline = new Date(task.deadline);
      if (isNaN(deadline)) return;

      const daysDiff = (deadline - now) / (1000 * 60 * 60 * 24);
      const isOverdue = daysDiff < 0;
      const status = task.status?.trim().toLowerCase() || 'pending';
      const card = createTaskCard(task);

      if (isOverdue || status === 'протерміновано') {
        overdueContainer.appendChild(card);
      } else if (status === 'виконано') {
        completedContainer.appendChild(card);
      } else if (status === 'на перевірці') {
        reviewContainer.appendChild(card);
      } else {
        pendingContainer.appendChild(card);
      }
    });

    updateTaskCounts();
  }

  function updateTaskCounts() {
    ['pending', 'review', 'completed', 'overdue'].forEach(section => {
      const count = document.querySelectorAll(`#${section}Tasks .task-card`).length;
      const countEl = document.querySelector(`#${section}Tasks .task-count`);
      if (countEl) countEl.textContent = count;
    });
  }

  async function initialize() {
    await Promise.all([
      fetchStudyGroups(),
      fetchAssignments()
    ]);
    setupFilterListeners();
    applyFilters();
  }

  function setupTaskCardEventListeners() {
    document.addEventListener('click', function(event) {
      // Проверяем, была ли нажата кнопка "Submit Task"
      if (event.target.closest('.submit-task')) {
        event.preventDefault();
        const taskCard = event.target.closest('.task-card');
        const taskId = taskCard.dataset.taskId;
        
        // Здесь мы используем заглушку для ID студента, в реальном приложении
        // нужно получить его из текущей сессии пользователя
        const studentId = localStorage.getItem('studentId') || '1'; // Заглушка - ID студента
        
        // Вызываем глобальную функцию openSubmissionModal из task_submission.js
        if (typeof window.openSubmissionModal === 'function') {
          window.openSubmissionModal(taskId, studentId);
        } else {
          console.error('Функция openSubmissionModal не найдена');
          // Показываем уведомление пользователю
          showNotification('Не удалось открыть форму отправки задания', 'error');
        }
      }
      
      // Проверяем для кнопки "Edit Task"
      if (event.target.closest('.edit-task')) {
        event.preventDefault();
        const taskCard = event.target.closest('.task-card');
        const taskId = taskCard.dataset.taskId;
        
        // Проверяем роль пользователя
        const userRole = localStorage.getItem('userRole') || 'student';
        if (userRole !== 'teacher' && userRole !== 'advisor') {
          showNotification('У вас нет прав для редактирования задания', 'warning');
          return;
        }
        
        // Здесь должен быть вызов функции openEditTaskModal
        // Так как функции нет в предоставленных файлах, покажем уведомление
        showNotification('Функция редактирования задания находится в разработке', 'info');
      }
    });
  }
  
  // Вспомогательная функция для показа уведомлений
  function showNotification(message, type = 'info') {
    const notificationContainer = document.createElement('div');
    notificationContainer.classList.add('notification', `notification-${type}`);
    notificationContainer.textContent = message;
    
    document.body.appendChild(notificationContainer);
    
    setTimeout(() => {
      notificationContainer.classList.add('hide');
      setTimeout(() => {
        document.body.removeChild(notificationContainer);
      }, 500);
    }, 3000);
  }
  
  // Модифицируем функцию initialize, чтобы добавить вызов новой функции
  async function initialize() {
    await Promise.all([
      fetchStudyGroups(),
      fetchAssignments()
    ]);
    setupFilterListeners();
    setupTaskCardEventListeners(); // Добавляем новую функцию
    applyFilters();
  }

  initialize();
});

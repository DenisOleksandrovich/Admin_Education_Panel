// Функция загрузки событий с сервера
async function fetchEvents(year, month) {
  try {
    const response = await fetch(`http://localhost:3000/api/events-by-date?year=${year}&month=${month}`);
    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

    const data = await response.json();

    const formattedData = {};
    for (const key in data) {
      const formattedDate = new Date(key).toISOString().split('T')[0];
      formattedData[formattedDate] = data[key];
    }

    console.log("Загруженные события (форматированные):", formattedData);
    return formattedData;
  } catch (error) {
    console.error('Ошибка при загрузке событий:', error);
    return {};
  }
}

// Возвращает CSS-класс по типу события
function getEventClass(eventType) {
  switch (eventType) {
    case 'Семінар': return 'event-type-seminar';
    case 'Конференція': return 'event-type-conference';
    case 'Лекція': return 'event-type-lecture';
    case 'Практика': return 'event-type-practice';
    case 'Дедлайн': return 'event-type-deadline';
    case 'Виставка': return 'event-type-exhibition';
    case 'Екзамен': return 'event-type-exam';
    case 'Зустріч': return 'event-type-meeting';
    case 'Інше': return 'event-type-other';
    default: return 'event-type-common';
  }
}

// Генерация календаря
async function generateCalendar() {
  const calendarGrid = document.querySelector('.calendar-grid');
  if (!calendarGrid) return;
  calendarGrid.innerHTML = '';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = now.toISOString().split('T')[0];

  const events = await fetchEvents(year, month);
  const lastDayOfMonth = new Date(year, month, 0);
  const totalDays = lastDayOfMonth.getDate();

  for (let i = 1; i <= totalDays; i++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = i;

    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

    if (dateKey === today) {
      dayDiv.classList.add('today');
    }

    if (events[dateKey]) {
      events[dateKey].forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = `event ${getEventClass(event.event_type)}`;
        eventDiv.innerHTML = `
          <span class="event-name card-main-text">${event.event_name}</span><br>
          <span class="event-group card-main-text">🔹${event.groups}</span>
        `;
        eventDiv.addEventListener('click', () => openEventModal(event));
        dayDiv.appendChild(eventDiv);
      });
    }

    calendarGrid.appendChild(dayDiv);
  }
}

// Генерация списка ближайших событий
async function generateUpcomingEvents(year, month) {
  const upcomingList = document.querySelector('.upcoming-list');
  if (!upcomingList) return;
  upcomingList.innerHTML = '';

  const events = await fetchEvents(year, month);

  for (const date in events) {
    events[date].forEach(event => {
      const listItem = document.createElement('li');
      listItem.className = `upcoming-item ${getEventClass(event.event_type)}`;
      listItem.innerHTML = `
        <div class="upcoming-date card-large-text">
          <div class="upcoming-day card-title">${new Date(date).getDate()}</div>
          <div class="upcoming-month card-main-text">${new Date(date).toLocaleString('uk', { month: 'short' })}</div>
        </div>
        <div class="upcoming-content">
          <div class="upcoming-title-text card-large-text">${event.event_name}</div>
          <div class="upcoming-info card-main-text">
            <span class="card-main-text">🔹 ${event.groups}</span><br>
            <span class="card-main-text">🕒 ${new Date(event.event_date).toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="upcoming-type card-large-text">${event.event_type}</div>
      `;

      listItem.addEventListener('click', () => openEventModal(event));
      upcomingList.appendChild(listItem);
    });
  }

  updatePagination(year, month);
}

// Обновление пагинации
function updatePagination(year, month) {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;
  pagination.innerHTML = '';
  for (let i = -1; i <= 1; i++) {
    const pageButton = document.createElement('div');
    pageButton.className = 'page-button' + (i === 0 ? ' active' : '');
    pageButton.textContent = month + i;
    pageButton.addEventListener('click', () => {
      generateUpcomingEvents(year, month + i);
    });
    pagination.appendChild(pageButton);
  }
}

// Открытие модального окна
function openEventModal(event) {
  if (!event || typeof event !== 'object') return;

  const modal = document.getElementById('eventModal');
  if (!modal) return;

  document.getElementById('modal-event-name').textContent = event.event_name || '';
  document.getElementById('modal-event-date').textContent = new Date(event.event_date).toLocaleString();
  document.getElementById('modal-event-venue').textContent = event.venue || '';
  document.getElementById('modal-event-type').textContent = event.event_type || '';
  document.getElementById('modal-event-duration').textContent = event.duration || '';
  document.getElementById('modal-event-supervisor').textContent = event.supervisor || '';
  document.getElementById('modal-event-description').textContent = event.event_description || '';
  document.getElementById('modal-event-groups').textContent = event.groups || '';

  modal.style.display = 'flex';
}

// Закрытие модального окна
function closeEventModal() {
  const modal = document.getElementById('eventModal');
  if (modal) modal.style.display = 'none';
}

// Защита от ошибки: Uncaught TypeError: Cannot read properties of null
document.addEventListener('click', function (event) {
  const modal = document.getElementById('eventModal');
  if (modal && event.target === modal) {
    closeEventModal();
  }
});

// Основная инициализация
document.addEventListener('DOMContentLoaded', function () {
  const closeBtn = document.getElementById('closeModalBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEventModal);
  }

  const now = new Date();
  generateCalendar();
  generateUpcomingEvents(now.getFullYear(), now.getMonth() + 1);
});

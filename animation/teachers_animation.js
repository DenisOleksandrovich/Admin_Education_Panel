document.querySelectorAll('.filter-button').forEach(button => {
  button.addEventListener('click', function() {
    if (!this.classList.contains('active')) {
      document.querySelectorAll('.filter-button').forEach(btn => {
        btn.classList.remove('active');
      });
      this.classList.add('active');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  loadSupervisors();

  const searchInput = document.querySelector('.search-input');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query === '') {
      loadSupervisors();
    } else {
      searchSupervisors(query);
    }
  });
});

async function loadSupervisors() {
  try {
    const response = await fetch('http://localhost:3000/api/supervisors');
    if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
    const supervisors = await response.json();
    renderSupervisors(supervisors);
  } catch (error) {
    console.error('Помилка завантаження викладачів:', error);
  }
}

async function searchSupervisors(query) {
  try {
    const response = await fetch(`http://localhost:3000/api/supervisors/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
    const supervisors = await response.json();
    renderSupervisors(supervisors);
  } catch (error) {
    console.error('Помилка пошуку викладачів:', error);
  }
}

function renderSupervisors(supervisors) {
  const grid = document.querySelector('.teachers-grid'); // изменено
  grid.innerHTML = '';

  supervisors.forEach(supervisor => {
    const initials = supervisor.full_name.split(' ')
      .map(name => name.charAt(0)).join('');

    const card = document.createElement('div');
    card.classList.add('teacher-card'); // изменено

    card.innerHTML = `
      <div class="teacher-header">
        <div class="teacher-avatar-large l-card-text">${initials}</div>
        <div class="teacher-details">
          <h3 class="teacher-name-large l-card-text">${supervisor.full_name || 'Невідомо'}</h3> <!-- изменено -->
          <span class="status-badge status-active card-main-text">${supervisor.teacher_status || 'Невідомо'}</span>
        </div>
      </div>
      <div class="teacher-meta">
        <div class="meta-item">
          <span class="meta-label l-card-text">ID</span>
          <span class="meta-value card-main-text">${supervisor.supervisor_id}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Пошта</span>
          <span class="meta-value card-main-text">${supervisor.email || '—'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Телефон</span>
          <span class="meta-value card-main-text">${supervisor.phone || '—'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Кафедра</span>
          <span class="meta-value card-main-text">${supervisor.department || '—'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Посада</span>
          <span class="meta-value card-main-text">${supervisor.position || '—'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Спеціалізація</span>
          <span class="meta-value card-main-text">${supervisor.specialization || '—'}</span>
        </div>
      </div>
      <div class="teacher-actions">
        <div class="action-button">
          <i class="fa fa-eye"></i>
        </div>
        <div class="action-button">
          <i class="fa fa-user-plus"></i>
        </div>
        <div class="action-button">
          <i class="fa fa-comment"></i>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

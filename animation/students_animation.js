// Обробка кліків на кнопках фільтрації
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
  // Завантаження всіх студентів за замовчуванням
  loadStudents();

  // Слухач для поля пошуку
  const searchInput = document.querySelector('.search-input');
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query === '') {
      loadStudents();
    } else {
      searchStudents(query);
    }
  });
});

async function loadStudents() {
  try {
    const response = await fetch('http://localhost:3000/api/students');
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    const students = await response.json();
    renderStudents(students);
  } catch (error) {
    console.error('Помилка завантаження студентів:', error);
  }
}

async function searchStudents(query) {
  try {
    const response = await fetch(`http://localhost:3000/api/students/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    const students = await response.json();
    renderStudents(students);
  } catch (error) {
    console.error('Помилка пошуку студентів:', error);
  }
}

function renderStudents(students) {
  const studentsGrid = document.querySelector('.students-grid');
  studentsGrid.innerHTML = '';

  students.forEach(student => {
    // Формуємо ініціали для аватара
    const initials = student.full_name.split(' ')
                        .map(name => name.charAt(0))
                        .join('');

    // Створюємо HTML-код карточки студента
    const card = document.createElement('div');
    card.classList.add('student-card');
    card.innerHTML = `
      <div class="student-header">
        <div class="student-avatar-large l-card-text">${initials}</div>
        <div class="student-details">
          <h3 class="student-name-large l-card-text">${student.full_name || 'Невідомо'}</h3>
          <span class="status-badge status-active l-card-text">Активний</span>
        </div>
      </div>
      <div class="student-meta">
        <div class="meta-item">
          <span class="meta-label l-card-text">ID</span>
          <span class="meta-value card-main-text">${student.student_id}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Пошта</span>
          <span class="meta-value card-main-text">${student.email || ''}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Студ. квиток</span>
          <span class="meta-value card-main-text">${student.student_card_number || ''}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Факультет</span>
          <span class="meta-value card-main-text">${student.department || ''}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Група</span>
          <span class="meta-value card-main-text">${student.group_name || student.study_group_id || 'Невідомо'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Телефон</span>
          <span class="meta-value card-main-text">${student.phone || ''}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Керівник</span>
          <span class="meta-value card-main-text">${student.supervisor_name || student.supervisor_id || 'Невідомо'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Прогрес</span>
          <span class="meta-value card-main-text">${student.total_progress || 0}%</span>
        </div>
        <div class="meta-item">
          <span class="meta-label l-card-text">Диплом</span>
          <span class="meta-value card-main-text">${student.diploma_id ? student.diploma_id : 'Не визначено'}</span>
        </div>
      </div>
      <div class="student-actions">
        <div class="action-button">
          <i class="fa fa-eye"></i>
        </div>
        <div class="action-button">
          <i class="fa fa-file-alt"></i>
        </div>
        <div class="action-button">
          <i class="fa fa-comment"></i>
        </div>
      </div>
    `;
    studentsGrid.appendChild(card);
  });
}
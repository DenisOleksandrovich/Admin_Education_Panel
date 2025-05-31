let currentGroupFilter = null;
let currentSpecialtyFilter = null;
let currentDepartmentFilter = null;
let currentSupervisorFilter = null;
let currentProgressFilter = null;
let currentSortOption = null;
let currentSortDirection = 'asc';

document.addEventListener('DOMContentLoaded', () => {
  loadStudents();
  loadGroups();
  loadSpecialties();
  loadDepartments();
  loadSupervisors();
  setupProgressFilters();
  setupSortingOptions();

  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      applyFilters(query);
    });
  }

  document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function() {
      if (this.classList.contains('dropdown-filter')) return; // Skip dropdown buttons for this logic

      document.querySelectorAll('.filter-button:not(.dropdown-filter)').forEach(btn => {
        btn.classList.remove('active');
      });
      this.classList.add('active');
      
      const filterType = this.getAttribute('data-filter');
      handleFilterClick(filterType);
    });
  });
  
  const mainFilterToggleButton = document.querySelector('.filter-toggle-button'); // Assuming a more specific selector
  if (mainFilterToggleButton) {
    mainFilterToggleButton.addEventListener('click', () => {
      const filtersSection = document.querySelector('.filters-section');
      if (filtersSection) {
        filtersSection.classList.toggle('visible');
      } else {
        console.error("Element with class '.filters-section' not found for toggling.");
      }
    });
  }
});

function handleFilterClick(filterType) {
  const searchInput = document.querySelector('.search-input');
  const query = searchInput ? searchInput.value.trim() : '';
  applyFilters(query);
}

async function loadGroups() {
  try {
    const response = await fetch('http://localhost:3000/api/groups');
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const groups = await response.json();
    renderFilterDropdown('group', groups, 'Група', 'study_group_id', 'group_name');
  } catch (error) {
    console.error('Error loading groups:', error);
  }
}

async function loadSpecialties() {
  try {
    const response = await fetch('http://localhost:3000/api/specialties');
    if (!response.ok) {
      const mockSpecialties = [
        { id: '1', name: 'Комп\'ютерні науки' },
        { id: '2', name: 'Кібербезпека' },
        { id: '3', name: 'Інженерія програмного забезпечення' }
      ];
      renderFilterDropdown('specialty', mockSpecialties, 'Спеціальність', 'id', 'name');
      return;
    }
    const specialties = await response.json();
    renderFilterDropdown('specialty', specialties, 'Спеціальність', 'id', 'name');
  } catch (error) {
    console.error('Error loading specialties:', error);
    const mockSpecialties = [
        { id: '1', name: 'Комп\'ютерні науки (mock)' },
        { id: '2', name: 'Кібербезпека (mock)' }
    ];
    renderFilterDropdown('specialty', mockSpecialties, 'Спеціальність', 'id', 'name');
  }
}

async function loadDepartments() {
  try {
    const response = await fetch('http://localhost:3000/api/student-departments');
    if (!response.ok) {
      const mockDepartments = [
        { id: '1', name: 'IT кафедра' },
        { id: '2', name: 'Кафедра математики' },
        { id: '3', name: 'Кафедра фізики' }
      ];
      renderFilterDropdown('department', mockDepartments, 'Кафедра', 'id', 'name');
      return;
    }
    const departments = await response.json();
    renderFilterDropdown('department', departments, 'Кафедра', 'id', 'name');
  } catch (error) {
    console.error('Error loading student departments:', error);
     const mockDepartments = [
        { id: '1', name: 'IT кафедра (mock)' },
        { id: '2', name: 'Кафедра математики (mock)' }
    ];
    renderFilterDropdown('department', mockDepartments, 'Кафедра', 'id', 'name');
  }
}

async function loadSupervisors() {
  try {
    const response = await fetch('http://localhost:3000/api/supervisors');
    if (!response.ok) {
      const mockSupervisors = [
        { supervisor_id: '1', full_name: 'Іванов Іван Іванович' },
        { supervisor_id: '2', full_name: 'Петров Петро Петрович' }
      ];
      renderFilterDropdown('supervisor', mockSupervisors, 'Керівник', 'supervisor_id', 'full_name');
      return;
    }
    const supervisors = await response.json();
    renderFilterDropdown('supervisor', supervisors, 'Керівник', 'supervisor_id', 'full_name');
  } catch (error) {
    console.error('Error loading supervisors:', error);
    const mockSupervisors = [
        { supervisor_id: '1', full_name: 'Іванов Іван Іванович (mock)' },
    ];
    renderFilterDropdown('supervisor', mockSupervisors, 'Керівник', 'supervisor_id', 'full_name');
  }
}

function setupProgressFilters() {
  const progressFilters = [
    { id: 'low', name: 'Низький прогрес (<30%)' },
    { id: 'medium', name: 'Середній прогрес (30-70%)' },
    { id: 'high', name: 'Високий прогрес (>70%)' },
    { id: 'no-progress', name: 'Без прогресу (0%)' },
    { id: 'completed', name: 'Завершено (100%)' }
  ];
  renderFilterDropdown('progress', progressFilters, 'Прогрес', 'id', 'name');
}

function setupSortingOptions() {
  const sortOptions = [
    { id: 'name_asc', name: 'Ім\'я (А-Я)' },
    { id: 'name_desc', name: 'Ім\'я (Я-А)' },
    { id: 'progress_asc', name: 'Прогрес (низький-високий)' },
    { id: 'progress_desc', name: 'Прогрес (високий-низький)' },
    { id: 'group_asc', name: 'Група (А-Я)' },
    { id: 'group_desc', name: 'Група (Я-А)' },
    { id: 'department_asc', name: 'Кафедра (А-Я)' },
    { id: 'department_desc', name: 'Кафедра (Я-А)' }
  ];
  renderSortOptions(sortOptions);
}

function renderFilterDropdown(filterType, items, title, idField, nameField) {
  const filterContainer = document.querySelector('.filter-container');
  if (!filterContainer) return;

  const dropdownButton = document.createElement('div');
  dropdownButton.classList.add('filter-button', 'dropdown-filter');
  dropdownButton.innerHTML = `<i class="fa fa-filter" class="card-main-text"></i> <span>${title}</span> <i class="fa fa-chevron-down ml-2" class="card-main-text"></i>`;

  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content');

  const allOption = document.createElement('div');
  allOption.classList.add('dropdown-item', 'card-main-text', 'active');
  allOption.setAttribute('data-filter-type', filterType);
  allOption.setAttribute('data-filter-id', '');
  allOption.textContent = `Всі`;
  allOption.addEventListener('click', () => {
    selectFilter(allOption, filterType, null);
    const spanElement = dropdownButton.querySelector('span');
    if (spanElement) spanElement.textContent = title;
    closeAllDropdowns();
  });
  dropdownContent.appendChild(allOption);

  items.forEach(item => {
    const filterOption = document.createElement('div');
    filterOption.classList.add('dropdown-item', 'card-main-text');
    filterOption.setAttribute('data-filter-type', filterType);
    filterOption.setAttribute('data-filter-id', item[idField]);
    filterOption.textContent = item[nameField];
    filterOption.addEventListener('click', () => {
      selectFilter(filterOption, filterType, item[idField]);
      const spanElement = dropdownButton.querySelector('span');
      if (spanElement) spanElement.textContent = `${title}: ${item[nameField]}`;
      closeAllDropdowns();
    });
    dropdownContent.appendChild(filterOption);
  });

  const dropdownWrapper = document.createElement('div');
  dropdownWrapper.classList.add('dropdown-wrapper');
  dropdownWrapper.appendChild(dropdownButton);
  dropdownWrapper.appendChild(dropdownContent);

  dropdownButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentlyOpen = dropdownContent.classList.contains('show');
    closeAllDropdowns();
    if (!currentlyOpen) {
        dropdownContent.classList.add('show');
    }
  });
  filterContainer.appendChild(dropdownWrapper);
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
    dropdown.classList.remove('show');
  });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown-wrapper')) {
        closeAllDropdowns();
    }
});

function renderSortOptions(sortOptions) {
  const filterContainer = document.querySelector('.filter-container');
  if (!filterContainer) return;

  const dropdownButton = document.createElement('div');
  dropdownButton.classList.add('filter-button', 'dropdown-filter');
  dropdownButton.innerHTML = `<i class="fa fa-sort" class="card-main-text"></i> <span class="card-main-text">Сортування</span> <i class="fa fa-chevron-down ml-2" class="card-main-text"></i>`;
  
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content');
  
  sortOptions.forEach(option => {
    const sortOptionElement = document.createElement('div');
    sortOptionElement.classList.add('dropdown-item', 'card-main-text');
    sortOptionElement.setAttribute('data-sort-id', option.id);
    sortOptionElement.textContent = option.name;
    sortOptionElement.addEventListener('click', () => {
      selectSortOption(sortOptionElement, option.id);
      const spanElement = dropdownButton.querySelector('span');
      if (spanElement) spanElement.textContent = `Сортування: ${option.name}`;
      closeAllDropdowns();
    });
    dropdownContent.appendChild(sortOptionElement);
  });
  
  const dropdownWrapper = document.createElement('div');
  dropdownWrapper.classList.add('dropdown-wrapper');
  dropdownWrapper.appendChild(dropdownButton);
  dropdownWrapper.appendChild(dropdownContent);
  
  dropdownButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentlyOpen = dropdownContent.classList.contains('show');
    closeAllDropdowns();
    if (!currentlyOpen) {
        dropdownContent.classList.add('show');
    }
  });
  filterContainer.appendChild(dropdownWrapper);
}

function selectFilter(filterOptionElement, filterType, filterIdValue) {
  document.querySelectorAll(`.dropdown-item[data-filter-type="${filterType}"]`).forEach(option => {
    option.classList.remove('active');
  });
  if (filterOptionElement) {
    filterOptionElement.classList.add('active');
  }
  
  switch (filterType) {
    case 'group': currentGroupFilter = filterIdValue; break;
    case 'specialty': currentSpecialtyFilter = filterIdValue; break;
    case 'department': currentDepartmentFilter = filterIdValue; break;
    case 'supervisor': currentSupervisorFilter = filterIdValue; break;
    case 'progress': currentProgressFilter = filterIdValue; break;
  }
  
  const searchInput = document.querySelector('.search-input');
  const query = searchInput ? searchInput.value.trim() : '';
  applyFilters(query);
}

function selectSortOption(sortOptionElement, sortIdValue) {
  document.querySelectorAll('.dropdown-item[data-sort-id]').forEach(option => {
    option.classList.remove('active');
  });
  if (sortOptionElement) {
    sortOptionElement.classList.add('active');
  }
  
  const [field, direction] = sortIdValue.split('_');
  currentSortOption = field;
  currentSortDirection = direction;
  
  const searchInput = document.querySelector('.search-input');
  const query = searchInput ? searchInput.value.trim() : '';
  applyFilters(query);
}

function applyFilters(searchQuery) {
  filterStudentsServerSide(searchQuery);
}

async function filterStudentsServerSide(searchQuery) {
  try {
    let url = 'http://localhost:3000/api/students/filter?';
    const params = new URLSearchParams();

    if (searchQuery) params.append('q', searchQuery);
    if (currentGroupFilter) params.append('group_id', currentGroupFilter);
    if (currentSpecialtyFilter) params.append('specialty', currentSpecialtyFilter);
    if (currentDepartmentFilter) params.append('department', currentDepartmentFilter);
    if (currentSupervisorFilter) params.append('supervisor_id', currentSupervisorFilter);
    if (currentProgressFilter) params.append('progress_filter', currentProgressFilter);
    if (currentSortOption && currentSortDirection) {
      params.append('sort_by', currentSortOption);
      params.append('sort_direction', currentSortDirection);
    }
    
    const response = await fetch(url + params.toString());
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    let students = await response.json();
    renderStudents(students);
  } catch (error) {
    console.error('Error filtering students:', error);
  }
}

async function loadStudents() {
  try {
    const response = await fetch('http://localhost:3000/api/students');
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    const students = await response.json();
    renderStudents(students);
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

function renderStudents(students) {
  const studentsGrid = document.querySelector('.students-grid');
  if (!studentsGrid) return;
  studentsGrid.innerHTML = '';

  if (students.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('empty-results');
    emptyMessage.innerHTML = `
      <img src="icons/no-result.png" alt="No results" class="no-results-icon">
      <p class="card-main-text">Студентів за вказаними критеріями не знайдено</p>
    `;
    studentsGrid.appendChild(emptyMessage);
    return;
  }

  students.forEach(student => {
    const initials = (student.full_name || '').split(' ')
                        .map(name => name.charAt(0))
                        .join('');

    let progressClass = '';
    const progress = student.total_progress || 0;
    if (progress >= 75) progressClass = 'progress-high';
    else if (progress >= 30) progressClass = 'progress-medium';
    else progressClass = 'progress-low';

    const card = document.createElement('div');
    card.classList.add('student-card');
    card.innerHTML = `
      <div class="student-header">
        <div class="student-avatar-large large-card-text">${initials}</div>
        <div class="student-details">
          <h4 class="student-name-large large-card-text">${student.full_name || 'Невідомо'}</h4>
          <span class="status-badge status-active large-card-text">Активний</span>
        </div>
      </div>
      <div class="student-meta">
        <div class="meta-item">
          <span class="meta-label large-card-text">ID</span>
          <span class="meta-value card-main-text">${student.student_id}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Пошта</span>
          <span class="meta-value card-main-text">${student.email || ''}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Студ. квиток</span>
          <span class="meta-value card-main-text">${student.student_card_number || ''}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Факультет</span>
          <span class="meta-value card-main-text">${student.department || ''}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Група</span>
          <span class="meta-value card-main-text">${student.group_name || student.study_group_id || 'Невідомо'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Телефон</span>
          <span class="meta-value card-main-text">${student.phone || ''}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Керівник</span>
          <span class="meta-value card-main-text">${student.supervisor_name || (student.supervisor_id ? `ID: ${student.supervisor_id}` : 'Невідомо')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Прогрес</span>
          <span class="meta-value card-main-text ${progressClass}">${student.total_progress || 0}%</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Диплом</span>
          <span class="meta-value card-main-text">${student.diploma_id ? `ID: ${student.diploma_id}` : 'Не визначено'}</span>
        </div>
      </div>
      <div class="student-actions">
        <div class="action-button"><i class="fa fa-eye"></i></div>
        <div class="action-button"><i class="fa fa-file-alt"></i></div>
        <div class="action-button"><i class="fa fa-comment"></i></div>
      </div>
    `;
    studentsGrid.appendChild(card);
  });
}

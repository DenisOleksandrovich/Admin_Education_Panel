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
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    applyFilters(query);
  });

  document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function() {
      if (!this.classList.contains('active')) {
        document.querySelectorAll('.filter-button').forEach(btn => {
          btn.classList.remove('active');
        });
        this.classList.add('active');
        
        const filterType = this.getAttribute('data-filter');
        handleFilterClick(filterType);
      }
    });
  });
  
  const filterButton = document.querySelector('.filter-button');
  filterButton.addEventListener('click', () => {
    const filtersSection = document.querySelector('.filters-section');
    filtersSection.classList.toggle('visible');
  });
});

function handleFilterClick(filterType) {
  const searchQuery = document.querySelector('.search-input').value.trim();
  applyFilters(searchQuery);
}

async function loadGroups() {
  try {
    const response = await fetch('http://localhost:3000/api/groups');
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    const groups = await response.json();
    renderFilterDropdown('group', groups, 'Група', 'study_group_id', 'group_name');
  } catch (error) {
    console.error('Помилка завантаження списку груп:', error);
  }
}

async function loadSpecialties() {
  try {
    const response = await fetch('http://localhost:3000/api/specialties');
    if (!response.ok) {
      const mockSpecialties = [
        { specialty_id: '1', specialty_name: 'Комп\'ютерні науки' },
        { specialty_id: '2', specialty_name: 'Кібербезпека' },
        { specialty_id: '3', specialty_name: 'Інженерія програмного забезпечення' }
      ];
      renderFilterDropdown('specialty', mockSpecialties, 'Спеціальність', 'specialty_id', 'specialty_name');
      return;
    }
    const specialties = await response.json();
    renderFilterDropdown('specialty', specialties, 'Спеціальність', 'specialty_id', 'specialty_name');
  } catch (error) {
    console.error('Помилка завантаження списку спеціальностей:', error);
    const mockSpecialties = [
      { specialty_id: '1', specialty_name: 'Комп\'ютерні науки' },
      { specialty_id: '2', specialty_name: 'Кібербезпека' },
      { specialty_id: '3', specialty_name: 'Інженерія програмного забезпечення' }
    ];
    renderFilterDropdown('specialty', mockSpecialties, 'Спеціальність', 'specialty_id', 'specialty_name');
  }
}

async function loadDepartments() {
  try {
    const response = await fetch('http://localhost:3000/api/departments');
    if (!response.ok) {
      const mockDepartments = [
        { department_id: '1', department_name: 'IT кафедра' },
        { department_id: '2', department_name: 'Кафедра математики' },
        { department_id: '3', department_name: 'Кафедра фізики' }
      ];
      renderFilterDropdown('department', mockDepartments, 'Кафедра', 'department_id', 'department_name');
      return;
    }
    const departments = await response.json();
    renderFilterDropdown('department', departments, 'Кафедра', 'department_id', 'department_name');
  } catch (error) {
    console.error('Помилка завантаження списку департаментів:', error);
    const mockDepartments = [
      { department_id: '1', department_name: 'IT кафедра' },
      { department_id: '2', department_name: 'Кафедра математики' },
      { department_id: '3', department_name: 'Кафедра фізики' }
    ];
    renderFilterDropdown('department', mockDepartments, 'Кафедра', 'department_id', 'department_name');
  }
}

async function loadSupervisors() {
  try {
    const response = await fetch('http://localhost:3000/api/supervisors');
    if (!response.ok) {
      const mockSupervisors = [
        { supervisor_id: '1', full_name: 'Іванов Іван Іванович' },
        { supervisor_id: '2', full_name: 'Петров Петро Петрович' },
        { supervisor_id: '3', full_name: 'Сидоренко Сидір Сидорович' }
      ];
      renderFilterDropdown('supervisor', mockSupervisors, 'Керівник', 'supervisor_id', 'full_name');
      return;
    }
    const supervisors = await response.json();
    renderFilterDropdown('supervisor', supervisors, 'Керівник', 'supervisor_id', 'full_name');
  } catch (error) {
    console.error('Помилка завантаження списку керівників:', error);
    const mockSupervisors = [
      { supervisor_id: '1', full_name: 'Іванов Іван Іванович' },
      { supervisor_id: '2', full_name: 'Петров Петро Петрович' },
      { supervisor_id: '3', full_name: 'Сидоренко Сидір Сидорович' }
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
    { id: 'group_desc', name: 'Група (Я-А)' }
  ];
  
  renderSortOptions(sortOptions);
}

function renderFilterDropdown(filterType, items, title, idField, nameField) {
  const filterContainer = document.querySelector('.filter-container');
  
  if (!filterContainer) return;
  
  const dropdownButton = document.createElement('div');
  dropdownButton.classList.add('filter-button', 'dropdown-filter');
  dropdownButton.innerHTML = `<i class="fa fa-filter card-main-text"></i> <span>${title}</span> <i class="fa fa-chevron-down ml-2 card-main-text"></i>`;
  
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content');
  
  const allOption = document.createElement('div');
  allOption.classList.add('dropdown-item', 'card-main-text', 'active');
  allOption.setAttribute('data-filter-type', filterType);
  allOption.setAttribute('data-filter-id', '');
  allOption.textContent = `Всі`;
  allOption.addEventListener('click', () => {
    selectFilter(allOption, filterType, null);
    dropdownButton.querySelector('span').textContent = title;
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
      dropdownButton.querySelector('span').textContent = `${title}: ${item[nameField]}`;
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
    closeAllDropdowns();
    dropdownContent.classList.toggle('show');
  });
  
  filterContainer.appendChild(dropdownWrapper);
  
  document.addEventListener('click', () => {
    closeAllDropdowns();
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-content').forEach(dropdown => {
    dropdown.classList.remove('show');
  });
}

function renderSortOptions(sortOptions) {
  const filterContainer = document.querySelector('.filter-container');
  
  if (!filterContainer) return;
  
  const dropdownButton = document.createElement('div');
  dropdownButton.classList.add('filter-button', 'dropdown-filter');
  dropdownButton.innerHTML = `<i class="fa fa-sort"></i> <span>Сортування</span> <i class="fa fa-chevron-down ml-2 card-main-text"></i>`;
  
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content');
  
  sortOptions.forEach(option => {
    const sortOption = document.createElement('div');
    sortOption.classList.add('dropdown-item', 'card-main-text');
    sortOption.setAttribute('data-sort-id', option.id);
    sortOption.textContent = option.name;
    sortOption.addEventListener('click', () => {
      selectSortOption(sortOption, option.id);
      dropdownButton.querySelector('span').textContent = `Сортування: ${option.name}`;
      closeAllDropdowns();
    });
    dropdownContent.appendChild(sortOption);
  });
  
  const dropdownWrapper = document.createElement('div');
  dropdownWrapper.classList.add('dropdown-wrapper');
  dropdownWrapper.appendChild(dropdownButton);
  dropdownWrapper.appendChild(dropdownContent);
  
  dropdownButton.addEventListener('click', (e) => {
    e.stopPropagation();
    closeAllDropdowns();
    dropdownContent.classList.toggle('show');
  });
  
  filterContainer.appendChild(dropdownWrapper);
}

function selectFilter(filterOption, filterType, filterId) {
  document.querySelectorAll(`.dropdown-item[data-filter-type="${filterType}"]`).forEach(option => {
    option.classList.remove('active');
  });
  
  filterOption.classList.add('active');
  
  switch (filterType) {
    case 'group':
      currentGroupFilter = filterId;
      break;
    case 'specialty':
      currentSpecialtyFilter = filterId;
      break;
    case 'department':
      currentDepartmentFilter = filterId;
      break;
    case 'supervisor':
      currentSupervisorFilter = filterId;
      break;
    case 'progress':
      currentProgressFilter = filterId;
      break;
  }
  
  const searchQuery = document.querySelector('.search-input').value.trim();
  applyFilters(searchQuery);
}

function selectSortOption(sortOption, sortId) {
  document.querySelectorAll('.dropdown-item[data-sort-id]').forEach(option => {
    option.classList.remove('active');
  });
  
  sortOption.classList.add('active');
  
  const [field, direction] = sortId.split('_');
  
  currentSortOption = field;
  currentSortDirection = direction;
  
  const searchQuery = document.querySelector('.search-input').value.trim();
  applyFilters(searchQuery);
}

function applyFilters(searchQuery) {
  if (hasServerSideFiltering()) {
    filterStudentsServerSide(searchQuery);
  } else {
    filterStudentsClientSide(searchQuery);
  }
}

function hasServerSideFiltering() {
  return true;
}

async function filterStudentsServerSide(searchQuery) {
  try {
    let url = 'http://localhost:3000/api/students/filter?';
    
    if (searchQuery) {
      url += `q=${encodeURIComponent(searchQuery)}`;
    }
    
    if (currentGroupFilter) {
      url += `${url.endsWith('?') ? '' : '&'}group_id=${encodeURIComponent(currentGroupFilter)}`;
    }
    
    if (currentSpecialtyFilter) {
      url += `${url.endsWith('?') ? '' : '&'}specialty_id=${encodeURIComponent(currentSpecialtyFilter)}`;
    }
    
    if (currentDepartmentFilter) {
      url += `${url.endsWith('?') ? '' : '&'}department_id=${encodeURIComponent(currentDepartmentFilter)}`;
    }
    
    if (currentSupervisorFilter) {
      url += `${url.endsWith('?') ? '' : '&'}supervisor_id=${encodeURIComponent(currentSupervisorFilter)}`;
    }
    
    if (currentProgressFilter) {
      url += `${url.endsWith('?') ? '' : '&'}progress_filter=${encodeURIComponent(currentProgressFilter)}`;
    }
    
    if (currentSortOption && currentSortDirection) {
      url += `${url.endsWith('?') ? '' : '&'}sort_by=${encodeURIComponent(currentSortOption)}&sort_direction=${encodeURIComponent(currentSortDirection)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    let students = await response.json();
    
    if (currentSortOption && !url.includes('sort_by')) {
      students = sortStudents(students);
    }
    
    if (currentProgressFilter && !url.includes('progress_filter')) {
      students = filterStudentsByProgress(students);
    }
    
    renderStudents(students);
  } catch (error) {
    console.error('Помилка фільтрації студентів:', error);
    filterStudentsClientSide(searchQuery);
  }
}

async function filterStudentsClientSide(searchQuery) {
  try {
    const response = await fetch('http://localhost:3000/api/students');
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    let students = await response.json();
    
    if (searchQuery) {
      students = students.filter(student => 
        Object.values(student).some(value => 
          value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    if (currentGroupFilter) {
      students = students.filter(student => student.study_group_id == currentGroupFilter);
    }
    
    if (currentSpecialtyFilter) {
      students = students.filter(student => student.specialty == currentSpecialtyFilter);
    }
    
    if (currentDepartmentFilter) {
      students = students.filter(student => student.department == currentDepartmentFilter);
    }
    
    if (currentSupervisorFilter) {
      students = students.filter(student => student.supervisor_id == currentSupervisorFilter);
    }
    
    if (currentProgressFilter) {
      students = filterStudentsByProgress(students);
    }
    
    if (currentSortOption) {
      students = sortStudents(students);
    }
    
    renderStudents(students);
  } catch (error) {
    console.error('Помилка фільтрації студентів на клієнті:', error);
  }
}

function filterStudentsByProgress(students) {
  switch (currentProgressFilter) {
    case 'low':
      return students.filter(student => (student.total_progress || 0) < 30);
    case 'medium':
      return students.filter(student => (student.total_progress || 0) >= 30 && (student.total_progress || 0) <= 70);
    case 'high':
      return students.filter(student => (student.total_progress || 0) > 70);
    case 'no-progress':
      return students.filter(student => (student.total_progress || 0) === 0);
    case 'completed':
      return students.filter(student => (student.total_progress || 0) === 100);
    default:
      return students;
  }
}

function sortStudents(students) {
  if (!currentSortOption) {
    return students;
  }
  
  const sortedStudents = [...students];
  
  switch (currentSortOption) {
    case 'name':
      sortedStudents.sort((a, b) => {
        const nameA = a.full_name || '';
        const nameB = b.full_name || '';
        return currentSortDirection === 'asc' ? 
          nameA.localeCompare(nameB, 'uk') : 
          nameB.localeCompare(nameA, 'uk');
      });
      break;
    case 'progress':
      sortedStudents.sort((a, b) => {
        const progressA = a.total_progress || 0;
        const progressB = b.total_progress || 0;
        return currentSortDirection === 'asc' ? 
          progressA - progressB : 
          progressB - progressA;
      });
      break;
    case 'group':
      sortedStudents.sort((a, b) => {
        const groupA = a.group_name || '';
        const groupB = b.group_name || '';
        return currentSortDirection === 'asc' ? 
          groupA.localeCompare(groupB, 'uk') : 
          groupB.localeCompare(groupA, 'uk');
      });
      break;
  }
  
  return sortedStudents;
}

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

function renderStudents(students) {
  const studentsGrid = document.querySelector('.students-grid');
  studentsGrid.innerHTML = '';

  if (students.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('empty-results');
    emptyMessage.innerHTML = `
      <img src="icons/no-result.png" alt="Немає результатів" class="no-results-icon">
      <p>Студентів за вказаними критеріями не знайдено</p>
    `;
    studentsGrid.appendChild(emptyMessage);
    return;
  }

  students.forEach(student => {
    const initials = student.full_name.split(' ')
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
          <span class="meta-value card-main-text">${student.supervisor_name || student.supervisor_id || 'Невідомо'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Прогрес</span>
          <span class="meta-value card-main-text ${progressClass}">${student.total_progress || 0}%</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Диплом</span>
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
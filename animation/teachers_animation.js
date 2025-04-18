let currentDepartmentFilter = null;
let currentPositionFilter = null;
let currentSpecializationFilter = null;
let currentStatusFilter = null;
let currentSortOption = null;
let currentSortDirection = 'asc';

document.addEventListener('DOMContentLoaded', () => {
  loadSupervisors();
  loadDepartments();
  loadPositions();
  loadSpecializations();
  loadStatuses();
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
    console.error('Помилка завантаження списку кафедр:', error);
    const mockDepartments = [
      { department_id: '1', department_name: 'IT кафедра' },
      { department_id: '2', department_name: 'Кафедра математики' },
      { department_id: '3', department_name: 'Кафедра фізики' }
    ];
    renderFilterDropdown('department', mockDepartments, 'Кафедра', 'department_id', 'department_name');
  }
}

async function loadPositions() {
  try {
    const response = await fetch('http://localhost:3000/api/positions');
    if (!response.ok) {
      const mockPositions = [
        { position_id: '1', position_name: 'Професор' },
        { position_id: '2', position_name: 'Доцент' },
        { position_id: '3', position_name: 'Старший викладач' },
        { position_id: '4', position_name: 'Асистент' }
      ];
      renderFilterDropdown('position', mockPositions, 'Посада', 'position_id', 'position_name');
      return;
    }
    const positions = await response.json();
    renderFilterDropdown('position', positions, 'Посада', 'position_id', 'position_name');
  } catch (error) {
    console.error('Помилка завантаження списку посад:', error);
    const mockPositions = [
      { position_id: '1', position_name: 'Професор' },
      { position_id: '2', position_name: 'Доцент' },
      { position_id: '3', position_name: 'Старший викладач' },
      { position_id: '4', position_name: 'Асистент' }
    ];
    renderFilterDropdown('position', mockPositions, 'Посада', 'position_id', 'position_name');
  }
}

async function loadSpecializations() {
  try {
    const response = await fetch('http://localhost:3000/api/specializations');
    if (!response.ok) {
      const mockSpecializations = [
        { specialization_id: '1', specialization_name: 'Інформаційні технології' },
        { specialization_id: '2', specialization_name: 'Штучний інтелект' },
        { specialization_id: '3', specialization_name: 'Комп\'ютерні мережі' },
        { specialization_id: '4', specialization_name: 'Програмна інженерія' }
      ];
      renderFilterDropdown('specialization', mockSpecializations, 'Спеціалізація', 'specialization_id', 'specialization_name');
      return;
    }
    const specializations = await response.json();
    renderFilterDropdown('specialization', specializations, 'Спеціалізація', 'specialization_id', 'specialization_name');
  } catch (error) {
    console.error('Помилка завантаження списку спеціалізацій:', error);
    const mockSpecializations = [
      { specialization_id: '1', specialization_name: 'Інформаційні технології' },
      { specialization_id: '2', specialization_name: 'Штучний інтелект' },
      { specialization_id: '3', specialization_name: 'Комп\'ютерні мережі' },
      { specialization_id: '4', specialization_name: 'Програмна інженерія' }
    ];
    renderFilterDropdown('specialization', mockSpecializations, 'Спеціалізація', 'specialization_id', 'specialization_name');
  }
}

function loadStatuses() {
  const statuses = [
    { status_id: 'active', status_name: 'Активний' },
    { status_id: 'vacation', status_name: 'У відпустці' },
    { status_id: 'busy', status_name: 'Зайнятий' },
    { status_id: 'available', status_name: 'Доступний для керівництва' }
  ];
  
  renderFilterDropdown('status', statuses, 'Статус', 'status_id', 'status_name');
}

function setupSortingOptions() {
  const sortOptions = [
    { id: 'name_asc', name: 'Ім\'я (А-Я)' },
    { id: 'name_desc', name: 'Ім\'я (Я-А)' },
    { id: 'department_asc', name: 'Кафедра (А-Я)' },
    { id: 'department_desc', name: 'Кафедра (Я-А)' },
    { id: 'position_asc', name: 'Посада (А-Я)' },
    { id: 'position_desc', name: 'Посада (Я-А)' }
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
    case 'department':
      currentDepartmentFilter = filterId;
      break;
    case 'position':
      currentPositionFilter = filterId;
      break;
    case 'specialization':
      currentSpecializationFilter = filterId;
      break;
    case 'status':
      currentStatusFilter = filterId;
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
    filterSupervisorsServerSide(searchQuery);
  } else {
    filterSupervisorsClientSide(searchQuery);
  }
}

function hasServerSideFiltering() {
  return true;
}

async function filterSupervisorsServerSide(searchQuery) {
  try {
    let url = 'http://localhost:3000/api/supervisors/filter?';
    
    if (searchQuery) {
      url += `q=${encodeURIComponent(searchQuery)}`;
    }
    
    if (currentDepartmentFilter) {
      url += `${url.endsWith('?') ? '' : '&'}department_id=${encodeURIComponent(currentDepartmentFilter)}`;
    }
    
    if (currentPositionFilter) {
      url += `${url.endsWith('?') ? '' : '&'}position_id=${encodeURIComponent(currentPositionFilter)}`;
    }
    
    if (currentSpecializationFilter) {
      url += `${url.endsWith('?') ? '' : '&'}specialization_id=${encodeURIComponent(currentSpecializationFilter)}`;
    }
    
    if (currentStatusFilter) {
      url += `${url.endsWith('?') ? '' : '&'}status=${encodeURIComponent(currentStatusFilter)}`;
    }
    
    if (currentSortOption && currentSortDirection) {
      url += `${url.endsWith('?') ? '' : '&'}sort_by=${encodeURIComponent(currentSortOption)}&sort_direction=${encodeURIComponent(currentSortDirection)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    let supervisors = await response.json();
    
    if (currentSortOption && !url.includes('sort_by')) {
      supervisors = sortSupervisors(supervisors);
    }
    
    renderSupervisors(supervisors);
  } catch (error) {
    console.error('Помилка фільтрації викладачів:', error);
    filterSupervisorsClientSide(searchQuery);
  }
}

async function filterSupervisorsClientSide(searchQuery) {
  try {
    const response = await fetch('http://localhost:3000/api/supervisors');
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    let supervisors = await response.json();
    
    if (searchQuery) {
      supervisors = supervisors.filter(supervisor => 
        Object.values(supervisor).some(value => 
          value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    if (currentDepartmentFilter) {
      supervisors = supervisors.filter(supervisor => supervisor.department == currentDepartmentFilter);
    }
    
    if (currentPositionFilter) {
      supervisors = supervisors.filter(supervisor => supervisor.position == currentPositionFilter);
    }
    
    if (currentSpecializationFilter) {
      supervisors = supervisors.filter(supervisor => supervisor.specialization == currentSpecializationFilter);
    }
    
    if (currentStatusFilter) {
      supervisors = supervisors.filter(supervisor => supervisor.teacher_status == currentStatusFilter);
    }
    
    if (currentSortOption) {
      supervisors = sortSupervisors(supervisors);
    }
    
    renderSupervisors(supervisors);
  } catch (error) {
    console.error('Помилка фільтрації викладачів на клієнті:', error);
  }
}

function sortSupervisors(supervisors) {
  if (!currentSortOption) {
    return supervisors;
  }
  
  const sortedSupervisors = [...supervisors];
  
  switch (currentSortOption) {
    case 'name':
      sortedSupervisors.sort((a, b) => {
        const nameA = a.full_name || '';
        const nameB = b.full_name || '';
        return currentSortDirection === 'asc' ? 
          nameA.localeCompare(nameB, 'uk') : 
          nameB.localeCompare(nameA, 'uk');
      });
      break;
    case 'department':
      sortedSupervisors.sort((a, b) => {
        const departmentA = a.department || '';
        const departmentB = b.department || '';
        return currentSortDirection === 'asc' ? 
          departmentA.localeCompare(departmentB, 'uk') : 
          departmentB.localeCompare(departmentA, 'uk');
      });
      break;
    case 'position':
      sortedSupervisors.sort((a, b) => {
        const positionA = a.position || '';
        const positionB = b.position || '';
        return currentSortDirection === 'asc' ? 
          positionA.localeCompare(positionB, 'uk') : 
          positionB.localeCompare(positionA, 'uk');
      });
      break;
  }
  
  return sortedSupervisors;
}

async function loadSupervisors() {
  try {
    const response = await fetch('http://localhost:3000/api/supervisors');
    if (!response.ok) {
      throw new Error(`Помилка сервера: ${response.status}`);
    }
    const supervisors = await response.json();
    renderSupervisors(supervisors);
  } catch (error) {
    console.error('Помилка завантаження викладачів:', error);
  }
}

function renderSupervisors(supervisors) {
  const teachersGrid = document.querySelector('.teachers-grid');
  teachersGrid.innerHTML = '';

  if (supervisors.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('empty-results');
    emptyMessage.innerHTML = `
      <img src="icons/no-result.png" alt="Немає результатів" class="no-results-icon">
      <p class="card-main-text">Викладачів за вказаними критеріями не знайдено</p>
    `;
    teachersGrid.appendChild(emptyMessage);
    return;
  }

  supervisors.forEach(supervisor => {
    const initials = supervisor.full_name.split(' ')
                        .map(name => name.charAt(0))
                        .join('');

    const card = document.createElement('div');
    card.classList.add('teacher-card');
    card.innerHTML = `
      <div class="teacher-header">
        <div class="teacher-avatar-large large-card-text">${initials}</div>
        <div class="teacher-details">
          <h4 class="teacher-name-large large-card-text">${supervisor.full_name || 'Невідомо'}</h4>
          <span class="status-badge status-active large-card-text">${supervisor.teacher_status || 'Активний'}</span>
        </div>
      </div>
      <div class="teacher-meta">
        <div class="meta-item">
          <span class="meta-label large-card-text">ID</span>
          <span class="meta-value card-main-text">${supervisor.supervisor_id}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Пошта</span>
          <span class="meta-value card-main-text">${supervisor.email || '—'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Телефон</span>
          <span class="meta-value card-main-text">${supervisor.phone || '—'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Кафедра</span>
          <span class="meta-value card-main-text">${supervisor.department || '—'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Посада</span>
          <span class="meta-value card-main-text">${supervisor.position || '—'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label large-card-text">Спеціалізація</span>
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
    teachersGrid.appendChild(card);
  });
}
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
  initializeSupervisorDetailsModal();

  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        applyFilters(query);
    });
  }

  document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', function() {
      if (!this.classList.contains('dropdown-filter')) {
        if (!this.classList.contains('active')) {
            document.querySelectorAll('.filter-button:not(.dropdown-filter)').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            const filterType = this.getAttribute('data-filter');
            handleFilterClick(filterType);
        }
      }
    });
  });
  
  const filterToggleButton = document.querySelector('.filter-toggle-button');
  if(filterToggleButton){
    filterToggleButton.addEventListener('click', () => {
        const filtersSection = document.querySelector('.filters-section');
        if(filtersSection) filtersSection.classList.toggle('visible');
    });
  }
});

function handleFilterClick(filterType) {
  const searchQueryInput = document.querySelector('.search-input');
  const searchQuery = searchQueryInput ? searchQueryInput.value.trim() : '';
  applyFilters(searchQuery);
}

async function loadDepartments() {
  try {
    const response = await fetch('http://localhost:3000/api/departments');
    if (!response.ok) {
      const mockDepartments = [
        { id: 'IT кафедра (mock)', name: 'IT кафедра (mock)' },
        { id: 'Кафедра математики (mock)', name: 'Кафедра математики (mock)' }
      ];
      console.warn(`Server error fetching departments: ${response.status}. Using mock data.`);
      renderFilterDropdown('department', mockDepartments, 'Кафедра', 'id', 'name');
      return;
    }
    const departments = await response.json();
    renderFilterDropdown('department', departments, 'Кафедра', 'id', 'name');
  } catch (error) {
    console.error('Помилка завантаження списку кафедр:', error);
    const mockDepartments = [ { id: 'IT кафедра (error mock)', name: 'IT кафедра (error mock)' }];
    renderFilterDropdown('department', mockDepartments, 'Кафедра', 'id', 'name');
  }
}

async function loadPositions() {
  try {
    const response = await fetch('http://localhost:3000/api/positions');
    if (!response.ok) {
      const mockPositions = [
        { id: 'Професор (mock)', name: 'Професор (mock)' },
        { id: 'Доцент (mock)', name: 'Доцент (mock)' }
      ];
      console.warn(`Server error fetching positions: ${response.status}. Using mock data.`);
      renderFilterDropdown('position', mockPositions, 'Посада', 'id', 'name');
      return;
    }
    const positions = await response.json();
    renderFilterDropdown('position', positions, 'Посада', 'id', 'name');
  } catch (error) {
    console.error('Помилка завантаження списку посад:', error);
    const mockPositions = [ { id: 'Професор (error mock)', name: 'Професор (error mock)' }];
    renderFilterDropdown('position', mockPositions, 'Посада', 'id', 'name');
  }
}

async function loadSpecializations() {
  try {
    const response = await fetch('http://localhost:3000/api/specializations');
    if (!response.ok) {
      const mockSpecializations = [
        { id: 'Інформаційні технології (mock)', name: 'Інформаційні технології (mock)' },
        { id: 'Штучний інтелект (mock)', name: 'Штучний інтелект (mock)' }
      ];
      console.warn(`Server error fetching specializations: ${response.status}. Using mock data.`);
      renderFilterDropdown('specialization', mockSpecializations, 'Спеціалізація', 'id', 'name');
      return;
    }
    const specializations = await response.json();
    renderFilterDropdown('specialization', specializations, 'Спеціалізація', 'id', 'name');
  } catch (error) {
    console.error('Помилка завантаження списку спеціалізацій:', error);
    const mockSpecializations = [ { id: 'Інформаційні технології (error mock)', name: 'Інформаційні технології (error mock)' }];
    renderFilterDropdown('specialization', mockSpecializations, 'Спеціалізація', 'id', 'name');
  }
}

async function loadStatuses() {
  try {
    const response = await fetch('http://localhost:3000/api/statuses');
     if (!response.ok) {
      const mockStatuses = [
        { id: 'Доступний (mock)', name: 'Доступний (mock)' },
        { id: 'У відпустці (mock)', name: 'У відпустці (mock)' }
      ];
      console.warn(`Server error fetching statuses: ${response.status}. Using mock data.`);
      renderFilterDropdown('status', mockStatuses, 'Статус', 'id', 'name');
      return;
    }
    const statuses = await response.json(); 
    renderFilterDropdown('status', statuses, 'Статус', 'id', 'name');
  } catch (error) {
    console.error('Помилка завантаження списку статусів:', error);
     const mockStatuses = [ { id: 'Доступний (error mock)', name: 'Доступний (error mock)' }];
    renderFilterDropdown('status', mockStatuses, 'Статус', 'id', 'name');
  }
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
  dropdownButton.classList.add('filter-button-dropdown', 'dropdown-filter');
  dropdownButton.innerHTML = `<i class="fa fa-filter" class="card-main-text"></i> <span class="card-main-text">${title}</span> <i class="fa fa-chevron-down ml-2" class="card-main-text"></i>`;
  
  const dropdownContent = document.createElement('div');
  dropdownContent.classList.add('dropdown-content');
  
  const allOption = document.createElement('div');
  allOption.classList.add('dropdown-item', 'card-main-text', 'active');
  allOption.setAttribute('data-filter-type', filterType);
  allOption.setAttribute('data-filter-id', '');
  allOption.textContent = `Всі`;
  allOption.addEventListener('click', () => {
    selectFilter(allOption, filterType, '');
    const spanElement = dropdownButton.querySelector('span');
    if (spanElement) spanElement.textContent = title;
    closeAllDropdowns();
  });
  dropdownContent.appendChild(allOption);

  if (items && items.length > 0) {
    items.forEach(item => {
      const filterOption = document.createElement('div');
      filterOption.classList.add('dropdown-item', 'card-main-text');
      filterOption.setAttribute('data-filter-type', filterType);
      const itemId = item[idField];
      const itemName = item[nameField];

      if (itemId === undefined || itemName === undefined) {
        return; 
      }
      filterOption.setAttribute('data-filter-id', itemId);
      filterOption.textContent = itemName;
      filterOption.addEventListener('click', () => {
        selectFilter(filterOption, filterType, itemId);
        const spanElement = dropdownButton.querySelector('span');
        if (spanElement) spanElement.textContent = `${title}: ${itemName}`;
        closeAllDropdowns();
      });
      dropdownContent.appendChild(filterOption);
    });
  } else {
    const noItemsOption = document.createElement('div');
    noItemsOption.classList.add('dropdown-item', 'card-main-text', 'disabled');
    noItemsOption.textContent = 'Немає варіантів';
    dropdownContent.appendChild(noItemsOption);
  }
  
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
document.addEventListener('click', closeAllDropdowns);

function renderSortOptions(sortOptions) {
  const filterContainer = document.querySelector('.filter-container');
  if (!filterContainer) return;
  
  const dropdownButton = document.createElement('div');
  dropdownButton.classList.add('filter-button-dropdown', 'dropdown-filter');
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
      dropdownButton.querySelector('span').textContent = `Сортування: ${option.name}`;
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

function selectFilter(filterOptionElement, filterType, filterId) {
  document.querySelectorAll(`.dropdown-item[data-filter-type="${filterType}"]`).forEach(option => {
    option.classList.remove('active');
  });
  if(filterOptionElement) filterOptionElement.classList.add('active');
  
  switch (filterType) {
    case 'department': currentDepartmentFilter = filterId; break;
    case 'position': currentPositionFilter = filterId; break;
    case 'specialization': currentSpecializationFilter = filterId; break;
    case 'status': currentStatusFilter = filterId; break;
  }
  const searchInput = document.querySelector('.search-input');
  const searchQuery = searchInput ? searchInput.value.trim() : '';
  applyFilters(searchQuery);
}

function selectSortOption(sortOptionElement, sortId) {
  document.querySelectorAll('.dropdown-item[data-sort-id]').forEach(option => {
    option.classList.remove('active');
  });
  if(sortOptionElement) sortOptionElement.classList.add('active');
  
  const [field, direction] = sortId.split('_');
  currentSortOption = field;
  currentSortDirection = direction;
  
  const searchInput = document.querySelector('.search-input');
  const searchQuery = searchInput ? searchInput.value.trim() : '';
  applyFilters(searchQuery);
}

function applyFilters(searchQuery) {
  filterSupervisorsServerSide(searchQuery);
}

async function filterSupervisorsServerSide(searchQuery) {
  try {
    let url = 'http://localhost:3000/api/supervisors/filter?';
    const params = new URLSearchParams();

    if (searchQuery) params.append('q', searchQuery);
    if (currentDepartmentFilter) params.append('department_id', currentDepartmentFilter);
    if (currentPositionFilter) params.append('position_id', currentPositionFilter);
    if (currentSpecializationFilter) params.append('specialization_id', currentSpecializationFilter);
    if (currentStatusFilter) params.append('status', currentStatusFilter);
    if (currentSortOption && currentSortDirection) {
      params.append('sort_by', currentSortOption);
      params.append('sort_direction', currentSortDirection);
    }
    const queryString = params.toString();
    if (queryString) url += queryString;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Помилка сервера: ${response.status}`);
    let supervisors = await response.json();
    renderSupervisors(supervisors);
  } catch (error) {
    console.error('Помилка фільтрації викладачів:', error);
    const teachersGrid = document.querySelector('.teachers-grid');
    if(teachersGrid) teachersGrid.innerHTML = `<p class="card-main-text error-message">Не вдалося завантажити дані викладачів. Спробуйте пізніше.</p>`;
  }
}

async function loadSupervisors() {
  applyFilters('');
}

function renderSupervisors(supervisors) {
  const teachersGrid = document.querySelector('.teachers-grid');
  if(!teachersGrid) return;
  teachersGrid.innerHTML = '';

  if (!supervisors || supervisors.length === 0) {
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
    const initials = (supervisor.full_name || 'N A').split(' ')
                        .map(name => name.charAt(0).toUpperCase())
                        .join('');

    const card = document.createElement('div');
    card.classList.add('teacher-card', 'card');
    card.innerHTML = `
      <div class="teacher-header">
        <div class="teacher-avatar-large large-card-text">${initials}</div>
        <div class="teacher-details">
          <h4 class="teacher-name-large large-card-text">${supervisor.full_name || 'Невідомо'}</h4>
          <span class="status-badge large-card-text ${supervisor.teacher_status ? 'status-active' : 'status-inactive'}">${supervisor.teacher_status || '—'}</span>
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
        <button class="action-button view-supervisor-details-btn" data-supervisor-id="${supervisor.supervisor_id}" title="Детальніше">
          <i class="fa fa-eye" class="card-main-text"></i>
        </button>
        <button class="action-button" title="Обрати керівником (недоступно)">
          <i class="fa fa-user-plus" class="card-main-text" style="opacity:0.7;"></i>
        </button>
        <button class="action-button" title="Написати повідомлення (недоступно)">
          <i class="fa fa-comment" class="card-main-text" style="opacity:0.7;"></i>
        </button>
      </div>
    `;
    teachersGrid.appendChild(card);

    const viewDetailsButton = card.querySelector('.view-supervisor-details-btn');
    if (viewDetailsButton) {
        viewDetailsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            showSupervisorDetails(supervisor.supervisor_id);
        });
    }
  });
}

function initializeSupervisorDetailsModal() {
    const modalHtml = `
        <div id="supervisorDetailsModal" class="modal" style="display:none;">
          <div class="modal-content card">
            <span class="close-button card-main-text" id="closeSupervisorModalBtn" title="Закрити">&times;</span>
            <h3 id="modalSupervisorName" class="card-title" style="margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-border);">Деталі Викладача</h3>
            <div class="supervisor-modal-body" style="display: flex; flex-direction: column; gap: 0.75rem;">

              <div class="modal-section">
                <p class="card-main-text" style="margin-bottom: 0.5rem;"><strong>Email:</strong> <span id="modalSupervisorEmail" class="card-main-text"></span></p>
                <p class="card-main-text" style="margin-bottom: 0.5rem;"><strong>Телефон:</strong> <span id="modalSupervisorPhone" class="card-main-text"></span></p>
                <p class="card-main-text" style="margin-bottom: 0.5rem;"><strong>Кафедра:</strong> <span id="modalSupervisorDepartment" class="card-main-text"></span></p>
                <p class="card-main-text" style="margin-bottom: 0.5rem;"><strong>Посада:</strong> <span id="modalSupervisorPosition" class="card-main-text"></span></p>
                <p class="card-main-text" style="margin-bottom: 0.5rem;"><strong>Спеціалізація:</strong> <span id="modalSupervisorSpecialization" class="card-main-text"></span></p>
                <p class="card-main-text"><strong>Статус:</strong> <span id="modalSupervisorStatus" class="card-main-text"></span></p>
              </div>

              <hr style="border: none; border-top: 1px solid var(--color-border); margin: 0.75rem 0;">

              <div class="modal-section">
                <h4 class="card-subtitle" style="margin-top:0; margin-bottom: 0.5rem;">Навантаження</h4>
                <p class="card-main-text"><strong>Робіт на перевірці:</strong> <span id="modalPendingReviewCount" class="card-main-text">0</span></p>
              </div>

              <hr style="border: none; border-top: 1px solid var(--color-border); margin: 0.75rem 0;">

              <div class="modal-section">
                <h4 class="card-subtitle" style="margin-top:0; margin-bottom: 0.5rem;">Прикріплені студенти</h4>
                <ul id="modalAssignedStudentsList" class="card-main-text" style="list-style-position: inside; padding-left: 0; margin-top: 0; max-height: 150px; overflow-y: auto;">
                </ul>
              </div>
            </div>
          </div>
        </div>
    `;
    if(!document.getElementById('supervisorDetailsModal')){
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
    
    const modal = document.getElementById('supervisorDetailsModal');
    const closeButton = document.getElementById('closeSupervisorModalBtn');

    if (closeButton) {
        closeButton.onclick = () => {
            if(modal) modal.style.display = 'none';
        };
    }
    if (modal) {
        modal.addEventListener('click', (event) => {
             if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

async function showSupervisorDetails(supervisorId) {
    try {
        const response = await fetch(`http://localhost:3000/api/supervisors/${supervisorId}/dashboard-data`);
        if (!response.ok) {
            throw new Error(`Помилка завантаження даних: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.details) {
            populateAndShowSupervisorModal(data.details);
        } else {
            console.error('Не вдалося отримати деталі викладача:', data.error || 'Відповідь не успішна або відсутні деталі');
            alert('Не вдалося завантажити деталі викладача.');
        }
    } catch (error) {
        console.error('Помилка при запиті деталей викладача:', error);
        alert('Помилка при запиті деталей викладача.');
    }
}

function populateAndShowSupervisorModal(details) {
    const { supervisor, assignedStudents, pendingReviewCount } = details;
    const modal = document.getElementById('supervisorDetailsModal');
    if (!modal) return;

    const modalSupervisorName = document.getElementById('modalSupervisorName');
    const modalSupervisorEmail = document.getElementById('modalSupervisorEmail');
    const modalSupervisorPhone = document.getElementById('modalSupervisorPhone');
    const modalSupervisorDepartment = document.getElementById('modalSupervisorDepartment');
    const modalSupervisorPosition = document.getElementById('modalSupervisorPosition');
    const modalSupervisorSpecialization = document.getElementById('modalSupervisorSpecialization');
    const modalSupervisorStatus = document.getElementById('modalSupervisorStatus');
    const modalPendingReviewCount = document.getElementById('modalPendingReviewCount');
    const studentsList = document.getElementById('modalAssignedStudentsList');

    if(modalSupervisorName) modalSupervisorName.textContent = supervisor.full_name || 'Деталі Викладача';
    if(modalSupervisorEmail) modalSupervisorEmail.textContent = supervisor.email || '—';
    if(modalSupervisorPhone) modalSupervisorPhone.textContent = supervisor.phone || '—';
    if(modalSupervisorDepartment) modalSupervisorDepartment.textContent = supervisor.department || '—';
    if(modalSupervisorPosition) modalSupervisorPosition.textContent = supervisor.position || '—';
    if(modalSupervisorSpecialization) modalSupervisorSpecialization.textContent = supervisor.specialization || '—';
    if(modalSupervisorStatus) modalSupervisorStatus.textContent = supervisor.teacher_status || '—';
    if(modalPendingReviewCount) modalPendingReviewCount.textContent = pendingReviewCount || 0;

    if (studentsList) {
        studentsList.innerHTML = '';
        if (assignedStudents && assignedStudents.length > 0) {
            assignedStudents.forEach(student => {
                const li = document.createElement('li');
                li.style.marginBottom = '0.25rem';
                li.textContent = `${student.full_name} (${student.email || 'email не вказано'})`;
                studentsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Немає прикріплених студентів.';
            studentsList.appendChild(li);
        }
    }
    modal.style.display = 'flex';
}
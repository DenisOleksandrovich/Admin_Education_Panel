let documentLinks = [];
let allAvailableSupervisors_create = [];
let currentCoauthorIds_create = new Set();
let designatedMainAuthorId_create = null; // Нова змінна
let coauthorsContainer_create;
let coauthorSelect_create;

function setupDocumentLinks() {
  const addBtn = document.getElementById('addDocumentLink');
  const input = document.getElementById('newDocumentLink');
  const list = document.getElementById('documentLinksList');

  addBtn.addEventListener('click', () => addDocumentLink());
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDocumentLink();
    }
  });

  function addDocumentLink() {
    const link = input.value.trim();
    if (link) {
      try {
          new URL(link);
          documentLinks.push(link);
          renderDocumentLinks();
          input.value = '';
      } catch (e) {
          alert('Будь ласка, введіть дійсне посилання (URL).');
      }
    } else {
        alert('Поле посилання не може бути порожнім.');
    }
  }

  function renderDocumentLinks() {
    list.innerHTML = '';
    documentLinks.forEach((link, index) => {
      const linkItem = document.createElement('div');
      linkItem.className = 'document-link-item';
      const marker = document.createElement('span');
      marker.className = 'document-link-marker';
      marker.innerHTML = '&#9670;';
      linkItem.appendChild(marker);
      const linkText = document.createElement('a');
      linkText.className = 'document-link-text card-main-text';
      linkText.textContent = link;
      linkText.href = link;
      linkText.target = "_blank";
      linkItem.appendChild(linkText);
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'document-link-actions';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'document-link-button edit';
      editBtn.innerHTML = '✎';
      editBtn.title = 'Редагувати';
      editBtn.onclick = () => editDocumentLink(index);
      actionsDiv.appendChild(editBtn);
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'document-link-button delete';
      deleteBtn.innerHTML = '−';
      deleteBtn.title = 'Видалити';
      deleteBtn.onclick = () => deleteDocumentLink(index);
      actionsDiv.appendChild(deleteBtn);
      linkItem.appendChild(actionsDiv);
      list.appendChild(linkItem);
    });
  }

  function editDocumentLink(index) {
    const newLink = prompt('Відредагуйте посилання:', documentLinks[index]);
    if (newLink !== null) {
        if (newLink.trim()){
            try {
                new URL(newLink.trim());
                documentLinks[index] = newLink.trim();
            } catch (e) {
                 alert('Будь ласка, введіть дійсне посилання (URL) або залиште порожнім для видалення.');
                 return;
            }
        } else {
             documentLinks.splice(index, 1);
        }
        renderDocumentLinks();
    }
  }

  function deleteDocumentLink(index) {
    if (confirm('Ви впевнені, що хочете видалити це посилання?')) {
      documentLinks.splice(index, 1);
      renderDocumentLinks();
    }
  }
}

async function fetchAndRenderSupervisors_create() {
    if (!coauthorSelect_create) return;
    const { getAuthHeaders, getUserInfo } = await import('./authUtils.js');
    try {
        const response = await fetch('http://localhost:3000/api/supervisors', { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allAvailableSupervisors_create = await response.json();
        
        coauthorSelect_create.innerHTML = '<option value="">Виберіть співавтора...</option>';
        const currentUser = await getUserInfo();
        const currentUserId = currentUser ? (currentUser.role === 'supervisor' ? currentUser.userId : (currentUser.role === 'admin' ? currentUser.accountId : null)) : null;


        allAvailableSupervisors_create.forEach(supervisor => {
            if (supervisor.supervisor_id !== currentUserId) { 
                const option = document.createElement('option');
                option.value = supervisor.supervisor_id;
                option.textContent = supervisor.full_name;
                coauthorSelect_create.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Помилка завантаження співавторів:', error);
        coauthorSelect_create.innerHTML = '<option value="">Помилка завантаження</option>';
    }
}

function renderCoauthors_create() {
    if (!coauthorsContainer_create) return;
    coauthorsContainer_create.innerHTML = '';
    currentCoauthorIds_create.forEach(id => {
        const supervisor = allAvailableSupervisors_create.find(s => s.supervisor_id === id);
        if (supervisor) {
            const coauthorTag = document.createElement('span');
            coauthorTag.className = 'coauthor-tag card-main-text';
            
            const starIcon = document.createElement('i');
            starIcon.className = 'fas fa-star coauthor-main-star';
            starIcon.style.color = 'var(--primary-color)';
            starIcon.style.marginRight = '5px';
            starIcon.style.display = (designatedMainAuthorId_create === id) ? 'inline-block' : 'none';
            coauthorTag.appendChild(starIcon);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = supervisor.full_name;
            coauthorTag.appendChild(nameSpan);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-coauthor-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.dataset.coauthorId = id;
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeCoauthor_create(id);
            };
            coauthorTag.appendChild(removeBtn);

            coauthorTag.addEventListener('dblclick', () => {
                if (designatedMainAuthorId_create === id) {
                    designatedMainAuthorId_create = null; 
                } else {
                    designatedMainAuthorId_create = id;
                }
                renderCoauthors_create();
            });
            coauthorsContainer_create.appendChild(coauthorTag);
        }
    });
}

function handleAddCoauthor_create(event) {
    const selectedId = parseInt(event.target.value, 10);
    if (!isNaN(selectedId) && !currentCoauthorIds_create.has(selectedId)) {
        currentCoauthorIds_create.add(selectedId);
        renderCoauthors_create();
    }
    event.target.value = '';
}

function removeCoauthor_create(coauthorId) {
    currentCoauthorIds_create.delete(coauthorId);
    if (designatedMainAuthorId_create === coauthorId) {
        designatedMainAuthorId_create = null;
    }
    renderCoauthors_create();
}

document.addEventListener('DOMContentLoaded', () => {
  renderNewTaskForm();
});

function renderNewTaskForm() {
  const html = `
    <div class="new-task-overlay" id="newTaskFormOverlay" style="display: none;">
      <div class="new-task-form">
        <div class="new-task-header">
          <h3 class="new-task-title card-title" id="newTaskTitle"> 📝 Нове завдання</h3>
          <button class="new-task-close" id="closeNewTaskForm">&times;</button>
        </div>
        <form id="newTaskForm">
          <input type="hidden" id="taskId" value="">
          <div class="new-task-group">
            <label for="taskTitle" class="new-task-label large-card-text">Назва завдання</label>
            <input type="text" id="taskTitle" class="new-task-input card-main-text" required>
          </div>
          <div class="new-task-group">
            <label for="taskDescription" class="new-task-label large-card-text">Опис завдання</label>
            <textarea id="taskDescription" class="new-task-input new-task-textarea card-main-text" required></textarea>
          </div>
          <div class="new-task-group">
            <label for="taskDeadline" class="new-task-label large-card-text">Дедлайн</label>
            <input type="datetime-local" id="taskDeadline" class="new-task-input card-main-text" required>
          </div>
          <div class="new-task-group">
            <label class="new-task-label large-card-text">Призначити групам</label>
            <div id="groupSelectionContainer" class="group-selection-grid card-main-text"></div>
            <div id="selectedGroupsDisplay" class="selected-groups-display card-main-text"></div>
          </div>
          <div class="new-task-group">
            <label for="newTaskCoauthorSelect" class="new-task-label large-card-text">Додати співавтора:</label>
            <select id="newTaskCoauthorSelect" class="new-task-input card-main-text">
                <option value="">Виберіть співавтора...</option>
            </select>
            <div id="newTaskCoauthorsContainer" class="coauthors-container card-main-text" style="margin-top:10px;"></div>
          </div>
          <div class="new-task-group">
            <label for="taskType" class="new-task-label large-card-text">Тип завдання</label>
            <select id="taskType" class="new-task-input card-main-text">
              <option class="card-main-text" value="theory">Теоретичне</option>
              <option class="card-main-text" value="practice">Практичне</option>
              <option class="card-main-text" value="report">Звітне</option>
              <option class="card-main-text" value="diploma">Дипломна робота</option>
              <option class="card-main-text" value="presentation">Презентація</option>
              <option class="card-main-text" value="other">Інше</option>
            </select>
          </div>
          <div class="new-task-group">
            <label class="new-task-label large-card-text">Посилання на документи до завдання</label>
            <div class="document-input-container">
              <input type="url" id="newDocumentLink" placeholder="Вставте посилання" class="new-task-input card-main-text">
              <button type="button" id="addDocumentLink" class="btn btn-primary btn-sm card-main-text"> + </button>
            </div>
            <div id="documentLinksList" class="document-links-container"></div>
          </div>
          <div class="new-task-group">
            <label class="new-task-label large-card-text">Параметри здачі роботи</label>
            <div class="new-task-submission-options">
              <div class="new-task-checkbox-group">
                <input type="checkbox" id="allowTextSubmission" checked>
                <label for="allowTextSubmission" class="card-main-text">Дозволити здачу текстом</label>
              </div>
              <div class="new-task-checkbox-group">
                <input type="checkbox" id="allowFileSubmission" checked>
                <label for="allowFileSubmission" class="card-main-text">Дозволити здачу файлами</label>
              </div>
              <div class="new-task-file-types" id="newAllowedFileTypesContainer">
                <label class="legal_type large-card-text">Дозволені типи файлів:</label>
                <div class="new-task-file-type-options">
                  <div class="new-task-checkbox-group">
                    <input type="checkbox" id="allowPdf" checked class="card-main-text">
                    <label for="allowPdf" class="card-main-text">PDF</label>
                  </div>
                  <div class="new-task-checkbox-group">
                    <input type="checkbox" id="allowDoc" checked class="card-main-text">
                    <label for="allowDoc" class="card-main-text">DOC/DOCX</label>
                  </div>
                  <div class="new-task-checkbox-group">
                    <input type="checkbox" id="allowZip" checked class="card-main-text">
                    <label for="allowZip" class="card-main-text">ZIP</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="new-task-actions">
            <button type="button" class="btn btn-secondary card-main-text" id="cancelNewTaskForm">Скасувати</button>
            <button type="submit" class="btn btn-primary card-main-text">Зберегти</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container.firstElementChild);

  coauthorsContainer_create = document.getElementById('newTaskCoauthorsContainer');
  coauthorSelect_create = document.getElementById('newTaskCoauthorSelect');
  if(coauthorSelect_create) coauthorSelect_create.addEventListener('change', handleAddCoauthor_create);


  loadStudyGroups();
  setupDocumentLinks();
  fetchAndRenderSupervisors_create();
  setupFormSubmission();
  initTaskForm();
}

function initTaskForm() {
  const elements = {
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskFormOverlay: document.getElementById('newTaskFormOverlay'),
    taskForm: document.getElementById('newTaskForm'),
    taskIdInput: document.getElementById('taskId'),
    taskTitleInput: document.getElementById('taskTitle'),
    taskDescriptionInput: document.getElementById('taskDescription'),
    taskDeadlineInput: document.getElementById('taskDeadline'),
    closeTaskFormBtn: document.getElementById('closeNewTaskForm'),
    cancelTaskFormBtn: document.getElementById('cancelNewTaskForm'),
    taskFormTitle: document.getElementById('newTaskTitle'),
    allowFileCheckbox: document.getElementById('allowFileSubmission'),
    fileTypesContainer: document.getElementById('newAllowedFileTypesContainer')
  };

  elements.addTaskBtn?.addEventListener('click', () => {
    resetTaskForm(elements);
    elements.taskFormOverlay.style.display = 'flex';
  });

  elements.closeTaskFormBtn?.addEventListener('click', () => {
    elements.taskFormOverlay.style.display = 'none';
  });

  elements.cancelTaskFormBtn?.addEventListener('click', () => {
    elements.taskFormOverlay.style.display = 'none';
  });
  
  elements.taskFormOverlay.addEventListener('click', (event) => {
    if (event.target === elements.taskFormOverlay) {
        elements.taskFormOverlay.style.display = 'none';
    }
  });

  elements.allowFileCheckbox?.addEventListener('change', () => {
    elements.fileTypesContainer.style.display = elements.allowFileCheckbox.checked ? 'block' : 'none';
  });
  
  const today = new Date();
  const oneHourFromNow = new Date(today.getTime() + 60 * 60 * 1000);
  const currentDate = oneHourFromNow.toISOString().slice(0, 16);
  elements.taskDeadlineInput.value = currentDate;
  elements.taskDeadlineInput.setAttribute('min', currentDate);
}

function resetTaskForm(elements) {
  elements.taskForm.reset();
  elements.taskIdInput.value = '';
  elements.taskFormTitle.textContent = ' 📝 Нове завдання';

  const today = new Date();
  const oneHourFromNow = new Date(today.getTime() + 60 * 60 * 1000);
  const currentDate = oneHourFromNow.toISOString().slice(0, 16);
  elements.taskDeadlineInput.value = currentDate;

  documentLinks = [];
  document.getElementById('documentLinksList').innerHTML = '';
  document.getElementById('newDocumentLink').value = '';

  currentCoauthorIds_create.clear();
  designatedMainAuthorId_create = null;
  if(coauthorsContainer_create) coauthorsContainer_create.innerHTML = '';
  if(coauthorSelect_create) coauthorSelect_create.value = '';

  const groupContainer = document.getElementById('groupSelectionContainer');
  groupContainer.querySelectorAll('.group-button.selected').forEach(btn => btn.classList.remove('selected'));
  const allGroupsBtn = groupContainer.querySelector('.group-button[data-id="all"]');
  if(allGroupsBtn) allGroupsBtn.classList.remove('selected');
  document.getElementById('selectedGroupsDisplay').textContent = 'Нічого не вибрано';

  if (elements.allowFileCheckbox) {
    elements.allowFileCheckbox.checked = true;
    elements.fileTypesContainer.style.display = 'block';
    document.getElementById('allowPdf').checked = true;
    document.getElementById('allowDoc').checked = true;
    document.getElementById('allowZip').checked = true;
  }
  document.getElementById('allowTextSubmission').checked = true;
}

function loadStudyGroups() {
  const container = document.getElementById('groupSelectionContainer');
  const selectedDisplay = document.getElementById('selectedGroupsDisplay');
  const selectedGroups = new Set();

  fetch('http://localhost:3000/api/study-groups')
    .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to load groups: ${res.status}`)))
    .then(groups => {
      container.innerHTML = '';
      const groupButtons = [];
      const allButton = document.createElement('div');
      allButton.className = 'group-button';
      allButton.textContent = 'Всі групи';
      allButton.dataset.id = 'all';
      container.appendChild(allButton);

      allButton.addEventListener('click', () => {
        const isNowSelected = !allButton.classList.contains('selected');
        selectedGroups.clear();
        if (isNowSelected) {
            allButton.classList.add('selected');
            groupButtons.forEach(btn => btn.classList.remove('selected'));
        } else {
            allButton.classList.remove('selected');
        }
        updateDisplay();
      });

      groups.forEach(group => {
        const btn = document.createElement('div');
        btn.className = 'group-button';
        btn.textContent = group.group_name;
        btn.dataset.id = String(group.study_group_id);
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if(allButton.classList.contains('selected')) {
            allButton.classList.remove('selected');
          }
          if (selectedGroups.has(id)) {
            selectedGroups.delete(id);
            btn.classList.remove('selected');
          } else {
            selectedGroups.add(id);
            btn.classList.add('selected');
          }
          updateAllButtonState();
          updateDisplay();
        });
        container.appendChild(btn);
        groupButtons.push(btn);
      });
      
      function updateAllButtonState(){
        if(selectedGroups.size === 0 && !allButton.classList.contains('selected')){
             allButton.classList.add('selected');
        } else if (selectedGroups.size > 0 && allButton.classList.contains('selected')){
             allButton.classList.remove('selected');
        }
      }

      function updateDisplay() {
        if (allButton.classList.contains('selected') && selectedGroups.size === 0) {
            selectedDisplay.textContent = 'Вибрано: Всі групи';
            return;
        }
        const selectedNames = groupButtons
          .filter(btn => selectedGroups.has(btn.dataset.id))
          .map(btn => btn.textContent);
        selectedDisplay.textContent = selectedNames.length
          ? `Вибрано: ${selectedNames.join(', ')}`
          : 'Нічого не вибрано';
        if(selectedNames.length === 0 && !allButton.classList.contains('selected')){
             allButton.classList.add('selected');
             selectedDisplay.textContent = 'Вибрано: Всі групи';
        }
      }
      updateAllButtonState();
      updateDisplay();

      document.getElementById('newTaskForm').addEventListener('submit', () => {
        let input = document.getElementById('hiddenSelectedGroups');
        if (input) input.remove();
        input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'hiddenSelectedGroups';
        input.name = 'selectedGroups';
        if (allButton.classList.contains('selected') && selectedGroups.size === 0) {
            input.value = JSON.stringify([]);
        } else {
            input.value = JSON.stringify(Array.from(selectedGroups));
        }
        document.getElementById('newTaskForm').appendChild(input);
      });
    })
    .catch(err => console.error(err.message || 'Failed to load groups'));
}

function containsMaliciousCode(input) {
  const blacklist = /(<script|<\/script>|<|>|--|;|\/\*|\*\/|drop|select|insert|update|delete|union|alert|onerror|onload)/i;
  return blacklist.test(input);
}

function validateTaskForm() {
  const title = document.getElementById('taskTitle');
  const desc = document.getElementById('taskDescription');
  const deadline = document.getElementById('taskDeadline');
  let valid = true;
  [title, desc, deadline].forEach(field => {
    if (!field.value.trim() || containsMaliciousCode(field.value)) {
      field.classList.add('invalid');
      valid = false;
    } else {
      field.classList.remove('invalid');
    }
  });
  if (!valid) {
    alert("Будь ласка, заповніть поля правильно і без шкідливого коду.");
  }
  return valid;
}

function setupFormSubmission() {
  document.getElementById('newTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateTaskForm()) return;
    const { getAuthHeaders, showNotification: globalShowNotification, getUserInfo } = await import('./authUtils.js');

    const selectedGroupsInput = document.getElementById('hiddenSelectedGroups');
    let groupsToSend;
    if (selectedGroupsInput && selectedGroupsInput.value) {
        groupsToSend = JSON.parse(selectedGroupsInput.value);
    } else {
        const groupContainer = document.getElementById('groupSelectionContainer');
        const allButtonIsSelected = groupContainer.querySelector('.group-button[data-id="all"].selected');
        if (allButtonIsSelected) {
             groupsToSend = [];
        } else {
            const selectedButtons = Array.from(groupContainer.querySelectorAll('.group-button.selected:not([data-id="all"])'));
            groupsToSend = selectedButtons.map(btn => btn.dataset.id);
        }
    }
    
    const currentUser = await getUserInfo();
    if (groupsToSend.length === 0 && !document.getElementById('groupSelectionContainer').querySelector('.group-button[data-id="all"].selected')) {
        if(currentUser && currentUser.role === 'supervisor'){
            globalShowNotification('Викладач повинен обрати хоча б одну групу або "Всі групи".', 'error');
            return;
        }
    }

    const body = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      deadline: document.getElementById('taskDeadline').value,
      groups: groupsToSend,
      coauthors: Array.from(currentCoauthorIds_create),
      designated_author_supervisor_id: designatedMainAuthorId_create,
      taskType: document.getElementById('taskType').value,
      allowText: document.getElementById('allowTextSubmission').checked,
      allowFile: document.getElementById('allowFileSubmission').checked,
      fileTypes: {
        pdf: document.getElementById('allowPdf').checked,
        doc: document.getElementById('allowDoc').checked,
        zip: document.getElementById('allowZip').checked
      },
      attachments: documentLinks
    };

    try {
      const res = await fetch('http://localhost:3000/assignments_create', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json();
      if (res.ok) {
        globalShowNotification('Завдання успішно створено!', 'success');
        document.getElementById('newTaskFormOverlay').style.display = 'none';
         if (typeof window.refreshAssignmentsView === 'function') {
            window.refreshAssignmentsView();
        } else {
             location.reload();
        }
      } else {
        globalShowNotification(result.error || 'Помилка при створенні завдання.', 'error');
      }
    } catch (err) {
      globalShowNotification('Помилка мережі або сервера при створенні завдання.', 'error');
    }
  });
}
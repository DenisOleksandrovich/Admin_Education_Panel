let documentLinks = [];

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
      documentLinks.push(link);
      renderDocumentLinks();
      input.value = '';
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

      const linkText = document.createElement('span');
      linkText.className = 'document-link-text card-main-text';
      linkText.textContent = link;
      linkItem.appendChild(linkText);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'document-link-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'document-link-button edit';
      editBtn.innerHTML = '✎';
      editBtn.title = 'Редагувати';
      editBtn.onclick = () => editDocumentLink(index);
      actionsDiv.appendChild(editBtn);

      const deleteBtn = document.createElement('button');
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
    if (newLink !== null && newLink.trim()) {
      documentLinks[index] = newLink.trim();
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

document.addEventListener('DOMContentLoaded', () => {
  renderNewTaskForm();
});

function renderNewTaskForm() {
  const html = `
    <div class="new-task-overlay" id="newTaskFormOverlay" style="display: none;">
      <div class="new-task-form">
        <div class="new-task-header">
          <h3 class="new-task-title card-title" id="newTaskTitle">Нове завдання</h3>
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
            <input type="date" id="taskDeadline" class="new-task-input card-main-text" required>
          </div>

          <div class="new-task-group">
            <label class="new-task-label large-card-text">Призначити групам</label>
            <div id="groupSelectionContainer" class="group-selection-grid card-main-text"></div>
            <div id="selectedGroupsDisplay" class="selected-groups-display card-main-text"></div>
          </div>

          <div class="new-task-group">
            <label for="taskType" class="new-task-label large-card-text">Тип завдання</label>
            <select id="taskType" class="new-task-input card-main-text">
              <option class="card-main-text" value="theory">Теоретичне</option>
              <option class="card-main-text" value="practice">Практичне</option>
              <option class="card-main-text" value="report">Звітне</option>
            </select>
          </div>

          <div class="new-task-group">
            <label class="new-task-label large-card-text">Посилання на документи до завдання</label>
            <div id="documentLinksList" class="document-links-container"></div>
            <div class="document-input-container">
              <input type="url" id="newDocumentLink" placeholder="Вставте посилання" class="new-task-input card-main-text">
              <button type="button" id="addDocumentLink" class="btn btn-primary btn-sm card-main-text"> + </button>
            </div>
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

  loadStudyGroups();
  setupDocumentLinks();
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
    taskFormTitle: document.getElementById('newTaskTitle')
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

  const today = new Date().toISOString().split('T')[0];
  elements.taskDeadlineInput.setAttribute('min', today);
}

function resetTaskForm(elements) {
  elements.taskForm.reset();
  elements.taskIdInput.value = '';
  elements.taskFormTitle.textContent = 'Нове завдання';

  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  elements.taskDeadlineInput.value = oneWeekFromNow.toISOString().split('T')[0];
  documentLinks = [];
  document.getElementById('documentLinksList').innerHTML = '';
  document.getElementById('newDocumentLink').value = '';
}

function loadStudyGroups() {
  const container = document.getElementById('groupSelectionContainer');
  const selectedDisplay = document.getElementById('selectedGroupsDisplay');
  const selectedGroups = new Set();

  fetch('http://localhost:3000/api/study-groups')
    .then(res => res.json())
    .then(groups => {
      container.innerHTML = '';

      const groupButtons = [];

      // Кнопка "Всі групи"
      const allButton = document.createElement('div');
      allButton.className = 'group-button';
      allButton.textContent = 'Всі групи';
      container.appendChild(allButton);

      allButton.addEventListener('click', () => {
        const allSelected = selectedGroups.size === groups.length;
        selectedGroups.clear();

        if (!allSelected) {
          groups.forEach(g => selectedGroups.add(g.study_group_id));
        }

        updateGroupButtons();
        updateDisplay();
      });

      // Кнопки обычных групп
      groups.forEach(group => {
        const btn = document.createElement('div');
        btn.className = 'group-button';
        btn.textContent = group.group_name;
        btn.dataset.id = group.study_group_id;

        btn.addEventListener('click', () => {
          const id = btn.dataset.id;

          if (selectedGroups.has(id)) {
            selectedGroups.delete(id);
          } else {
            selectedGroups.add(id);
          }

          updateGroupButtons();
          updateDisplay();
        });

        container.appendChild(btn);
        groupButtons.push(btn);
      });

      function updateGroupButtons() {
        // Подсветка обычных групп
        groupButtons.forEach(btn => {
          const id = btn.dataset.id;
          if (selectedGroups.has(id)) {
            btn.classList.add('selected');
          } else {
            btn.classList.remove('selected');
          }
        });

        // Подсветка "Всі групи"
        if (selectedGroups.size === groups.length) {
          allButton.classList.add('selected');
        } else {
          allButton.classList.remove('selected');
        }
      }

      function updateDisplay() {
        if (selectedGroups.size === groups.length) {
          selectedDisplay.textContent = 'Вибрано: Всі групи';
          return;
        }

        const selectedNames = groupButtons
          .filter(btn => selectedGroups.has(btn.dataset.id))
          .map(btn => btn.textContent);

        selectedDisplay.textContent = selectedNames.length
          ? `Вибрано: ${selectedNames.join(', ')}`
          : 'Нічого не вибрано';
      }

      document.getElementById('newTaskForm').addEventListener('submit', () => {
        let input = document.getElementById('hiddenSelectedGroups');
        if (input) input.remove();

        input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'hiddenSelectedGroups';
        input.name = 'selectedGroups';
        input.value = JSON.stringify(Array.from(selectedGroups));
        document.getElementById('newTaskForm').appendChild(input);
      });
    })
    .catch(err => console.error('Failed to load groups', err));
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
      field.classList.add('invalid', 'red-shadow');
      valid = false;
    } else {
      field.classList.remove('invalid', 'red-shadow');
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

    const body = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      deadline: document.getElementById('taskDeadline').value,
      groups: JSON.parse(document.getElementById('hiddenSelectedGroups')?.value || '[]'),
      taskType: document.getElementById('taskType').selectedOptions[0].textContent,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await res.json();
      if (res.ok) {
        alert('Завдання створено!');
        location.reload();
      } else {
        console.error(result.error);
        alert('Помилка при створенні завдання');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  });
}

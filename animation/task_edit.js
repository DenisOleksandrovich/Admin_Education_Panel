import { getAuthHeaders, showNotification, getUserInfo } from './authUtils.js';

const backendUrl = 'http://localhost:3000';
let editModalOverlay;
let editModalForm;
let currentEditingTaskId = null;

let fileTypesContainer;
let allowFileCheckbox;
let allAvailableGroups = [];
let selectedGroupIds = new Set();
let groupsButtonContainer;

let edit_currentDocumentLinks = [];
let edit_documentLinksListElement;
let edit_newDocumentLinkInput;
let edit_addDocumentLinkButton;

let allAvailableSupervisors = [];
let currentCoauthorIds = new Set();
let coauthorsContainer;
let coauthorSelect;

function createEditModalDOM() {
    if (document.getElementById('editTaskModalOverlay')) {
        editModalOverlay = document.getElementById('editTaskModalOverlay');
        editModalForm = document.getElementById('editTaskForm');
        fileTypesContainer = document.getElementById('editTaskFileTypesContainer');
        allowFileCheckbox = document.getElementById('editTaskAllowFile');
        groupsButtonContainer = document.getElementById('editTaskGroupsButtonContainer');
        edit_documentLinksListElement = document.getElementById('edit_documentLinksList');
        edit_newDocumentLinkInput = document.getElementById('edit_newDocumentLink');
        edit_addDocumentLinkButton = document.getElementById('edit_addDocumentLink');
        coauthorsContainer = document.getElementById('editTaskCoauthorsContainer');
        coauthorSelect = document.getElementById('editTaskCoauthorSelect');

        document.getElementById('closeEditTaskModal').removeEventListener('click', closeEditModal);
        document.getElementById('cancelEditTaskBtn').removeEventListener('click', closeEditModal);
        editModalOverlay.removeEventListener('click', handleOverlayClick);
        editModalForm.removeEventListener('submit', handleSaveChanges);
        if(allowFileCheckbox) allowFileCheckbox.removeEventListener('change', toggleFileTypesVisibility);
        if(groupsButtonContainer) groupsButtonContainer.removeEventListener('click', handleGroupButtonClick);
        if(edit_addDocumentLinkButton) edit_addDocumentLinkButton.removeEventListener('click', edit_handleAddDocumentLink);
        if(edit_newDocumentLinkInput) edit_newDocumentLinkInput.removeEventListener('keypress', edit_handleDocumentLinkInputKeypress);
        if(coauthorSelect) coauthorSelect.removeEventListener('change', handleAddCoauthor);


        document.getElementById('closeEditTaskModal').addEventListener('click', closeEditModal);
        document.getElementById('cancelEditTaskBtn').addEventListener('click', closeEditModal);
        editModalOverlay.addEventListener('click', handleOverlayClick);
        editModalForm.addEventListener('submit', handleSaveChanges);
        if(allowFileCheckbox) allowFileCheckbox.addEventListener('change', toggleFileTypesVisibility);
        if(groupsButtonContainer) groupsButtonContainer.addEventListener('click', handleGroupButtonClick);
        if(edit_addDocumentLinkButton) edit_addDocumentLinkButton.addEventListener('click', edit_handleAddDocumentLink);
        if(edit_newDocumentLinkInput) edit_newDocumentLinkInput.addEventListener('keypress', edit_handleDocumentLinkInputKeypress);
        if(coauthorSelect) coauthorSelect.addEventListener('change', handleAddCoauthor);
        return;
    }

    editModalOverlay = document.createElement('div');
    editModalOverlay.id = 'editTaskModalOverlay';
    editModalOverlay.className = 'new-task-overlay';
    editModalOverlay.style.display = 'none';

    const modalContent = document.createElement('div');
    modalContent.className = 'new-task-form';

    modalContent.innerHTML = `
        <div class="new-task-header">
            <h2 id="editTaskModalTitle" class="new-task-title card-title">Редагувати Завдання</h2>
            <button id="closeEditTaskModal" class="new-task-close card-title">&times;</button>
        </div>
        <form id="editTaskForm">
            <div class="new-task-group">
                <label for="editTaskTitleInput" class="new-task-label large-card-text">Назва завдання:</label>
                <input type="text" id="editTaskTitleInput" class="new-task-input card-main-text" required>
            </div>
            <div class="new-task-group">
                <label for="editTaskDescriptionTextarea" class="new-task-label large-card-text">Опис:</label>
                <textarea id="editTaskDescriptionTextarea" class="new-task-textarea card-main-text"></textarea>
            </div>
            <div class="new-task-group">
                <label for="editTaskDeadlineInput" class="new-task-label large-card-text">Дедлайн:</label>
                <input type="datetime-local" id="editTaskDeadlineInput" class="new-task-input card-main-text" required>
            </div>
            <div class="new-task-group">
                <label for="editTaskTypeSelect" class="new-task-label large-card-text">Тип завдання:</label>
                <select id="editTaskTypeSelect" class="new-task-input card-main-text" required>
                    <option class="card-main-text" value="theory">Теоретичне</option>
                    <option class="card-main-text" value="practice">Практичне</option>
                    <option class="card-main-text" value="report">Звітне</option>
                    <option class="card-main-text" value="diploma">Дипломна робота</option>
                    <option class="card-main-text" value="presentation">Презентація</option>
                    <option class="card-main-text" value="other">Інше</option>
                </select>
            </div>
            <div class="new-task-group">
                <label for="editTaskStatusSelect" class="new-task-label large-card-text">Статус завдання:</label>
                <select id="editTaskStatusSelect" class="new-task-input card-main-text" required>
                    <option value="Опубліковано">Опубліковано</option>
                    <option value="Чернетка">Чернетка</option>
                    <option value="Архів">Архів</option>
                    <option value="Протерміновано">Протерміновано</option>
                </select>
            </div>
            <div class="new-task-group">
                <label class="new-task-label large-card-text">Призначити групам:</label>
                <div id="editTaskGroupsButtonContainer" class="group-selection-grid card-main-text">
                </div>
            </div>
            <div class="new-task-group">
                <label for="editTaskCoauthorSelect" class="new-task-label large-card-text">Додати співавтора:</label>
                <select id="editTaskCoauthorSelect" class="new-task-input card-main-text">
                    <option value="">Виберіть співавтора...</option>
                </select>
                <div id="editTaskCoauthorsContainer" class="coauthors-container card-main-text" style="margin-top:10px;"></div>
            </div>
            <div class="new-task-group">
                <label class="new-task-label large-card-text">Посилання на документи до завдання:</label>
                <div class="document-input-container">
                  <input type="url" id="edit_newDocumentLink" placeholder="Вставте посилання" class="new-task-input card-main-text">
                  <button type="button" id="edit_addDocumentLink" class="btn btn-primary btn-sm card-main-text"> + </button>
                </div>
                <div id="edit_documentLinksList" class="document-links-container card-main-text"></div>
            </div>
            <div class="new-task-submission-options">
                <div class="new-task-checkbox-group large-card-text">
                    <input type="checkbox" id="editTaskAllowText" name="allowText">
                    <label for="editTaskAllowText">Дозволити текстову відповідь</label>
                </div>
                <div class="new-task-checkbox-group large-card-text">
                    <input type="checkbox" id="editTaskAllowFile" name="allowFile">
                    <label for="editTaskAllowFile">Дозволити завантаження файлів</label>
                </div>
                <div id="editTaskFileTypesContainer" class="new-task-file-types large-card-text" style="display: none; margin-left: 20px; margin-top:10px;">
                    <div class="new-task-checkbox-group">
                        <input type="checkbox" id="editTaskAllowPdf" name="allowPdf">
                        <label for="editTaskAllowPdf">Дозволити PDF</label>
                    </div>
                    <div class="new-task-checkbox-group large-card-text">
                        <input type="checkbox" id="editTaskAllowDoc" name="allowDoc">
                        <label for="editTaskAllowDoc">Дозволити DOC/DOCX</label>
                    </div>
                    <div class="new-task-checkbox-group large-card-text">
                        <input type="checkbox" id="editTaskAllowZip" name="allowZip">
                        <label for="editTaskAllowZip">Дозволити ZIP/RAR</label>
                    </div>
                </div>
            </div>
            <div class="new-task-actions">
                <button type="button" id="cancelEditTaskBtn" class="btn btn-secondary card-main-text">Скасувати</button>
                <button type="submit" class="btn btn-primary card-main-text">Зберегти Зміни</button>
            </div>
        </form>
    `;
    editModalOverlay.appendChild(modalContent);
    document.body.appendChild(editModalOverlay);

    editModalForm = document.getElementById('editTaskForm');
    fileTypesContainer = document.getElementById('editTaskFileTypesContainer');
    allowFileCheckbox = document.getElementById('editTaskAllowFile');
    groupsButtonContainer = document.getElementById('editTaskGroupsButtonContainer');
    edit_documentLinksListElement = document.getElementById('edit_documentLinksList');
    edit_newDocumentLinkInput = document.getElementById('edit_newDocumentLink');
    edit_addDocumentLinkButton = document.getElementById('edit_addDocumentLink');
    coauthorsContainer = document.getElementById('editTaskCoauthorsContainer');
    coauthorSelect = document.getElementById('editTaskCoauthorSelect');

    document.getElementById('closeEditTaskModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditTaskBtn').addEventListener('click', closeEditModal);
    editModalOverlay.addEventListener('click', handleOverlayClick);
    editModalForm.addEventListener('submit', handleSaveChanges);
    if(allowFileCheckbox) allowFileCheckbox.addEventListener('change', toggleFileTypesVisibility);
    if(groupsButtonContainer) groupsButtonContainer.addEventListener('click', handleGroupButtonClick);
    if(edit_addDocumentLinkButton) edit_addDocumentLinkButton.addEventListener('click', edit_handleAddDocumentLink);
    if(edit_newDocumentLinkInput) edit_newDocumentLinkInput.addEventListener('keypress', edit_handleDocumentLinkInputKeypress);
    if(coauthorSelect) coauthorSelect.addEventListener('change', handleAddCoauthor);

    fetchAndRenderGroups();
    fetchAndRenderSupervisors();
}

function handleOverlayClick(event) {
    if (event.target === editModalOverlay) {
        closeEditModal();
    }
}

function toggleFileTypesVisibility() {
    if (fileTypesContainer) {
        fileTypesContainer.style.display = allowFileCheckbox.checked ? 'block' : 'none';
    }
}

async function fetchAndRenderGroups() {
    if (!groupsButtonContainer) return;
    try {
        const response = await fetch(`${backendUrl}/api/groups`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allAvailableGroups = await response.json();
        renderGroupButtons();
    } catch (error) {
        groupsButtonContainer.innerHTML = '<p class="card-main-text error-text">Не вдалося завантажити групи.</p>';
    }
}

function renderGroupButtons() {
    if (!groupsButtonContainer) return;
    groupsButtonContainer.innerHTML = '';

    const forAllButton = document.createElement('button');
    forAllButton.type = 'button';
    forAllButton.className = 'group-button card-main-text';
    forAllButton.textContent = 'Всі групи';
    forAllButton.dataset.groupId = 'all';
    groupsButtonContainer.appendChild(forAllButton);

    allAvailableGroups.forEach(group => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'group-button card-main-text';
        button.textContent = group.group_name;
        button.dataset.groupId = group.study_group_id;
        if (selectedGroupIds.has(group.study_group_id)) {
            button.classList.add('selected');
        }
        groupsButtonContainer.appendChild(button);
    });
    updateForAllGroupsButtonState();
}
function updateForAllGroupsButtonState() {
    if (!groupsButtonContainer) return;
    const forAllButton = groupsButtonContainer.querySelector('.group-button[data-group-id="all"]');
    if (!forAllButton) return;

    const allSpecificGroupsSelected = allAvailableGroups.length > 0 && allAvailableGroups.every(group => selectedGroupIds.has(group.study_group_id));
    const noSpecificGroupsSelected = selectedGroupIds.size === 0;

    if (allSpecificGroupsSelected) {
        forAllButton.classList.add('selected');
    } else if (noSpecificGroupsSelected) {
         forAllButton.classList.add('selected');
    }
    else {
        forAllButton.classList.remove('selected');
    }
}


function handleGroupButtonClick(event) {
    const button = event.target.closest('.group-button');
    if (!button) return;

    const groupIdStr = button.dataset.groupId;
    const forAllButton = groupsButtonContainer.querySelector('.group-button[data-group-id="all"]');

    if (groupIdStr === 'all') {
        const isSelected = button.classList.toggle('selected');
        selectedGroupIds.clear();
        if (isSelected) {
            groupsButtonContainer.querySelectorAll('.group-button[data-group-id]').forEach(btn => {
                if (btn.dataset.groupId !== 'all') btn.classList.remove('selected');
            });
        }
    } else {
        const groupId = parseInt(groupIdStr, 10);
        if (isNaN(groupId)) return;

        if (selectedGroupIds.has(groupId)) {
            selectedGroupIds.delete(groupId);
            button.classList.remove('selected');
        } else {
            selectedGroupIds.add(groupId);
            button.classList.add('selected');
        }
        updateForAllGroupsButtonState();
    }
}

async function fetchAndRenderSupervisors() {
    if (!coauthorSelect) return;
    try {
        const response = await fetch(`${backendUrl}/api/supervisors`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allAvailableSupervisors = await response.json();
        
        coauthorSelect.innerHTML = '<option value="">Виберіть співавтора...</option>';
        const currentUser = await getUserInfo();
        const currentSupervisorId = currentUser && currentUser.role === 'supervisor' ? currentUser.userId : null;

        allAvailableSupervisors.forEach(supervisor => {
            if (supervisor.supervisor_id !== currentSupervisorId) {
                const option = document.createElement('option');
                option.value = supervisor.supervisor_id;
                option.textContent = supervisor.full_name;
                coauthorSelect.appendChild(option);
            }
        });
    } catch (error) {
        coauthorSelect.innerHTML = '<option value="">Помилка завантаження</option>';
    }
}

function renderCoauthors() {
    if (!coauthorsContainer) return;
    coauthorsContainer.innerHTML = '';
    currentCoauthorIds.forEach(id => {
        const supervisor = allAvailableSupervisors.find(s => s.supervisor_id === id);
        if (supervisor) {
            const coauthorTag = document.createElement('span');
            coauthorTag.className = 'coauthor-tag card-main-text';
            coauthorTag.textContent = supervisor.full_name;
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'remove-coauthor-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.dataset.coauthorId = id;
            removeBtn.onclick = () => removeCoauthor(id);
            coauthorTag.appendChild(removeBtn);
            coauthorsContainer.appendChild(coauthorTag);
        }
    });
}

function handleAddCoauthor(event) {
    const selectedId = parseInt(event.target.value, 10);
    if (!isNaN(selectedId) && !currentCoauthorIds.has(selectedId)) {
        currentCoauthorIds.add(selectedId);
        renderCoauthors();
    }
    event.target.value = '';
}

function removeCoauthor(coauthorId) {
    currentCoauthorIds.delete(coauthorId);
    renderCoauthors();
}

function edit_handleAddDocumentLink() {
    const link = edit_newDocumentLinkInput.value.trim();
    if (link) {
        try {
            new URL(link);
            edit_currentDocumentLinks.push(link);
            edit_renderDocumentLinks();
            edit_newDocumentLinkInput.value = '';
        } catch (e) {
            showNotification('Будь ласка, введіть дійсне посилання (URL).', 'warning');
        }
    } else {
        showNotification('Поле посилання не може бути порожнім.', 'warning');
    }
}

function edit_handleDocumentLinkInputKeypress(e){
    if (e.key === 'Enter') {
      e.preventDefault();
      edit_handleAddDocumentLink();
    }
}

function edit_renderDocumentLinks() {
    if(!edit_documentLinksListElement) return;
    edit_documentLinksListElement.innerHTML = '';
    edit_currentDocumentLinks.forEach((link, index) => {
      const linkItem = document.createElement('div');
      linkItem.className = 'document-link-item card-main-text';
      const marker = document.createElement('span');
      marker.className = 'document-link-marker';
      marker.innerHTML = '&#9670; ';
      linkItem.appendChild(marker);
      const linkText = document.createElement('a');
      linkText.className = 'document-link-text';
      linkText.textContent = link;
      linkText.href = link;
      linkText.target = "_blank";
      linkItem.appendChild(linkText);
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'document-link-actions';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'document-link-button edit card-main-text';
      editBtn.innerHTML = '✎';
      editBtn.title = 'Редагувати';
      editBtn.onclick = () => edit_editDocumentLink(index);
      actionsDiv.appendChild(editBtn);
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'document-link-button delete card-main-text';
      deleteBtn.innerHTML = '−';
      deleteBtn.title = 'Видалити';
      deleteBtn.onclick = () => edit_deleteDocumentLink(index);
      actionsDiv.appendChild(deleteBtn);
      linkItem.appendChild(actionsDiv);
      edit_documentLinksListElement.appendChild(linkItem);
    });
}

function edit_editDocumentLink(index) {
    const newLink = prompt('Відредагуйте посилання:', edit_currentDocumentLinks[index]);
    if (newLink !== null) {
        if (newLink.trim()){
            try {
                new URL(newLink.trim());
                edit_currentDocumentLinks[index] = newLink.trim();
            } catch (e) {
                 showNotification('Будь ласка, введіть дійсне посилання (URL) або залиште порожнім для видалення.', 'warning');
                 return;
            }
        } else {
             edit_currentDocumentLinks.splice(index, 1);
        }
        edit_renderDocumentLinks();
    }
}

function edit_deleteDocumentLink(index) {
    if (confirm('Ви впевнені, що хочете видалити це посилання?')) {
      edit_currentDocumentLinks.splice(index, 1);
      edit_renderDocumentLinks();
    }
}

async function populateEditForm(taskId) {
    try {
        const response = await fetch(`${backendUrl}/assignments/${taskId}`, { headers: getAuthHeaders() });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `HTTP error ${response.status}`);
        }
        const task = await response.json();

        document.getElementById('editTaskModalTitle').textContent = `Редагувати: ${task.title}`;
        document.getElementById('editTaskTitleInput').value = task.title || '';
        document.getElementById('editTaskDescriptionTextarea').value = task.description || '';
        if (task.deadline) {
            const deadlineDate = new Date(task.deadline);
            document.getElementById('editTaskDeadlineInput').value = `${deadlineDate.getFullYear()}-${(deadlineDate.getMonth() + 1).toString().padStart(2, '0')}-${deadlineDate.getDate().toString().padStart(2, '0')}T${deadlineDate.getHours().toString().padStart(2, '0')}:${deadlineDate.getMinutes().toString().padStart(2, '0')}`;
        }

        const typeSelectElement = document.getElementById('editTaskTypeSelect');
        const typeFromBackend = task.type;
        let targetTypeValue = 'theory';
        const typeMap = {
            "Теоретичне": "theory", "Практичне": "practice", "Звітне": "report",
            "Дипломна робота": "diploma", "Презентація": "presentation", "Інше": "other"
        };
        if (typeFromBackend && typeMap[typeFromBackend]) {
            targetTypeValue = typeMap[typeFromBackend];
        } else if (typeSelectElement.options.namedItem(typeFromBackend)) {
            targetTypeValue = typeFromBackend;
        }
        typeSelectElement.value = targetTypeValue;


        document.getElementById('editTaskStatusSelect').value = task.status || 'Опубліковано';

        selectedGroupIds.clear();
        if (task.groups && Array.isArray(task.groups)) {
            task.groups.forEach(id => selectedGroupIds.add(parseInt(id, 10)));
        }
        renderGroupButtons();

        currentCoauthorIds.clear();
        if (task.coauthors && Array.isArray(task.coauthors)) {
            task.coauthors.forEach(coauthor => currentCoauthorIds.add(coauthor.id));
        }
        renderCoauthors();

        edit_currentDocumentLinks = task.attachments ? task.attachments.map(att => att.url) : [];
        edit_renderDocumentLinks();

        document.getElementById('editTaskAllowText').checked = task.allow_text == 1;
        allowFileCheckbox.checked = task.allow_file == 1;
        toggleFileTypesVisibility();

        if (fileTypesContainer) {
            document.getElementById('editTaskAllowPdf').checked = task.allow_pdf == 1;
            document.getElementById('editTaskAllowDoc').checked = task.allow_doc == 1;
            document.getElementById('editTaskAllowZip').checked = task.allow_zip == 1;
        }
    } catch (error) {
        showNotification(`Помилка завантаження даних завдання: ${error.message}`, 'error');
        closeEditModal();
    }
}

async function handleSaveChanges(event) {
    event.preventDefault();
    if (!currentEditingTaskId) return;

    let groupsToSend = Array.from(selectedGroupIds);
    const forAllButtonSelected = groupsButtonContainer.querySelector('.group-button[data-group-id="all"].selected');
    if (forAllButtonSelected && selectedGroupIds.size === 0) {
         groupsToSend = [];
    } else if (forAllButtonSelected && selectedGroupIds.size > 0) {
         groupsToSend = Array.from(selectedGroupIds);
    } else if (!forAllButtonSelected && selectedGroupIds.size === 0) {
         groupsToSend = [];
    }


    const updatedTaskData = {
        title: document.getElementById('editTaskTitleInput').value,
        description: document.getElementById('editTaskDescriptionTextarea').value,
        deadline: document.getElementById('editTaskDeadlineInput').value,
        taskType: document.getElementById('editTaskTypeSelect').value,
        status: document.getElementById('editTaskStatusSelect').value,
        groups: groupsToSend,
        coauthors: Array.from(currentCoauthorIds),
        attachments: edit_currentDocumentLinks,
        allowText: document.getElementById('editTaskAllowText').checked,
        allowFile: allowFileCheckbox.checked,
        fileTypes: {
            pdf: allowFileCheckbox.checked ? document.getElementById('editTaskAllowPdf').checked : false,
            doc: allowFileCheckbox.checked ? document.getElementById('editTaskAllowDoc').checked : false,
            zip: allowFileCheckbox.checked ? document.getElementById('editTaskAllowZip').checked : false,
        }
    };

    try {
        const response = await fetch(`${backendUrl}/assignments/${currentEditingTaskId}`, {
            method: 'PUT',
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedTaskData)
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `HTTP error ${response.status}`);
        }
        showNotification('Завдання успішно оновлено!', 'success');
        closeEditModal();
        if (typeof window.refreshAssignmentsView === 'function') {
            window.refreshAssignmentsView();
        } else {
            location.reload();
        }
    } catch (error) {
        showNotification(`Помилка оновлення завдання: ${error.message}`, 'error');
    }
}

window.openEditTaskModal = async function(taskId) {
    createEditModalDOM();
    currentEditingTaskId = taskId;
    document.getElementById('editTaskModalTitle').textContent = 'Редагувати Завдання';
    
    await Promise.all([fetchAndRenderGroups(), fetchAndRenderSupervisors()]);
    await populateEditForm(taskId); 
    
    if (editModalOverlay) editModalOverlay.style.display = 'flex';
}

function closeEditModal() {
    if (editModalOverlay) {
        editModalOverlay.style.display = 'none';
    }
    currentEditingTaskId = null;
    selectedGroupIds.clear();
    currentCoauthorIds.clear();
    edit_currentDocumentLinks = [];
    if(edit_documentLinksListElement) edit_documentLinksListElement.innerHTML = '';
    if(edit_newDocumentLinkInput) edit_newDocumentLinkInput.value = '';
    if(coauthorsContainer) coauthorsContainer.innerHTML = '';
    if(coauthorSelect) coauthorSelect.value = '';


    if(editModalForm) editModalForm.reset();
    if(allowFileCheckbox) allowFileCheckbox.checked = false;
    toggleFileTypesVisibility();
}

document.addEventListener('DOMContentLoaded', () => {
    createEditModalDOM();
});
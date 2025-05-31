import { getAuthHeaders, getUserInfo, showNotification } from './authUtils.js';

document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('taskSearch');
    const clearSearchButton = document.getElementById('clearSearch');
    const groupFilter = document.getElementById('groupFilter');
    const typeFilter = document.getElementById('typeFilter');
    const sortFilter = document.getElementById('sortFilter');
    const filterButtons = document.querySelectorAll('.filter-button');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const messageContainer = document.querySelector('.task-management-content');
    const noResultsMessageEl = messageContainer.querySelector('.no-results-message');

    const supervisorTaskSectionsContainer = document.getElementById('supervisorTaskSections');
    const myTasksGrid = document.getElementById('myAuthoredCoauthoredTasksGrid');
    const myTasksCountEl = document.getElementById('myAuthoredCoauthoredTasksCount');
    const myTasksSectionEl = document.getElementById('myAuthoredCoauthoredTasksSection');

    const otherSupervisorTasksGrid = document.getElementById('otherSupervisorTasksGrid');
    const otherSupervisorTasksCountEl = document.getElementById('otherSupervisorTasksCount');
    const otherSupervisorTasksSectionEl = document.getElementById('otherSupervisorTasksSection');

    const generalTaskSectionsContainer = document.getElementById('generalTaskSections');
    const pendingContainer = generalTaskSectionsContainer.querySelector('#pendingTasks .task-grid');
    const reviewContainer = generalTaskSectionsContainer.querySelector('#reviewTasks .task-grid');
    const completedContainer = generalTaskSectionsContainer.querySelector('#completedTasks .task-grid');
    const overdueContainer = generalTaskSectionsContainer.querySelector('#overdueTasks .task-grid');
    const allGeneralContainers = [pendingContainer, reviewContainer, completedContainer, overdueContainer].filter(Boolean);

    const pendingTasksSectionEl = document.getElementById('pendingTasks');
    const reviewTasksSectionEl = document.getElementById('reviewTasks');
    const completedTasksSectionEl = document.getElementById('completedTasks');
    const overdueTasksSectionEl = document.getElementById('overdueTasks');

    const pendingTasksCountEl = document.getElementById('pendingTasksCount');
    const reviewTasksCountEl = document.getElementById('reviewTasksCount');
    const completedTasksCountEl = document.getElementById('completedTasksCount');
    const overdueTasksCountEl = document.getElementById('overdueTasksCount');

    let fetchedSupervisorTasks = [];
    let fetchedOtherSupervisorTasks = [];
    let fetchedGeneralAssignments = [];

    let currentUserInfo = null;
    const backendUrl = 'http://localhost:3000';

    async function fetchCurrentUser() {
        if (!currentUserInfo) {
            currentUserInfo = await getUserInfo();
            if (currentUserInfo && !currentUserInfo.userId && currentUserInfo.account_id) {
                if(currentUserInfo.role === 'supervisor' && currentUserInfo.supervisor_id) currentUserInfo.userId = currentUserInfo.supervisor_id;
                else if(currentUserInfo.role === 'student' && currentUserInfo.student_id) currentUserInfo.userId = currentUserInfo.student_id;
                else if(currentUserInfo.id) currentUserInfo.userId = currentUserInfo.id;
                else currentUserInfo.userId = currentUserInfo.account_id;
            } else if (currentUserInfo && !currentUserInfo.userId && currentUserInfo.id) {
                 currentUserInfo.userId = currentUserInfo.id;
            }
        }
        return currentUserInfo;
    }

    function updateUIBasedOnRole() {
        if (!currentUserInfo) return;
        addTaskBtn.style.display = (currentUserInfo.role === 'supervisor' || currentUserInfo.role === 'admin') ? 'inline-flex' : 'none';

        const isSupervisorOrAdmin = currentUserInfo.role === 'supervisor' || currentUserInfo.role === 'admin';
        if(groupFilter) groupFilter.style.display = isSupervisorOrAdmin ? 'inline-block' : 'none';

        if (currentUserInfo.role === 'supervisor') {
            if(supervisorTaskSectionsContainer) supervisorTaskSectionsContainer.style.display = 'block';
            if(generalTaskSectionsContainer) generalTaskSectionsContainer.style.display = 'none';
        } else {
            if(supervisorTaskSectionsContainer) supervisorTaskSectionsContainer.style.display = 'none';
            if(generalTaskSectionsContainer) generalTaskSectionsContainer.style.display = 'block';
        }
    }

    async function fetchAssignmentsData() {
        const headers = getAuthHeaders();
        if (!headers['Authorization']) {
            showNotification("Помилка автентифікації. Будь ласка, увійдіть знову.", "error", "notification-container-tasks");
            fetchedSupervisorTasks = []; fetchedOtherSupervisorTasks = []; fetchedGeneralAssignments = [];
            applyFiltersAndRender();
            return;
        }
        try {
            const response = await fetch(`${backendUrl}/assignments`, { headers });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({error: response.statusText, message: response.statusText}));
                throw new Error(`HTTP ${response.status}: ${errData.error || errData.message}`);
            }
            const data = await response.json();

            if (currentUserInfo.role === 'supervisor') {
                fetchedSupervisorTasks = data.supervisorTasks || [];
                fetchedOtherSupervisorTasks = data.otherTasks || [];
                fetchedGeneralAssignments = [];
                populateTypeFilterWithData(fetchedSupervisorTasks.concat(fetchedOtherSupervisorTasks));
            } else { // Includes admin and student
                fetchedGeneralAssignments = data || [];
                fetchedSupervisorTasks = [];
                fetchedOtherSupervisorTasks = [];
                populateTypeFilterWithData(fetchedGeneralAssignments);
            }
            applyFiltersAndRender();
        } catch (err) {
            console.error('[tasks_animation.js] Помилка при завантаженні завдань:', err);
            showNotification(`Помилка завантаження завдань: ${err.message}`, "error", "notification-container-tasks");
            fetchedSupervisorTasks = []; fetchedOtherSupervisorTasks = []; fetchedGeneralAssignments = [];
            applyFiltersAndRender();
        }
    }

    function populateTypeFilterWithData(assignmentsList) {
        if (!typeFilter) return;
        const uniqueTypes = [...new Set(assignmentsList.map(task => task.type).filter(Boolean))];
        typeFilter.innerHTML = `<option value="">Усі типи</option>`;
        uniqueTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            typeFilter.appendChild(option);
        });
    }

    function filterAndSortTasks(tasks, searchTerm, groupVal, typeVal, statusFlt, sortVal, isSupervisorPrimaryContext = false) {
        let assignmentsToDisplay = tasks.filter(task => {
            if (!task || typeof task.title !== 'string') return false;
            const title = task.title.toLowerCase();
            const description = task.description?.toLowerCase() || '';
            const taskGroupsString = task.group_names || '';
            const taskType = task.type || '';
            const status = task.status ? task.status.trim().toLowerCase() : 'pending';
            const deadline = task.deadline ? new Date(task.deadline) : null;
            const now = new Date(); now.setHours(0, 0, 0, 0);
            const deadlineDateOnly = deadline ? new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()) : null;
            const isOverdue = deadlineDateOnly && deadlineDateOnly < now && status !== 'виконано' && status !== 'прийнято';

            const matchesSearch = !searchTerm || title.includes(searchTerm) || description.includes(searchTerm) || taskType.toLowerCase().includes(searchTerm);

            let matchesGroup = true;
            // Group filter applies to "Other Supervisor Tasks" or general tasks view, not "My Tasks" for supervisors.
            if (currentUserInfo?.role === 'admin' || (currentUserInfo?.role === 'supervisor' && !isSupervisorPrimaryContext) || currentUserInfo?.role === 'student') {
                if (groupVal) { // If a group is selected
                    matchesGroup = taskGroupsString.toLowerCase().split(', ').map(g => g.trim()).includes(groupVal.toLowerCase());
                }
            }


            const matchesType = !typeVal || taskType.toLowerCase() === typeVal.toLowerCase();

            let matchesStatus = true;
            if (statusFlt !== 'all') {
                 if (statusFlt === 'pending') matchesStatus = (status === 'опубліковано' || status === 'pending') && !isOverdue;
                 else if (statusFlt === 'review') matchesStatus = status === 'на перевірці';
                 else if (statusFlt === 'completed') matchesStatus = status === 'виконано' || status === 'прийнято';
                 else if (statusFlt === 'overdue') matchesStatus = isOverdue;
                 else matchesStatus = false;
            }
            return matchesSearch && matchesGroup && matchesType && matchesStatus;
        });

        assignmentsToDisplay.sort((a, b) => {
            if (isSupervisorPrimaryContext && a.current_user_relation && b.current_user_relation) {
                if (a.current_user_relation === 'author' && b.current_user_relation !== 'author') return -1;
                if (a.current_user_relation !== 'author' && b.current_user_relation === 'author') return 1;
                if (a.current_user_relation === 'coauthor' && b.current_user_relation === 'author') return 1;
                if (a.current_user_relation === 'author' && b.current_user_relation === 'coauthor') return -1;
            }
            switch (sortVal) {
                case 'deadline-asc': return (new Date(a.deadline || '9999-12-31')) - (new Date(b.deadline || '9999-12-31'));
                case 'deadline-desc': return (new Date(b.deadline || '0000-01-01')) - (new Date(a.deadline || '0000-01-01'));
                case 'name-asc': return (a.title || '').localeCompare(b.title || '', 'uk');
                case 'name-desc': return (b.title || '').localeCompare(a.title || '', 'uk');
                case 'date-asc': return (new Date(a.created_at || 0)) - (new Date(b.created_at || 0));
                case 'date-desc': default: return (new Date(b.created_at || 0)) - (new Date(a.created_at || 0));
            }
        });
        return assignmentsToDisplay;
    }

    function applyFiltersAndRender() {
        const searchTerm = searchInput?.value.toLowerCase().trim() || '';
        const groupValue = groupFilter?.value || '';
        const typeValue = typeFilter?.value || '';
        const sortValue = sortFilter?.value || 'date-desc';
        const statusFilterActiveButton = document.querySelector('.filter-button.active');
        const statusFilterValue = statusFilterActiveButton ? statusFilterActiveButton.dataset.filter : 'all';

        if (clearSearchButton) clearSearchButton.style.display = searchTerm ? 'flex' : 'none';

        let totalTasksFound = 0;

        if (currentUserInfo?.role === 'supervisor') {
            const filteredMyTasks = filterAndSortTasks(fetchedSupervisorTasks, searchTerm, "", typeValue, statusFilterValue, sortValue, true);
            const filteredOtherSupervisorTasks = filterAndSortTasks(fetchedOtherSupervisorTasks, searchTerm, groupValue, typeValue, statusFilterValue, sortValue, false);

            renderTasksToGrid(myTasksGrid, filteredMyTasks, myTasksCountEl, myTasksSectionEl);
            renderTasksToGrid(otherSupervisorTasksGrid, filteredOtherSupervisorTasks, otherSupervisorTasksCountEl, otherSupervisorTasksSectionEl);
            totalTasksFound = filteredMyTasks.length + filteredOtherSupervisorTasks.length;

        } else { // Admin or Student
            const filteredAssignments = filterAndSortTasks(fetchedGeneralAssignments, searchTerm, groupValue, typeValue, statusFilterValue, sortValue);
            renderGeneralAssignments(filteredAssignments);
            totalTasksFound = filteredAssignments.length;
        }

        if (noResultsMessageEl) {
            noResultsMessageEl.style.display = totalTasksFound === 0 ? 'block' : 'none';
        }
    }

    function createTaskCard(task) {
        if (!task || !task.assignment_id) return null;
        const deadline = task.deadline ? new Date(task.deadline) : null;
        const formattedDeadline = deadline ? deadline.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Не вказано';
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const deadlineDateOnly = deadline ? new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()) : null;
        const daysRemaining = deadlineDateOnly ? Math.ceil((deadlineDateOnly - now) / (1000 * 60 * 60 * 24)) : null;
        const currentGeneralStatus = task.status ? task.status.trim().toLowerCase() : 'pending';
        const isOverdueGeneral = deadlineDateOnly && deadlineDateOnly < now && currentGeneralStatus !== 'виконано' && currentGeneralStatus !== 'прийнято';

        let generalStatusText = '', generalStatusClass = '';
        if (isOverdueGeneral) { generalStatusText = 'Протерміновано'; generalStatusClass = 'status-overdue'; }
        else {
            switch (currentGeneralStatus) {
                case 'прийнято': case 'виконано': generalStatusText = 'Завершено'; generalStatusClass = 'status-completed'; break;
                case 'на перевірці': generalStatusText = 'На перевірці'; generalStatusClass = 'status-in-review'; break;
                case 'опубліковано': case 'pending': default: generalStatusText = 'Очікує виконання'; generalStatusClass = 'status-pending'; break;
            }
        }

        const card = document.createElement('div');
        card.className = 'task-card';
        card.dataset.taskId = task.assignment_id;

        let studentPersonalStatusHTML = '';
        if (currentUserInfo && currentUserInfo.role === 'student' && task.student_submission_status) {
            let personalStatusText = task.student_submission_status;
            let personalStatusClass = '';

            switch (task.student_submission_status.toLowerCase()) {
                case 'на перевірці':
                    personalStatusText = 'На перевірці';
                    personalStatusClass = 'status-personal-review';
                    break;
                case 'прийнято':
                    personalStatusText = 'Прийнято';
                    personalStatusClass = 'status-personal-accepted';
                    if (task.student_submission_grade) {
                         personalStatusText += ` (Оцінка: ${task.student_submission_grade})`;
                    }
                    break;
                case 'зараховано':
                    personalStatusText = 'Зараховано';
                    personalStatusClass = 'status-personal-credited';
                     if (task.student_submission_grade) {
                         personalStatusText += ` (Оцінка: ${task.student_submission_grade})`;
                    }
                    break;
                case 'потребує доопрацювання':
                    personalStatusText = 'Потребує доопрацювання';
                    personalStatusClass = 'status-personal-rework';
                    break;
                case 'відхилено':
                    personalStatusText = 'Відхилено';
                    personalStatusClass = 'status-personal-rejected';
                    break;
                case 'протерміновано':
                    personalStatusText = 'Протерміновано (Ваша здача)';
                    personalStatusClass = 'status-personal-overdue';
                    break;
                default:
                     personalStatusText = task.student_submission_status;
                     personalStatusClass = 'status-personal-unknown';
                     break;
            }

            if (personalStatusText) {
                studentPersonalStatusHTML = `
                    <div class="task-personal-status-container">
                        <span class="personal-status-label card-main-text">Ваш статус:</span>
                        <span class="task-card-status ${personalStatusClass} card-main-text">${personalStatusText}</span>
                    </div>`;
            }
        } else if (currentUserInfo && currentUserInfo.role === 'student' && !task.student_submission_status) {
             studentPersonalStatusHTML = `
                    <div class="task-personal-status-container">
                        <span class="personal-status-label card-main-text">Ваш статус:</span>
                        <span class="task-card-status status-personal-none card-main-text">Не здано</span>
                    </div>`;
        }

        const groupNamesDisplay = task.group_names || 'Для всіх';

        const attachmentsHtml = task.attachments?.length > 0
             ? `<ul class="document-list">${task.attachments.map(att => {
                    if (!att || typeof att.url !== 'string' || att.url.trim() === '') return '<li class="card-main-text error-text">[Недійсне вкл.]</li>';
                    const attachmentUrl = att.url;
                    let fileName = 'Файл'; let linkHref = '#'; let isExternalLink = false;
                    try {
                        const urlObj = new URL(attachmentUrl);
                        linkHref = attachmentUrl;
                        fileName = decodeURIComponent(urlObj.pathname.split('/').pop() || urlObj.hostname);
                        isExternalLink = true;
                    } catch (e) {
                        try {
                            let decodedName = decodeURIComponent(attachmentUrl.split('/').pop() || '');
                            if (decodedName) fileName = decodedName;
                        } catch(decodeError) {
                            fileName = attachmentUrl.split('/').pop() || 'Файл';
                        }
                        linkHref = attachmentUrl.startsWith('http') ? attachmentUrl : `${backendUrl}/uploads/${encodeURIComponent(attachmentUrl)}`;
                    }
                    return `<li class="card-main-text"><a href="${linkHref}" target="_blank" title="${decodeURIComponent(attachmentUrl)}">${fileName} ${isExternalLink ? '<i class="fas fa-external-link-alt external-link-icon"></i>' : ''}</a></li>`;
                }).join('')}</ul>`
             : '<span class="no-attachments card-main-text">Вкладень немає</span>';

        let deadlineClass = '', deadlineText = `Дедлайн: ${formattedDeadline}`;
        if (deadlineDateOnly) {
           if (daysRemaining !== null && !isOverdueGeneral && (currentGeneralStatus !== 'виконано' && currentGeneralStatus !== 'прийнято')) {
                if (daysRemaining === 0) { deadlineText += ` (Сьогодні)`; deadlineClass = 'urgent'; }
                else if (daysRemaining < 0) {  } // Should be caught by isOverdueGeneral
                else if (daysRemaining <= 3) { deadlineText += ` (${daysRemaining} д.)`; deadlineClass = 'urgent'; }
                else { deadlineText += ` (${daysRemaining} д.)`; }
           } else if (isOverdueGeneral) {
              deadlineClass = 'overdue';
           }
        } else { deadlineText = 'Дедлайн: Не вказано'; }

        let canEditThisTask = false;
        let canCheckSubmissions = false;
        const isAdmin = currentUserInfo?.role === 'admin';

        if (currentUserInfo && currentUserInfo.userId) {
            const isAuthor = currentUserInfo.role === 'supervisor' && String(currentUserInfo.userId) === String(task.posted_by_supervisor_id);
            const isCoauthor = currentUserInfo.role === 'supervisor' && task.current_user_relation === 'coauthor';

            canEditThisTask = isAdmin || isAuthor || isCoauthor;
            canCheckSubmissions = (isAuthor || isCoauthor) && currentUserInfo.role === 'supervisor';
        }

        let authorAndCoauthorsHTML = `<p class="task-authors card-main-text">`;
        if (task.posted_by_name) {
            authorAndCoauthorsHTML += `<span class="author-info"><span class="author-label">Автор:</span> ${task.posted_by_name}${task.posted_by_supervisor_id == currentUserInfo?.userId && currentUserInfo?.role === 'supervisor' ? ' (Ви)' : ''}</span>`;
        } else {
            authorAndCoauthorsHTML += `<span class="author-info"><span class="author-label">Автор:</span> Адміністрація</span>`;
        }

        if (task.coauthor_names) {
            let coauthorDisplayNames = task.coauthor_names;
            authorAndCoauthorsHTML += `<br><span class="coauthors-info"><span class="coauthor-label">Співавтори:</span> ${coauthorDisplayNames}</span>`;
        }
        authorAndCoauthorsHTML += `</p>`;

        const canSubmitOrUpdate = currentUserInfo?.role === 'student' &&
            (currentGeneralStatus === 'pending' || currentGeneralStatus === 'опубліковано' || isOverdueGeneral || (task.student_submission_status && task.student_submission_status.toLowerCase() === 'потребує доопрацювання'));

        card.innerHTML = `
          <div class="task-card-header">
            <h3 class="task-card-title large-card-text">${task.title || 'Без назви'}</h3>
          </div>
          ${authorAndCoauthorsHTML}
          <p class="task-groups card-main-text"><span class="group-topic card-main-text">Групи:</span> ${groupNamesDisplay}</p>
          <p class="task-card-description card-main-text"><span class="description-topic card-main-text">Опис:</span> ${task.description || 'Опис відсутній.'}</p>
          <p class="task-type card-main-text"><span class="type-topic card-main-text">Тип:</span> ${task.type ? (task.type.charAt(0).toUpperCase() + task.type.slice(1)) : 'Невідомо'}</p>
          <div class="task-card-documents card-main-text">
            <span class="attachments-label card-main-text">Вкладення:</span>
            ${attachmentsHtml}
          </div>
          ${studentPersonalStatusHTML}
          <div class="task-progress">
            <div class="task-info">
              <span class="task-card-status ${generalStatusClass} card-main-text">${generalStatusText}</span>
            </div>
          </div>
          <div class="task-card-time card-main-text">
            <span class="task-card-deadline card-main-text ${deadlineClass}">${deadlineText}</span>
          </div>
          <div class="task-card-footer">
            <div class="task-card-actions">
              <button class="task-action-button view-task" title="Переглянути деталі"><i class="fas fa-eye card-main-text"></i></button>
              ${canSubmitOrUpdate ? `<button class="task-action-button submit-task" title="Здати/Оновити роботу"><i class="fas fa-upload card-main-text"></i></button>` : ''}
              ${canEditThisTask ? `<button class="task-action-button edit-task" title="Редагувати завдання"><i class="fas fa-edit card-main-text"></i></button>` : ''}
              ${isAdmin ? `<button class="task-action-button delete-task" title="Видалити завдання"><i class="fas fa-trash-alt card-main-text"></i></button>` : ''}
              ${canCheckSubmissions ? `<a href="assignment_check.html?assignmentId=${task.assignment_id}&title=${encodeURIComponent(task.title || 'Завдання')}" class="task-action-button check-submissions-task" title="Перевірити роботи"><i class="fas fa-tasks" class="card-main-text"></i></a>` : ''}
            </div>
          </div>`;
        return card;
    }

    function renderTasksToGrid(gridElement, tasks, countElement, sectionElement) {
        if (!gridElement) { console.warn("Grid element not found for rendering:", gridElement); return; }
        gridElement.innerHTML = '';
        let renderedCount = 0;
        tasks.forEach(task => {
            const card = createTaskCard(task);
            if (card) {
                gridElement.appendChild(card);
                renderedCount++;
            }
        });
        if (countElement) countElement.textContent = renderedCount;
        if (sectionElement) sectionElement.style.display = renderedCount > 0 ? 'block' : 'none';
    }

    function renderGeneralAssignments(assignments) {
        allGeneralContainers.forEach(c => { if(c) c.innerHTML = ''; });

        const sections = [pendingTasksSectionEl, reviewTasksSectionEl, completedTasksSectionEl, overdueTasksSectionEl];
        sections.forEach(section => { if(section) section.style.display = 'none'; });

        let counts = { pending: 0, review: 0, completed: 0, overdue: 0 };

        assignments.forEach(task => {
            const card = createTaskCard(task);
            if (!card) return;
            const status = task.status ? task.status.trim().toLowerCase() : 'pending';
            const deadline = task.deadline ? new Date(task.deadline) : null;
            const now = new Date(); now.setHours(0,0,0,0);
            const deadlineDateOnly = deadline ? new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate()) : null;
            const isOverdue = deadlineDateOnly && deadlineDateOnly < now && status !== 'виконано' && status !== 'прийнято';

            if (isOverdue && overdueContainer) { overdueContainer.appendChild(card); counts.overdue++; }
            else if ((status === 'виконано' || status === 'прийнято') && completedContainer) { completedContainer.appendChild(card); counts.completed++; }
            else if (status === 'на перевірці' && reviewContainer) { reviewContainer.appendChild(card); counts.review++; }
            else if (pendingContainer) { pendingContainer.appendChild(card); counts.pending++;}
        });

        if (counts.pending > 0 && pendingTasksSectionEl) pendingTasksSectionEl.style.display = 'block';
        if (counts.review > 0 && reviewTasksSectionEl) reviewTasksSectionEl.style.display = 'block';
        if (counts.completed > 0 && completedTasksSectionEl) completedTasksSectionEl.style.display = 'block';
        if (counts.overdue > 0 && overdueTasksSectionEl) overdueTasksSectionEl.style.display = 'block';

        if(pendingTasksCountEl) pendingTasksCountEl.textContent = counts.pending;
        if(reviewTasksCountEl) reviewTasksCountEl.textContent = counts.review;
        if(completedTasksCountEl) completedTasksCountEl.textContent = counts.completed;
        if(overdueTasksCountEl) overdueTasksCountEl.textContent = counts.overdue;
    }

    async function deleteAssignment(taskId) {
        const headers = getAuthHeaders();
        if (!headers['Authorization']) {
            showNotification("Помилка автентифікації для видалення. Будь ласка, увійдіть знову.", "error", "notification-container-tasks");
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/assignments/${taskId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({ error: `HTTP ${response.status} ${response.statusText}` }));
                throw new Error(errData.error || `Помилка ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                showNotification(result.message || 'Завдання успішно видалено.', 'success', 'notification-container-tasks');
                if (typeof window.refreshAssignmentsView === 'function') {
                    window.refreshAssignmentsView();
                } else {
                    console.warn('refreshAssignmentsView function not found, reloading page.');
                    location.reload(); // Fallback if specific refresh isn't available
                }
            } else {
                showNotification(result.error || 'Не вдалося видалити завдання.', 'error', 'notification-container-tasks');
            }
        } catch (err) {
            console.error('[tasks_animation.js] Помилка при видаленні завдання:', err);
            showNotification(`Помилка видалення завдання: ${err.message}`, 'error', 'notification-container-tasks');
        }
    }

    function setupEventListeners() {
        if(searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
        if(clearSearchButton) clearSearchButton.addEventListener('click', () => {
            if(searchInput) searchInput.value = '';
            applyFiltersAndRender();
        });
        if(groupFilter) groupFilter.addEventListener('change', applyFiltersAndRender);
        if(typeFilter) typeFilter.addEventListener('change', applyFiltersAndRender);
        if(sortFilter) sortFilter.addEventListener('change', applyFiltersAndRender);

        filterButtons.forEach(button => {
            button.addEventListener('click', function () {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                applyFiltersAndRender();
            });
        });

        document.addEventListener('click', async function(event) {
            const targetButton = event.target.closest('.task-action-button');
            if (!targetButton) return;

            if (targetButton.tagName.toLowerCase() !== 'a' || !targetButton.classList.contains('check-submissions-task')) {
                event.preventDefault();
            }

            const taskCard = targetButton.closest('.task-card');
            const taskId = taskCard?.dataset.taskId;

            if (targetButton.classList.contains('check-submissions-task')) {
                if (!taskId) {
                    console.error('Task ID not found for check submissions button.');
                    showNotification('Не вдалося визначити ID завдання для перевірки.', 'error', 'notification-container-tasks');
                    event.preventDefault(); // Prevent navigation if ID is missing
                }
                // Allow default behavior for <a> tag if taskId is present
                return;
            }

            if (!taskId) {
                 console.error('Task ID not found for action button that is not check-submissions-task.');
                 showNotification('Не вдалося визначити ID завдання.', 'error', 'notification-container-tasks');
                 return;
            }

            if (targetButton.classList.contains('view-task')) {
                if (typeof window.openAssignmentModal === 'function') {
                    window.openAssignmentModal(taskId);
                } else {
                    console.error('Function openAssignmentModal not found.');
                    showNotification('Не вдалося відкрити деталі завдання.', 'error', 'notification-container-tasks');
                }
            } else if (targetButton.classList.contains('edit-task')) {
                let taskData = null;
                 // Admins might see tasks in generalAssignments or otherSupervisorTasks (if not authored/coauthored)
                if (currentUserInfo?.role === 'supervisor') {
                    taskData = fetchedSupervisorTasks.find(t => String(t.assignment_id) === String(taskId)) ||
                               fetchedOtherSupervisorTasks.find(t => String(t.assignment_id) === String(taskId));
                } else if (currentUserInfo?.role === 'admin') {
                     taskData = fetchedGeneralAssignments.find(t => String(t.assignment_id) === String(taskId)) ||
                                fetchedSupervisorTasks.find(t => String(t.assignment_id) === String(taskId)) || // Check supervisor tasks as well if admin
                                fetchedOtherSupervisorTasks.find(t => String(t.assignment_id) === String(taskId));
                } else { // Student
                    taskData = fetchedGeneralAssignments.find(t => String(t.assignment_id) === String(taskId));
                }


                if (!taskData) {
                    showNotification('Дані завдання для редагування не знайдено.', 'error', 'notification-container-tasks');
                    return;
                }
                if (typeof window.openEditTaskModal === 'function') {
                    window.openEditTaskModal(taskId, taskData);
                } else {
                    console.error('Function openEditTaskModal not found.');
                     showNotification('Функція редагування завдання ще не доступна.', 'info', 'notification-container-tasks');
                }
            } else if (targetButton.classList.contains('submit-task') && currentUserInfo?.role === 'student') {
                 const studentId = currentUserInfo?.userId;
                 if (!studentId) {
                     showNotification('Помилка: ID студента не визначено.', 'error', 'notification-container-tasks'); return;
                 }
                 if (typeof window.openSubmissionModal === 'function') {
                     window.openSubmissionModal(taskId, studentId);
                 } else {
                     console.error('Function openSubmissionModal not found.');
                     showNotification('Не вдалося відкрити форму для здачі завдання.', 'error', 'notification-container-tasks');
                 }
            } else if (targetButton.classList.contains('delete-task') && currentUserInfo?.role === 'admin') {
                const taskTitleElement = taskCard.querySelector('.task-card-title');
                const taskTitle = taskTitleElement ? taskTitleElement.textContent.trim() : `ID: ${taskId}`;
                if (confirm(`Ви впевнені, що хочете видалити завдання "${taskTitle}"? Це також видалить усі пов'язані з ним роботи та дані.`)) {
                    await deleteAssignment(taskId);
                }
            }
        });
    }

    async function initializePage() {
        await fetchCurrentUser();
        if (!currentUserInfo || !currentUserInfo.role) {
            if(noResultsMessageEl) noResultsMessageEl.textContent = 'Помилка завантаження даних користувача. Будь ласка, оновіть сторінку або увійдіть знову.';
            if(noResultsMessageEl) noResultsMessageEl.style.display = 'block';
            if(supervisorTaskSectionsContainer) supervisorTaskSectionsContainer.style.display = 'none';
            if(generalTaskSectionsContainer) generalTaskSectionsContainer.style.display = 'none';
            return;
        }
        updateUIBasedOnRole();
        await fetchStudyGroupsForFilter();
        await fetchAssignmentsData(); // This will call applyFiltersAndRender
        setupEventListeners();
    }

    async function fetchStudyGroupsForFilter() {
         if (!groupFilter || (currentUserInfo && currentUserInfo.role === 'student')) {
            if(groupFilter) groupFilter.style.display = 'none';
            return;
         }
         groupFilter.innerHTML = `<option value="">Завантаження груп...</option>`;
         try {
             // Assuming /api/groups returns all groups and is accessible by admin/supervisor
             const response = await fetch(`${backendUrl}/api/study-groups`, { headers: getAuthHeaders() });
             if (!response.ok) throw new Error(`HTTP ${response.status}`);
             const groups = await response.json();
             groupFilter.innerHTML = `<option value="">Усі групи</option>`;
             groups.forEach(group => {
                 const option = document.createElement('option');
                 option.value = group.group_name; // Filter by name
                 option.textContent = group.group_name;
                 groupFilter.appendChild(option);
             });
         } catch (err) {
             console.error('Помилка при завантаженні груп для фільтра:', err);
             groupFilter.innerHTML = `<option value="">Помилка груп</option>`;
         }
     }

    window.refreshAssignmentsView = fetchAssignmentsData;

    initializePage();
});
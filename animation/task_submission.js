import { getAuthHeaders, showNotification, getUserInfo } from './authUtils.js';

let submissionModalOverlay;
let populateSubmissionModal;
let currentAssignmentId = null;
let currentStudentId = null;
let modalContent;
let dropArea;
let fileInput;
let dropText;
let submitAssignmentBtn;
let saveGradeBtn;
let addSubmissionCommentBtn;
let newSubmissionCommentInput;
let closeSubmissionModalBtn;
let latestSubmissionData = null;
let versionItemGlobal = null;

const backendUrl = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    submissionModalOverlay = document.createElement('div');
    submissionModalOverlay.id = 'submissionModal';
    submissionModalOverlay.className = 'task-form-overlay';
    submissionModalOverlay.style.display = 'none';

    modalContent = document.createElement('div');
    modalContent.className = 'task-detail-modal';

    modalContent.innerHTML = `
        <div class="task-details-modal-header"> <div id="modalSubmissionTitle" class="task-details-title card-title">Відправлення завдання</div> <button id="closeSubmissionModal" class="form-close card-title">&times;</button> </div>
        <div class="task-details-meta">
        <div class="task-details-meta-item"> <span class="info-label pre-title card-large-text">Завдання:</span> <span id="modalAssignmentTitle" class="card-main-text"></span> </div>
        <div class="task-details-meta-item"> <span class="info-label pre-title card-large-text">Студент:</span> <span id="modalStudentName" class="card-main-text"></span> </div>
        <div class="task-details-meta-item"> <span class="info-label pre-title card-large-text">Дедлайн:</span> <span id="modalAssignmentDeadline" class="card-main-text"></span> <span id="modalAssignmentDaysRemaining" class="days-remaining card-main-text"></span> </div>
        <div class="task-details-meta-item"> <span class="info-label pre-title card-large-text">Статус:</span> <span id="modalSubmissionStatus" class="submission-status"></span> </div>
        </div>
        <div class="submission-form task-details-description">
        <label for="submissionLink" class="info-label pre-title link-title card-large-text">Посилання на роботу:</label> <div class="input-group"> <input type="text" id="submissionLink" class="text-input comment-input card-main-text" placeholder="https://..."> </div>
        <div class="input-group"> <label class="info-label or-file-title pre-title card-large-text">Або завантажте файл:</label> <div id="dropArea" class="drop-area"> <p id="dropText">Перетягніть файл сюди або натисніть для вибору</p> <input type="file" id="submissionFile" class="file-input hidden" /> </div> </div>
        <button id="submitAssignmentBtn" class="task-submit-btn card-main-text">Відправити на перевірку</button>
        </div>
        <div class="grade-section task-details-description" id="gradeSection">
        <div class="input-group"> <label for="submissionGrade" class="info-label pre-title card-large-text">Оцінка:</label> <input type="number" id="submissionGrade" min="0" max="100" class="grade-input comment-input" placeholder="0-100"> </div>
        <button id="saveGradeBtn" class="task-submit-btn card-main-text">Зберегти оцінку</button>
        </div>
        <div class="submission-history"> <div class="pre-title submission-history-title card-large-text">Історія відправлень</div> <div id="submissionHistory" class="card-main-text"></div> </div>
        <div class="pre-title comment_title card-large-text">Коментарі до роботи</div>
        <div class="comment-section">
        <div class="comment-form"> <input id="newSubmissionComment" class="comment-input card-main-text" placeholder="Додати коментар..."></input> <button id="addSubmissionCommentBtn" class="comment-submit-btn card-main-text">Відправити</button> </div>
        <div class="comment-list" id="submissionComments"></div>
        </div>
    `;
    submissionModalOverlay.appendChild(modalContent);
    document.body.appendChild(submissionModalOverlay);

    dropArea = document.getElementById('dropArea');
    fileInput = document.getElementById('submissionFile');
    dropText = document.getElementById('dropText');
    submitAssignmentBtn = document.getElementById('submitAssignmentBtn');
    saveGradeBtn = document.getElementById('saveGradeBtn');
    addSubmissionCommentBtn = document.getElementById('addSubmissionCommentBtn');
    newSubmissionCommentInput = document.getElementById('newSubmissionComment');
    closeSubmissionModalBtn = document.getElementById('closeSubmissionModal');

    if(dropArea && fileInput) {
        dropArea.addEventListener('click', () => fileInput.click());
        dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('dragover'); });
        dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault(); dropArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                if(dropText) dropText.textContent = `Обрано файл: ${files[0].name}`;
                const submissionLinkInput = document.getElementById('submissionLink');
                if(submissionLinkInput) submissionLinkInput.value = '';
            }
        });
        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0 && dropText) {
                dropText.textContent = `Обрано файл: ${fileInput.files[0].name}`;
                const submissionLinkInput = document.getElementById('submissionLink');
                if(submissionLinkInput) submissionLinkInput.value = '';
            }
        });
    }

    const submissionLinkInput = document.getElementById('submissionLink');
    if (submissionLinkInput) {
        submissionLinkInput.addEventListener('input', () => {
            if (submissionLinkInput.value.trim() !== '') {
                if(fileInput) fileInput.value = '';
                if(dropText) dropText.textContent = 'Перетягніть файл сюди або натисніть для вибору';
            }
        });
    }

    if(closeSubmissionModalBtn) closeSubmissionModalBtn.addEventListener('click', closeModal);
    if(submissionModalOverlay) submissionModalOverlay.addEventListener('click', (event) => { if (event.target === submissionModalOverlay) closeModal(); });
    if(submitAssignmentBtn) submitAssignmentBtn.addEventListener('click', () => handleSubmitAssignment(null));
    if(saveGradeBtn) saveGradeBtn.addEventListener('click', handleSaveGrade);
    if(addSubmissionCommentBtn) addSubmissionCommentBtn.addEventListener('click', handleAddSubmissionComment);
    if(newSubmissionCommentInput) newSubmissionCommentInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddSubmissionComment(); } });

    populateSubmissionModal = async function(assignment, student, submissionsResponse, currentUserInfoPassed) {
        currentAssignmentId = assignment?.assignment_id;
        latestSubmissionData = submissionsResponse && submissionsResponse.length > 0 ? submissionsResponse[0] : null;

        if (!assignment) {
            showNotification('Помилка: Не вдалося завантажити дані завдання.', 'error');
            return;
        }

        document.getElementById('modalAssignmentTitle').textContent = assignment.title || 'Без назви';

        if (student) {
            document.getElementById('modalStudentName').textContent = `${student.full_name || 'Невідомий'} (ID: ${student.student_id})`;
        } else if (currentUserInfoPassed.role === 'admin') {
            document.getElementById('modalStudentName').textContent = 'Адміністратор';
        } else {
            document.getElementById('modalStudentName').textContent = 'Студент не визначений';
        }

        const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
        document.getElementById('modalAssignmentDeadline').textContent = deadline ? deadline.toLocaleDateString('uk-UA') : 'Не вказано';

        const daysRemainingElement = document.getElementById('modalAssignmentDaysRemaining');
        daysRemainingElement.textContent = '';
        daysRemainingElement.className = 'days-remaining card-main-text';

        const existingWarning = document.getElementById('modalAssignmentDeadline').closest('.task-details-meta-item')?.querySelector('.late-submission-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        if (assignment.days_remaining !== null && typeof assignment.days_remaining !== 'undefined') {
            daysRemainingElement.textContent = ` (${assignment.days_remaining} д.)`;
            if (assignment.days_remaining < 0 && latestSubmissionData?.status?.toLowerCase() !== 'виконано' && latestSubmissionData?.status?.toLowerCase() !== 'прийнято' && latestSubmissionData?.status?.toLowerCase() !== 'зараховано') {
                daysRemainingElement.classList.add('overdue');
            } else if (assignment.days_remaining <= 3 && assignment.days_remaining >=0 && latestSubmissionData?.status?.toLowerCase() !== 'виконано' && latestSubmissionData?.status?.toLowerCase() !== 'прийнято' && latestSubmissionData?.status?.toLowerCase() !== 'зараховано') {
                daysRemainingElement.classList.add('urgent');
            }
        }

        const mainSubmissionLinkInput = document.getElementById('submissionLink');
        const mainFileInput = document.getElementById('submissionFile');
        const mainDropText = document.getElementById('dropText');

        if (mainSubmissionLinkInput) mainSubmissionLinkInput.value = '';
        if (mainFileInput) mainFileInput.value = '';
        if (mainDropText) mainDropText.textContent = 'Перетягніть файл сюди або натисніть для вибору';

        const statusElement = document.getElementById('modalSubmissionStatus');
        const submissionHistoryList = document.getElementById('submissionHistory');
        if(submissionHistoryList) submissionHistoryList.innerHTML = '';
        const commentsSection = document.getElementById('submissionComments');
        if(commentsSection) commentsSection.innerHTML = '';
        const gradeInput = document.getElementById('submissionGrade');
        if(gradeInput) gradeInput.value = '';
        const gradeSection = document.getElementById('gradeSection');
        const mainSubmissionFormElements = document.querySelectorAll('.submission-form input, .submission-form .drop-area');

        modalContent.dataset.assignmentId = currentAssignmentId;
        delete modalContent.dataset.submissionId;

        if (latestSubmissionData && latestSubmissionData.versions && latestSubmissionData.versions.length > 0) {
            const lastVersionDetails = latestSubmissionData.versions[0];
            latestSubmissionData.current_version_number_display = `${lastVersionDetails.major_version}.${lastVersionDetails.minor_version}`;
        }

        if (latestSubmissionData) {
            statusElement.textContent = latestSubmissionData.status || 'Невідомо';
            statusElement.className = `submission-status ${getSubmissionStatusClass(latestSubmissionData.status)}`;
            if (gradeInput && latestSubmissionData.grade !== null) gradeInput.value = latestSubmissionData.grade;
            modalContent.dataset.submissionId = latestSubmissionData.submission_id;
            if (currentStudentId || (currentUserInfoPassed.role === 'admin' && latestSubmissionData.student_id)) {
                 await loadAndRenderHistory(latestSubmissionData.submission_id, assignment, currentUserInfoPassed);
                 await loadAndRenderComments(latestSubmissionData.submission_id);
            } else {
                 if (submissionHistoryList) submissionHistoryList.innerHTML = '<div class="no-history card-main-text">Історія відсутня</div>';
                 if (commentsSection) commentsSection.innerHTML = '<div class="no-comments card-main-text">Коментарі відсутні</div>';
            }
        } else {
            statusElement.textContent = 'Не відправлено';
            statusElement.className = 'submission-status status-pending card-main-text';
            if (submissionHistoryList) submissionHistoryList.innerHTML = '<div class="no-history card-main-text">Історія відправлень відсутня</div>';
            if (commentsSection) commentsSection.innerHTML = '<div class="no-comments card-main-text">Коментарів поки немає</div>';
        }

        const currentUserRole = currentUserInfoPassed?.role || 'student';
        if(gradeSection) gradeSection.style.display = (currentUserRole === 'supervisor' || currentUserRole === 'admin') ? 'block' : 'none';

        const deadlinePassed = assignment.days_remaining < 0;
        const terminalPositiveStatuses = ['прийнято', 'зараховано'];

        const canSubmitNewMajorVersion = currentUserRole === 'student' &&
            (!latestSubmissionData || !terminalPositiveStatuses.includes(latestSubmissionData.status?.toLowerCase()));

        mainSubmissionFormElements.forEach(el => {
            el.disabled = !canSubmitNewMajorVersion;
            el.style.opacity = !canSubmitNewMajorVersion ? 0.6 : 1;
            el.style.cursor = !canSubmitNewMajorVersion ? 'not-allowed' : '';
        });
        if(dropArea) dropArea.style.pointerEvents = !canSubmitNewMajorVersion ? 'none' : '';


        if(submitAssignmentBtn) {
            if (currentUserRole === 'student') {
                if (canSubmitNewMajorVersion) {
                    if (latestSubmissionData && latestSubmissionData.status?.toLowerCase() === 'потребує доопрацювання') {
                        submitAssignmentBtn.textContent = 'Відправити виправлену роботу';
                    } else if (deadlinePassed && (!latestSubmissionData || !terminalPositiveStatuses.includes(latestSubmissionData.status?.toLowerCase()))) {
                        submitAssignmentBtn.textContent = 'Відправити роботу (після дедлайну)';
                        const warningMsg = document.createElement('p');
                        warningMsg.textContent = 'Увага! Термін здачі роботи минув. За здачу із запізненням може бути знижено бал.';
                        warningMsg.style.color = 'red';
                        warningMsg.className = 'late-submission-warning card-main-text';
                        const deadlineMetaItem = document.getElementById('modalAssignmentDeadline').closest('.task-details-meta-item');
                        if (deadlineMetaItem && !deadlineMetaItem.querySelector('.late-submission-warning')) {
                           deadlineMetaItem.appendChild(warningMsg);
                        }
                    } else if (latestSubmissionData) {
                        submitAssignmentBtn.textContent = 'Відправити нову версію';
                    } else {
                        submitAssignmentBtn.textContent = 'Відправити на перевірку';
                    }
                    submitAssignmentBtn.disabled = false;
                } else if (latestSubmissionData && terminalPositiveStatuses.includes(latestSubmissionData.status?.toLowerCase())) {
                    submitAssignmentBtn.textContent = 'Роботу прийнято';
                    submitAssignmentBtn.disabled = true;
                } else {
                     submitAssignmentBtn.textContent = 'Відправка недоступна';
                     submitAssignmentBtn.disabled = true;
                }
            } else if (currentUserRole === 'admin' || currentUserRole === 'supervisor') {
                submitAssignmentBtn.disabled = false;
                submitAssignmentBtn.textContent = modalContent.dataset.submissionId ? 'Оновити роботу студента (як викладач)' : 'Відправити роботу від студента (як викладач)';
            }
        }

        if (currentUserRole === 'admin' && !currentStudentId && submitAssignmentBtn) {
            submitAssignmentBtn.disabled = false;
            submitAssignmentBtn.textContent = 'Завантажити як Адміністратор';
        }
    };

    async function loadAndRenderHistory(submissionId, assignmentData, currentUserInfo) {
        const submissionHistoryList = document.getElementById('submissionHistory');
        if (!submissionHistoryList) return;
        submissionHistoryList.innerHTML = '<div class="card-main-text"><i>Завантаження історії...</i></div>';
        try {
            const response = await fetch(`${backendUrl}/submissions/${submissionId}/versions`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const responseData = await response.json();
            const versions = responseData.versions || (Array.isArray(responseData) ? responseData : []);

            submissionHistoryList.innerHTML = '';
            if (versions.length > 0) {
                versions.forEach(version => {
                    const versionItem = document.createElement('div');
                    versionItem.className = 'submission-version-item';
                    versionItem.dataset.versionId = version.version_id;

                    const versionHeader = document.createElement('div');
                    versionHeader.className = 'submission-version-header card-main-text';
                    const versionNumberDisplay = `${version.major_version || 1}.${version.minor_version || 0}`;
                    versionHeader.innerHTML = `<strong>Версія ${versionNumberDisplay}</strong> - <span>${new Date(version.upload_time).toLocaleString('uk-UA')}</span>`;
                    if (latestSubmissionData && latestSubmissionData.grade !== null && latestSubmissionData.grade !== undefined) {
                        versionHeader.innerHTML += ` <span class="version-grade-display card-main-text" style="font-weight: bold;">(Оцінка: ${latestSubmissionData.grade})</span>`;
                    }

                    const versionContentDiv = document.createElement('div');
                    versionContentDiv.className = 'submission-version-link card-main-text';
                    const contentData = version.file_name;

                    if (contentData) {
                        const isUrl = /^(https?|ftp):\/\//i.test(contentData);
                        let displayText = contentData;
                        let downloadUrl = contentData;

                        if (!isUrl) {
                            displayText = contentData;
                            downloadUrl = `${backendUrl}/api/submissions/file/version/${version.version_id}`;
                            versionContentDiv.innerHTML = `<a href="${downloadUrl}" target="_blank" class="download-link" title="Завантажити ${displayText}">${displayText} <i class="fas fa-download"></i></a>`;
                        } else {
                             displayText = contentData.length > 100 ? contentData.substring(0, 97) + '...' : contentData;
                             versionContentDiv.innerHTML = `<a href="${downloadUrl}" target="_blank" class="external-link card-main-text" title="Перейти за посиланням: ${contentData}">${displayText}</a>`;
                        }
                    } else {
                        versionContentDiv.textContent = 'Дані відсутні для цієї версії';
                    }

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'version-actions';

                    const isStudent = currentUserInfo.role === 'student';
                    const submissionStatus = latestSubmissionData?.status?.toLowerCase();
                    const deadlinePassed = assignmentData.days_remaining < 0;
                    const terminalGradedOrRejectedStatuses = ['прийнято', 'зараховано', 'відхилено', 'перевірено'];

                    let canEditThisVersionAsStudent = isStudent &&
                        (
                            (!terminalGradedOrRejectedStatuses.includes(submissionStatus) && !deadlinePassed) ||
                            submissionStatus === 'потребує доопрацювання'
                        );

                    let canEditThisVersionAsStaff = currentUserInfo.role === 'supervisor' || currentUserInfo.role === 'admin';

                    if (canEditThisVersionAsStudent || canEditThisVersionAsStaff) {
                        const editVersionButton = document.createElement('button');
                        editVersionButton.className = 'button-edit-version card-main-text';
                        editVersionButton.innerHTML = '<i class="fas fa-pencil-alt"></i> Редагувати цю версію';
                        editVersionButton.title = 'Редагувати вміст цієї версії та зберегти як наступну мінорну версію';
                        editVersionButton.onclick = (e) => {
                            e.stopPropagation();
                            versionItemGlobal = versionItem;
                            toggleInlineVersionEditor(versionItem, version, assignmentData, editVersionButton);
                        };
                        actionsDiv.appendChild(editVersionButton);
                    }

                    versionItem.appendChild(versionHeader);
                    versionItem.appendChild(versionContentDiv);
                    versionItem.appendChild(actionsDiv);
                    submissionHistoryList.appendChild(versionItem);
                });
            } else {
                submissionHistoryList.innerHTML = '<div class="no-history card-main-text">Історія відправлень відсутня</div>';
            }
        } catch (error) {
            console.error('Error loading submission history:', error);
            submissionHistoryList.innerHTML = '<div class="no-history card-main-text">Помилка завантаження історії</div>';
        }
    }

    function toggleInlineVersionEditor(versionItem, versionData, assignmentData, editButton) {
        const existingEditor = versionItem.querySelector('.inline-version-editor');
        if (existingEditor) {
            existingEditor.remove();
            if(editButton) editButton.innerHTML = '<i class="fas fa-pencil-alt"></i> Редагувати цю версію';
            return;
        }

        document.querySelectorAll('.inline-version-editor').forEach(editor => editor.remove());
        document.querySelectorAll('.button-edit-version').forEach(btn => btn.innerHTML = '<i class="fas fa-pencil-alt"></i> Редагувати цю версію');

        document.getElementById('submissionLink').value = '';
        document.getElementById('submissionFile').value = '';
        document.getElementById('dropText').textContent = 'Перетягніть файл сюди або натисніть для вибору';

        const editorDiv = document.createElement('div');
        editorDiv.className = 'inline-version-editor task-details-description';

        const versionContent = versionData.file_name;
        const isContentUrl = /^(https?|ftp):\/\//i.test(versionContent);
        const nextMinorVersion = (versionData.minor_version || 0) + 1;

        editorDiv.innerHTML = `
            <div class="inline-editor-header">
                <h4 class="card-main-text">Редагування версії ${versionData.major_version}.${versionData.minor_version}</h4>
                <button class="inline-editor-close card-title">&times;</button>
            </div>
            <div class="input-group">
                <label class="info-label pre-title card-large-text">Нове посилання:</label>
                <input type="text" class="inline-editor-link text-input comment-input card-main-text" placeholder="https://..." value="${isContentUrl ? versionContent : ''}">
            </div>
            <div class="input-group">
                <label class="info-label pre-title card-large-text">Або новий файл:</label>
                <div class="inline-editor-drop-area drop-area">
                    <p class="inline-editor-drop-text card-main-text">${!isContentUrl && versionContent ? `Поточний: ${versionContent}. Перетягніть новий або натисніть.` : 'Перетягніть файл сюди або натисніть для вибору'}</p>
                    <input type="file" class="inline-editor-file file-input hidden" />
                </div>
            </div>
            <button class="inline-editor-save task-submit-btn card-main-text">Зберегти як версію ${versionData.major_version}.${nextMinorVersion}</button>
        `;

        versionItem.appendChild(editorDiv);
        if(editButton) editButton.innerHTML = '<i class="fas fa-times"></i> Закрити редактор';

        const closeButton = editorDiv.querySelector('.inline-editor-close');
        closeButton.onclick = () => {
            editorDiv.remove();
            if(editButton) editButton.innerHTML = '<i class="fas fa-pencil-alt"></i> Редагувати цю версію';
        };

        const linkInput = editorDiv.querySelector('.inline-editor-link');
        const fileInputLocal = editorDiv.querySelector('.inline-editor-file');
        const dropAreaLocal = editorDiv.querySelector('.inline-editor-drop-area');
        const dropTextLocal = editorDiv.querySelector('.inline-editor-drop-text');

        dropAreaLocal.onclick = () => fileInputLocal.click();
        dropAreaLocal.ondragover = (e) => { e.preventDefault(); dropAreaLocal.classList.add('dragover'); };
        dropAreaLocal.ondragleave = () => dropAreaLocal.classList.remove('dragover');
        dropAreaLocal.ondrop = (e) => {
            e.preventDefault(); dropAreaLocal.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInputLocal.files = files;
                dropTextLocal.textContent = `Обрано: ${files[0].name}`;
                linkInput.value = '';
            }
        };
        fileInputLocal.onchange = () => {
            if (fileInputLocal.files.length > 0) {
                dropTextLocal.textContent = `Обрано: ${fileInputLocal.files[0].name}`;
                linkInput.value = '';
            }
        };
        linkInput.oninput = () => {
            if (linkInput.value.trim() !== '') {
                fileInputLocal.value = '';
                dropTextLocal.textContent = 'Перетягніть файл сюди або натисніть для вибору';
            }
        };

        const saveButton = editorDiv.querySelector('.inline-editor-save');
        saveButton.onclick = () => {
            handleSubmitAssignment({
                isInlineEdit: true,
                baseVersionMajor: versionData.major_version,
                baseVersionMinor: versionData.minor_version,
                inlineLink: linkInput.value.trim(),
                inlineFile: fileInputLocal.files[0],
                saveButtonElement: saveButton
            });
        };
    }

    async function loadAndRenderComments(submissionId) {
        const commentsSection = document.getElementById('submissionComments');
        if (!commentsSection) return;
        commentsSection.innerHTML = '<div class="card-main-text"><i>Завантаження коментарів...</i></div>';
        try {
            const response = await fetch(`${backendUrl}/submissions/${submissionId}/comments`, { headers: getAuthHeaders() });
            if (!response.ok) {
                 if (response.status === 404) {
                    commentsSection.innerHTML = '<div class="no-comments card-main-text">Коментарів поки немає</div>';
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const commentsData = await response.json();
            const comments = commentsData.comments || commentsData || [];

            commentsSection.innerHTML = '';
            if (comments.length > 0) {
                comments.forEach(comment => {
                    const commentItem = document.createElement('div'); commentItem.className = 'comment-item';
                    const commentHeader = document.createElement('div'); commentHeader.className = 'comment-header card-main-text';
                    const author = document.createElement('span'); author.className = 'comment-author';
                    author.textContent = comment.author_name || 'Невідомо';
                    const date = document.createElement('span'); date.className = 'comment-date';
                    date.textContent = comment.comment_date ? new Date(comment.comment_date).toLocaleString('uk-UA') :
                                       (comment.timestamp ? new Date(comment.timestamp).toLocaleString('uk-UA') : 'невідомо');
                    commentHeader.appendChild(author); commentHeader.appendChild(date);
                    const commentText = document.createElement('div'); commentText.className = 'comment-text card-main-text'; commentText.textContent = comment.comment_text;
                    commentItem.appendChild(commentHeader); commentItem.appendChild(commentText);
                    commentsSection.appendChild(commentItem);
                });
            } else { commentsSection.innerHTML = '<div class="no-comments card-main-text">Коментарів поки немає</div>'; }
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsSection.innerHTML = '<div class="no-comments card-main-text">Помилка завантаження коментарів</div>';
        }
    }

    function getSubmissionStatusClass(status) {
          const statusLower = status?.toLowerCase() || '';
          if (statusLower.includes('протермін') || statusLower.includes('пізня здача')) return 'status-overdue';
          if (statusLower.includes('прийнято') || statusLower.includes('виконано') || statusLower.includes('зараховано')) return 'status-completed';
          if (statusLower.includes('перевір')) return 'status-in-review';
          if (statusLower.includes('потребує доопрацювання')) return 'status-rework';
          return 'status-pending';
    }

    window.openSubmissionModal = async function(assignmentIdToOpen, studentIdFromCaller) {
        if (!submissionModalOverlay) {
            showNotification('Помилка ініціалізації вікна здачі.', 'error');
            return;
        }
        try {
            const headers = getAuthHeaders();
            if (!headers['Authorization']) {
                showNotification('Помилка автентифікації.', 'error');
                return;
            }

            let localCurrentUserInfo = await getUserInfo();

            if (localCurrentUserInfo && localCurrentUserInfo.account_id) {
                localCurrentUserInfo.userId = localCurrentUserInfo.account_id;
            }

            if (!localCurrentUserInfo || !localCurrentUserInfo.role || !localCurrentUserInfo.userId) {
                showNotification('Помилка: Не вдалося отримати дані поточного користувача.', 'error');
                return;
            }

            currentAssignmentId = assignmentIdToOpen;
            let actualStudentIdToUse = null;
            let studentToDisplay = null;

            if (localCurrentUserInfo.role === 'admin' && !studentIdFromCaller) {
                actualStudentIdToUse = null;
            } else if (localCurrentUserInfo.role === 'student') {
                if (localCurrentUserInfo.userId) {
                    const studentApiUrl = `${backendUrl}/students/${localCurrentUserInfo.userId}`;
                    try {
                        const studentRes = await fetch(studentApiUrl, { headers });
                        if (!studentRes.ok) {
                            let errorMsg = `Не вдалося отримати дані студента (ID акаунту: ${localCurrentUserInfo.userId}). Статус: ${studentRes.status}`;
                            try {
                                const errorData = await studentRes.json();
                                errorMsg = errorData.error || errorMsg;
                            } catch (e) {  }
                            throw new Error(errorMsg);
                        }
                        const studentDataWrapper = await studentRes.json();
                        if (!studentDataWrapper.success || !studentDataWrapper.student) {
                             throw new Error(`Не вдалося отримати об'єкт студента для ID акаунту ${localCurrentUserInfo.userId}. Відповідь: ${JSON.stringify(studentDataWrapper)}`);
                        }
                        studentToDisplay = studentDataWrapper.student;
                        actualStudentIdToUse = studentToDisplay.student_id;
                        localCurrentUserInfo.student_id = actualStudentIdToUse;
                        localCurrentUserInfo.profile = studentToDisplay;
                    } catch (fetchError) {
                        console.error(`Помилка отримання деталей студента (для поточного користувача-студента): ${fetchError.message}`);
                        showNotification(`Помилка отримання даних студента: ${fetchError.message}`, 'error');
                        return;
                    }
                } else {
                    showNotification('Помилка: ID облікового запису студента не визначено.', 'error');
                    return;
                }
            } else if (studentIdFromCaller) {
                try {
                    const studentRes = await fetch(`${backendUrl}/api/students/${studentIdFromCaller}`, { headers });
                     if (!studentRes.ok) {
                        const errorData = await studentRes.text();
                        throw new Error(`Не вдалося отримати дані студента (ID студента: ${studentIdFromCaller}). Статус: ${studentRes.status} - ${errorData}`);
                     }
                     const studentData = await studentRes.json();
                     studentToDisplay = studentData.student || studentData;
                     if (!studentToDisplay || !studentToDisplay.student_id) {
                        throw new Error(`Не вдалося отримати student_id для ID ${studentIdFromCaller}. Відповідь: ${JSON.stringify(studentData)}`);
                     }
                     actualStudentIdToUse = studentToDisplay.student_id;
                } catch (fetchError) {
                    console.error(`Помилка отримання деталей студента за studentIdFromCaller: ${fetchError.message}`);
                    showNotification(`Помилка отримання даних студента (ID: ${studentIdFromCaller}): ${fetchError.message}`, 'error');
                    return;
                }
            }

            if (!actualStudentIdToUse && localCurrentUserInfo.role !== 'admin') {
                showNotification('Не вдалося визначити студента для здачі роботи.', 'error');
                return;
            }
            currentStudentId = actualStudentIdToUse;

            const assignmentRes = await fetch(`${backendUrl}/assignments/${currentAssignmentId}`, { headers });
            if (!assignmentRes.ok) throw new Error(`Assignment fetch failed: ${assignmentRes.status}`);
            const assignmentDataResponse = await assignmentRes.json();
            const assignment = assignmentDataResponse.assignment || assignmentDataResponse;
             if (!assignment) throw new Error('Дані завдання не отримано або вони некоректні.');

            let submissionsDataForModal = [];
            if (currentStudentId) {
                const submissionsRes = await fetch(`${backendUrl}/submissions?assignmentId=${currentAssignmentId}&studentId=${currentStudentId}`, { headers: getAuthHeaders() });
                if (!submissionsRes.ok) {
                    if (submissionsRes.status !== 404) {
                        throw new Error(`Submissions fetch failed: ${submissionsRes.status}`);
                    }
                } else {
                    const rawSubmissionsData = await submissionsRes.json();
                    submissionsDataForModal = Array.isArray(rawSubmissionsData) ? rawSubmissionsData : (rawSubmissionsData.submissions || []);
                }
            }

            populateSubmissionModal(assignment, studentToDisplay, submissionsDataForModal, localCurrentUserInfo);
            if(submissionModalOverlay) submissionModalOverlay.style.display = 'flex';

        } catch (error) {
            console.error('Error opening submission modal:', error);
            if(submissionModalOverlay) submissionModalOverlay.style.display = 'none';
            showNotification(`Помилка завантаження даних для здачі: ${error.message}`, 'error');
        }
    };

    function closeModal() {
        if(submissionModalOverlay) submissionModalOverlay.style.display = 'none';
        document.querySelectorAll('.inline-version-editor').forEach(editor => editor.remove());
        document.querySelectorAll('.button-edit-version').forEach(btn => btn.innerHTML = '<i class="fas fa-pencil-alt"></i> Редагувати цю версію');
        currentAssignmentId = null;
        currentStudentId = null;
        latestSubmissionData = null;
        versionItemGlobal = null;
    }

    async function handleSubmitAssignment(inlineEditData) {
        let localCurrentUserInfo = await getUserInfo();
        if (localCurrentUserInfo && localCurrentUserInfo.account_id) {
            localCurrentUserInfo.userId = localCurrentUserInfo.account_id;
        }

        if (!currentAssignmentId) {
            showNotification('Помилка: Не вдалося визначити завдання.', 'error'); return;
        }

        if (localCurrentUserInfo && localCurrentUserInfo.role !== 'admin' && !currentStudentId) {
             showNotification('Помилка: Не вдалося визначити ID студента для відправки. Перевірте дані користувача.', 'error'); return;
        }

        const submissionIdForRoute = modalContent.dataset.submissionId;

        let finalSubmissionLink = null;
        let finalSubmissionFile = null;
        let isPutRequest = false;

        if (inlineEditData && inlineEditData.isInlineEdit) {
            finalSubmissionLink = inlineEditData.inlineLink;
            finalSubmissionFile = inlineEditData.inlineFile;
            if (submissionIdForRoute) {
                 isPutRequest = true;
            } else {
                showNotification('Помилка: ID здачі не знайдено для inline редагування.', 'error'); return;
            }
        } else {
            const mainSubmissionLinkInput = document.getElementById('submissionLink');
            const mainSubmissionFileInput = document.getElementById('submissionFile');

            finalSubmissionLink = mainSubmissionLinkInput?.value.trim();
            finalSubmissionFile = mainSubmissionFileInput?.files[0];

            if (submissionIdForRoute) {
                 isPutRequest = true;
            } else {
                 isPutRequest = false;
            }
        }

        if (!finalSubmissionLink && !finalSubmissionFile) {
            showNotification('Додайте посилання або файл для відправки завдання', 'warning'); return;
        }

        if (finalSubmissionLink && finalSubmissionFile) {
            showNotification('Будь ласка, надайте або посилання, або файл, не обидва одночасно. Буде використано файл.', 'warning');
            finalSubmissionLink = '';
        }

        const formData = new FormData();
        formData.append('assignmentId', String(currentAssignmentId));

        if (currentStudentId) {
            formData.append('studentId', String(currentStudentId));
        } else if (localCurrentUserInfo && localCurrentUserInfo.role === 'admin') {
            formData.append('adminUpload', 'true');
            if (localCurrentUserInfo.userId) {
                formData.append('adminUserId', String(localCurrentUserInfo.userId));
            } else {
                showNotification('Помилка: Не вдалося визначити ID адміністратора.', 'error'); return;
            }
        }

        if (finalSubmissionLink) {
            formData.append('submissionLink', finalSubmissionLink);
        } else if (finalSubmissionFile) {
            formData.append('submissionFile', finalSubmissionFile);
        }

        let assignmentDeadline;
        try {
            const assignmentRes = await fetch(`${backendUrl}/assignments/${currentAssignmentId}`, { headers: getAuthHeaders() });
            if (!assignmentRes.ok) throw new Error('Failed to fetch assignment details for deadline check.');
            const assignmentDataResponse = await assignmentRes.json();
            const assignment = assignmentDataResponse.assignment || assignmentDataResponse;
            if (!assignment || !assignment.deadline) throw new Error('Assignment deadline not found.');
            assignmentDeadline = new Date(assignment.deadline);
        } catch (e) {
            showNotification(`Помилка отримання дедлайну: ${e.message}`, 'error');
            const btnToReEnable = inlineEditData?.saveButtonElement || submitAssignmentBtn;
            if (btnToReEnable) {btnToReEnable.disabled = false; btnToReEnable.textContent = btnToReEnable.dataset.originalText || "Повторити";}
            return;
        }

        const deadlinePassed = new Date() > assignmentDeadline;

        let isEditModeForBackend = false;
        if (inlineEditData && inlineEditData.isInlineEdit) {
            isEditModeForBackend = true;
        } else if (isPutRequest && submissionIdForRoute) {
            isEditModeForBackend = false;
        }

        let isResubmissionAfterReturn = false;
        if (latestSubmissionData && latestSubmissionData.status) {
            isResubmissionAfterReturn = latestSubmissionData.status.toLowerCase() === 'потребує доопрацювання';
        }

        formData.append('isEditMode', String(isEditModeForBackend));
        formData.append('isResubmissionAfterReturn', String(isResubmissionAfterReturn));
        formData.append('isLateSubmissionByDeadline', String(deadlinePassed));

        let url = `${backendUrl}/submissions`;
        let method = 'POST';

        if (isPutRequest && submissionIdForRoute) {
            url = `${backendUrl}/submissions/${submissionIdForRoute}`;
            method = 'PUT';
        }

        const buttonToDisable = (inlineEditData && inlineEditData.isInlineEdit) ? inlineEditData.saveButtonElement : submitAssignmentBtn;
        const originalButtonText = buttonToDisable ? buttonToDisable.textContent : "Відправити";
        if (buttonToDisable) {
            buttonToDisable.disabled = true;
            buttonToDisable.textContent = 'Відправлення...';
            buttonToDisable.dataset.originalText = originalButtonText;
        }

        try {
            const response = await fetch(url, { method: method, headers: getAuthHeaders(), body: formData });
            const responseData = await response.json();

            if (!response.ok) {
                if (response.status === 409 && method === 'POST' && responseData.submission_id && currentStudentId && !(inlineEditData && inlineEditData.isInlineEdit)) {
                    const updateUrl = `${backendUrl}/submissions/${responseData.submission_id}`;

                    const updateResponse = await fetch(updateUrl, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        body: formData
                    });
                    const updateResponseData = await updateResponse.json();
                    if (!updateResponse.ok) throw new Error(updateResponseData.error || `HTTP помилка при оновленні! Статус: ${updateResponse.status}`);

                    showNotification('Завдання успішно оновлено (попередня здача існувала)', 'success');
                    modalContent.dataset.submissionId = responseData.submission_id;
                } else {
                     throw new Error(responseData.error || `HTTP помилка! Статус: ${response.status} (${response.statusText})`);
                }
            } else {
                showNotification(method === 'POST' ? 'Завдання успішно відправлено' : 'Завдання успішно оновлено', 'success');
                const newSubmissionId = responseData.submission_id || submissionIdForRoute;
                modalContent.dataset.submissionId = newSubmissionId;
            }

            if (inlineEditData && inlineEditData.isInlineEdit && buttonToDisable) {
                const editorContainer = buttonToDisable.closest('.inline-version-editor');
                if (editorContainer) editorContainer.remove();
                if (versionItemGlobal) {
                    const originalEditButton = versionItemGlobal.querySelector('.button-edit-version');
                    if(originalEditButton) originalEditButton.innerHTML = '<i class="fas fa-pencil-alt"></i> Редагувати цю версію';
                    versionItemGlobal = null;
                }
            } else if (!inlineEditData) {
                const mainLinkInput = document.getElementById('submissionLink');
                const mainFileInputEl = document.getElementById('submissionFile');
                const mainDropTextEl = document.getElementById('dropText');
                if(mainLinkInput) mainLinkInput.value = '';
                if(mainFileInputEl) mainFileInputEl.value = '';
                if(mainDropTextEl) mainDropTextEl.textContent = 'Перетягніть файл сюди або натисніть для вибору';
            }
            openSubmissionModal(currentAssignmentId, currentStudentId);
        } catch (error) {
            showNotification(`Помилка відправки: ${error.message}`, 'error');
        } finally {
             if (buttonToDisable) {
                buttonToDisable.disabled = false;
                buttonToDisable.textContent = originalButtonText;
            }
        }
    }

    async function handleSaveGrade() {
        const submissionId = modalContent.dataset.submissionId;
        if (!submissionId) { showNotification('Немає відправлення для оцінювання', 'warning'); return; }
        const grade = document.getElementById('submissionGrade')?.value;
        if (grade === '' || grade === null || isNaN(grade) || parseFloat(grade) < 0 || parseFloat(grade) > 100) {
            showNotification('Введіть коректну оцінку від 0 до 100', 'warning'); return;
        }

        if(saveGradeBtn) {
            saveGradeBtn.disabled = true;
            saveGradeBtn.textContent = 'Збереження...';
        }

        try {
            const response = await fetch(`${backendUrl}/submissions/${submissionId}/grade`, { method: 'PUT', headers: {...getAuthHeaders(), 'Content-Type': 'application/json'}, body: JSON.stringify({ grade: parseFloat(grade) }) });
            if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || `HTTP помилка! Статус: ${response.status}`); }
            const responseData = await response.json();
            showNotification('Оцінка успішно збережена', 'success');
            openSubmissionModal(currentAssignmentId, currentStudentId);
        } catch (error) {
            showNotification(`Помилка при збереженні оцінки: ${error.message}`, 'error');
        } finally {
            if(saveGradeBtn) {
                saveGradeBtn.disabled = false;
                saveGradeBtn.textContent = 'Зберегти оцінку';
            }
        }
    }

    async function handleAddSubmissionComment() {
        const commentText = document.getElementById('newSubmissionComment')?.value.trim();
        if (!commentText) {
            showNotification('Введіть текст коментаря', 'warning');
            return;
        }
        const submissionId = modalContent.dataset.submissionId;
        if (!submissionId) {
            showNotification('Спочатку відправте завдання для додавання коментарів', 'warning');
            return;
        }

        if(addSubmissionCommentBtn) addSubmissionCommentBtn.disabled = true;

        try {
            const response = await fetch(`${backendUrl}/submissions/${submissionId}/comments`, {
                method: 'POST',
                headers: {...getAuthHeaders(), 'Content-Type': 'application/json'},
                body: JSON.stringify({ comment: commentText })
            });
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || `HTTP помилка! Статус: ${response.status}`);
            }
            showNotification('Коментар додано успішно', 'success');
            if(document.getElementById('newSubmissionComment')) document.getElementById('newSubmissionComment').value = '';
            await loadAndRenderComments(submissionId);
        } catch (error) {
            showNotification(`Помилка при додаванні коментаря: ${error.message}`, 'error');
        } finally {
            if(addSubmissionCommentBtn) addSubmissionCommentBtn.disabled = false;
        }
    }

  const style = document.createElement('style');
  style.textContent = `
    .task-details-title {
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
    }
    .task-details-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--color-border);
    }
    .form-close {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--modal-text-primary);
        padding: 0 5px;
        line-height: 1;
        transition: all 0,3s ease;
    }
    .form-close:hover {
        color: var(--color-error);
    }
    .task-details-meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .task-details-meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #submissionLink, #dropArea {
      margin-top: 1rem;
    }
    .pre-title {
      color: var(--modal-text-primary);
      font-weight: 500;
      margin-bottom: 0px;
    }
    .submission-status {
      display: inline-block;
      padding: 4px 8px;
      margin-bottom: 5px;
      margin-top: 5px;
      border-radius: 4px;
      background-color: var(--event-assignment-bg);
      color: var(--color-info);
    }
    .task-details-description {
      margin-top: 8px;
      background-color: var(--secondary-bg-color);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      color: var(--modal-text-primary);
    }
    .input-group {
      margin-bottom: 1rem;
    }
    .text-input {
      border: 2px dashed var(--color-border, #ccc);
    }
    .text-input, .comment-input, .grade-input {
      flex-grow: 1;
      padding: 15px;
      outline: none !important;
      margin-right: 10px;
      border-radius: 10px;
      background-color: var(--main-bg-color);
      backdrop-filter: blur(10px);
      color: var(--color-text);
      transition: all 0.3s ease;
      box-shadow: var(--little-blue-shadow);
      width: 100%;
      border: 1px solid var(--color-border);
      box-sizing: border-box;
    }
    .text-input:hover, .comment-input:hover, .grade-input:hover {
      outline: none;
      box-shadow: var(--blue-shadow);
      border-color: var(--color-primary);
    }
    .text-input:focus, .comment-input:focus, .grade-input:focus {
       border-color: var(--color-primary);
       box-shadow: var(--blue-shadow);
    }
    .drop-area {
      border: 2px dashed var(--color-border, #ccc);
      padding: 20px;
      text-align: center;
      border-radius: 12px;
      background-color: var(--main-bg-color, #f9f9f9);
      transition: background-color 0.3s ease, border-color 0.3s ease;
      cursor: pointer;
    }
    .drop-area.dragover {
      background-color: var(--color-hover, #e0f7fa);
      border-color: var(--color-primary, #00acc1);
    }
    .drop-area p {
      margin: 0;
      color: var(--color-text-light, #555);
    }
    .hidden {
      display: none;
    }
    .file-input {
      width: 100%;
      padding: 8px;
      margin-top: 5px;
    }
    .task-submit-btn {
      align-items: center;
      width: 100%;
      margin-top: 10px;
    }
    .grade-section {
      margin-bottom: 20px;
      display: none;
    }
    .grade-input {
      width: 100%;
      max-width: 120px;
      display: inline-block;
      vertical-align: middle;
       margin-right: 10px;
    }
    #saveGradeBtn {
      width: auto;
       display: inline-block;
       vertical-align: middle;
    }
    .submission-history {
      margin-bottom: 20px;
    }
    .submission-history-title, .comment_title {
        margin-bottom: 0.5rem;
        color: var(--color-text);
        font-weight: 600;
    }
    #submissionHistory, .comment-list {
      background-color: var(--secondary-bg-color);
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
      border: 1px solid var(--color-border-light);
    }
    .submission-version-item {
      padding: 12px;
      border-bottom: 1px solid var(--color-border-light);
      position: relative;
    }
    .submission-version-item:last-child {
      border-bottom: none;
    }
    .submission-version-header {
      margin-bottom: 8px;
    }
     .submission-version-header span {
      color: var(--modal-text-secondary);
      margin-left: 10px;
    }
    .version-actions {
        margin-top: 8px;
    }
    .button-edit-version {
        background-color: var(--color-button-secondary-bg);
        color: var(--color-button-secondary-text);
        border: 1px solid var(--color-button-secondary-border);
        padding: 6px 10px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
    }
    .button-edit-version:hover {
        background-color: var(--color-button-secondary-hover-bg);
    }
    .inline-version-editor {
        margin-top: 10px;
        padding: 15px;
        border: 1px solid var(--color-primary-light);
        border-radius: 8px;
        background-color: var(--main-bg-color);
    }
    .inline-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    .inline-editor-header h4 {
        margin: 0;
    }
    .inline-editor-close {
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        color: var(--modal-text-primary);
    }
    .inline-editor-close:hover {
        color: var(--color-error);
    }

    .comment-form {
      display: flex;
      margin-bottom: 16px;
      align-items: center;
    }
    .comment-input {
      flex-grow: 1;
      margin-right: 10px;
      margin-bottom: 0;
    }
     .comment-submit-btn {
       width: auto;
       padding: 10px 15px;
       height: auto;
       line-height: normal;
     }
    .comment-list {
      padding: 0;
      margin-top: 1rem;
    }
    .comment-item {
      padding: 12px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--color-border-light);
    }
    .comment-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .comment-author {
      font-weight: 500;
      color: var(--modal-text-primary);
    }
    .comment-date {
      color: var(--modal-text-secondary);
    }
    .comment-text {
      word-break: break-word;
    }
    .download-link, .external-link {
      display: inline-block;
      text-decoration: none;
      word-break: break-all;
    }
    .download-link:hover, .external-link:hover {
      text-decoration: underline;
    }
    .download-link i, .external-link i {
       margin-left: 5px;
    }
    .no-history, .no-comments {
      padding: 10px;
      color: var(--modal-text-secondary);
      text-align: center;
    }
    .days-remaining {
      margin-left: 5px;
      color: var(--modal-text-secondary);
    }
    .days-remaining.urgent {
        color: var(--color-warning);
        font-weight: 500;
    }
    .days-remaining.overdue {
        color: var(--color-error);
        font-weight: 500;
    }
    .late-submission-warning {
      color: var(--color-error) !important;
      margin-bottom: 0px;
      margin-top: 0px;
    }

    #notification-container-global .notification,
    #notification-container-tasks .notification {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      max-width: 300px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
      z-index: 1100;
      animation: slideIn 0.3s forwards;
      margin-bottom: 10px;
    }
    #notification-container-global .notification-success,
    #notification-container-tasks .notification-success {
      background-color: var(--color-success);
    }
    #notification-container-global .notification-error,
    #notification-container-tasks .notification-error {
      background-color: var(--color-error);
    }
    #notification-container-global .notification-warning,
    #notification-container-tasks .notification-warning {
      background-color: var(--color-warning);
      color: #333;
    }
     #notification-container-global .notification-info,
     #notification-container-tasks .notification-info {
      background-color: var(--color-info);
    }
    #notification-container-global .notification.hide,
    #notification-container-tasks .notification.hide {
      animation: slideOut 0.5s 0.3s forwards;
    }
    @keyframes slideIn {
      from { transform: translateX(110%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(110%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
});
import { getAuthHeaders, showNotification } from './authUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'assignmentDetailModal';
    modalOverlay.className = 'task-details-modal-overlay';
    modalOverlay.style.display = 'none';

    const modalContent = document.createElement('div');
    modalContent.className = 'task-detail-modal';

    modalContent.innerHTML = `
        <div class="task-details-modal-header"> <div id="modalTaskTitle" class="task-details-title card-title">Деталі завдання</div> <button id="closeAssignmentModal" class="form-close card-main-text">&times;</button> </div>
        <div class="task-details-meta">
        <div class="task-details-meta-item"> <span class="info-label large-card-text">Дедлайн:</span> <span id="modalTaskDeadline" class="card-main-text"></span> <span id="modalTaskDaysRemaining" class="days-remaining card-main-text"></span> </div>
        <div class="task-details-meta-item"> <span class="info-label large-card-text">Опубліковано:</span> <span id="modalTaskPublishedDate" class="card-main-text"></span> </div>
        <div class="task-details-meta-item"> <span class="info-label large-card-text">Групи:</span> <span id="modalTaskGroups" class="card-main-text"></span> </div>
        <div class="task-details-meta-item"> <span class="info-label large-card-text">Тип завдання:</span> <span id="modalTaskType" class="task-type card-main-text"></span> </div>
        <div class="task-details-meta-item"> <span id="modalTaskStatus" class="submission-status card-main-text"></span> </div>
        </div>
        <div class="pre-title description-title large-card-text">Опис:</div>
        <div class="task-details-description"> <div id="modalTaskDescription" class="card-main-text"></div> </div>
        <div class="task-documents-section"> <div class="pre-title doc-title large-card-text">Прикріплені файли:</div> <div id="modalTaskAttachments" class="card-main-text"></div> </div>
        <div class="submission-history"> <div class="pre-title submission-history-title large-card-text">Історія змін</div> <div id="modalTaskHistory" class="card-main-text"></div> </div>
        <div class="pre-title comment_title card-large-text">Коментарі до роботи</div>
        <div class="comment-section">
        <div class="comment-form"> <input id="newCommentText" class="comment-input card-main-text" placeholder="Додати коментар до викокананої роботи..."></input> <button id="addCommentButton" class="comment-submit-btn card-main-text">Відправити</button> </div>
        <div class="comment-list card-main-text" id="modalTaskComments"></div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `.task-details-meta { display: flex; flex-direction: column; gap: 10px; } .task-details-meta-item { display: flex; align-items: center; gap: 8px; }`;
    document.head.appendChild(style);

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    const backendUrl = 'http://localhost:3000';
    let currentAssignmentId = null;

    function openAssignmentModal(assignmentId) {
        currentAssignmentId = assignmentId; // Зберігаємо ID
        const headers = getAuthHeaders();
        if (!headers['Authorization']) {
             showNotification('Помилка автентифікації при завантаженні деталей.', 'error');
             return;
        }
        fetch(`${backendUrl}/assignments/${assignmentId}`, { headers })
            .then(response => {
                if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                return response.json();
            })
            .then(assignment => {
                populateModalWithAssignmentData(assignment);
                modalOverlay.style.display = 'flex';
            })
            .catch(error => {
                console.error('Error fetching assignment details:', error);
                modalOverlay.style.display = 'none';
                showNotification('Помилка завантаження деталей завдання', 'error');
            });
    }

    function populateModalWithAssignmentData(assignment) {
        document.getElementById('modalTaskTitle').textContent = `${assignment.title || 'Без назви'} (#${assignment.assignment_id})`;
        const statusElement = document.getElementById('modalTaskStatus');
        statusElement.textContent = assignment.status || 'Невідомо';
        statusElement.className = 'submission-status card-main-text';
        const statusLower = assignment.status?.toLowerCase() || '';
        if (statusLower.includes('протермін')) statusElement.classList.add('status-overdue');
        else if (statusLower.includes('виконано') || statusLower.includes('прийнято')) statusElement.classList.add('status-completed');
        else if (statusLower.includes('перевір')) statusElement.classList.add('status-in-review');
        else statusElement.classList.add('status-pending');

        const deadline = assignment.deadline ? new Date(assignment.deadline) : null;
        document.getElementById('modalTaskDeadline').textContent = deadline ? deadline.toLocaleDateString('uk-UA') : 'Не вказано';
        const daysRemainingElement = document.getElementById('modalTaskDaysRemaining'); daysRemainingElement.textContent = ''; daysRemainingElement.className = 'days-remaining card-main-text';
        if (assignment.days_remaining !== null && typeof assignment.days_remaining !== 'undefined') {
            daysRemainingElement.textContent = `(${assignment.days_remaining} д.)`;
            if (assignment.days_remaining <= 0 && !(statusLower.includes('виконано') || statusLower.includes('прийнято'))) daysRemainingElement.classList.add('overdue');
            else if (assignment.days_remaining <= 3 && !(statusLower.includes('виконано') || statusLower.includes('прийнято'))) daysRemainingElement.classList.add('urgent');
        }

        const publishDate = assignment.publish_date || assignment.created_at ? new Date(assignment.publish_date || assignment.created_at) : null;
        document.getElementById('modalTaskPublishedDate').textContent = publishDate ? publishDate.toLocaleDateString('uk-UA') : 'Невідомо';
        document.getElementById('modalTaskGroups').textContent = assignment.group_names || 'Для всіх';
        document.getElementById('modalTaskDescription').textContent = assignment.description || 'Опис відсутній.';
        const taskTypeElement = document.getElementById('modalTaskType');
        taskTypeElement.innerHTML = `<span class="type-topic card-main-text">■</span> ${assignment.type || 'Невідомо'}`;
        const attachmentsList = document.getElementById('modalTaskAttachments');
        attachmentsList.innerHTML = '';
        if (assignment.attachments && assignment.attachments.length > 0) {
        assignment.attachments.forEach(att => {
            if (!att || !att.url) return;
            const docItem = document.createElement('div'); docItem.className = 'task-document-item';
            const docIcon = document.createElement('div'); docIcon.className = 'task-document-icon';
            const fileType = getFileTypeFromUrl(att.url); docIcon.innerHTML = `<i class="${getIconClassForFileType(fileType)}"></i>`;
            const docInfo = document.createElement('div'); docInfo.className = 'task-document-info';
            const docName = document.createElement('div'); docName.className = 'task-document-name';
            let fileName = 'Файл'; let linkHref = '#'; let isExternalLink = false;
            try { const urlObj = new URL(att.url); linkHref = att.url; fileName = urlObj.pathname.split('/').pop() || urlObj.hostname; isExternalLink = true; }
            catch (e) { try { let decodedName = decodeURIComponent(att.url.split('/').pop() || ''); if (decodedName) fileName = decodedName; } catch(decodeError) { fileName = att.url.split('/').pop() || 'Файл'; } linkHref = att.url.startsWith('http') ? att.url : `${backendUrl}/uploads/${att.url}`; }
            docName.textContent = fileName;
            const fileSize = document.createElement('div'); fileSize.className = 'task-document-size'; fileSize.textContent = fileType.toUpperCase();
            docInfo.appendChild(docName); docInfo.appendChild(fileSize);
            const downloadBtn = document.createElement('button'); downloadBtn.className = 'task-document-download'; downloadBtn.innerHTML = '<i class="fas fa-download"></i>'; downloadBtn.title = `Завантажити ${fileName}`;
            downloadBtn.addEventListener('click', () => { window.open(linkHref, '_blank'); });
            docItem.appendChild(docIcon); docItem.appendChild(docInfo); docItem.appendChild(downloadBtn);
            attachmentsList.appendChild(docItem);
        });
        } else { attachmentsList.innerHTML = '<div class="task-document-item card-main-text">Немає прикріплених файлів</div>'; }
        const commentsList = document.getElementById('modalTaskComments');
        commentsList.innerHTML = '';
        if (assignment.comments && assignment.comments.length > 0) {
        assignment.comments.forEach(comment => {
            const commentItem = document.createElement('div'); commentItem.className = 'comment-item';
            const commentHeader = document.createElement('div'); commentHeader.className = 'comment-header card-main-text';
            const author = document.createElement('span'); author.className = 'comment-author'; author.textContent = comment.author;
            const date = document.createElement('span'); date.className = 'comment-date'; date.textContent = new Date(comment.date).toLocaleString('uk-UA');
            commentHeader.appendChild(author); commentHeader.appendChild(date);
            const commentText = document.createElement('div'); commentText.className = 'comment-text card-main-text'; commentText.textContent = comment.text;
            commentItem.appendChild(commentHeader); commentItem.appendChild(commentText); commentsList.appendChild(commentItem);
        });
        } else { commentsList.innerHTML = '<div class="comment-item no-comments card-main-text">Коментарів поки немає</div>'; }
        const historyList = document.getElementById('modalTaskHistory');
        historyList.innerHTML = '';
        if (assignment.changes && assignment.changes.length > 0) {
        assignment.changes.forEach(change => {
            const historyItem = document.createElement('div'); historyItem.className = 'submission-item';
            const historyHeader = document.createElement('div'); historyHeader.className = 'submission-header card-main-text';
            const author = document.createElement('span'); author.className = 'comment-author'; author.textContent = change.changed_by;
            const date = document.createElement('span'); date.className = 'comment-date'; date.textContent = new Date(change.date).toLocaleString('uk-UA');
            historyHeader.appendChild(author); historyHeader.appendChild(date);
            const changeText = document.createElement('div'); changeText.className = 'card-main-text'; changeText.textContent = change.description;
            historyItem.appendChild(historyHeader); historyItem.appendChild(changeText); historyList.appendChild(historyItem);
        });
        } else { historyList.innerHTML = '<div class="submission-item card-main-text">Історія змін відсутня</div>'; }
    }

    function getFileTypeFromUrl(url) {
        if(!url) return 'file';
        const extension = url.split('.').pop()?.toLowerCase() || '';
        const fileTypes = { 'pdf': 'pdf', 'doc': 'doc', 'docx': 'doc', 'xls': 'xls', 'xlsx': 'xls', 'ppt': 'ppt', 'pptx': 'ppt', 'txt': 'txt', 'zip': 'zip', 'rar': 'zip', 'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'mp3': 'audio', 'wav': 'audio', 'mp4': 'video', 'avi': 'video', 'mov': 'video' };
        return fileTypes[extension] || 'file';
    }

    function getIconClassForFileType(fileType) {
        const iconClasses = { 'pdf': 'fas fa-file-pdf', 'doc': 'fas fa-file-word', 'xls': 'fas fa-file-excel', 'ppt': 'fas fa-file-powerpoint', 'txt': 'fas fa-file-alt', 'zip': 'fas fa-file-archive', 'image': 'fas fa-file-image', 'audio': 'fas fa-file-audio', 'video': 'fas fa-file-video', 'file': 'fas fa-file' };
        return iconClasses[fileType] || 'fas fa-file';
    }

    function closeModal() { if(modalOverlay) modalOverlay.style.display = 'none'; }

    window.openAssignmentModal = openAssignmentModal;

    document.addEventListener('click', event => {
        const viewTaskBtn = event.target.closest('.view-task');
        if (viewTaskBtn) {
            const taskCard = viewTaskBtn.closest('.task-card');
            const taskId = taskCard?.dataset?.taskId;
            if (taskId) openAssignmentModal(taskId);
        }
        if (event.target.closest('#closeAssignmentModal')) closeModal();
        if (event.target === modalOverlay) closeModal();
    });

    const addCommentButton = document.getElementById('addCommentButton');
    const newCommentTextInput = document.getElementById('newCommentText');

    if(addCommentButton) addCommentButton.addEventListener('click', () => { addComment(); });
    if(newCommentTextInput) newCommentTextInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } });

    function addComment() {
        const commentInput = document.getElementById('newCommentText');
        const commentText = commentInput?.value.trim();
        if (!commentText) { showNotification('Введіть текст коментаря', 'warning'); return; }
        if (containsMaliciousCode(commentText)) { showNotification('Коментар містить потенційно небезпечний код', 'error'); return; }
        if (!currentAssignmentId) { showNotification('Не вдалося визначити ідентифікатор завдання', 'error'); return; }

        const headers = {...getAuthHeaders(), 'Content-Type': 'application/json'};
         if (!headers['Authorization']) {
              showNotification('Помилка автентифікації для додавання коментаря.', 'error');
              return;
         }

        fetch(`${backendUrl}/assignments/${currentAssignmentId}/comments`, { method: 'POST', headers: headers, body: JSON.stringify({ comment: commentText }), })
        .then(response => { if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); } return response.json(); })
        .then(data => {
            if(commentInput) commentInput.value = '';
            showNotification('Коментар додано успішно', 'success');
            const commentsList = document.getElementById('modalTaskComments');
            const noCommentsEl = commentsList?.querySelector('.no-comments');
            if (noCommentsEl) commentsList.innerHTML = '';
            const commentItem = document.createElement('div'); commentItem.className = 'comment-item';
            const commentHeader = document.createElement('div'); commentHeader.className = 'comment-header card-main-text';
            const author = document.createElement('span'); author.className = 'comment-author'; author.textContent = data.comment?.author || 'Ви';
            const date = document.createElement('span'); date.className = 'comment-date'; date.textContent = new Date(data.comment.comment_date).toLocaleString('uk-UA');
            commentHeader.appendChild(author); commentHeader.appendChild(date);
            const commentTextDiv = document.createElement('div'); commentTextDiv.className = 'comment-text card-main-text'; commentTextDiv.textContent = data.comment.comment_text;
            commentItem.appendChild(commentHeader); commentItem.appendChild(commentTextDiv);
            if(commentsList) commentsList.appendChild(commentItem);
        })
        .catch(error => { console.error('Error adding comment:', error); showNotification('Помилка при додаванні коментаря', 'error'); });
    }

    function containsMaliciousCode(text) {
        if (/<script|<\/?[a-z]+[\s>]|javascript:|onerror=|onload=|eval\(|setTimeout\(|setInterval\(|new\s+Function\(|document\.write\(/i.test(text)) return true;
        if (/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|CREATE|WHERE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b|--|;$/i.test(text)) return true;
        return false;
    }

});
document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'assignmentDetailModal';
  modalOverlay.className = 'task-details-modal-overlay';
  modalOverlay.style.display = 'none'; // Hide by default
  
  const modalContent = document.createElement('div');
  modalContent.className = 'task-detail-modal';
  
  modalContent.innerHTML = `
    <div class="task-details-modal-header">
      <div id="modalTaskTitle" class="task-details-title card-title">Деталі завдання</div>
      <button id="closeAssignmentModal" class="form-close card-main-text">&times;</button>
    </div>
    <div class="task-details-meta">
      <div class="task-details-meta-item">
        <span class="info-label large-card-text">Дедлайн:</span>
        <span id="modalTaskDeadline" class="card-main-text"></span>
        <span id="modalTaskDaysRemaining" class="days-remaining card-main-text"></span>
      </div>
      <div class="task-details-meta-item">
        <span class="info-label large-card-text">Опубліковано:</span>
        <span id="modalTaskPublishedDate" class="card-main-text"></span>
      </div>
      <div class="task-details-meta-item">
        <span class="info-label large-card-text">Групи:</span>
        <span id="modalTaskGroups" class="card-main-text"></span>
      </div>
      <div class="task-details-meta-item">
        <span class="info-label large-card-text">Тип завдання:</span>
        <span id="modalTaskType" class="task-type card-main-text"></span>
      </div>
      <div class="task-details-meta-item">
        <span id="modalTaskStatus" class="submission-status card-main-text"></span>
      </div>
    </div>
    
    <div class="pre-title description-title large-card-text">Опис:</div>
    <div class="task-details-description">
      <div id="modalTaskDescription" class="card-main-text"></div>
    </div>

    <div class="task-documents-section">
      <div class="pre-title doc-title large-card-text">Прикріплені файли:</div>
      <div id="modalTaskAttachments" class="card-main-text"></div>
    </div>
    
    <div class="submission-history">
      <div class="pre-title submission-history-title large-card-text">Історія змін</div>
      <div id="modalTaskHistory" class="card-main-text"></div>
    </div>
    
    <div class="pre-title comment_title card-large-text">Коментарі до роботи</div>
    <div class="comment-section">
      <div class="comment-form">
        <input id="newCommentText" class="comment-input card-main-text" placeholder="Додати коментар до викокананої роботи..."></input>
        <button id="addCommentButton" class="comment-submit-btn card-main-text">Відправити</button>
      </div>
      <div class="comment-list card-main-text" id="modalTaskComments"></div>
    </div>
  `;
  
  // Add CSS to make meta items stack vertically
  const style = document.createElement('style');
  style.textContent = `
    .task-details-meta {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .task-details-meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `;
  document.head.appendChild(style);
  
  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
  
  function openAssignmentModal(assignmentId) {
    fetch(`http://localhost:3000/assignments/${assignmentId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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
    document.getElementById('modalTaskTitle').textContent = `${assignment.title} (#${assignment.assignment_id})`;
    
    const statusElement = document.getElementById('modalTaskStatus');
    statusElement.textContent = assignment.status;
    
    switch (assignment.status.toLowerCase()) {
      case 'протерміновано':
        statusElement.style.backgroundColor = 'var(--color-error-light)';
        statusElement.style.color = 'var(--color-error)';
        break;
      case 'виконано':
        statusElement.style.backgroundColor = 'var(--color-success-light)';
        statusElement.style.color = 'var(--color-success)';
        break;
      case 'на перевірці':
        statusElement.style.backgroundColor = 'var(--color-warning-light)';
        statusElement.style.color = 'var(--color-warning)';
        break;
      case 'опубліковано':
      default:
        statusElement.style.backgroundColor = 'var(--event-assignment-bg)';
        statusElement.style.color = 'var(--color-info)';
        break;
    }
    
    const deadline = new Date(assignment.deadline);
    document.getElementById('modalTaskDeadline').textContent = deadline.toLocaleDateString('uk-UA');
    
    const daysRemainingElement = document.getElementById('modalTaskDaysRemaining');
    daysRemainingElement.textContent = `${assignment.days_remaining} днів`;
    if (assignment.days_remaining <= 0) {
      daysRemainingElement.style.color = 'var(--color-error)';
    } else if (assignment.days_remaining <= 3) {
      daysRemainingElement.style.color = 'var(--color-warning)';
    }
    
    const publishDate = new Date(assignment.publish_date || assignment.created_at);
    document.getElementById('modalTaskPublishedDate').textContent = publishDate.toLocaleDateString('uk-UA');
    
    document.getElementById('modalTaskGroups').textContent = assignment.groups || 'Всі групи';
    document.getElementById('modalTaskDescription').textContent = assignment.description;
    
    // Добавляем тип задания с правильным ID
    const taskTypeElement = document.getElementById('modalTaskType');
    taskTypeElement.innerHTML = `<span class="type-topic card-main-text">■</span> ${assignment.type || 'Невідомо'}`;
    
    const attachmentsList = document.getElementById('modalTaskAttachments');
    attachmentsList.innerHTML = '';
    
    if (assignment.attachments && assignment.attachments.length > 0) {
      assignment.attachments.forEach(url => {
        const docItem = document.createElement('div');
        docItem.className = 'task-document-item';
        
        const docIcon = document.createElement('div');
        docIcon.className = 'task-document-icon';
        
        // Determine file type from URL
        const fileType = getFileTypeFromUrl(url);
        const iconClass = getIconClassForFileType(fileType);
        docIcon.innerHTML = `<i class="${iconClass}"></i>`;
        
        const docInfo = document.createElement('div');
        docInfo.className = 'task-document-info';
        
        const docName = document.createElement('div');
        docName.className = 'task-document-name';
        docName.textContent = url.split('/').pop();
        
        const fileSize = document.createElement('div');
        fileSize.className = 'task-document-size';
        fileSize.textContent = fileType.toUpperCase();
        
        docInfo.appendChild(docName);
        docInfo.appendChild(fileSize);
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'task-document-download';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
        downloadBtn.addEventListener('click', () => {
          window.open(url, '_blank');
        });
        
        docItem.appendChild(docIcon);
        docItem.appendChild(docInfo);
        docItem.appendChild(downloadBtn);
        
        attachmentsList.appendChild(docItem);
      });
    } else {
      const noFiles = document.createElement('div');
      noFiles.className = 'task-document-item';
      noFiles.textContent = 'Немає прикріплених файлів';
      attachmentsList.appendChild(noFiles);
    }
    
    const commentsList = document.getElementById('modalTaskComments');
    commentsList.innerHTML = '';
    
    if (assignment.comments && assignment.comments.length > 0) {
      assignment.comments.forEach(comment => {
        const commentItem = document.createElement('div');
        commentItem.className = 'comment-item';
        
        const commentHeader = document.createElement('div');
        commentHeader.className = 'comment-header';
        
        const author = document.createElement('span');
        author.className = 'comment-author';
        author.textContent = comment.author;
        
        const date = document.createElement('span');
        date.className = 'comment-date';
        date.textContent = new Date(comment.date).toLocaleString('uk-UA');
        
        commentHeader.appendChild(author);
        commentHeader.appendChild(date);
        
        const commentText = document.createElement('div');
        commentText.className = 'comment-text';
        // Sanitize comment text to prevent XSS
        commentText.textContent = comment.text;
        
        commentItem.appendChild(commentHeader);
        commentItem.appendChild(commentText);
        commentsList.appendChild(commentItem);
      });
    } else {
      const noComments = document.createElement('div');
      noComments.className = 'comment-item no-comments';
      noComments.textContent = 'Коментарів поки немає';
      commentsList.appendChild(noComments);
    }
    
    const historyList = document.getElementById('modalTaskHistory');
    historyList.innerHTML = '';
    
    if (assignment.changes && assignment.changes.length > 0) {
      assignment.changes.forEach(change => {
        const submissionItem = document.createElement('div');
        submissionItem.className = 'submission-item';
        
        const submissionHeader = document.createElement('div');
        submissionHeader.className = 'submission-header';
        
        const author = document.createElement('span');
        author.className = 'comment-author';
        author.textContent = change.changed_by;
        
        const date = document.createElement('span');
        date.className = 'comment-date';
        date.textContent = new Date(change.date).toLocaleString('uk-UA');
        
        submissionHeader.appendChild(author);
        submissionHeader.appendChild(date);
        
        const changeText = document.createElement('div');
        changeText.textContent = change.description;
        
        submissionItem.appendChild(submissionHeader);
        submissionItem.appendChild(changeText);
        historyList.appendChild(submissionItem);
      });
    } else {
      const noHistory = document.createElement('div');
      noHistory.className = 'submission-item';
      noHistory.textContent = 'Історія змін відсутня';
      historyList.appendChild(noHistory);
    }
  }
  
  function getFileTypeFromUrl(url) {
    const extension = url.split('.').pop().toLowerCase();
    
    const fileTypes = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'doc',
      'xls': 'xls',
      'xlsx': 'xls',
      'ppt': 'ppt',
      'pptx': 'ppt',
      'txt': 'txt',
      'zip': 'zip',
      'rar': 'zip',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'mp3': 'audio',
      'wav': 'audio',
      'mp4': 'video',
      'avi': 'video',
      'mov': 'video'
    };
    
    return fileTypes[extension] || 'file';
  }
  
  function getIconClassForFileType(fileType) {
    const iconClasses = {
      'pdf': 'fas fa-file-pdf',
      'doc': 'fas fa-file-word',
      'xls': 'fas fa-file-excel',
      'ppt': 'fas fa-file-powerpoint',
      'txt': 'fas fa-file-alt',
      'zip': 'fas fa-file-archive',
      'image': 'fas fa-file-image',
      'audio': 'fas fa-file-audio',
      'video': 'fas fa-file-video',
      'file': 'fas fa-file'
    };
    
    return iconClasses[fileType] || 'fas fa-file';
  }
  
  function closeModal() {
    modalOverlay.style.display = 'none';
  }
  
  // Открытие модального окна - экспортируем функцию глобально
  window.openAssignmentModal = openAssignmentModal;
  
  // Add event listeners for opening and closing the modal
  document.addEventListener('click', event => {
    const viewTaskBtn = event.target.closest('.view-task');
    if (viewTaskBtn) {
      const taskCard = viewTaskBtn.closest('.task-card');
      const taskId = taskCard.dataset.taskId;
      openAssignmentModal(taskId);
    }
    
    if (event.target.closest('#closeAssignmentModal')) {
      closeModal();
    }
    
    if (event.target === modalOverlay) {
      closeModal();
    }
  });
  
  // Add event listeners for comment functionality
  document.getElementById('addCommentButton').addEventListener('click', () => {
    addComment();
  });
  
  document.getElementById('newCommentText').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addComment();
    }
  });
  
  function addComment() {
    const commentInput = document.getElementById('newCommentText');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
      showNotification('Введіть текст коментаря', 'warning');
      return;
    }
    
    // Prevent malicious code in comments
    if (containsMaliciousCode(commentText)) {
      showNotification('Коментар містить потенційно небезпечний код', 'error');
      return;
    }
    
    const taskIdMatch = document.getElementById('modalTaskTitle').textContent.match(/#(\d+)/);
    if (!taskIdMatch) {
      showNotification('Не вдалося визначити ідентифікатор завдання', 'error');
      return;
    }
    
    const taskId = taskIdMatch[1];
    
    fetch(`http://localhost:3000/assignments/${taskId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: commentText }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      commentInput.value = '';
      showNotification('Коментар додано успішно', 'success');
      
      const commentsList = document.getElementById('modalTaskComments');
      
      // Remove "no comments" message if present
      const noCommentsEl = commentsList.querySelector('.no-comments');
      if (noCommentsEl) {
        commentsList.innerHTML = '';
      }
      
      const commentItem = document.createElement('div');
      commentItem.className = 'comment-item';
      
      const commentHeader = document.createElement('div');
      commentHeader.className = 'comment-header';
      
      const author = document.createElement('span');
      author.className = 'comment-author';
      author.textContent = 'Ви';
      
      const date = document.createElement('span');
      date.className = 'comment-date';
      date.textContent = new Date().toLocaleString('uk-UA');
      
      commentHeader.appendChild(author);
      commentHeader.appendChild(date);
      
      const commentTextDiv = document.createElement('div');
      commentTextDiv.className = 'comment-text';
      commentTextDiv.textContent = commentText;
      
      commentItem.appendChild(commentHeader);
      commentItem.appendChild(commentTextDiv);
      commentsList.appendChild(commentItem);
    })
    .catch(error => {
      console.error('Error adding comment:', error);
      showNotification('Помилка при додаванні коментаря', 'error');
    });
  }
  
  function containsMaliciousCode(text) {
    // Check for HTML tags or script injection
    if (/<script|<\/?[a-z]+[\s>]|javascript:|onerror=|onload=|eval\(|setTimeout\(|setInterval\(|new\s+Function\(|document\.write\(/i.test(text)) {
      return true;
    }
    
    // Check for SQL injection patterns
    if (/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION|CREATE|WHERE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b|--|;$/i.test(text)) {
      return true;
    }
    
    return false;
  }
  
  function showNotification(message, type = 'info') {
    const notificationContainer = document.createElement('div');
    notificationContainer.classList.add('notification', `notification-${type}`);
    notificationContainer.textContent = message;
    
    document.body.appendChild(notificationContainer);
    
    setTimeout(() => {
      notificationContainer.classList.add('hide');
      setTimeout(() => {
        document.body.removeChild(notificationContainer);
      }, 500);
    }, 3000);
  }
});
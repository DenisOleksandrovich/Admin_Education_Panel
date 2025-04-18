let submissionModalOverlay;
let populateSubmissionModal;

document.addEventListener('DOMContentLoaded', () => {
  submissionModalOverlay = document.createElement('div');
  submissionModalOverlay.id = 'submissionModal';
  submissionModalOverlay.className = 'task-form-overlay';
  submissionModalOverlay.style.display = 'none'; // Hide by default
  
  const modalContent = document.createElement('div');
  modalContent.className = 'task-detail-modal';
  
  modalContent.innerHTML = `
    <div class="task-details-modal-header">
      <div id="modalSubmissionTitle" class="task-details-title card-title">Відправлення завдання</div>
      <button id="closeSubmissionModal" class="form-close card-main-text">&times;</button>
    </div>
    
    <div class="task-details-meta">
      <div class="task-details-meta-item">
        <span class="info-label pre-title card-large-text">Завдання:</span>
        <span id="modalAssignmentTitle" class="card-main-text"></span>
      </div>
      <div class="task-details-meta-item">
        <span class="info-label pre-title card-large-text">Студент:</span>
        <span id="modalStudentName" class="card-main-text"></span>
      </div>
      <div class="task-details-meta-item">
        <span class="info-label pre-title card-large-text">Дедлайн:</span>
        <span id="modalAssignmentDeadline" class="card-main-text"></span>
        <span id="modalAssignmentDaysRemaining" class="days-remaining card-main-text"></span>
      </div>
      <div class="task-details-meta-item">
        <span class="info-label pre-title card-large-text">Статус:</span>
        <span id="modalSubmissionStatus" class="submission-status"></span>
      </div>
    </div>
    
    <div class="submission-form task-details-description">
      <label for="submissionLink" class="info-label pre-title link-title card-large-text">Посилання на роботу:</label>
      <div class="input-group">
        <input type="text" id="submissionLink" class="text-input comment-input card-main-text" placeholder="https://...">
      </div>
    
      <div class="input-group">
        <label class="info-label or-file-title pre-title card-large-text">Або завантажте файл:</label>
        
        <div id="dropArea" class="drop-area">
          <p id="dropText">Перетягніть файл сюди або натисніть для вибору</p>
          <input type="file" id="submissionFile" class="file-input hidden" />
        </div>
      </div>
    
      <button id="submitAssignmentBtn" class="task-submit-btn card-main-text">Відправити на перевірку</button>
    </div>
    
    <div class="grade-section task-details-description" id="gradeSection">
      <div class="input-group">
        <label for="submissionGrade" class="info-label pre-title" card-large-text>Оцінка:</label>
        <input type="number" id="submissionGrade" min="0" max="100" class="grade-input comment-input" placeholder="0-100">
      </div>
      
      <button id="saveGradeBtn" class="task-submit-btn card-main-text">Зберегти оцінку</button>
    </div>
    
    <div class="submission-history">
      <div class="pre-title submission-history-title card-large-text">Історія відправлень</div>
      <div id="submissionHistory" class="card-main-text"></div>
    </div>
    
    <div class="pre-title comment_title card-large-text">Коментарі до роботи</div>
    <div class="comment-section">
      <div class="comment-form">
        <input id="newSubmissionComment" class="comment-input card-main-text" placeholder="Додати коментар..."></input>
        <button id="addSubmissionCommentBtn" class="comment-submit-btn card-main-text">Відправити</button>
      </div>
      <div class="comment-list" id="submissionComments"></div>
    </div>
  `;
  
  // Append modal content to modal overlay
  submissionModalOverlay.appendChild(modalContent);
  
  // Append modal overlay to document body
  document.body.appendChild(submissionModalOverlay);
  
  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    /* Task Submission Modal Styles */
    .task-details-title {
      font-weight: 600;
      color: var(--color-text);
      margin: 0;
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
    
    .text-input, .comment-input {
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
    }
    
    .text-input:hover, .comment-input:hover {
      outline: none;
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
    }
    
    .grade-section {
      margin-bottom: 20px;
      display: none; /* Hidden by default, shown only for teachers */
    }
    
    .grade-input {
      width: 100%;
      max-width: 120px;
    }
    
    .submission-history {
      margin-bottom: 20px;
    }
    
    #submissionHistory {
      background-color: var(--secondary-bg-color);
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
    }
    
    .submission-version-item {
      padding: 12px;
      border-bottom: 1px solid var(--color-border);
    }
    
    .submission-version-item:last-child {
      border-bottom: none;
    }
    
    .submission-version-header {
      margin-bottom: 8px;
    }
    
    .comment-form {
      display: flex;
      margin-bottom: 16px;
    }
    
    .comment-input {
      flex-grow: 1;
      margin-right: 10px;
    }
    
    .comment-list {
      list-style: none;
      padding: 0;
      background-color: var(--secondary-bg-color);
      border-radius: 8px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .comment-item {
      background-color: var(--secondary-bg-color);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--color-border);
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
    
    .download-link {
      display: inline-block;
      margin-left: 10px;
      color: var(--color-primary);
      text-decoration: none;
    }
    
    .download-link:hover {
      text-decoration: underline;
    }
    
    .no-history, .no-comments {
      padding: 10px;
      color: var(--modal-text-secondary);
      text-align: center;
    }
    
    /* Notification styles */
    .notification {
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
    }
    
    .notification-success {
      background-color: var(--color-success);
    }
    
    .notification-error {
      background-color: var(--color-error);
    }
    
    .notification-warning {
      background-color: var(--color-warning);
    }
    
    .notification-info {
      background-color: var(--color-info);
    }
    
    .notification.hide {
      animation: slideOut 0.3s forwards;
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  const dropArea = document.getElementById('dropArea');
  const fileInput = document.getElementById('submissionFile');
  const dropText = document.getElementById('dropText');
  
  // Клик на dropArea = клик на input
  dropArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Drag over
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
  });
  
  // Drag leave
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
  });
  
  // Drop file
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
  
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
  
      dropText.textContent = `Обрано файл: ${files[0].name}`;
    }
  });
  
  // Отображение имени при выборе вручную
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      dropText.textContent = `Обрано файл: ${fileInput.files[0].name}`;
    }
  });
  
  // Save reference to populateSubmissionModal for access in window.openSubmissionModal
  populateSubmissionModal = function(assignment, student, submissions) {
    document.getElementById('modalAssignmentTitle').textContent = assignment.title;
    document.getElementById('modalStudentName').textContent = `${student.last_name} ${student.first_name}`;
    
    const deadline = new Date(assignment.deadline);
    document.getElementById('modalAssignmentDeadline').textContent = deadline.toLocaleDateString('uk-UA');
    
    const daysRemainingElement = document.getElementById('modalAssignmentDaysRemaining');
    daysRemainingElement.textContent = `${assignment.days_remaining} днів`;
    if (assignment.days_remaining <= 0) {
      daysRemainingElement.style.color = 'var(--color-error)';
    } else if (assignment.days_remaining <= 3) {
      daysRemainingElement.style.color = 'var(--color-warning)';
    }
    
    const statusElement = document.getElementById('modalSubmissionStatus');
    
    // Store assignment and student IDs as data attributes for later use
    modalContent.dataset.assignmentId = assignment.assignment_id;
    modalContent.dataset.studentId = student.student_id;
    
    const submissionHistoryList = document.getElementById('submissionHistory');
    submissionHistoryList.innerHTML = '';
    
    const commentsSection = document.getElementById('submissionComments');
    commentsSection.innerHTML = '';
    
    if (submissions.length > 0) {
      const latestSubmission = submissions[0]; // Assuming the most recent is first
      
      statusElement.textContent = latestSubmission.status;
      
      // Apply status styling
      switch (latestSubmission.status.toLowerCase()) {
        case 'протерміновано':
          statusElement.style.backgroundColor = 'var(--color-error-light)';
          statusElement.style.color = 'var(--color-error)';
          break;
        case 'прийнято':
          statusElement.style.backgroundColor = 'var(--color-success-light)';
          statusElement.style.color = 'var(--color-success)';
          break;
        case 'на перевірці':
          statusElement.style.backgroundColor = 'var(--color-warning-light)';
          statusElement.style.color = 'var(--color-warning)';
          break;
        default:
          statusElement.style.backgroundColor = 'var(--color-info-light)';
          statusElement.style.color = 'var(--color-info)';
          break;
      }
      
      // Pre-fill grade if exists
      if (latestSubmission.grade) {
        document.getElementById('submissionGrade').value = latestSubmission.grade;
      } else {
        document.getElementById('submissionGrade').value = '';
      }
      
      // Store submission ID for later use
      modalContent.dataset.submissionId = latestSubmission.submission_id;
      
      // Add submission versions to history
      fetch(`http://localhost:3000/submissions/${latestSubmission.submission_id}/versions`)
        .then(response => response.json())
        .then(versions => {
          if (versions.length > 0) {
            versions.forEach(version => {
              const versionItem = document.createElement('div');
              versionItem.className = 'submission-version-item';
              
              const versionHeader = document.createElement('div');
              versionHeader.className = 'submission-version-header';
              versionHeader.innerHTML = `
                <strong>Версія ${version.version_number}</strong> - 
                <span>${new Date(version.upload_time).toLocaleString('uk-UA')}</span>
              `;
              
              const versionLink = document.createElement('div');
              versionLink.className = 'submission-version-link';
              
              // If it's a URL
              if (version.file_name.startsWith('http')) {
                versionLink.innerHTML = `
                  <a href="${version.file_name}" target="_blank">${version.file_name}</a>
                `;
              } else {
                versionLink.innerHTML = `
                  <span>${version.file_name}</span>
                  <a href="http://localhost:3000/uploads/${version.file_name}" target="_blank" class="download-link">
                    <i class="fas fa-download"></i> Завантажити
                  </a>
                `;
              }
              
              versionItem.appendChild(versionHeader);
              versionItem.appendChild(versionLink);
              submissionHistoryList.appendChild(versionItem);
            });
          } else {
            submissionHistoryList.innerHTML = '<div class="no-history card-main-text">Історія відправлень відсутня</div>';
          }
        });
      
      // Add comments
      fetch(`http://localhost:3000/submissions/${latestSubmission.submission_id}/comments`)
        .then(response => response.json())
        .then(comments => {
          if (comments.length > 0) {
            comments.forEach((comment, index) => {
              const commentItem = document.createElement('div');
              commentItem.className = 'comment-item';
              
              const commentHeader = document.createElement('div');
              commentHeader.className = 'comment-header';
              
              // In a real app, you'd get the author from the comment data
              // For now we'll alternate between teacher and student
              const author = document.createElement('span');
              author.className = 'comment-author';
              author.textContent = index % 2 === 0 ? 'Викладач' : `${student.last_name} ${student.first_name}`;
              
              const date = document.createElement('span');
              date.className = 'comment-date';
              // If the comment has a timestamp, use it; otherwise use current date
              date.textContent = comment.created_at ? 
                new Date(comment.created_at).toLocaleString('uk-UA') : 
                new Date().toLocaleString('uk-UA');
              
              commentHeader.appendChild(author);
              commentHeader.appendChild(date);
              
              const commentText = document.createElement('div');
              commentText.className = 'comment-text';
              commentText.textContent = comment.comment_text;
              
              commentItem.appendChild(commentHeader);
              commentItem.appendChild(commentText);
              commentsSection.appendChild(commentItem);
            });
          } else {
            commentsSection.innerHTML = '<div class="no-comments card-main-text">Коментарів поки немає</div>';
          }
        });
        
    } else {
      // No submission yet
      statusElement.textContent = 'Не відправлено';
      statusElement.style.backgroundColor = 'var(--color-info-light)';
      statusElement.style.color = 'var(--color-info)';
      
      document.getElementById('submissionGrade').value = '';
      submissionHistoryList.innerHTML = '<div class="no-history">Історія відправлень відсутня</div>';
      commentsSection.innerHTML = '<div class="no-comments">Коментарів поки немає</div>';
      
      // Remove submission ID as there is none yet
      delete modalContent.dataset.submissionId;
    }
  };
  
  // Глобальная функция для открытия модального окна
  window.openSubmissionModal = function(assignmentId, studentId) {
    // Проверяем, что модальное окно уже создано
    if (!submissionModalOverlay) {
      console.error('Модальное окно еще не инициализировано');
      return;
    }
    
    // First get assignment details
    fetch(`http://localhost:3000/assignments/${assignmentId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(assignment => {
        // Then get student details and submission data
        Promise.all([
          fetch(`http://localhost:3000/students/${studentId}`).then(res => res.json()),
          fetch(`http://localhost:3000/submissions?assignmentId=${assignmentId}&studentId=${studentId}`).then(res => res.json())
        ])
        .then(([student, submissions]) => {
          populateSubmissionModal(assignment, student, submissions);
          submissionModalOverlay.style.display = 'flex';
          
          // Show or hide grade section based on user role
          const userRole = localStorage.getItem('userRole') || 'student';
          document.getElementById('gradeSection').style.display = userRole === 'teacher' ? 'block' : 'none';
          
          // Disable submission form if already submitted and user is not teacher
          if (submissions.length > 0 && submissions[0].status === 'На перевірці' && userRole === 'student') {
            document.getElementById('submissionLink').disabled = true;
            document.getElementById('submissionFile').disabled = true;
            document.getElementById('submitAssignmentBtn').disabled = true;
          } else {
            document.getElementById('submissionLink').disabled = false;
            document.getElementById('submissionFile').disabled = false;
            document.getElementById('submitAssignmentBtn').disabled = false;
          }
        });
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        submissionModalOverlay.style.display = 'none';
        showNotification('Помилка завантаження даних', 'error');
      });
  };
  
  function closeModal() {
    submissionModalOverlay.style.display = 'none';
  }
  
  // Event Listeners
  document.addEventListener('click', event => {
    // Open modal when clicking on a student submission link
    if (event.target.closest('.view-submission')) {
      const element = event.target.closest('.view-submission');
      const assignmentId = element.dataset.assignmentId;
      const studentId = element.dataset.studentId;
      openSubmissionModal(assignmentId, studentId);
    }
    
    // Close modal
    if (event.target.closest('#closeSubmissionModal') || 
        (event.target.classList.contains('task-form-overlay') && !event.target.closest('.task-detail-modal'))) {
      closeModal();
    }
  });
  
  // Submit assignment
  document.getElementById('submitAssignmentBtn').addEventListener('click', () => {
    const assignmentId = modalContent.dataset.assignmentId;
    const studentId = modalContent.dataset.studentId;
    const submissionId = modalContent.dataset.submissionId;
    const submissionLink = document.getElementById('submissionLink').value.trim();
    const submissionFile = document.getElementById('submissionFile').files[0];
    
    if (!submissionLink && !submissionFile) {
      showNotification('Додайте посилання або файл для відправки завдання', 'warning');
      return;
    }
    
    const formData = new FormData();
    formData.append('assignmentId', assignmentId);
    formData.append('studentId', studentId);
    
    if (submissionLink) {
      formData.append('submissionLink', submissionLink);
    }
    
    if (submissionFile) {
      formData.append('submissionFile', submissionFile);
    }
    
    // If we already have a submission, update it; otherwise create new
    const url = submissionId ? 
      `http://localhost:3000/submissions/${submissionId}` : 
      'http://localhost:3000/submissions';
    
    const method = submissionId ? 'PUT' : 'POST';
    
    fetch(url, {
      method: method,
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      showNotification('Завдання успішно відправлено', 'success');
      
      // Update the modal with the new data
      if (!submissionId) {
        modalContent.dataset.submissionId = data.submission_id;
      }
      
      // Update status
      const statusElement = document.getElementById('modalSubmissionStatus');
      statusElement.textContent = 'На перевірці';
      statusElement.style.backgroundColor = 'var(--color-warning-light)';
      statusElement.style.color = 'var(--color-warning)';
      
      // Clear inputs
      document.getElementById('submissionLink').value = '';
      document.getElementById('submissionFile').value = '';
      
      // Add to history
      const submissionHistoryList = document.getElementById('submissionHistory');
      
      // If there was no history before, clear the "no history" message
      if (submissionHistoryList.querySelector('.no-history')) {
        submissionHistoryList.innerHTML = '';
      }
      
      const versionItem = document.createElement('div');
      versionItem.className = 'submission-version-item';
      
      const versionHeader = document.createElement('div');
      versionHeader.className = 'submission-version-header';
      versionHeader.innerHTML = `
        <strong>Версія ${data.version_number || 1}</strong> - 
        <span>${new Date().toLocaleString('uk-UA')}</span>
      `;
      
      const versionLink = document.createElement('div');
      versionLink.className = 'submission-version-link';
      
      const filename = submissionLink || (submissionFile ? submissionFile.name : 'Файл');
      
      // If it's a URL
      if (submissionLink) {
        versionLink.innerHTML = `
          <a href="${submissionLink}" target="_blank">${submissionLink}</a>
        `;
      } else {
        versionLink.innerHTML = `
          <span>${filename}</span>
          <a href="http://localhost:3000/uploads/${filename}" target="_blank" class="download-link">
            <i class="fas fa-download"></i> Завантажити
          </a>
        `;
      }
      
      versionItem.appendChild(versionHeader);
      versionItem.appendChild(versionLink);
      submissionHistoryList.insertBefore(versionItem, submissionHistoryList.firstChild);
      
      // Disable inputs after submission if student
      const userRole = localStorage.getItem('userRole') || 'student';
      if (userRole === 'student') {
        document.getElementById('submissionLink').disabled = true;
        document.getElementById('submissionFile').disabled = true;
        document.getElementById('submitAssignmentBtn').disabled = true;
      }
    })
    .catch(error => {
      console.error('Error submitting assignment:', error);
      showNotification('Помилка при відправці завдання', 'error');
    });
  });
  
  // Save grade
  document.getElementById('saveGradeBtn').addEventListener('click', () => {
    const submissionId = modalContent.dataset.submissionId;
    if (!submissionId) {
      showNotification('Немає відправлення для оцінювання', 'warning');
      return;
    }
    
    const grade = document.getElementById('submissionGrade').value;
    if (!grade || isNaN(grade) || grade < 0 || grade > 100) {
      showNotification('Введіть коректну оцінку від 0 до 100', 'warning');
      return;
    }
    
    fetch(`http://localhost:3000/submissions/${submissionId}/grade`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ grade: parseInt(grade) })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      showNotification('Оцінка успішно збережена', 'success');
      
      // Update status
      const statusElement = document.getElementById('modalSubmissionStatus');
      statusElement.textContent = 'Прийнято';
      statusElement.style.backgroundColor = 'var(--color-success-light)';
      statusElement.style.color = 'var(--color-success)';
    })
    .catch(error => {
      console.error('Error saving grade:', error);
      showNotification('Помилка при збереженні оцінки', 'error');
    });
  });
  
  // Add comment
  document.getElementById('addSubmissionCommentBtn').addEventListener('click', () => {
    addSubmissionComment();
  });
  
  document.getElementById('newSubmissionComment').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addSubmissionComment();
    }
  });
  
  function addSubmissionComment() {
    const commentInput = document.getElementById('newSubmissionComment');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
      showNotification('Введіть текст коментаря', 'warning');
      return;
    }
    
    const submissionId = modalContent.dataset.submissionId;
    if (!submissionId) {
      showNotification('Спочатку відправте завдання для додавання коментарів', 'warning');
      return;
    }
    
    fetch(`http://localhost:3000/submissions/${submissionId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: commentText })
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
      
      const commentsSection = document.getElementById('submissionComments');
      
      // Remove "no comments" message if present
      if (commentsSection.querySelector('.no-comments')) {
        commentsSection.innerHTML = '';
      }
      
      const commentItem = document.createElement('div');
      commentItem.className = 'comment-item';
      
      const commentHeader = document.createElement('div');
      commentHeader.className = 'comment-header';
      
      const userRole = localStorage.getItem('userRole') || 'student';
      const studentName = document.getElementById('modalStudentName').textContent;
      
      const author = document.createElement('span');
      author.className = 'comment-author';
      author.textContent = userRole === 'teacher' ? 'Викладач' : studentName;
      
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
      commentsSection.appendChild(commentItem);
    })
    .catch(error => {
      console.error('Error adding comment:', error);
      showNotification('Помилка при додаванні коментаря', 'error');
    });
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
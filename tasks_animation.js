document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const elements = {
    // Task Form Elements
    addTaskBtn: document.getElementById('addTaskBtn'),
    taskForm: document.getElementById('newTaskForm'),
    taskFormOverlay: document.getElementById('newTaskFormOverlay'),
    taskFormTitle: document.getElementById('newTaskTitle'),
    closeTaskFormBtn: document.getElementById('closeNewTaskForm'),
    cancelTaskFormBtn: document.getElementById('cancelTaskForm'),
    
    // Task Form Inputs
    taskIdInput: document.getElementById('taskId'),
    taskTitleInput: document.getElementById('taskTitle'),
    taskDescriptionInput: document.getElementById('taskDescription'),
    taskDeadlineInput: document.getElementById('taskDeadline'),
    taskGroupsInput: document.getElementById('taskGroups'),
    taskTypeInput: document.getElementById('taskType'),
    newTaskDocuments: document.getElementById('newTaskDocuments'),
    
    // Task Detail Elements
    taskDetailOverlay: document.getElementById('taskDetailOverlay'),
    closeTaskDetailBtn: document.getElementById('closeTaskDetail'),
    detailTaskTitle: document.getElementById('detailTaskTitle'),
    detailTaskDeadline: document.getElementById('detailTaskDeadline'),
    detailTaskStatus: document.getElementById('detailTaskStatus'),
    detailTaskGroups: document.getElementById('detailTaskGroups'),
    detailTaskDescription: document.getElementById('detailTaskDescription'),
    editDetailedTaskBtn: document.getElementById('editDetailedTaskBtn'),
    
    // Other Elements
    tabButtons: document.querySelectorAll('.tab-button, .filter-button'),
    taskCards: document.querySelectorAll('.task-card'),
    paginationItems: document.querySelectorAll('.pagination-item'),
    viewTaskButtons: document.querySelectorAll('.view-task'),
    editTaskButtons: document.querySelectorAll('.edit-task'),
    deleteTaskButtons: document.querySelectorAll('.delete-task')
  };

  // User Role Configuration
  const userRole = 'student';

  // Notification Function
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

  // Tab and Task Filtering
  function initTabFiltering() {
    elements.tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        const tabType = this.getAttribute('data-filter') || this.getAttribute('data-tab');
        
        elements.tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        filterTasks(tabType);
      });
    });
  }

  function filterTasks(tabType) {
    elements.taskCards.forEach(card => {
      const status = card.querySelector('.task-card-status');
      
      if (tabType === 'all') {
        card.style.display = 'block';
      } else if (tabType === 'pending' && status.classList.contains('status-pending')) {
        card.style.display = 'block';
      } else if (tabType === 'submitted' && status.classList.contains('status-in-review')) {
        card.style.display = 'block';
      } else if (tabType === 'completed' && status.classList.contains('status-completed')) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Task Form Initialization
  function initTaskForm() {
    // Add Task Button
    if (elements.addTaskBtn) {
      elements.addTaskBtn.addEventListener('click', function() {
        resetTaskForm();
        elements.taskFormOverlay.style.display = 'flex';
      });
    }

    // Close Task Form Buttons
    if (elements.closeTaskFormBtn) {
      elements.closeTaskFormBtn.addEventListener('click', closeTaskForm);
    }

    if (elements.cancelTaskFormBtn) {
      elements.cancelTaskFormBtn.addEventListener('click', closeTaskForm);
    }

    // Restrict deadline to future dates
    const today = new Date().toISOString().split('T')[0];
    elements.taskDeadlineInput.setAttribute('min', today);

    // Form Submission
    elements.taskForm.addEventListener('submit', handleTaskFormSubmission);
  }

  function resetTaskForm() {
    elements.taskForm.reset();
    elements.taskIdInput.value = '';
    elements.taskFormTitle.textContent = 'Нове завдання';
    
    // Set default deadline to one week from now
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    elements.taskDeadlineInput.value = oneWeekFromNow.toISOString().split('T')[0];
  }

  function closeTaskForm() {
    elements.taskFormOverlay.style.display = 'none';
  }

  function handleTaskFormSubmission(e) {
    e.preventDefault();
    
    if (!validateTaskForm()) {
      return;
    }
    
    showNotification('Завдання успішно збережено!', 'success');
    updateTaskCardIfEditing();
    closeTaskForm();
  }

  function validateTaskForm() {
    const requiredFields = [
      elements.taskTitleInput, 
      elements.taskDescriptionInput, 
      elements.taskDeadlineInput
    ];

    let isValid = true;
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        field.classList.add('invalid', 'red-shadow');
        isValid = false;
      } else {
        field.classList.remove('invalid', 'red-shadow');
      }
    });

    if (!isValid) {
      showNotification('Будь ласка, заповніть всі обов\'язкові поля', 'error');
    }

    return isValid;
  }

  function updateTaskCardIfEditing() {
    if (elements.taskIdInput.value) {
      const taskCard = document.querySelector(`.task-card[data-task-id="${elements.taskIdInput.value}"]`);
      if (taskCard) {
        const titleEl = taskCard.querySelector('.task-card-title');
        if (titleEl) titleEl.textContent = elements.taskTitleInput.value;
        
        const deadlineEl = taskCard.querySelector('.task-card-deadline');
        if (deadlineEl) {
          const dateObj = new Date(elements.taskDeadlineInput.value);
          const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;
          deadlineEl.textContent = `Дедлайн: ${formattedDate}`;
        }
        
        const descEl = taskCard.querySelector('.task-card-description');
        if (descEl) descEl.textContent = elements.taskDescriptionInput.value;
      }
    } else {
      setTimeout(() => location.reload(), 1000);
    }
  }

  // View Task Details
  function initTaskDetailsView() {
    elements.viewTaskButtons.forEach(button => {
      button.addEventListener('click', function() {
        const taskCard = this.closest('.task-card');
        const taskId = taskCard.getAttribute('data-task-id');
        const taskTitle = taskCard.querySelector('.task-card-title').textContent;
        const taskDeadline = taskCard.querySelector('.task-card-deadline').textContent.replace('Дедлайн: ', '');
        const taskStatus = taskCard.querySelector('.task-card-status').textContent;
        const taskDescription = taskCard.querySelector('.task-card-description').textContent;
        
        populateTaskDetails(taskTitle, taskDeadline, taskStatus, taskDescription);
      });
    });

    if (elements.closeTaskDetailBtn) {
      elements.closeTaskDetailBtn.addEventListener('click', () => {
        elements.taskDetailOverlay.style.display = 'none';
      });
    }

    if (elements.editDetailedTaskBtn) {
      elements.editDetailedTaskBtn.addEventListener('click', editTaskFromDetails);
    }
  }

  function populateTaskDetails(title, deadline, status, description) {
    elements.detailTaskTitle.textContent = title;
    elements.detailTaskDeadline.textContent = deadline;
    elements.detailTaskStatus.textContent = status;
    elements.detailTaskDescription.innerHTML = `<p>${description}</p>`;
    
    elements.taskDetailOverlay.style.display = 'flex';
  }

  function editTaskFromDetails() {
    const taskCard = document.querySelector(`.task-card[data-task-id="${elements.taskIdInput.value}"]`);
    
    elements.taskFormOverlay.style.display = 'flex';
    elements.taskTitleInput.value = taskCard.querySelector('.task-card-title').textContent;
    elements.taskDescriptionInput.value = taskCard.querySelector('.task-card-description').textContent;
    
    const deadlineParts = taskCard.querySelector('.task-card-deadline').textContent.replace('Дедлайн: ', '').split('.');
    const deadlineDate = new Date(`${deadlineParts[2]}-${deadlineParts[1]}-${deadlineParts[0]}`);
    elements.taskDeadlineInput.value = deadlineDate.toISOString().split('T')[0];
    
    elements.taskIdInput.value = taskCard.getAttribute('data-task-id');
    elements.taskFormTitle.textContent = 'Редагування завдання';
  }

  // File Upload Handling
  function initFileUpload() {
    const fileInfo = document.createElement('div');
    fileInfo.id = 'fileInfo';
    fileInfo.classList.add('file-info');
    elements.newTaskDocuments.parentNode.insertBefore(fileInfo, elements.newTaskDocuments.nextSibling);

    elements.newTaskDocuments.addEventListener('change', function(e) {
      const files = e.target.files;
      
      if (files.length > 0) {
        fileInfo.innerHTML = '';
        
        Array.from(files).forEach(file => {
          const fileNameSpan = document.createElement('div');
          fileNameSpan.classList.add('uploaded-file');
          fileNameSpan.innerHTML = `
            <span>${file.name}</span>
            <button type="button" class="remove-file" data-filename="${file.name}">&times;</button>
          `;
          fileInfo.appendChild(fileNameSpan);
        });

        fileInfo.querySelectorAll('.remove-file').forEach(removeBtn => {
          removeBtn.addEventListener('click', function() {
            const filenameToRemove = this.getAttribute('data-filename');
            
            const updatedFiles = Array.from(elements.newTaskDocuments.files)
              .filter(file => file.name !== filenameToRemove);
            
            const dataTransfer = new DataTransfer();
            updatedFiles.forEach(file => dataTransfer.items.add(file));
            
            elements.newTaskDocuments.files = dataTransfer.files;
            
            this.closest('.uploaded-file').remove();
          });
        });
      }
    });
  }

  // Initialization and Page Setup
  function initializePage() {
    // Role-based visibility
    document.querySelectorAll('[data-role="advisor"]').forEach(el => {
      el.style.display = userRole === 'advisor' ? 'block' : 'none';
    });
    
    document.getElementById('studentActions').style.display = userRole === 'student' ? 'flex' : 'none';
    document.getElementById('advisorActions').style.display = userRole === 'advisor' ? 'flex' : 'none';
    
    checkDeadlines();
  }

  function checkDeadlines() {
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    elements.taskCards.forEach(card => {
      const deadlineEl = card.querySelector('.task-card-deadline');
      if (!deadlineEl) return;
      
      const deadlineText = deadlineEl.textContent.replace('Дедлайн: ', '');
      const deadlineParts = deadlineText.split('.');
      const deadlineDate = new Date(`${deadlineParts[2]}-${deadlineParts[1]}-${deadlineParts[0]}`);
      
      if (deadlineDate <= threeDaysFromNow && deadlineDate >= today) {
        deadlineEl.classList.add('urgent');
      }
      
      if (deadlineDate < today) {
        const statusEl = card.querySelector('.task-card-status');
        if (statusEl && statusEl.classList.contains('status-pending')) {
          statusEl.textContent = 'Пропущений термін';
          statusEl.className = 'task-card-status status-overdue';
        }
      }
    });
  }

  // Group Selection
  function initGroupSelection() {
    elements.taskGroupsInput.addEventListener('change', function() {
      Array.from(this.options).forEach(option => {
        option.selected ? option.setAttribute('selected', 'selected') : option.removeAttribute('selected');
      });
    });
  }

  // Pagination
  function initPagination() {
    elements.paginationItems.forEach(item => {
      item.addEventListener('click', function() {
        if (this.classList.contains('active') || this.querySelector('i')) return;
        
        elements.paginationItems.forEach(pg => pg.classList.remove('active'));
        this.classList.add('active');
        
        showNotification(`Завантаження сторінки ${this.textContent}...`);
      });
    });
  }

  // Main Initialization
  function init() {
    initializePage();
    initTabFiltering();
    initTaskForm();
    initTaskDetailsView();
    initFileUpload();
    initGroupSelection();
    initPagination();
  }

  // Start the application
  init();
});
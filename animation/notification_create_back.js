document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const form = document.getElementById('notification-form');
  const titleInput = document.getElementById('title');
  const messageInput = document.getElementById('message');
  const typeSelect = document.getElementById('type');
  const submitButton = document.getElementById('submit-button');
  const notificationAlert = document.getElementById('notification-alert');
  const notificationMessage = document.getElementById('notification-message');
  const previewSection = document.getElementById('preview-section');
  const previewTitle = document.getElementById('preview-title');
  const previewMessage = document.getElementById('preview-message');
  const previewType = document.getElementById('preview-type');
  const previewDate = document.getElementById('preview-date');
  
  // Recipient fields
  const recipientRadios = document.querySelectorAll('input[name="recipientType"]');
  const recipientIndividual = document.getElementById('recipient-individual');
  const recipientGroup = document.getElementById('recipient-group');
  const recipientSupervisor = document.getElementById('recipient-supervisor');
  
  // Form error messages
  const errorElements = {};
  ['title', 'message', 'user_id', 'group_id', 'supervisor_id'].forEach(field => {
    errorElements[field] = document.getElementById(`${field}-error`);
  });
  
  // Current form data
  const formData = {
    type: 'message',
    title: '',
    message: '',
    user_id: '',
    supervisor_id: '',
    group_id: '',
    selectedRecipient: 'individual'
  };
  
  // Input validator class - imported from your code
  class InputValidator {
    static isNumeric(value) {
      return /^\d+$/.test(value);
    }
  
    static hasSQLInjection(value) {
      const sqlPattern = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|REPLACE|EXEC|UNION|XP_)\b|['";`]|--|\/\*/i;
      return sqlPattern.test(value);
    }
  
    static hasXSS(value) {
      const xssPattern = /<script.*?>|<\/script>|javascript:|on\w+=".*?"|<.*?on\w+=.*?>|<iframe.*?>|<img.*?onerror=.*?>/gi;
      return xssPattern.test(value);
    }
  
    static hasHTMLInjection(value) {
      const htmlPattern = /<[^>]+>/g;
      return htmlPattern.test(value);
    }
  
    static hasCommandInjection(value) {
      const cmdPattern = /[;&|]/;
      return cmdPattern.test(value);
    }
  
    static hasPathTraversal(value) {
      return /\.\.\/|\.\.\\/.test(value);
    }
  
    static sanitize(value) {
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(value));
      return div.innerHTML;
    }
  
    static validateInput(value, options = {}) {
      const { numeric = false, required = false, allowHTML = false } = options;
      const trimmed = value.trim();
  
      if (required && trimmed === '') return { valid: false, reason: 'Field is required' };
      if (numeric && trimmed !== '' && !this.isNumeric(trimmed)) return { valid: false, reason: 'Must be a number' };
      if (this.hasSQLInjection(trimmed)) return { valid: false, reason: 'Potential SQL injection detected' };
      if (this.hasXSS(trimmed)) return { valid: false, reason: 'Potential XSS attack detected' };
      if (!allowHTML && this.hasHTMLInjection(trimmed)) return { valid: false, reason: 'HTML content not allowed' };
      if (this.hasCommandInjection(trimmed)) return { valid: false, reason: 'Potential command injection detected' };
      if (this.hasPathTraversal(trimmed)) return { valid: false, reason: 'Potential path traversal detected' };
  
      return { valid: true, value: this.sanitize(trimmed) };
    }
  }
  
  // Function to mark input as invalid
  function markInvalid(element, message) {
    element.classList.add('invalid');
    element.style.boxShadow = 'var(--little-red-shadow)';
    element.style.borderColor = 'var(--danger-color)';
    
    // Display error message if error element exists
    const errorId = `${element.id}-error`;
    if (errorElements[element.id]) {
      errorElements[element.id].textContent = message;
      errorElements[element.id].classList.remove('hidden');
    }
    
    return false;
  }
  
  // Function to mark input as valid
  function markValid(element) {
    element.classList.remove('invalid');
    element.style.boxShadow = '';
    element.style.borderColor = '';
    
    // Hide error message if error element exists
    if (errorElements[element.id]) {
      errorElements[element.id].textContent = '';
      errorElements[element.id].classList.add('hidden');
    }
    
    return true;
  }
  
  // Function to validate a single input
  function validateField(element, options = {}) {
    const { required = false, numeric = false } = options;
    
    // Check if field is empty when required
    if (required && element.value.trim() === '') {
      return markInvalid(element, 'This field is required');
    }
    
    // Check if numeric when needed
    if (numeric && element.value.trim() !== '' && !InputValidator.isNumeric(element.value)) {
      return markInvalid(element, 'Must be a number');
    }
    
    // Check other security validations
    const result = InputValidator.validateInput(element.value, options);
    if (!result.valid) {
      return markInvalid(element, result.reason);
    }
    
    return markValid(element);
  }
  
  // Function to validate all form fields before submission
  function validateForm() {
    let isFormValid = true;
    
    // Always validate title and message
    isFormValid = validateField(titleInput, { required: true }) && isFormValid;
    isFormValid = validateField(messageInput, { required: true }) && isFormValid;
    
    // Validate the appropriate recipient field based on selection
    const selectedRecipient = document.querySelector('input[name="recipientType"]:checked').value;
    
    if (selectedRecipient === 'individual') {
      const userIdInput = document.getElementById('user_id');
      isFormValid = validateField(userIdInput, { required: true }) && isFormValid;
    } else if (selectedRecipient === 'group') {
      const groupIdInput = document.getElementById('group_id');
      isFormValid = validateField(groupIdInput, { required: true }) && isFormValid;
    } else if (selectedRecipient === 'supervisor') {
      const supervisorIdInput = document.getElementById('supervisor_id');
      isFormValid = validateField(supervisorIdInput, { required: true }) && isFormValid;
    }
    
    return isFormValid;
  }
  
  // Mark required fields visually
  function markRequiredFields() {
    const requiredFields = document.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label && !label.classList.contains('required-field')) {
        label.classList.add('required-field');
      }
    });
  }
  
  // Create recipient info displays
  function createRecipientInfoElements() {
    // Create individual student info display
    const studentInfoDisplay = document.createElement('div');
    studentInfoDisplay.id = 'student-info-display';
    studentInfoDisplay.className = 'recipient-info hidden';
    recipientIndividual.appendChild(studentInfoDisplay);
    
    // Create group info display
    const groupInfoDisplay = document.createElement('div');
    groupInfoDisplay.id = 'group-info-display';
    groupInfoDisplay.className = 'recipient-info hidden';
    recipientGroup.appendChild(groupInfoDisplay);
    
    // Create supervisor info display
    const supervisorInfoDisplay = document.createElement('div');
    supervisorInfoDisplay.id = 'supervisor-info-display';
    supervisorInfoDisplay.className = 'recipient-info hidden';
    recipientSupervisor.appendChild(supervisorInfoDisplay);
  }
  
  // Fetch and display recipient info
  async function fetchRecipientInfo(type, value) {
    if (!value.trim()) return;
    
    const isNumeric = InputValidator.isNumeric(value);
    let url = '';
    let displayElement = null;
    
    // Determine the API endpoint and display element based on recipient type
    switch (type) {
      case 'individual':
        url = `http://localhost:3000/api/students/${isNumeric ? 'id' : 'name'}/${encodeURIComponent(value)}`;
        displayElement = document.getElementById('student-info-display');
        break;
      case 'group':
        url = `http://localhost:3000/api/groups/${isNumeric ? 'id' : 'name'}/${encodeURIComponent(value)}`;
        displayElement = document.getElementById('group-info-display');
        break;
      case 'supervisor':
        url = `http://localhost:3000/api/supervisors/${isNumeric ? 'id' : 'name'}/${encodeURIComponent(value)}`;
        displayElement = document.getElementById('supervisor-info-display');
        break;
      default:
        return;
    }
    
    try {
      displayElement.innerHTML = '<p class="loading">Завантаження інформації...</p>';
      displayElement.classList.remove('hidden');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Recipient not found');
      }
      
      const data = await response.json();
      
      // Format and display the recipient info
      if (type === 'individual') {
        const student = data.student;
        displayElement.innerHTML = `
          <div class="recipient-card">
            <h4 class="large-card-text"><strong>Інформація про студента</strong></h4>
            <p class="card-main-text"><strong>ПІБ:</strong> ${student.full_name}</p>
            <p class="card-main-text"><strong>Email:</strong> ${student.email}</p>
            <p class="card-main-text"><strong>Група:</strong> ${student.study_group_id}</p>
            <p class="card-main-text"><strong>ID студента:</strong> ${student.student_id}</p>
          </div>
        `;
        // Update the ID field if name was entered
        if (!isNumeric) {
          document.getElementById('user_id').value = student.student_id;
        }
      } else if (type === 'group') {
        const group = data.group;
        displayElement.innerHTML = `
          <div class="recipient-card">
            <h4 class="large-card-text"><strong>Інформація про групу</strong></h4>
            <p class="card-main-text"><strong>Назва групи:</strong> ${group.group_name}</p>
            <p class="card-main-text"><strong>Спеціальність:</strong> ${group.specialty}</p>
            <p class="card-main-text"><strong>Курс:</strong> ${group.course}</p>
            <p class="card-main-text"><strong>ID групи:</strong> ${group.study_group_id}</p>
          </div>
        `;
        // Update the ID field if name was entered
        if (!isNumeric) {
          document.getElementById('group_id').value = group.study_group_id;
        }
      } else if (type === 'supervisor') {
        const supervisor = data.supervisor;
        displayElement.innerHTML = `
          <div class="recipient-card">
            <h4 class="large-card-text"><strong>Інформація про куратора</strong></h4>
            <p class="card-main-text"><strong>ПІБ:</strong> ${supervisor.full_name}</p>
            <p class="card-main-text"><strong>Email:</strong> ${supervisor.email}</p>
            <p class="card-main-text"><strong>Кафедра:</strong> ${supervisor.department}</p>
            <p class="card-main-text"><strong>Посада:</strong> ${supervisor.position}</p>
            <p class="card-main-text"><strong>ID куратора:</strong> ${supervisor.supervisor_id}</p>
          </div>
        `;
        // Update the ID field if name was entered
        if (!isNumeric) {
          document.getElementById('supervisor_id').value = supervisor.supervisor_id;
        }
      }
    } catch (error) {
      displayElement.innerHTML = `
        <div class="recipient-card error">
          <p class="card-main-text">Отримувача не знайдено. Перевірте введені дані.</p>
        </div>
      `;
    }
  }
  
  // Update input labels and placeholders
  function updateInputLabelsAndPlaceholders() {
    // Update student input
    const userIdLabel = document.querySelector('label[for="user_id"]');
    const userIdInput = document.getElementById('user_id');
    userIdLabel.textContent = 'ID або ПІБ студента';
    userIdInput.placeholder = 'Введіть ID або ПІБ студента';
    
    // Update group input
    const groupIdLabel = document.querySelector('label[for="group_id"]');
    const groupIdInput = document.getElementById('group_id');
    groupIdLabel.textContent = 'ID або назва групи';
    groupIdInput.placeholder = 'Введіть ID або назву групи';
    
    // Update supervisor input
    const supervisorIdLabel = document.querySelector('label[for="supervisor_id"]');
    const supervisorIdInput = document.getElementById('supervisor_id');
    supervisorIdLabel.textContent = 'ID або ПІБ куратора';
    supervisorIdInput.placeholder = 'Введіть ID або ПІБ куратора';
  }
  
  // Add blur event listeners to validate fields when user leaves the field
  titleInput.addEventListener('blur', () => validateField(titleInput, { required: true }));
  messageInput.addEventListener('blur', () => validateField(messageInput, { required: true }));
  
  // Set up recipient search fields
  function setupRecipientSearchFields() {
    // Student search field
    const userIdInput = document.getElementById('user_id');
    userIdInput.addEventListener('blur', function() {
      validateField(this, { required: formData.selectedRecipient === 'individual' });
      if (this.value.trim()) {
        fetchRecipientInfo('individual', this.value);
      } else {
        document.getElementById('student-info-display').classList.add('hidden');
      }
    });
    
    // Group search field
    const groupIdInput = document.getElementById('group_id');
    groupIdInput.addEventListener('blur', function() {
      validateField(this, { required: formData.selectedRecipient === 'group' });
      if (this.value.trim()) {
        fetchRecipientInfo('group', this.value);
      } else {
        document.getElementById('group-info-display').classList.add('hidden');
      }
    });
    
    // Supervisor search field
    const supervisorIdInput = document.getElementById('supervisor_id');
    supervisorIdInput.addEventListener('blur', function() {
      validateField(this, { required: formData.selectedRecipient === 'supervisor' });
      if (this.value.trim()) {
        fetchRecipientInfo('supervisor', this.value);
      } else {
        document.getElementById('supervisor-info-display').classList.add('hidden');
      }
    });
  }
  
  // Handle recipient type change
  recipientRadios.forEach(radio => {
    radio.addEventListener('change', function (e) {
      const selectedType = e.target.value;
      const previousType = formData.selectedRecipient;
      
      // Only proceed if the selection actually changed
      if (selectedType === previousType) return;
      
      formData.selectedRecipient = selectedType;
  
      // Reset required attributes
      document.getElementById('user_id').removeAttribute('required');
      document.getElementById('group_id').removeAttribute('required');
      document.getElementById('supervisor_id').removeAttribute('required');
      
      // Clear validation styling
      markValid(document.getElementById('user_id'));
      markValid(document.getElementById('group_id'));
      markValid(document.getElementById('supervisor_id'));
      
      // Get the currently visible element
      const visibleElement = [recipientIndividual, recipientGroup, recipientSupervisor].find(
        el => !el.classList.contains('hidden')
      );
      
      // Get the element that should be shown based on the selected type
      let elementToShow = null;
      if (selectedType === 'individual') {
        elementToShow = recipientIndividual;
        document.getElementById('user_id').setAttribute('required', '');
      } else if (selectedType === 'group') {
        elementToShow = recipientGroup;
        document.getElementById('group_id').setAttribute('required', '');
      } else if (selectedType === 'supervisor') {
        elementToShow = recipientSupervisor;
        document.getElementById('supervisor_id').setAttribute('required', '');
      }
      
      // If "all" is selected, hide the visible element with animation
      if (selectedType === 'all' && visibleElement) {
        visibleElement.classList.remove('show');
        visibleElement.classList.add('fade-out');
        setTimeout(() => {
          visibleElement.classList.add('hidden');
          visibleElement.classList.remove('fade-in', 'fade-out');
        }, 300);
      }
      // If we're switching from one field to another
      else if (visibleElement && elementToShow && visibleElement !== elementToShow) {
        // Hide the currently visible element
        visibleElement.classList.remove('show');
        visibleElement.classList.add('fade-out');
        
        // After animation completes, hide it and show the new one
        setTimeout(() => {
          visibleElement.classList.add('hidden');
          visibleElement.classList.remove('fade-in', 'fade-out');
          
          // Show the new element with animation
          elementToShow.classList.remove('hidden', 'fade-out');
          elementToShow.classList.add('fade-in');
          setTimeout(() => elementToShow.classList.add('show'), 10);
        }, 300);
      }
      // If we're coming from "all" or initial state to a specific recipient
      else if (elementToShow && (selectedType !== 'all' && !visibleElement)) {
        // Show the new element with animation
        elementToShow.classList.remove('hidden', 'fade-out');
        elementToShow.classList.add('fade-in');
        setTimeout(() => elementToShow.classList.add('show'), 10);
      }
      
      // Update required field markings
      markRequiredFields();
    });
  });
  
  // Add the necessary CSS for animations
  const animationStyle = document.createElement('style');
  animationStyle.textContent = `
    .hidden {
      display: none;
    }
    
    .fade-in {
      display: block;
      opacity: 0;
      max-height: 0;
      transition: all 0.3s ease;
    }
    
    .fade-in.show {
      opacity: 1;
      max-height: 500px;
    }
    
    .fade-out {
      opacity: 0;
      max-height: 0;
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(animationStyle);
  
  // Show preview as user types
  function updatePreview() {
    if (titleInput.value && messageInput.value) {
      previewSection.classList.remove('hidden');
      previewTitle.textContent = titleInput.value;
      previewMessage.textContent = messageInput.value;
      
      // Update type badge
      const type = typeSelect.value;
      previewType.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      
      // Remove all type classes
      previewType.classList.remove('message', 'assignment', 'event', 'grade', 'system');
      // Add the current type class
      previewType.classList.add(type);
      
      // Update date
      previewDate.textContent = new Date().toLocaleString();
    } else {
      previewSection.classList.add('hidden');
    }
  }
  
  // Update preview when inputs change
  titleInput.addEventListener('input', updatePreview);
  messageInput.addEventListener('input', updatePreview);
  typeSelect.addEventListener('change', updatePreview);
  
  // Form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate all required fields before submission
    if (!validateForm()) {
      showNotification('Будь ласка, виправте помилки у формі.', 'error');
      return;
    }
    
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Створення...';
    
    // Collect data from form
    formData.type = typeSelect.value;
    formData.title = InputValidator.sanitize(titleInput.value.trim());
    formData.message = InputValidator.sanitize(messageInput.value.trim());
    
    // Handle different recipient types
    if (formData.selectedRecipient === 'individual') {
      formData.user_id = document.getElementById('user_id').value.trim();
      formData.group_id = null;
      formData.supervisor_id = null;
    } else if (formData.selectedRecipient === 'group') {
      formData.user_id = null;
      formData.group_id = document.getElementById('group_id').value.trim();
      formData.supervisor_id = null;
    } else if (formData.selectedRecipient === 'supervisor') {
      formData.user_id = null;
      formData.group_id = null;
      formData.supervisor_id = document.getElementById('supervisor_id').value.trim();
    } else if (formData.selectedRecipient === 'all') {
      formData.user_id = null;
      formData.group_id = null;
      formData.supervisor_id = null;
    }
    
    // Send data to server
    saveNotification(formData);
  });
  
  // Function to show notification alerts
  function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    notificationAlert.classList.remove('hidden', 'success', 'error');
    notificationAlert.classList.add(type);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      notificationAlert.classList.add('hidden');
    }, 5000);
  }
  
  // Initialize the date in preview
  previewDate.textContent = new Date().toLocaleString();
  
  // Send notification data to server
  function saveNotification(data) {
    fetch('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Server returned an error');
      }
      return response.json();
    })
    .then(result => {
      console.log('Success:', result);
      showNotification('Повідомлення успішно створено!', 'success');
      
      // Reset form
      form.reset();
      formData.selectedRecipient = 'individual';
      previewSection.classList.add('hidden');
      
      // Reset recipient fields and info displays
      recipientIndividual.classList.remove('hidden');
      recipientGroup.classList.add('hidden');
      recipientSupervisor.classList.add('hidden');
      document.querySelectorAll('.recipient-info').forEach(el => el.classList.add('hidden'));
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification('Не вдалося створити повідомлення. Спробуйте ще раз.', 'error');
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'Створити повідомлення';
    });
  }
  
  // Add CSS rule for required field markers
  const style = document.createElement('style');
  style.textContent = `
    .required-field::after {
      content: '*';
      color: var(--danger-color, red);
      margin-left: 4px;
    }
    
    .recipient-info {
      margin-top: 10px;
    }
    
    .recipient-card {
      background-color: var(--secondary-color);
      border-radius: 8px;
      padding: 12px;
      margin-top: 10px;
      box-shadow: var(--little-shadow);
    }
    
    .recipient-card h4 {
      margin-top: 0;
      padding-bottom: 4px;
      margin-bottom: 8px;
      border-bottom: var(--card-border);
    }
    
    .recipient-card p {
      margin: 5px 0;
    }
    
    .recipient-card.error {
      background-color: rgba(var(--danger-color-rgb), 0.1);
      border: 1px solid var(--danger-color);
    }
    
    .loading {
      color: var(--accent-color);
      font-style: italic;
    }
  `;
  document.head.appendChild(style);
  
  // Initialize required field markings
  markRequiredFields();
  
  // Initialize new functionality
  createRecipientInfoElements();
  updateInputLabelsAndPlaceholders();
  setupRecipientSearchFields();
});
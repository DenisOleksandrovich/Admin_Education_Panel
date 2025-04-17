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
      isFormValid = validateField(userIdInput, { required: true, numeric: true }) && isFormValid;
    } else if (selectedRecipient === 'group') {
      const groupIdInput = document.getElementById('group_id');
      isFormValid = validateField(groupIdInput, { required: true, numeric: true }) && isFormValid;
    } else if (selectedRecipient === 'supervisor') {
      const supervisorIdInput = document.getElementById('supervisor_id');
      isFormValid = validateField(supervisorIdInput, { required: true, numeric: true }) && isFormValid;
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
  
  // Add blur event listeners to validate fields when user leaves the field
  titleInput.addEventListener('blur', () => validateField(titleInput, { required: true }));
  messageInput.addEventListener('blur', () => validateField(messageInput, { required: true }));
  
  // Add specific validation for ID fields
  document.getElementById('user_id').addEventListener('blur', function() {
    validateField(this, { required: formData.selectedRecipient === 'individual', numeric: true });
  });
  
  document.getElementById('group_id').addEventListener('blur', function() {
    validateField(this, { required: formData.selectedRecipient === 'group', numeric: true });
  });
  
  document.getElementById('supervisor_id').addEventListener('blur', function() {
    validateField(this, { required: formData.selectedRecipient === 'supervisor', numeric: true });
  });
  
  // Add input event listeners for real-time validation on numeric fields
  document.getElementById('user_id').addEventListener('input', function() {
    if (this.value && !InputValidator.isNumeric(this.value)) {
      markInvalid(this, 'Must be a number');
    } else {
      markValid(this);
    }
  });
  
  document.getElementById('group_id').addEventListener('input', function() {
    if (this.value && !InputValidator.isNumeric(this.value)) {
      markInvalid(this, 'Must be a number');
    } else {
      markValid(this);
    }
  });
  
  document.getElementById('supervisor_id').addEventListener('input', function() {
    if (this.value && !InputValidator.isNumeric(this.value)) {
      markInvalid(this, 'Must be a number');
    } else {
      markValid(this);
    }
  });
  
  // Handle recipient type change
  recipientRadios.forEach(radio => {
    radio.addEventListener('change', function (e) {
      const selectedType = e.target.value;
      formData.selectedRecipient = selectedType;
  
      // First hide all recipient fields
      [recipientIndividual, recipientGroup, recipientSupervisor].forEach(el => {
        el.classList.add('fade-out');
        el.classList.remove('fade-in');
      });
  
      // Reset required attributes
      document.getElementById('user_id').removeAttribute('required');
      document.getElementById('group_id').removeAttribute('required');
      document.getElementById('supervisor_id').removeAttribute('required');
      
      // Clear validation styling
      markValid(document.getElementById('user_id'));
      markValid(document.getElementById('group_id'));
      markValid(document.getElementById('supervisor_id'));
  
      // After animation, show the appropriate recipient field
      setTimeout(() => {
        recipientIndividual.classList.add('hidden');
        recipientGroup.classList.add('hidden');
        recipientSupervisor.classList.add('hidden');
  
        if (selectedType === 'individual') {
          recipientIndividual.classList.remove('hidden', 'fade-out');
          recipientIndividual.classList.add('fade-in');
          document.getElementById('user_id').setAttribute('required', '');
        } else if (selectedType === 'group') {
          recipientGroup.classList.remove('hidden', 'fade-out');
          recipientGroup.classList.add('fade-in');
          document.getElementById('group_id').setAttribute('required', '');
        } else if (selectedType === 'supervisor') {
          recipientSupervisor.classList.remove('hidden', 'fade-out');
          recipientSupervisor.classList.add('fade-in');
          document.getElementById('supervisor_id').setAttribute('required', '');
        }
        
        // Update required field markings
        markRequiredFields();
      }, 200); // Match CSS animation duration
    });
  });
  
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
      showNotification('Please correct the errors in the form.', 'error');
      return;
    }
    
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Creating...';
    
    // Collect data from form
    formData.type = typeSelect.value;
    formData.title = InputValidator.sanitize(titleInput.value.trim());
    formData.message = InputValidator.sanitize(messageInput.value.trim());
    
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
      showNotification('Notification created successfully!', 'success');
      
      // Reset form
      form.reset();
      formData.selectedRecipient = 'individual';
      previewSection.classList.add('hidden');
      
      // Reset recipient fields
      recipientIndividual.classList.remove('hidden');
      recipientGroup.classList.add('hidden');
      recipientSupervisor.classList.add('hidden');
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification('Failed to create notification. Please try again.', 'error');
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'Create Notification';
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
  `;
  document.head.appendChild(style);
  
  // Initialize required field markings
  markRequiredFields();
});
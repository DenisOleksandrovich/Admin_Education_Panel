document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('notification-form');
  const titleInput = document.getElementById('title');
  const messageInput = document.getElementById('message');
  const typeSelect = document.getElementById('type');
  const submitButton = document.getElementById('submit-button');
  const previewSection = document.getElementById('preview-section');
  const previewTitle = document.getElementById('preview-title');
  const previewMessage = document.getElementById('preview-message');
  const previewType = document.getElementById('preview-type');
  const previewDate = document.getElementById('preview-date');
  
  const recipientRadios = document.querySelectorAll('input[name="recipientType"]');
  const recipientIndividual = document.getElementById('recipient-individual');
  const recipientGroup = document.getElementById('recipient-group');
  const recipientSupervisor = document.getElementById('recipient-supervisor');
  
  const errorElements = {};
  ['title', 'message', 'user_id', 'group_id', 'supervisor_id'].forEach(field => {
    errorElements[field] = document.getElementById(`${field}-error`);
  });
  
  const formData = {
    type: 'message',
    title: '',
    message: '',
    user_id: '',
    supervisor_id: '',
    group_id: '',
    selectedRecipient: 'individual'
  };
  
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
  
      if (required && trimmed === '') return { valid: false, reason: 'Поле обов\'язкове для заповнення' };
      if (numeric && trimmed !== '' && !this.isNumeric(trimmed)) return { valid: false, reason: 'Має бути числом' };
      if (this.hasSQLInjection(trimmed)) return { valid: false, reason: 'Виявлено потенційну SQL-ін\'єкцію' };
      if (this.hasXSS(trimmed)) return { valid: false, reason: 'Виявлено потенційну XSS-атаку' };
      if (!allowHTML && this.hasHTMLInjection(trimmed)) return { valid: false, reason: 'HTML-вміст заборонено' };
      if (this.hasCommandInjection(trimmed)) return { valid: false, reason: 'Виявлено потенційну командну ін\'єкцію' };
      if (this.hasPathTraversal(trimmed)) return { valid: false, reason: 'Виявлено потенційний обхід шляху' };
  
      return { valid: true, value: this.sanitize(trimmed) };
    }
  }
  
  function markInvalid(element, message) {
    element.classList.add('invalid');
    element.style.boxShadow = 'var(--little-red-shadow)';
    element.style.borderColor = 'var(--danger-color)';
    
    const errorId = `${element.id}-error`;
    if (errorElements[element.id]) {
      errorElements[element.id].textContent = message;
      errorElements[element.id].classList.remove('hidden');
    }
    
    return false;
  }
  
  function markValid(element) {
    element.classList.remove('invalid');
    element.style.boxShadow = '';
    element.style.borderColor = '';
    
    if (errorElements[element.id]) {
      errorElements[element.id].textContent = '';
      errorElements[element.id].classList.add('hidden');
    }
    
    return true;
  }
  
  function validateField(element, options = {}) {
    const { required = false, numeric = false } = options;
    
    if (required && element.value.trim() === '') {
      return markInvalid(element, 'Це поле є обов\'язковим');
    }
    
    if (numeric && element.value.trim() !== '' && !InputValidator.isNumeric(element.value)) {
      return markInvalid(element, 'Має бути числом');
    }
    
    const result = InputValidator.validateInput(element.value, options);
    if (!result.valid) {
      return markInvalid(element, result.reason);
    }
    
    return markValid(element);
  }
  
  function validateForm() {
    let isFormValid = true;
    
    isFormValid = validateField(titleInput, { required: true }) && isFormValid;
    isFormValid = validateField(messageInput, { required: true }) && isFormValid;
    
    const selectedRecipientRadio = document.querySelector('input[name="recipientType"]:checked');
    if (!selectedRecipientRadio) {
        showGlobalNotification('Будь ласка, оберіть тип одержувача.', 'error');
        return false;
    }
    const selectedRecipient = selectedRecipientRadio.value;
    
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
  
  function markRequiredFields() {
    const requiredFields = document.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label && !label.classList.contains('required-field')) {
        label.classList.add('required-field');
      }
    });
  }
  
  function createRecipientInfoElements() {
    const studentInfoDisplay = document.createElement('div');
    studentInfoDisplay.id = 'student-info-display';
    studentInfoDisplay.className = 'recipient-info hidden';
    recipientIndividual.appendChild(studentInfoDisplay);
    
    const groupInfoDisplay = document.createElement('div');
    groupInfoDisplay.id = 'group-info-display';
    groupInfoDisplay.className = 'recipient-info hidden';
    recipientGroup.appendChild(groupInfoDisplay);
    
    const supervisorInfoDisplay = document.createElement('div');
    supervisorInfoDisplay.id = 'supervisor-info-display';
    supervisorInfoDisplay.className = 'recipient-info hidden';
    recipientSupervisor.appendChild(supervisorInfoDisplay);
  }
  
  async function fetchRecipientInfo(type, value, supervisorIdForValidation = null) {
    if (!value.trim()) return;
    
    const isNumericInput = InputValidator.isNumeric(value);
    let url = '';
    let displayElement = null;
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  
    switch (type) {
      case 'individual':
        url = `http://localhost:3000/api/students/${isNumericInput ? 'id' : 'name'}/${encodeURIComponent(value)}`;
        if (supervisorIdForValidation) {
            url += `?supervisorId=${supervisorIdForValidation}`;
        }
        displayElement = document.getElementById('student-info-display');
        break;
      case 'group':
        url = `http://localhost:3000/api/groups/${isNumericInput ? 'id' : 'name'}/${encodeURIComponent(value)}`;
         if (supervisorIdForValidation) {
            url += `?supervisorId=${supervisorIdForValidation}`;
        }
        displayElement = document.getElementById('group-info-display');
        break;
      case 'supervisor':
        url = `http://localhost:3000/api/supervisors/${isNumericInput ? 'id' : 'name'}/${encodeURIComponent(value)}`;
        displayElement = document.getElementById('supervisor-info-display');
        break;
      default:
        return;
    }
    
    try {
      displayElement.innerHTML = '<p class="loading">Завантаження інформації...</p>';
      displayElement.classList.remove('hidden');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();

      if (!response.ok || (data.success === false && data.error)) {
        throw new Error(data.error || 'Отримувача не знайдено або доступ обмежено');
      }
      
      if (type === 'individual' && data.student) {
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
        if (!isNumericInput) {
          document.getElementById('user_id').value = student.student_id;
        }
      } else if (type === 'group' && data.group) {
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
        if (!isNumericInput) {
          document.getElementById('group_id').value = group.study_group_id;
        }
      } else if (type === 'supervisor' && data.supervisor) {
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
        if (!isNumericInput) {
          document.getElementById('supervisor_id').value = supervisor.supervisor_id;
        }
      } else {
         throw new Error('Некоректні дані від сервера');
      }
    } catch (error) {
      displayElement.innerHTML = `
        <div class="recipient-card error">
          <p class="card-main-text">${error.message || 'Отримувача не знайдено. Перевірте введені дані.'}</p>
        </div>
      `;
    }
  }
  
  function updateInputLabelsAndPlaceholders() {
    const userIdLabel = document.querySelector('label[for="user_id"]');
    const userIdInput = document.getElementById('user_id');
    userIdLabel.textContent = 'ID або ПІБ студента';
    userIdInput.placeholder = 'Введіть ID або ПІБ студента';
    
    const groupIdLabel = document.querySelector('label[for="group_id"]');
    const groupIdInput = document.getElementById('group_id');
    groupIdLabel.textContent = 'ID або назва групи';
    groupIdInput.placeholder = 'Введіть ID або назву групи';
    
    const supervisorIdLabel = document.querySelector('label[for="supervisor_id"]');
    const supervisorIdInput = document.getElementById('supervisor_id');
    supervisorIdLabel.textContent = 'ID або ПІБ куратора';
    supervisorIdInput.placeholder = 'Введіть ID або ПІБ куратора';
  }
  
  titleInput.addEventListener('blur', () => validateField(titleInput, { required: true }));
  messageInput.addEventListener('blur', () => validateField(messageInput, { required: true }));
  
  function setupRecipientSearchFields(userRole, currentUserId) {
    const userIdInput = document.getElementById('user_id');
    userIdInput.addEventListener('blur', function() {
      validateField(this, { required: formData.selectedRecipient === 'individual' });
      if (this.value.trim()) {
        fetchRecipientInfo('individual', this.value, userRole === 'supervisor' ? currentUserId : null);
      } else {
        document.getElementById('student-info-display').classList.add('hidden');
      }
    });
    
    const groupIdInput = document.getElementById('group_id');
    groupIdInput.addEventListener('blur', function() {
      validateField(this, { required: formData.selectedRecipient === 'group' });
      if (this.value.trim()) {
        fetchRecipientInfo('group', this.value, userRole === 'supervisor' ? currentUserId : null);
      } else {
        document.getElementById('group-info-display').classList.add('hidden');
      }
    });
    
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
  
  recipientRadios.forEach(radio => {
    radio.addEventListener('change', function (e) {
      const selectedType = e.target.value;
      const previousType = formData.selectedRecipient;
      
      if (selectedType === previousType) return;
      
      formData.selectedRecipient = selectedType;
  
      document.getElementById('user_id').removeAttribute('required');
      document.getElementById('group_id').removeAttribute('required');
      document.getElementById('supervisor_id').removeAttribute('required');
      
      markValid(document.getElementById('user_id'));
      markValid(document.getElementById('group_id'));
      markValid(document.getElementById('supervisor_id'));
      
      const visibleElement = [recipientIndividual, recipientGroup, recipientSupervisor].find(
        el => !el.classList.contains('hidden')
      );
      
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
      
      if (selectedType === 'all' && visibleElement) {
        visibleElement.classList.remove('show');
        visibleElement.classList.add('fade-out');
        setTimeout(() => {
          visibleElement.classList.add('hidden');
          visibleElement.classList.remove('fade-in', 'fade-out');
        }, 300);
      }
      else if (visibleElement && elementToShow && visibleElement !== elementToShow) {
        visibleElement.classList.remove('show');
        visibleElement.classList.add('fade-out');
        
        setTimeout(() => {
          visibleElement.classList.add('hidden');
          visibleElement.classList.remove('fade-in', 'fade-out');
          
          elementToShow.classList.remove('hidden', 'fade-out');
          elementToShow.classList.add('fade-in');
          setTimeout(() => elementToShow.classList.add('show'), 10);
        }, 300);
      }
      else if (elementToShow && (selectedType !== 'all' && !visibleElement)) {
        elementToShow.classList.remove('hidden', 'fade-out');
        elementToShow.classList.add('fade-in');
        setTimeout(() => elementToShow.classList.add('show'), 10);
      }
      
      markRequiredFields();
    });
  });
  
  const animationStyle = document.createElement('style');
  animationStyle.textContent = `
    .hidden { display: none; }
    .fade-in { display: block; opacity: 0; max-height: 0; transition: all 0.3s ease; }
    .fade-in.show { opacity: 1; max-height: 500px; }
    .fade-out { opacity: 0; max-height: 0; transition: all 0.3s ease; }
  `;
  document.head.appendChild(animationStyle);
  
  function updatePreview() {
    if (titleInput.value && messageInput.value) {
      previewSection.classList.remove('hidden');
      previewTitle.textContent = titleInput.value;
      previewMessage.textContent = messageInput.value;
      
      const type = typeSelect.value;
      previewType.textContent = type.charAt(0).toUpperCase() + type.slice(1);
      
      previewType.classList.remove('message', 'assignment', 'event', 'grade', 'system');
      previewType.classList.add(type);
      
      previewDate.textContent = new Date().toLocaleString();
    } else {
      previewSection.classList.add('hidden');
    }
  }
  
  titleInput.addEventListener('input', updatePreview);
  messageInput.addEventListener('input', updatePreview);
  typeSelect.addEventListener('change', updatePreview);
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!validateForm()) {
      showGlobalNotification('Будь ласка, виправте помилки у формі.', 'error');
      return;
    }
    
    submitButton.disabled = true;
    submitButton.textContent = 'Створення...';
    
    formData.type = typeSelect.value;
    formData.title = InputValidator.sanitize(titleInput.value.trim());
    formData.message = InputValidator.sanitize(messageInput.value.trim());
    
    const selectedRecipientValue = document.querySelector('input[name="recipientType"]:checked').value;

    if (selectedRecipientValue === 'individual') {
      formData.user_id = document.getElementById('user_id').value.trim();
      formData.group_id = null;
      formData.supervisor_id = null;
    } else if (selectedRecipientValue === 'group') {
      formData.user_id = null;
      formData.group_id = document.getElementById('group_id').value.trim();
      formData.supervisor_id = null;
    } else if (selectedRecipientValue === 'supervisor') {
      formData.user_id = null;
      formData.group_id = null;
      formData.supervisor_id = document.getElementById('supervisor_id').value.trim();
    } else if (selectedRecipientValue === 'all') {
      formData.user_id = null;
      formData.group_id = null;
      formData.supervisor_id = null;
    }
    formData.recipientType = selectedRecipientValue; 
    
    saveNotification(formData);
  });
  
  function showGlobalNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '10000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s ease-in-out';

    if (type === 'success') {
        notification.style.backgroundColor = 'rgb(212, 237, 218)';
        notification.style.color = 'rgb(21, 87, 36)';
    } else if (type === 'error') {
        notification.style.backgroundColor = 'rgb(248, 215, 218)';
        notification.style.color = 'rgb(114, 28, 36)';
    }
    document.body.appendChild(notification);
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
    });
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 5000);
  }
  
  previewDate.textContent = new Date().toLocaleString();
  
  function saveNotification(data) {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    fetch('http://localhost:3000/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw new Error(err.error || 'Сервер повернув помилку') });
      }
      return response.json();
    })
    .then(result => {
      showGlobalNotification('Повідомлення успішно створено!', 'success');
      
      form.reset();
      document.querySelector('input[name="recipientType"][value="individual"]').checked = true;
      formData.selectedRecipient = 'individual';
      previewSection.classList.add('hidden');
      
      recipientGroup.classList.add('hidden');
      recipientSupervisor.classList.add('hidden');
      recipientIndividual.classList.remove('hidden');
      recipientIndividual.classList.add('show');

      document.querySelectorAll('.recipient-info').forEach(el => {
          el.classList.add('hidden');
          el.innerHTML = '';
      });
      markRequiredFields();
    })
    .catch(error => {
      showGlobalNotification(error.message || 'Не вдалося створити повідомлення. Спробуйте ще раз.', 'error');
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = 'Створити повідомлення';
    });
  }
  
  const style = document.createElement('style');
  style.textContent = `
    .required-field::after { content: '*'; color: var(--danger-color, red); margin-left: 4px; }
    .recipient-info { margin-top: 10px; }
    .recipient-card { background-color: var(--secondary-color); border-radius: 8px; padding: 12px; margin-top: 10px; box-shadow: var(--little-shadow); }
    .recipient-card h4 { margin-top: 0; padding-bottom: 4px; margin-bottom: 8px; border-bottom: var(--card-border); }
    .recipient-card p { margin: 5px 0; }
    .recipient-card.error { background-color: rgba(var(--danger-color-rgb), 0.1); border: 1px solid var(--danger-color); }
    .loading { color: var(--accent-color); font-style: italic; }
  `;
  document.head.appendChild(style);
 
  async function initializeFormForUserRole() {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (!token) {
        document.body.innerHTML = '<h1>Доступ заборонено. Будь ласка, авторизуйтесь.</h1>';
        if (form) form.style.display = 'none';
        return;
    }

    if (form) {
        form.style.display = 'block';
    } else {
        console.error("FATAL: Елемент форми (form) не знайдено на сторінці notification_create.html!");
        document.body.innerHTML = '<h1>Помилка конфігурації сторінки. Зверніться до адміністратора.</h1>';
        return;
    }

    try {
        const backendUrl = 'http://localhost:3000'; 
        const response = await fetch(`${backendUrl}/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({error: `Не вдалося завантажити профіль. Статус: ${response.status}`}));
             throw new Error(errorData.error || `Помилка завантаження профілю: ${response.statusText}`);
        }
        const userData = await response.json();
        
        console.log('User Data from /api/user/profile:', JSON.stringify(userData, null, 2));

        if (!userData || !userData.account) {
            throw new Error('Дані облікового запису користувача не знайдено у відповіді від сервера.');
        }

        const userRole = userData.account.role;
        const accountId = userData.account.accountId; 

        let currentUserId = accountId; 
        if (userRole === 'supervisor') {
            if (userData.profile && userData.profile.supervisor_id) {
                currentUserId = userData.profile.supervisor_id;
            } else {
                console.warn('ID куратора (supervisor_id) не знайдено в профілі для користувача з роллю supervisor. Використовується accountId.');
            }
        }
        
        console.log(`Role: ${userRole}, AccountID: ${accountId}, CurrentUserID (for logic): ${currentUserId}`);

        const recipientSupervisorRadioLabel = document.querySelector('input[name="recipientType"][value="supervisor"]')?.closest('label');
        const recipientAllRadioLabel = document.querySelector('input[name="recipientType"][value="all"]')?.closest('label');

        if (userRole === 'student') {
            document.body.innerHTML = '<h1>Створення оголошень для студентів заборонено.</h1>';
            if (form) form.style.display = 'none';
            const addBtnOnNotificationPage = parent.document.getElementById('addNottificationBtn');
            if(addBtnOnNotificationPage) addBtnOnNotificationPage.style.display = 'none';
            return;
        } else if (userRole === 'supervisor') {
            if (recipientSupervisorRadioLabel) recipientSupervisorRadioLabel.style.display = 'none';
            if (recipientAllRadioLabel) recipientAllRadioLabel.style.display = 'none';
            
            document.querySelector('input[name="recipientType"][value="individual"]').checked = true;
            formData.selectedRecipient = 'individual';
            if (recipientGroup) recipientGroup.classList.add('hidden');
            if (recipientSupervisor) recipientSupervisor.classList.add('hidden');
            if (recipientIndividual) {
                 recipientIndividual.classList.remove('hidden');
                 recipientIndividual.classList.add('show');
            }

            const userIdInput = document.getElementById('user_id');
            const groupIdInput = document.getElementById('group_id');
            if(userIdInput) userIdInput.placeholder = 'Введіть ID або ПІБ вашого студента';
            if(groupIdInput) groupIdInput.placeholder = 'Введіть ID або назву вашої групи';

        } else if (userRole === 'admin') {
             document.querySelector('input[name="recipientType"][value="individual"]').checked = true;
             formData.selectedRecipient = 'individual';
             if (recipientGroup) recipientGroup.classList.add('hidden');
             if (recipientSupervisor) recipientSupervisor.classList.add('hidden');
             if (recipientIndividual) {
                recipientIndividual.classList.remove('hidden');
                recipientIndividual.classList.add('show');
             }
        } else {
            throw new Error(`Невідома або неприпустима роль користувача: '${userRole}'. Доступ обмежено.`);
        }
        
        setupRecipientSearchFields(userRole, currentUserId); 

    } catch (error) {
        console.error("Помилка ініціалізації форми:", error.message, "\nStack:", error.stack);
        if (!document.body.innerHTML.includes('<h1>Доступ заборонено')) {
            document.body.innerHTML = `<h1>Помилка ініціалізації:</h1><p>${error.message}</p><p>Будь ласка, спробуйте оновити сторінку або зверніться до підтримки, якщо проблема не зникає.</p>`;
        }
        if (form) form.style.display = 'none'; 
    }
     markRequiredFields(); 
  }

  createRecipientInfoElements();
  updateInputLabelsAndPlaceholders();
  initializeFormForUserRole();
});
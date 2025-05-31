document.addEventListener('DOMContentLoaded', function() {
  const registrationForm = document.getElementById('registrationForm');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const studentIdInput = document.getElementById('studentId');
  const departmentInput = document.getElementById('department');
  const phoneNumberInput = document.getElementById('phone-number');
  const studyGroupSelect = document.getElementById('studyGroup');
  const supervisorSelect = document.getElementById('supervisorSelect');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const registerButton = document.getElementById('registerButton');

  const errorElements = {
    fullName: document.getElementById('fullName-error'),
    email: document.getElementById('email-error'),
    studentId: document.getElementById('studentId-error'),
    department: document.getElementById('department-error'),
    phoneNumber: document.getElementById('phone-number-error'),
    studyGroup: document.getElementById('studyGroup-error'),
    supervisorSelect: document.getElementById('supervisorSelect-error'),
    password: document.getElementById('password-error'),
    confirmPassword: document.getElementById('confirmPassword-error')
  };

  function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('visible');
  }

  const BACKEND_URL = 'http://localhost:3000';

  async function loadStudyGroups() {
    if (!studyGroupSelect) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/study-groups`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const groups = await response.json();
      studyGroupSelect.innerHTML = '<option value="" disabled selected>Оберіть групу...</option>';
      if (groups && groups.length > 0) {
        groups.forEach(group => {
          const option = document.createElement('option');
          option.value = group.study_group_id;
          option.textContent = group.group_name;
          studyGroupSelect.appendChild(option);
        });
      } else {
         studyGroupSelect.innerHTML = '<option value="" disabled selected>Груп не знайдено</option>';
      }
    } catch (error) {
      console.error('Failed to load study groups:', error);
      studyGroupSelect.innerHTML = '<option value="" disabled selected>Помилка завантаження груп</option>';
      if(errorElements.studyGroup) showError(errorElements.studyGroup, 'Не вдалося завантажити список груп.');
    }
  }

  async function loadSupervisors() {
      if (!supervisorSelect) return;
      try {
          const response = await fetch(`${BACKEND_URL}/api/supervisors`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const supervisors = await response.json();
          supervisorSelect.innerHTML = '<option value="" disabled selected>Оберіть керівника...</option>';
          if (supervisors && supervisors.length > 0) {
              supervisors.forEach(supervisor => {
                  const option = document.createElement('option');
                  option.value = supervisor.supervisor_id;
                  option.textContent = supervisor.full_name;
                  supervisorSelect.appendChild(option);
              });
          } else {
               supervisorSelect.innerHTML = '<option value="" disabled selected>Керівників не знайдено</option>';
          }
      } catch (error) {
          console.error('Failed to load supervisors:', error);
          supervisorSelect.innerHTML = '<option value="" disabled selected>Помилка завантаження керівників</option>';
          if(errorElements.supervisorSelect) showError(errorElements.supervisorSelect, 'Не вдалося завантажити список керівників.');
      }
  }

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      const icon = togglePasswordBtn.querySelector('i');
      icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
  }

  function sanitizeInput(input) {
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

   function isValidPhoneNumber(phone) {
     const phoneRegex = /^(?:\+?38)?(0\d{9})$/;
     return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
   }

  function validateRegistrationForm() {
    let isValid = true;
    Object.values(errorElements).forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });

    if (!fullNameInput.value.trim()) {
      showError(errorElements.fullName, 'Введіть повне ім\'я');
      isValid = false;
    } else if (fullNameInput.value.trim().split(' ').length < 2) {
      showError(errorElements.fullName, 'Введіть прізвище та ім\'я');
      isValid = false;
    }

    const emailValue = emailInput.value.trim();
    if (!emailValue) {
      showError(errorElements.email, 'Введіть email');
      isValid = false;
    } else if (!isValidEmail(emailValue)) {
      showError(errorElements.email, 'Некоректний формат email');
      isValid = false;
    }

    if (!studentIdInput.value.trim()) {
      showError(errorElements.studentId, 'Введіть номер студентського квитка');
      isValid = false;
    }

    if (!departmentInput.value.trim()) {
      showError(errorElements.department, 'Введіть назву кафедри');
      isValid = false;
    }

     if (!phoneNumberInput.value.trim()) {
        showError(errorElements.phoneNumber, 'Введіть номер телефону');
        isValid = false;
    } else if (!isValidPhoneNumber(phoneNumberInput.value)) {
        showError(errorElements.phoneNumber, 'Некоректний формат телефону (очікується +380xxxxxxxxx або 0xxxxxxxxx)');
        isValid = false;
    }

    if (!studyGroupSelect || studyGroupSelect.value === "") {
        showError(errorElements.studyGroup, 'Будь ласка, оберіть групу');
        isValid = false;
    }

    if (!supervisorSelect || supervisorSelect.value === "") {
        showError(errorElements.supervisorSelect, 'Будь ласка, оберіть керівника');
        isValid = false;
    }

    const passwordValue = passwordInput.value;
    if (!passwordValue) {
      showError(errorElements.password, 'Введіть пароль');
      isValid = false;
    } else if (passwordValue.length < 8) {
      showError(errorElements.password, 'Пароль повинен містити щонайменше 8 символів');
      isValid = false;
    }

    if (!confirmPasswordInput.value) {
      showError(errorElements.confirmPassword, 'Підтвердьте пароль');
      isValid = false;
    } else if (passwordValue !== confirmPasswordInput.value) {
      showError(errorElements.confirmPassword, 'Паролі не співпадають');
      isValid = false;
    }
    return isValid;
  }

  async function handleRegistrationSubmit(userData) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/register/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

       let data;
       try {
            data = await response.json();
       } catch (jsonError) {
            console.error("Failed to parse server response as JSON.", jsonError);
            const textResponse = await response.text();
            console.error("Server Response Text:", textResponse);
            return { success: false, error: `Неочікувана відповідь від сервера (статус ${response.status}). Перевірте консоль бекенду.` };
       }

      if (response.ok && data.success) {
        console.log('Registration successful!', data.message);
        return { success: true };
      } else {
        console.error('Registration failed:', data.error);
        return { success: false, error: data.error || `Помилка сервера (статус ${response.status})` };
      }
    } catch (error) {
      console.error('Network or server error during registration:', error);
       if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return { success: false, error: 'Помилка мережі. Перевірте, чи запущено бекенд-сервер та налаштування CORS.' };
       }
      return { success: false, error: 'Не вдалося підключитися до сервера реєстрації.' };
    }
  }

  if (registrationForm) {
    registrationForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      if (!validateRegistrationForm()) {
        registrationForm.classList.add('shake');
        setTimeout(() => registrationForm.classList.remove('shake'), 500);
        return;
      }

      const userData = {
        fullName: sanitizeInput(fullNameInput.value.trim()),
        email: sanitizeInput(emailInput.value.trim()),
        studentCardNumber: sanitizeInput(studentIdInput.value.trim()),
        department: sanitizeInput(departmentInput.value.trim()),
        phoneNumber: sanitizeInput(phoneNumberInput.value.trim()),
        studyGroupId: studyGroupSelect.value,
        supervisorId: supervisorSelect.value,
        password: passwordInput.value
      };

      const originalButtonText = registerButton.innerHTML;
      registerButton.innerHTML = '<span>Реєстрація...</span><div class="spinner"></div>';
      registerButton.disabled = true;
      Object.values(errorElements).forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
      });

      const registrationResult = await handleRegistrationSubmit(userData);

      if (registrationResult.success) {
        alert('Реєстрація успішна! Тепер ви можете увійти.');
        window.location.href = 'login.html';
      } else {
        registerButton.innerHTML = originalButtonText;
        registerButton.disabled = false;
        showError(errorElements.email, registrationResult.error);
        registrationForm.classList.add('shake');
        setTimeout(() => registrationForm.classList.remove('shake'), 500);
      }
    });
  } else {
    console.error("Форму реєстрації #registrationForm не знайдено!");
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
    .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: white; animation: spin 1s ease-in-out infinite; margin-left: 8px; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);

  if (registrationForm) {
      registrationForm.style.opacity = '0';
      registrationForm.style.transform = 'translateY(20px)';
      registrationForm.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      setTimeout(() => {
          registrationForm.style.opacity = '1';
          registrationForm.style.transform = 'translateY(0)';
      }, 100);
  }

  loadStudyGroups();
  loadSupervisors();
});
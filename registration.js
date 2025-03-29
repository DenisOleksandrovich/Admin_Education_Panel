document.addEventListener('DOMContentLoaded', function() {
  // Variables
  const registrationForm = document.getElementById('registrationForm');
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const studentIdInput = document.getElementById('studentId');
  const departmentInput = document.getElementById('department');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  
  // Error message elements
  const fullNameError = document.getElementById('fullName-error');
  const emailError = document.getElementById('email-error');
  const studentIdError = document.getElementById('studentId-error');
  const departmentError = document.getElementById('department-error');
  const passwordError = document.getElementById('password-error');
  const confirmPasswordError = document.getElementById('confirmPassword-error');
  
  // Toggle password visibility
  const togglePasswordBtn = document.getElementById('togglePassword');
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Change icon
    const icon = togglePasswordBtn.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  });
  
  // Basic XSS input sanitization
  function sanitizeInput(input) {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;')
      .replace(/`/g, '&#96;');
  }
  
  // Email validation regex
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Student ID validation (assuming a specific format, adjust as needed)
  function isValidStudentId(studentId) {
    const studentIdRegex = /^[A-Z]{2}\d{6}$/;
    return studentIdRegex.test(studentId);
  }
  
  // Form validation
  function validateForm() {
    let isValid = true;
    
    // Clear previous errors
    fullNameError.textContent = '';
    emailError.textContent = '';
    studentIdError.textContent = '';
    departmentError.textContent = '';
    passwordError.textContent = '';
    confirmPasswordError.textContent = '';
    
    // Full Name validation
    if (!fullNameInput.value.trim()) {
      fullNameError.textContent = 'Введіть повне ім\'я';
      isValid = false;
    } else if (fullNameInput.value.trim().split(' ').length < 2) {
      fullNameError.textContent = 'Введіть прізвище та ім\'я';
      isValid = false;
    }
    
    // Email validation
    if (!emailInput.value.trim()) {
      emailError.textContent = 'Введіть електронну пошту';
      isValid = false;
    } else if (!isValidEmail(emailInput.value)) {
      emailError.textContent = 'Введіть коректну електронну пошту';
      isValid = false;
    }
    
    // Student ID validation
    if (!studentIdInput.value.trim()) {
      studentIdError.textContent = 'Введіть номер студентського квитка';
      isValid = false;
    } else if (!isValidStudentId(studentIdInput.value)) {
      studentIdError.textContent = 'Некоректний формат номера студентського (напр., AB123456)';
      isValid = false;
    }
    
    // Department validation
    if (!departmentInput.value.trim()) {
      departmentError.textContent = 'Введіть назву кафедри';
      isValid = false;
    }
    
    // Password validation
    if (!passwordInput.value) {
      passwordError.textContent = 'Введіть пароль';
      isValid = false;
    } else if (passwordInput.value.length < 8) {
      passwordError.textContent = 'Пароль повинен містити щонайменше 8 символів';
      isValid = false;
    }
    
    // Confirm password validation
    if (!confirmPasswordInput.value) {
      confirmPasswordError.textContent = 'Підтвердьте пароль';
      isValid = false;
    } else if (passwordInput.value !== confirmPasswordInput.value) {
      confirmPasswordError.textContent = 'Паролі не збігаються';
      isValid = false;
    }
    
    return isValid;
  }
  
  // Simulate server-side registration
  async function submitRegistration(userData) {
    try {
      // In a real application, this would be an actual server request
      // fetch('register.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userData)
      // });
      
      // Simulate request delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demonstration, check if email is unique
      const reservedEmails = ['admin@diploma.edu.ua', 'test@diploma.edu.ua'];
      if (reservedEmails.includes(userData.email)) {
        return { 
          success: false, 
          error: 'Користувач з такою електронною поштою вже існує' 
        };
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: 'Помилка реєстрації. Спробуйте пізніше.' 
      };
    }
  }
  
  // Handle form submission
  registrationForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      // Add shake animation to form
      registrationForm.classList.add('shake');
      setTimeout(() => {
        registrationForm.classList.remove('shake');
      }, 500);
      return;
    }
    
    // Prepare user data
    const userData = {
      fullName: sanitizeInput(fullNameInput.value.trim()),
      email: sanitizeInput(emailInput.value.trim()),
      studentId: sanitizeInput(studentIdInput.value.trim()),
      department: sanitizeInput(departmentInput.value.trim())
    };
    
    // Change button state during submission
    const registerButton = document.getElementById('registerButton');
    const originalButtonText = registerButton.innerHTML;
    registerButton.innerHTML = '<span>Реєстрація...</span><div class="spinner"></div>';
    registerButton.disabled = true;
    
    // Submit registration
    const response = await submitRegistration(userData);
    
    // Restore button state
    registerButton.innerHTML = originalButtonText;
    registerButton.disabled = false;
    
    if (response.success) {
      // Redirect to login or show success message
      window.location.href = 'login.html?registered=true';
    } else {
      // Show error message
      emailError.textContent = response.error;
      
      // Shake form
      registrationForm.classList.add('shake');
      setTimeout(() => {
        registrationForm.classList.remove('shake');
      }, 500);
    }
  });
});
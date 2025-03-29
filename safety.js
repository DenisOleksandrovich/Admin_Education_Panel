 // Password visibility toggle
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

// Password strength checker
function checkPasswordStrength() {
  const password = document.getElementById('newPassword').value;
  const meter = document.getElementById('passwordStrengthMeter');
  
  // Reset the meter
  meter.className = 'password-strength-meter';
  
  if (password.length === 0) {
    meter.style.width = '0%';
    updateRequirements(false, false, false, false);
    return;
  }
  
  let strength = 0;
  
  // Check length
  const hasLength = password.length >= 8;
  if (hasLength) strength += 1;
  
  // Check for mixed case
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  if (hasMixedCase) strength += 1;
  
  // Check for numbers
  const hasNumbers = /\d/.test(password);
  if (hasNumbers) strength += 1;
  
  // Check for special characters
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  if (hasSpecial) strength += 1;
  
  // Update requirements visual indicators
  updateRequirements(hasLength, hasMixedCase, hasNumbers, hasSpecial);
  
  // Update meter based on strength
  if (strength === 0) {
    meter.style.width = '0%';
  } else if (strength <= 2) {
    meter.classList.add('strength-weak');
  } else if (strength === 3) {
    meter.classList.add('strength-medium');
  } else {
    meter.classList.add('strength-strong');
  }
}

// Update requirement indicators
function updateRequirements(length, mixedCase, numbers, special) {
  updateRequirement('req-length', length);
  updateRequirement('req-case', mixedCase);
  updateRequirement('req-numbers', numbers);
  updateRequirement('req-special', special);
}

function updateRequirement(id, isMet) {
  const element = document.getElementById(id);
  const icon = element.querySelector('i');
  
  if (isMet) {
    element.classList.add('met');
    icon.className = 'fas fa-check-circle';
  } else {
    element.classList.remove('met');
    icon.className = 'fas fa-circle';
  }
}

// Check if passwords match
function checkPasswordMatch() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const errorElement = document.getElementById('confirmPasswordError');
  
  if (newPassword !== confirmPassword && confirmPassword.length > 0) {
    errorElement.style.display = 'block';
  } else {
    errorElement.style.display = 'none';
  }
}

// Form validation
document.getElementById('passwordChangeForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  let isValid = true;
  
  // Reset error messages
  document.querySelectorAll('.form-error').forEach(error => {
    error.style.display = 'none';
  });
  
  // Validate email (simple check)
  if (!email.includes('@')) {
    document.getElementById('emailError').style.display = 'block';
    isValid = false;
  }
  
  // Validate new password strength
  let strength = 0;
  if (newPassword.length >= 8) strength += 1;
  if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength += 1;
  if (/\d/.test(newPassword)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(newPassword)) strength += 1;
  
  if (strength < 3) {
    document.getElementById('newPasswordError').style.display = 'block';
    isValid = false;
  }
  
  // Check if passwords match
  if (newPassword !== confirmPassword) {
    document.getElementById('confirmPasswordError').style.display = 'block';
    isValid = false;
  }
  
  if (isValid) {
    // Here you would normally send the data to the server
    alert('Пароль успішно змінено!');
    window.location.href = 'account.html';
  }
});

// Chat toggle function
function toggleChat() {
  const chatContainer = document.getElementById('chatContainer');
  if (chatContainer) {
    chatContainer.classList.toggle('show');
  }
}

// Initialize the password strength indicators on page load
window.onload = function() {
  checkPasswordStrength();
};
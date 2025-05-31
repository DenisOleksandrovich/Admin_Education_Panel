document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const rememberCheckbox = document.getElementById('remember');
  const loginButton = document.getElementById('loginButton');

  const BACKEND_URL = 'http://localhost:3000';

  function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('visible');
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

  function containsSqlInjection(input) {
    const sqlKeywords = ['--', ';', 'DROP', 'DELETE', 'INSERT', 'UPDATE', 'UNION', 'SELECT'];
    const lowerInput = input.toLowerCase();
    return sqlKeywords.some(keyword => lowerInput.includes(keyword.toLowerCase()));
  }

  function validateForm() {
    let isValid = true;
    [usernameError, passwordError].forEach(errorElement => {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    });

    const usernameValue = usernameInput.value.trim();
    const passwordValue = passwordInput.value;

    if (!usernameValue) {
      showError(usernameError, 'Введіть логін або email');
      isValid = false;
    } else if (containsSqlInjection(usernameValue)) {
      showError(usernameError, 'Виявлено підозрілий ввід');
      isValid = false;
    }

    if (!passwordValue) {
      showError(passwordError, 'Введіть пароль');
      isValid = false;
    }

    return isValid;
  }

  async function handleLoginSubmit(username, password, remember) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, remember }),
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

      if (response.ok && data.success && data.token) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('authToken', data.token);
        storage.setItem('userRole', data.userRole);
        storage.setItem('userId', data.userId || data.accountId);
        window.location.href = 'index.html';
        return { success: true };
      } else {
        console.error('Login failed:', data.error);
        return { success: false, error: data.error || `Помилка сервера (статус ${response.status})` };
      }
    } catch (error) {
      console.error('Network or server error during login:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { success: false, error: 'Помилка мережі. Перевірте, чи запущено бекенд-сервер та налаштування CORS.' };
      }
      return { success: false, error: 'Не вдалося підключитися до сервера.' };
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!validateForm()) {
        loginForm.classList.add('shake');
        setTimeout(() => loginForm.classList.remove('shake'), 500);
        return;
      }

      const username = sanitizeInput(usernameInput.value.trim());
      const password = passwordInput.value;
      const remember = rememberCheckbox.checked;

      const originalButtonText = loginButton.innerHTML;
      loginButton.innerHTML = '<span>Зачекайте...</span><div class="spinner"></div>';
      loginButton.disabled = true;
      passwordError.textContent = '';

      const loginResult = await handleLoginSubmit(username, password, remember);

      if (!loginResult.success) {
        loginButton.innerHTML = originalButtonText;
        loginButton.disabled = false;
        showError(passwordError, loginResult.error);
        loginForm.classList.add('shake');
        setTimeout(() => loginForm.classList.remove('shake'), 500);
      }
    });
  } else {
    console.error("Форму входу #loginForm не знайдено!");
  }

  if (loginForm) {
    loginForm.style.opacity = '0';
    loginForm.style.transform = 'translateY(20px)';
    loginForm.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    setTimeout(() => {
      loginForm.style.opacity = '1';
      loginForm.style.transform = 'translateY(0)';
    }, 100);
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
    .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3); border-radius: 50%; border-top-color: white; animation: spin 1s ease-in-out infinite; margin-left: 8px; vertical-align: middle; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
});
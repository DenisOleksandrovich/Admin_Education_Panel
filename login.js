document.addEventListener('DOMContentLoaded', function() {
  // Переменные
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const themeToggle = document.getElementById('theme-toggle');
  
  // Переключение темной/светлой темы
  const getTheme = () => localStorage.getItem('theme') || 'light';
  const saveTheme = (theme) => localStorage.setItem('theme', theme);
  
  // Установка начальной темы
  document.body.setAttribute('data-theme', getTheme());
  
  // Функция для переключения видимости пароля
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Изменение иконки
    const icon = togglePasswordBtn.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
  });
  
  // Базовая проверка на XSS для входных данных
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
  
  // Проверка SQL инъекций
  function containsSqlInjection(input) {
    const sqlPatterns = [
      /'\s*OR\s*'1=1/i,
      /'\s*OR\s*1=1/i,
      /'\s*OR\s*'\s*'/i,
      /'\s*OR\s*1\s*'/i,
      /'\s*OR\s*'a'='a/i,
      /--/,
      /;\s*DROP\s+TABLE/i,
      /;\s*DELETE\s+FROM/i,
      /UNION\s+SELECT/i,
      /EXEC\s+sp_/i,
      /EXEC\s+xp_/i,
      /INSERT\s+INTO/i,
      /UPDATE\s+.*SET/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  }
  
  // Валидация формы
  function validateForm() {
    let isValid = true;
    
    // Очистка предыдущих ошибок
    usernameError.textContent = '';
    passwordError.textContent = '';
    
    // Проверка логина/email
    if (!usernameInput.value.trim()) {
      usernameError.textContent = 'Введіть логін або email';
      isValid = false;
    } else if (containsSqlInjection(usernameInput.value)) {
      usernameError.textContent = 'Виявлено підозрілий ввід';
      isValid = false;
    }
    
    // Проверка пароля
    if (!passwordInput.value) {
      passwordError.textContent = 'Введіть пароль';
      isValid = false;
    } else if (passwordInput.value.length < 6) {
      passwordError.textContent = 'Пароль повинен містити щонайменше 6 символів';
      isValid = false;
    }
    
    return isValid;
  }
  
  // Имитация отправки данных на сервер
  async function submitForm(username, password, remember) {
    try {
      // В реальном приложении здесь будет запрос к серверу
      // fetch('authenticate.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ username, password, remember })
      // });
      
      // Имитация задержки запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Для демонстрации используем жестко закодированные учетные данные
      if (username === 'admin@diploma.edu.ua' && password === 'password123') {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: 'Невірний логін або пароль' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Помилка сервера. Спробуйте пізніше.' 
      };
    }
  }
  
  // Обработка отправки формы
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Валидация формы
    if (!validateForm()) {
      return;
    }
    
    const username = sanitizeInput(usernameInput.value.trim());
    const password = passwordInput.value; // Не применяем sanitizeInput к паролю
    const remember = document.getElementById('remember').checked;
    
    // Изменение состояния кнопки
    const loginButton = document.getElementById('loginButton');
    const originalButtonText = loginButton.innerHTML;
    loginButton.innerHTML = '<span>Зачекайте...</span><div class="spinner"></div>';
    loginButton.disabled = true;
    
    // Отправка данных
    const response = await submitForm(username, password, remember);
    
    // Возвращаем кнопку в исходное состояние
    loginButton.innerHTML = originalButtonText;
    loginButton.disabled = false;
    
    if (response.success) {
      // Перенаправление на главную страницу при успешной аутентификации
      window.location.href = 'index.html';
    } else {
      // Показываем ошибку
      passwordError.textContent = response.error;
      
      // Встряхиваем форму при ошибке
      loginForm.classList.add('shake');
      setTimeout(() => {
        loginForm.classList.remove('shake');
      }, 500);
    }
  });
  
  // Добавляем анимацию встряхивания при ошибке
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .shake {
      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
    }
    
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
      margin-left: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  
  document.head.appendChild(style);
  
  // Простая анимация появления формы
  loginForm.style.opacity = '0';
  loginForm.style.transform = 'translateY(20px)';
  loginForm.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  
  setTimeout(() => {
    loginForm.style.opacity = '1';
    loginForm.style.transform = 'translateY(0)';
  }, 200);
});
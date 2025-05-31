import { getAuthHeaders, getUserInfo, showNotification } from './authUtils.js';

const backendUrl = 'http://localhost:3000';

function togglePasswordVisibility(event) {
  const button = event.currentTarget;
  const container = button.closest('.password-container');
  if (!container) return;
  const input = container.querySelector('input');
  const icon = button.querySelector('i');
  if (!input || !icon) return;

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

function checkPasswordStrength() {
  const passwordInput = document.getElementById('newPassword');
  const meter = document.getElementById('passwordStrengthMeter');
  if (!passwordInput || !meter) return;
  const password = passwordInput.value;

  meter.className = 'password-strength-meter';
  meter.style.width = '0%';

  if (password.length === 0) {
    updateRequirements(false, false, false, false);
    return;
  }

  let strength = 0;
  const hasLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLength) strength++;
  if (hasMixedCase) strength++;
  if (hasNumbers) strength++;
  if (hasSpecial) strength++;

  updateRequirements(hasLength, hasMixedCase, hasNumbers, hasSpecial);

  const strengthPercentage = (strength / 4) * 100;
  meter.style.width = `${strengthPercentage}%`;

  if (strength <= 1) {
    meter.classList.add('strength-weak');
  } else if (strength <= 3) {
    meter.classList.add('strength-medium');
  } else {
    meter.classList.add('strength-strong');
  }
}

function updateRequirements(length, mixedCase, numbers, special) {
  updateRequirement('req-length', length);
  updateRequirement('req-case', mixedCase);
  updateRequirement('req-numbers', numbers);
  updateRequirement('req-special', special);
}

function updateRequirement(id, isMet) {
  const element = document.getElementById(id);
  if (!element) return;
  const icon = element.querySelector('i');
  if (!icon) return;

  if (isMet) {
    element.classList.add('met');
    icon.className = 'fas fa-check-circle';
  } else {
    element.classList.remove('met');
    icon.className = 'fas fa-times-circle';
  }
}

function checkPasswordMatch() {
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const errorElement = document.getElementById('confirmPasswordError');
  if (!newPasswordInput || !confirmPasswordInput || !errorElement) return;

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
    errorElement.textContent = 'Паролі не співпадають.';
    errorElement.style.display = 'block';
    confirmPasswordInput.classList.add('invalid');
  } else {
    errorElement.style.display = 'none';
    confirmPasswordInput.classList.remove('invalid');
  }
}

async function handleChangePassword(event) {
    event.preventDefault();

    const form = event.target;
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = form.querySelector('button[type="submit"]');

    document.querySelectorAll('.form-error').forEach(el => el.style.display = 'none');
    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(el => el?.classList.remove('invalid'));

    const currentPassword = currentPasswordInput?.value;
    const newPassword = newPasswordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    let isValid = true;

    if (!currentPassword) {
        document.getElementById('currentPasswordError').textContent = 'Введіть поточний пароль.';
        document.getElementById('currentPasswordError').style.display = 'block';
        currentPasswordInput?.classList.add('invalid');
        isValid = false;
    }
    if (!newPassword) {
        document.getElementById('newPasswordError').textContent = 'Введіть новий пароль.';
        document.getElementById('newPasswordError').style.display = 'block';
        newPasswordInput?.classList.add('invalid');
        isValid = false;
    }
    if (!confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Підтвердіть новий пароль.';
        document.getElementById('confirmPasswordError').style.display = 'block';
        confirmPasswordInput?.classList.add('invalid');
        isValid = false;
    }

    let strength = 0;
    if (newPassword && newPassword.length >= 8) strength++;
    if (newPassword && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
    if (newPassword && /\d/.test(newPassword)) strength++;
    if (newPassword && /[^a-zA-Z0-9]/.test(newPassword)) strength++;

    if (newPassword && strength < 3) {
        document.getElementById('newPasswordError').textContent = 'Пароль недостатньо складний.';
        document.getElementById('newPasswordError').style.display = 'block';
        newPasswordInput?.classList.add('invalid');
        isValid = false;
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Паролі не співпадають.';
        document.getElementById('confirmPasswordError').style.display = 'block';
        confirmPasswordInput?.classList.add('invalid');
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Зміна...';
    }

    try {
        const response = await fetch(`${backendUrl}/api/user/password`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showNotification('Пароль успішно змінено!', 'success');
            form.reset();
            checkPasswordStrength();
        } else {
            showNotification(result.error || 'Помилка зміни пароля.', 'error');
            if (response.status === 401) {
                 currentPasswordInput?.classList.add('invalid');
                 document.getElementById('currentPasswordError').textContent = result.error || 'Невірний поточний пароль.';
                 document.getElementById('currentPasswordError').style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса на смену пароля:', error);
        showNotification('Не вдалося підключитися до сервера.', 'error');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Змінити пароль';
        }
    }
}

const setup2faButton = document.getElementById('setup2faButton');
const verify2faButton = document.getElementById('verify2faButton');
const cancel2faButton = document.getElementById('cancel2faButton');
const disable2faButton = document.getElementById('disable2faButton');
const setupInstructionsDiv = document.getElementById('2fa-setup-instructions');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const secretKeyContainer = document.getElementById('secretKeyContainer');
const verificationCodeInput = document.getElementById('verificationCode');
const verificationCodeError = document.getElementById('verificationCodeError');

let tempSecret = null;

async function check2FAStatus() {
    const statusDiv = document.getElementById('2fa-status');
    if (!statusDiv) {
        console.warn("Елемент #2fa-status не знайдено");
        return;
    }
    const statusTextElement = statusDiv.querySelector('.status-text');
    if (!statusTextElement) {
         console.warn("Елемент .status-text всередині #2fa-status не знайдено");
         return;
    }

    statusTextElement.textContent = 'Перевірка...';
    if (setup2faButton) setup2faButton.style.display = 'none';
    if (disable2faButton) disable2faButton.style.display = 'none';
    if (setupInstructionsDiv) setupInstructionsDiv.style.display = 'none';

    try {
        const response = await fetch(`${backendUrl}/api/account/2fa/status`, { headers: getAuthHeaders() });
        const result = await response.json();

        if (response.ok && result.success) {
            if (result.enabled) {
                statusTextElement.textContent = 'Увімкнено';
                statusTextElement.style.color = 'var(--color-success)';
                if (disable2faButton) disable2faButton.style.display = 'inline-block';
                if (setup2faButton) setup2faButton.style.display = 'none';
            } else {
                statusTextElement.textContent = 'Вимкнено';
                statusTextElement.style.color = 'var(--color-text-light)';
                if (setup2faButton) setup2faButton.style.display = 'inline-block';
                if (disable2faButton) disable2faButton.style.display = 'none';
            }
        } else {
            statusTextElement.textContent = 'Помилка перевірки';
            statusTextElement.style.color = 'var(--color-danger)';
            showNotification(result.error || 'Не вдалося перевірити статус 2FA.', 'error');
        }
    } catch (error) {
        console.error('Ошибка при проверке статуса 2FA:', error);
        statusTextElement.textContent = 'Помилка перевірки';
        statusTextElement.style.color = 'var(--color-danger)';
        showNotification('Не вдалося підключитися до сервера для перевірки 2FA.', 'error');
    }
}

async function initiate2FASetup() {
    if (setup2faButton) {
        setup2faButton.disabled = true;
        setup2faButton.textContent = 'Генерація...';
    }
    if (verificationCodeInput) verificationCodeInput.value = '';
    if (verificationCodeError) verificationCodeError.style.display = 'none';
    if (qrCodeContainer) qrCodeContainer.innerHTML = 'Завантаження QR-коду...';
    if (secretKeyContainer) secretKeyContainer.textContent = 'Завантаження ключа...';

    try {
        const response = await fetch(`${backendUrl}/api/account/2fa/setup`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (response.ok && result.success) {
            tempSecret = result.secret;
            if (qrCodeContainer) qrCodeContainer.innerHTML = `<img src="${result.qrCodeDataUri}" alt="QR-код для 2FA">`;
            if (secretKeyContainer) secretKeyContainer.textContent = result.secret;
            if (setupInstructionsDiv) setupInstructionsDiv.style.display = 'block';
            if (setup2faButton) setup2faButton.style.display = 'none';
        } else {
            showNotification(result.error || 'Не вдалося почати налаштування 2FA.', 'error');
            if (qrCodeContainer) qrCodeContainer.innerHTML = 'Помилка завантаження QR.';
            if (secretKeyContainer) secretKeyContainer.textContent = 'Помилка';
            if (setup2faButton) {
                setup2faButton.disabled = false;
                setup2faButton.textContent = 'Налаштувати 2FA';
            }
        }
    } catch (error) {
        console.error('Ошибка при инициации настройки 2FA:', error);
        showNotification('Не вдалося підключитися до сервера для налаштування 2FA.', 'error');
        if (qrCodeContainer) qrCodeContainer.innerHTML = 'Помилка мережі.';
        if (secretKeyContainer) secretKeyContainer.textContent = 'Помилка';
        if (setup2faButton) {
            setup2faButton.disabled = false;
            setup2faButton.textContent = 'Налаштувати 2FA';
        }
    }
}

async function verifyAndEnable2FA() {
    const code = verificationCodeInput ? verificationCodeInput.value : '';
    if (!code || !/^\d{6}$/.test(code)) {
        if(verificationCodeError) {
            verificationCodeError.textContent = 'Введіть дійсний 6-значний код.';
            verificationCodeError.style.display = 'block';
        }
        return;
    }
    if (verificationCodeError) verificationCodeError.style.display = 'none';
    if (verify2faButton) {
        verify2faButton.disabled = true;
        verify2faButton.textContent = 'Перевірка...';
    }

    try {
        const response = await fetch(`${backendUrl}/api/account/2fa/verify`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: code, secret: tempSecret })
        });
        const result = await response.json();

        if (response.ok && result.success) {
            showNotification('Двофакторну аутентифікацію успішно увімкнено!', 'success');
            tempSecret = null;
            await check2FAStatus();
        } else {
            showNotification(result.error || 'Невірний код підтвердження.', 'error');
             if(verificationCodeError) {
                verificationCodeError.textContent = result.error || 'Невірний код підтвердження.';
                verificationCodeError.style.display = 'block';
             }
             if (verify2faButton) {
                verify2faButton.disabled = false;
                verify2faButton.textContent = 'Увімкнути 2FA';
             }
        }
    } catch (error) {
        console.error('Ошибка при верификации 2FA:', error);
        showNotification('Не вдалося підключитися до сервера для верифікації 2FA.', 'error');
        if (verify2faButton) {
            verify2faButton.disabled = false;
            verify2faButton.textContent = 'Увімкнути 2FA';
        }
    }
}

function cancel2FASetup() {
    tempSecret = null;
    if (setupInstructionsDiv) setupInstructionsDiv.style.display = 'none';
    if (setup2faButton) {
        setup2faButton.style.display = 'inline-block';
        setup2faButton.disabled = false;
        setup2faButton.textContent = 'Налаштувати 2FA';
    }
     if (verify2faButton) {
        verify2faButton.disabled = false;
        verify2faButton.textContent = 'Увімкнути 2FA';
     }
}

async function disable2FA() {
    if (!confirm("Ви впевнені, що хочете вимкнути двофакторну аутентифікацію?")) {
        return;
    }

    if (disable2faButton) {
        disable2faButton.disabled = true;
        disable2faButton.textContent = 'Вимкнення...';
    }

    try {
        const response = await fetch(`${backendUrl}/api/account/2fa/disable`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (response.ok && result.success) {
            showNotification('Двофакторну аутентифікацію вимкнено.', 'success');
            await check2FAStatus();
        } else {
            showNotification(result.error || 'Не вдалося вимкнути 2FA.', 'error');
            if (disable2faButton) {
                disable2faButton.disabled = false;
                disable2faButton.textContent = 'Вимкнути 2FA';
            }
        }
    } catch (error) {
        console.error('Ошибка при отключении 2FA:', error);
        showNotification('Не вдалося підключитися до сервера для відключення 2FA.', 'error');
        if (disable2faButton) {
            disable2faButton.disabled = false;
            disable2faButton.textContent = 'Вимкнути 2FA';
        }
    }
}

async function displayBlockedSessions() {
    const container = document.getElementById('blockedSessions');
    if (!container) {
        console.warn('Контейнер для заблокованих сесій не знайдено.');
        return;
    }
    container.innerHTML = '<p class="card-main-text">Завантаження заблокованих сесій...</p>';

    try {
        const response = await fetch(`${backendUrl}/api/account/blocked-sessions`, {
            headers: getAuthHeaders()
        });
        const result = await response.json();

        if (response.ok && result.success) {
            if (result.blockedSessions && result.blockedSessions.length > 0) {
                let sessionsHtml = '<ul class="session-list">';
                result.blockedSessions.forEach(session => {
                    const formattedDate = new Date(session.created_at).toLocaleString('uk-UA', { dateStyle: 'medium', timeStyle: 'short' });
                    sessionsHtml += `
                        <li class="session-item card-main-text">
                            <div class="session-info">
                                <strong class="l-card-text sesl">ID Сесії (оригінальне):</strong> ${session.session_id || 'N/A'} <br>
                                <strong class="l-card-text sesl">Причина:</strong> ${session.reason || 'Не вказано'} <br>
                                <strong class="l-card-text sesl">Заблоковано:</strong> ${formattedDate}
                            </div>
                            <div class="session-actions">
                                <button class="btn btn-secondary btn-sm unblock-button" class="card-main-text" onclick="unblockSession(${session.blocked_session_id})" title="Видалити запис про блокування">
                                    <i class="fas fa-unlock" class="card-main-text"></i> Розблокувати
                                </button>
                            </div>
                        </li>
                    `;
                });
                sessionsHtml += '</ul>';
                container.innerHTML = sessionsHtml;
            } else {
                container.innerHTML = '<p class="card-main-text">Заблоковані сесії для вашого облікового запису відсутні.</p>';
            }
        } else {
            container.innerHTML = `<p class="card-main-text error-text">Помилка завантаження заблокованих сесій: ${result.error || 'Невідома помилка'}</p>`;
            showNotification(result.error || 'Не вдалося завантажити заблоковані сесії.', 'error');
        }
    } catch (error) {
        console.error('Помилка при отриманні заблокованих сесій:', error);
        container.innerHTML = '<p class="card-main-text error-text">Не вдалося підключитися до сервера для завантаження сесій.</p>';
        showNotification('Не вдалося підключитися до сервера.', 'error');
    }
}

window.unblockSession = async function(blockedSessionId) {
    if (!confirm(`Ви впевнені, що хочете видалити запис про блокування сесії ID: ${blockedSessionId}? \nЦе не відновить саму сесію, лише видалить запис з історії блокувань.`)) {
        return;
    }

    try {
        const response = await fetch(`${backendUrl}/api/account/blocked-sessions/${blockedSessionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showNotification(result.message || 'Запис про блокування видалено.', 'success');
            displayBlockedSessions();
        } else {
            showNotification(result.error || 'Не вдалося видалити запис про блокування.', 'error');
        }
    } catch (error) {
        console.error('Помилка при розблокуванні сесії:', error);
        showNotification('Помилка мережі при спробі розблокування.', 'error');
    } finally {

    }
}

function displaySecurityActivity() {
    const container = document.getElementById('securityActivity');
    if (container) {
        container.innerHTML = '<p>Функціонал історії безпеки знаходиться в розробці.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    check2FAStatus();

    const form = document.getElementById('passwordChangeForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (form) {
        form.addEventListener('submit', handleChangePassword);
    }
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', checkPasswordStrength);
        newPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }

    document.querySelectorAll('.toggle-password').forEach(button => {
         button.addEventListener('click', togglePasswordVisibility);
    });

    if (setup2faButton) setup2faButton.addEventListener('click', initiate2FASetup);
    if (verify2faButton) verify2faButton.addEventListener('click', verifyAndEnable2FA);
    if (cancel2faButton) cancel2faButton.addEventListener('click', cancel2FASetup);
    if (disable2faButton) disable2faButton.addEventListener('click', disable2FA);

    displayBlockedSessions();
    displaySecurityActivity();
    checkPasswordStrength();
});

document.addEventListener('DOMContentLoaded', function() {
    const verifyForm = document.getElementById('verifyForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const studentCardNumberInput = document.getElementById('studentCardNumber');
    const departmentInput = document.getElementById('department');
    const phoneInput = document.getElementById('phone');

    const fullNameError = document.getElementById('fullName-error');
    const emailError = document.getElementById('email-error');
    const studentCardNumberError = document.getElementById('studentCardNumber-error');
    const departmentError = document.getElementById('department-error');
    const phoneError = document.getElementById('phone-error');
    const verifyButton = document.getElementById('verifyButton');
    const verifyError = document.getElementById('verify-error');
    const lockoutTimerDisplay = document.getElementById('lockoutTimer');

    const newPasswordModal = document.getElementById('newPasswordModal');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const newPasswordError = document.getElementById('newPassword-error');
    const confirmPasswordError = document.getElementById('confirmPassword-error');
    const resetNotification = document.getElementById('reset-notification');
    const resetButton = document.getElementById('resetButton');
    const resetIdentifierInput = document.getElementById('resetIdentifier');

    const BACKEND_URL = 'http://localhost:3000';

    let attemptCount = 0;
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_DURATION = 60 * 1000;
    let isLocked = false;
    let lockoutTimeout;

    function showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('visible');
        } else {
            console.error("Error element not found for message:", message);
        }
    }

    function clearError(errorElement) {
         if (errorElement) {
             errorElement.textContent = '';
             errorElement.classList.remove('visible');
         }
    }

    function clearAllErrors() {
        clearError(fullNameError);
        clearError(emailError);
        clearError(studentCardNumberError);
        clearError(departmentError);
        clearError(phoneError);
        clearError(verifyError);
        clearError(newPasswordError);
        clearError(confirmPasswordError);
        hideNotification(resetNotification);
    }


    function showNotification(element, message, isSuccess) {
        if (element) {
            element.textContent = message;
            element.className = 'notification ' + (isSuccess ? 'success' : 'error');
            element.style.display = 'block';
        } else {
             console.error("Notification element not found for message:", message);
        }
    }

    function hideNotification(element) {
        if (element) {
            element.style.display = 'none';
            element.textContent = '';
            element.className = 'notification';
        }
    }

    function lockForm() {
        isLocked = true;
        verifyButton.disabled = true;
        verifyButton.innerHTML = `<span>Заблоковано</span>`;
        lockoutTimerDisplay.style.display = 'block';
        let timeLeft = LOCKOUT_DURATION / 1000;

        function updateTimer() {
             if (timeLeft <= 0) {
                 unlockForm();
             } else {
                 lockoutTimerDisplay.textContent = `Спробуйте ще раз через ${timeLeft} секунд`;
                 timeLeft--;
                 lockoutTimeout = setTimeout(updateTimer, 1000);
             }
        }
        updateTimer();
    }

    function unlockForm() {
        clearTimeout(lockoutTimeout);
        isLocked = false;
        attemptCount = 0;
        verifyButton.disabled = false;
        verifyButton.innerHTML = `<span class="btn-icon"><i class="fas fa-check"></i></span> Перевірити дані`;
        lockoutTimerDisplay.style.display = 'none';
        clearError(verifyError);
    }

    const lastLockoutTime = sessionStorage.getItem('lockoutEndTime');
    if (lastLockoutTime && Date.now() < parseInt(lastLockoutTime)) {
        isLocked = true;
        verifyButton.disabled = true;
        verifyButton.innerHTML = `<span>Заблоковано</span>`;
        lockoutTimerDisplay.style.display = 'block';
        let remainingTime = Math.ceil((parseInt(lastLockoutTime) - Date.now()) / 1000);
        function countdown() {
            if (remainingTime <= 0) {
                unlockForm();
                sessionStorage.removeItem('lockoutEndTime');
            } else {
                lockoutTimerDisplay.textContent = `Спробуйте ще раз через ${remainingTime} секунд`;
                remainingTime--;
                lockoutTimeout = setTimeout(countdown, 1000);
            }
        }
        countdown();
    }

    verifyForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearAllErrors();

        if (isLocked) {
            showError(verifyError, 'Функцію відновлення тимчасово заблоковано.');
            return;
        }

        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const studentCardNumber = studentCardNumberInput.value.trim();
        const department = departmentInput.value.trim();
        const phone = phoneInput.value.trim();

        let isValid = true;

        if (!fullName) { showError(fullNameError, 'Введіть ПІБ'); isValid = false; }
        if (!email) { showError(emailError, 'Введіть email'); isValid = false; }
        else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) { showError(emailError, 'Введіть коректний email'); isValid = false; }
        }
        if (!studentCardNumber) { showError(studentCardNumberError, 'Введіть номер студентського квитка'); isValid = false; }
        if (!department) { showError(departmentError, 'Введіть назву кафедри'); isValid = false; }
        if (!phone) { showError(phoneError, 'Введіть номер телефону'); isValid = false; }

        if (!isValid) {
            return;
        }

        const originalButtonText = verifyButton.innerHTML;
        verifyButton.innerHTML = '<span>Перевірка...</span><div class="spinner"></div>';
        verifyButton.disabled = true;

        try {
            const response = await fetch(`${BACKEND_URL}/api/forgot-password/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, studentCardNumber, department, phone })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                resetIdentifierInput.value = email;
                openModal();
                attemptCount = 0;
                sessionStorage.removeItem('lockoutEndTime');
            } else {
                attemptCount++;
                const generalErrorMessage = data.error || `Помилка: ${response.statusText || response.status}`;
                if (attemptCount >= MAX_ATTEMPTS) {
                    const lockoutEndTime = Date.now() + LOCKOUT_DURATION;
                    sessionStorage.setItem('lockoutEndTime', lockoutEndTime.toString());
                    lockForm();
                    showError(verifyError, `Невірні дані або акаунт не знайдено. Спробу заблоковано на 1 хвилину.`);
                } else {
                    showError(verifyError, `${generalErrorMessage} Залишилось спроб: ${MAX_ATTEMPTS - attemptCount}`);
                }
                 verifyForm.classList.add('shake');
                 setTimeout(() => verifyForm.classList.remove('shake'), 500);
            }
        } catch (error) {
            console.error('Network or server error:', error);
            showError(verifyError, 'Помилка мережі або сервера.');
            attemptCount++;
             if (attemptCount >= MAX_ATTEMPTS) {
                 const lockoutEndTime = Date.now() + LOCKOUT_DURATION;
                 sessionStorage.setItem('lockoutEndTime', lockoutEndTime.toString());
                 lockForm();
                 showError(verifyError, `Помилка. Спробу заблоковано на 1 хвилину.`);
             }
        } finally {
             if (!isLocked) {
                 verifyButton.innerHTML = originalButtonText;
                 verifyButton.disabled = false;
             }
        }
    });

    function openModal() {
        clearError(newPasswordError);
        clearError(confirmPasswordError);
        hideNotification(resetNotification);
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        const modalToggles = newPasswordModal.querySelectorAll('.toggle-password i');
        newPasswordInput.type = 'password';
        confirmPasswordInput.type = 'password';
        modalToggles.forEach(icon => icon.className = 'fas fa-eye');
        newPasswordModal.style.display = 'block';
    }

    window.closeModal = function() {
        newPasswordModal.style.display = 'none';
         if(!isLocked) {
            unlockForm();
         }
    }

    window.onclick = function(event) {
        if (event.target == newPasswordModal) {
            closeModal();
        }
    }

    resetPasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearError(newPasswordError);
        clearError(confirmPasswordError);
        hideNotification(resetNotification);

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const identifier = resetIdentifierInput.value;

        let isValid = true;

        if (newPassword.length < 8) {
            showError(newPasswordError, 'Пароль повинен містити мінімум 8 символів');
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            showError(confirmPasswordError, 'Паролі не співпадають');
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        const originalButtonText = resetButton.innerHTML;
        resetButton.innerHTML = '<span>Збереження...</span><div class="spinner"></div>';
        resetButton.disabled = true;

        try {
            const response = await fetch(`${BACKEND_URL}/api/forgot-password/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier, newPassword })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showNotification(resetNotification, 'Пароль успішно змінено!', true);
                 setTimeout(() => {
                     closeModal();
                     window.location.href = 'login.html';
                 }, 3000);
            } else {
                showNotification(resetNotification, data.error || `Помилка: ${response.status}`, false);
            }
        } catch (error) {
            console.error('Network or server error:', error);
            showNotification(resetNotification, 'Помилка мережі або сервера.', false);
        } finally {
            resetButton.innerHTML = originalButtonText;
            resetButton.disabled = false;
        }
    });
});
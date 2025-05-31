function displayMessage(element, message, type = 'success') {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message ${type} card-main-text`;
    element.style.display = 'block';
    setTimeout(() => {
        if (element) {
            element.style.display = 'none';
            element.textContent = '';
            element.className = 'form-message';
        }
    }, 5000);
}

function clearFormMessages() {
    document.querySelectorAll('.form-message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
        el.className = 'form-message';
    });
    document.querySelectorAll('form').forEach(form => {
        clearInlineErrors(form);
        clearInputErrorStyles(form);
    });
}

function getFormMessageElement(formId) {
    switch (formId) {
        case 'createStudentForm': return document.getElementById('createStudentMessage');
        case 'createTeacherForm': return document.getElementById('createTeacherMessage');
        case 'createAdminForm': return document.getElementById('createAdminMessage');
        case 'editForm': return document.getElementById('editFormMessage');
        default: return null;
    }
}

function getActiveFormId() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return null;
    const form = activeTab.querySelector('form');
    return form ? form.id : null;
}

function clearInlineErrors(formElement) {
    formElement.querySelectorAll('.error-message.visible').forEach(span => {
        span.textContent = '';
        span.classList.remove('visible');
    });
    formElement.querySelectorAll('input.invalid, select.invalid, textarea.invalid').forEach(input => {
        input.classList.remove('invalid');
    });
}

function clearInputErrorStyles(formElement) {
    formElement.querySelectorAll('input.invalid, select.invalid, textarea.invalid').forEach(input => {
        input.classList.remove('invalid');
    });
}

function showInlineErrors(formElement, errors) {
    clearInlineErrors(formElement);

    if (typeof errors === 'object' && errors !== null) {
        for (const errorSpanId in errors) {
            const errorSpan = formElement.querySelector(`#${errorSpanId}`);
            let inputElementId;

            if (formElement.id.startsWith('create')) {
                inputElementId = errorSpanId.substring(0, errorSpanId.lastIndexOf('-error'));
            } else {
                const prefix = `${formElement.id}-`;
                const suffix = '-error';
                if (errorSpanId.startsWith(prefix) && errorSpanId.endsWith(suffix)) {
                    inputElementId = errorSpanId.substring(prefix.length, errorSpanId.length - suffix.length);
                } else {
                    inputElementId = errorSpanId.replace(/-error$/, '');
                }
            }
            
            const inputElement = formElement.querySelector(`#${inputElementId}`);

            if (inputElement) {
                inputElement.classList.add('invalid');
            }
            if (errorSpan) {
                errorSpan.textContent = errors[errorSpanId];
                errorSpan.classList.add('visible');
            }
        }
    }
}


function validateField(value, rules, formElement) {
    for (const rule of rules) {
        if (rule.required && !value.trim() && !(rule.condition && !rule.condition(formElement))) {
            return rule.message;
        }
        if (!value.trim() && !rule.required) {
            continue;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
            return rule.message;
        }
        if (rule.minLength && value.length < rule.minLength) {
            return rule.message;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            return rule.message;
        }
        if (rule.custom && !rule.custom(value, formElement)) {
            return rule.message;
        }
    }
    return null;
}

function validateForm(formElement, fieldConfigurations) {
    const errors = {};
    let isValid = true;
    clearInlineErrors(formElement);

    for (const inputIdFromConfig in fieldConfigurations) {
        const inputElement = formElement.querySelector(`#${inputIdFromConfig}`);
        
        if (inputElement) {
            if (formElement.id === 'editForm' && inputElement.offsetParent === null) {
                continue; 
            }

            const value = inputElement.value;
            const fieldConfig = fieldConfigurations[inputIdFromConfig];
            const errorMessage = validateField(value, fieldConfig.rules, formElement);

            if (errorMessage) {
                let errorSpanId;
                if (formElement.id.startsWith('create')) {
                    errorSpanId = `${inputIdFromConfig}-error`; 
                } else { 
                    errorSpanId = `${inputIdFromConfig}-error`;
                }
                errors[errorSpanId] = errorMessage;
                isValid = false;
            }
        }
    }

    if (!isValid) {
        showInlineErrors(formElement, errors);
    }
    return isValid;
}


const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+380\d{9}$/;
const NAME_PATTERN = /^[а-яА-ЯҐґЄєІіЇїҐґ'\s-]+$/u;
const STUDENT_CARD_PATTERN = /^[A-Za-z0-9]+$/;
const DEPARTMENT_PATTERN = /^[а-яА-ЯҐґЄєІіЇїҐґ\s.,'-]+$/u;
const POSITION_PATTERN = /^[а-яА-ЯҐґЄєІіЇїҐґ\s.,'-]+$/u;

const commonFieldRules = {
    fullName: [
        { required: true, message: "ПІБ є обов'язковим." },
        { pattern: NAME_PATTERN, message: 'ПІБ може містити тільки українські літери, апостроф, дефіс та пробіли.' }
    ],
    email: [
        { required: true, message: "Email є обов'язковим." },
        { pattern: EMAIL_PATTERN, message: 'Невірний формат email.' }
    ],
    password: [
        { required: true, message: "Пароль є обов'язковим." },
        { minLength: 8, message: 'Пароль повинен містити щонайменше 8 символів.' }
    ],
    phoneNumber: [
        { required: true, message: "Телефон є обов'язковим."},
        { pattern: PHONE_PATTERN, message: 'Телефон повинен бути у форматі +380XXXXXXXXX (9 цифр).' }
    ],
};

const createStudentFormConfig = {
    'create-fullName': { rules: commonFieldRules.fullName },
    'create-email': { rules: commonFieldRules.email },
    'create-phone': { rules: commonFieldRules.phoneNumber },
    'create-studentCard': {
        rules: [
            { required: true, message: "Номер студентського квитка є обов'язковим." },
            { pattern: STUDENT_CARD_PATTERN, message: 'Номер квитка може містити тільки латинські літери та цифри.' }
        ]
    },
    'create-department': {
        rules: [
            { required: true, message: "Кафедра є обов'язковою." },
            { pattern: DEPARTMENT_PATTERN, message: 'Назва кафедри містить недійсні символи.' }
        ]
    },
    'create-studyGroup': { rules: [{ required: true, message: "Навчальна група є обов'язковою." }] },
    'create-supervisor': { rules: [{ required: true, message: "Науковий керівник є обов'язковим." }] },
    'create-password-student': { rules: commonFieldRules.password },
    'create-confirm-password-student': {
        rules: [
            { required: true, message: "Підтвердження пароля є обов'язковим." },
            {
                custom: (value, formElement) => value === formElement.querySelector('#create-password-student').value,
                message: 'Паролі не співпадають.'
            }
        ]
    }
};

const createTeacherFormConfig = {
    'create-teacher-fullName': { rules: commonFieldRules.fullName },
    'create-teacher-email': { rules: commonFieldRules.email },
    'create-teacher-phone': { rules: commonFieldRules.phoneNumber },
    'create-teacher-department': {
        rules: [
            { required: true, message: "Кафедра/Відділ є обов'язковою." },
            { pattern: DEPARTMENT_PATTERN, message: 'Назва кафедри/відділу містить недійсні символи.' }
        ]
    },
    'create-teacher-position': {
        rules: [
            { required: true, message: "Посада є обов'язковою." },
            { pattern: POSITION_PATTERN, message: 'Назва посади містить недійсні символи.' }
        ]
    },
    'create-teacher-status': { rules: [{ required: true, message: "Статус викладача є обов'язковим." }] },
    'create-teacher-specialization': { rules: [] },
    'create-password-teacher': { rules: commonFieldRules.password },
    'create-confirm-password-teacher': {
        rules: [
            { required: true, message: "Підтвердження пароля є обов'язковим." },
            {
                custom: (value, formElement) => value === formElement.querySelector('#create-password-teacher').value,
                message: 'Паролі не співпадають.'
            }
        ]
    }
};

const createAdminFormConfig = {
    'create-admin-email': { rules: commonFieldRules.email },
    'create-password-admin': { rules: commonFieldRules.password },
    'create-confirm-password-admin': {
        rules: [
            { required: true, message: "Підтвердження пароля є обов'язковим." },
            {
                custom: (value, formElement) => value === formElement.querySelector('#create-password-admin').value,
                message: 'Паролі не співпадають.'
            }
        ]
    },
    'link-supervisor': { rules: [] }
};

const editFormBaseConfig = {
    'edit-email': { rules: commonFieldRules.email },
    'edit-status': { rules: [{ required: true, message: "Статус є обов'язковим." }] }
};

const editFormStudentConfig = {
    ...editFormBaseConfig,
    'edit-fullName': { rules: commonFieldRules.fullName },
    'edit-studentcardnumber': { rules: createStudentFormConfig['create-studentCard'].rules },
    'edit-department-student': { rules: createStudentFormConfig['create-department'].rules },
    'edit-phone-student': { rules: commonFieldRules.phoneNumber },
    'edit-studygroupid': { rules: createStudentFormConfig['create-studyGroup'].rules },
    'edit-supervisorid-student': { rules: createStudentFormConfig['create-supervisor'].rules }
};

const editFormTeacherConfig = {
    ...editFormBaseConfig,
    'edit-fullName': { rules: commonFieldRules.fullName },
    'edit-department-teacher': { rules: createTeacherFormConfig['create-teacher-department'].rules },
    'edit-phone-teacher': { rules: commonFieldRules.phoneNumber },
    'edit-position': { rules: createTeacherFormConfig['create-teacher-position'].rules },
    'edit-teacherstatus': { rules: createTeacherFormConfig['create-teacher-status'].rules },
    'edit-specialization': { rules: [] }
};

const editFormAdminConfig = {
    ...editFormBaseConfig,
    'edit-supervisorid-admin': { rules: [] }
};

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const API_BASE_URL = 'http://localhost:3000/api/admin';

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const studentsTableBody = document.querySelector('#students-table tbody');
    const teachersTableBody = document.querySelector('#teachers-table tbody');
    const adminsTableBody = document.querySelector('#admins-table tbody');
    const createStudentForm = document.getElementById('createStudentForm');
    const createTeacherForm = document.getElementById('createTeacherForm');
    const createAdminForm = document.getElementById('createAdminForm');
    const studentSearchInput = document.getElementById('student-search');
    const teacherSearchInput = document.getElementById('teacher-search');
    const adminSearchInput = document.getElementById('admin-search');
    const refreshStudentsBtn = document.getElementById('refresh-students');
    const refreshTeachersBtn = document.getElementById('refresh-teachers');
    const refreshAdminsBtn = document.getElementById('refresh-admins');
    const studentPaginationDiv = document.getElementById('student-pagination');
    const teacherPaginationDiv = document.getElementById('teacher-pagination');
    const adminPaginationDiv = document.getElementById('admin-pagination');
    const studyGroupSelectCreate = document.getElementById('create-studyGroup');
    const supervisorSelectStudentCreate = document.getElementById('create-supervisor');
    const supervisorSelectAdminCreate = document.getElementById('link-supervisor');
    const editModal = document.getElementById('editModal');
    const closeModalButton = editModal.querySelector('.close-button');
    const editForm = document.getElementById('editForm');
    const editModalTitle = document.getElementById('modalTitle');
    const editAccountIdInput = document.getElementById('edit-accountId');
    const editUserTypeInput = document.getElementById('edit-userType');
    const editProfileFieldsDiv = document.getElementById('edit-profile-fields');
    const editStudentFieldsDiv = document.getElementById('edit-student-fields');
    const editTeacherFieldsDiv = document.getElementById('edit-teacher-fields');
    const editAdminFieldsDiv = document.getElementById('edit-admin-fields');
    const editStudyGroupSelect = document.getElementById('edit-studygroupid');
    const editSupervisorSelectStudent = document.getElementById('edit-supervisorid-student');
    const editSupervisorSelectAdmin = document.getElementById('edit-supervisorid-admin');

    let currentStudentPage = 1;
    let currentTeacherPage = 1;
    let currentAdminPage = 1;
    let studentSearchTerm = '';
    let teacherSearchTerm = '';
    let adminSearchTerm = '';
    let loadedGroups = [];
    let loadedSupervisors = [];
    let currentlyEditingAccountData = null;

    async function fetchData(endpoint, method = 'GET', body = null) {
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
        };
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        const url = `${API_BASE_URL}${endpoint}`;
        try {
            const response = await fetch(url, options);
            if (response.status === 401 || response.status === 403) {
                alert('Сесія закінчилася або недостатньо прав. Будь ласка, увійдіть знову.');
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login.html';
                return null;
            }
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                let errorData = { error: `HTTP помилка: ${response.status}` };
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    try { errorData = await response.json(); } catch (e) {}
                } else {
                    try { errorData.responseText = await response.text(); } catch (e) {}
                }
                throw new Error(errorData.error || errorData.message || `Помилка ${response.status}`);
            }
            if (response.status === 204) {
                return { success: true };
            }
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return await response.json();
            } else {
                return { success: true, data: await response.text() };
            }
        } catch (error) {
            const activeFormId = getActiveFormId();
            const msgElement = activeFormId ? getFormMessageElement(activeFormId) : document.getElementById('editFormMessage');
            if (msgElement) displayMessage(msgElement, `Мережева помилка або помилка сервера: ${error.message}`, 'error');
            else alert(`Мережева помилка або помилка сервера: ${error.message}`);
            return null;
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(targetTabId).classList.add('active');
            clearFormMessages();
            switch (targetTabId) {
                case 'manage-students': loadStudents(1, ''); if(studentSearchInput) studentSearchInput.value = ''; break;
                case 'manage-teachers': loadTeachers(1, ''); if(teacherSearchInput) teacherSearchInput.value = ''; break;
                case 'manage-admins': loadAdmins(1, ''); if(adminSearchInput) adminSearchInput.value = ''; break;
                case 'create-student': loadGroupsAndSupervisors(true, true); break;
                case 'create-teacher': break;
                case 'create-admin': loadGroupsAndSupervisors(false, true); break;
            }
        });
    });

    async function loadStudents(page = 1, searchTerm = '') {
        currentStudentPage = page;
        studentSearchTerm = searchTerm;
        if(studentsTableBody) studentsTableBody.innerHTML = `<tr><td colspan="6" class="card-main-text">Завантаження... <i class="fas fa-spinner fa-spin" class="card-main-text"></i></td></tr>`;
        const result = await fetchData(`/users/students?page=${page}&limit=15&search=${encodeURIComponent(searchTerm)}`);
        if (result && result.success) {
            if(studentsTableBody) renderTable(studentsTableBody, result.data, 'student');
            if(studentPaginationDiv) renderPagination(studentPaginationDiv, result.pagination, loadStudents, searchTerm);
        } else {
            if(studentsTableBody) studentsTableBody.innerHTML = `<tr><td colspan="6" class="card-main-text">Помилка завантаження студентів.</td></tr>`;
            if(studentPaginationDiv) renderPagination(studentPaginationDiv, null, loadStudents);
        }
    }

    async function loadTeachers(page = 1, searchTerm = '') {
        currentTeacherPage = page;
        teacherSearchTerm = searchTerm;
        if(teachersTableBody) teachersTableBody.innerHTML = `<tr><td colspan="7" class="card-main-text">Завантаження... <i class="fas fa-spinner fa-spin" class="card-main-text"></i></td></tr>`;
        const result = await fetchData(`/users/teachers?page=${page}&limit=15&search=${encodeURIComponent(searchTerm)}`);
        if (result && result.success) {
            if(teachersTableBody) renderTable(teachersTableBody, result.data, 'teacher');
            if(teacherPaginationDiv) renderPagination(teacherPaginationDiv, result.pagination, loadTeachers, searchTerm);
        } else {
            if(teachersTableBody) teachersTableBody.innerHTML = `<tr><td colspan="7" class="card-main-text">Помилка завантаження викладачів.</td></tr>`;
            if(teacherPaginationDiv) renderPagination(teacherPaginationDiv, null, loadTeachers);
        }
    }

    async function loadAdmins(page = 1, searchTerm = '') {
        currentAdminPage = page;
        adminSearchTerm = searchTerm;
        if(adminsTableBody) adminsTableBody.innerHTML = `<tr><td colspan="6" class="card-main-text">Завантаження... <i class="fas fa-spinner fa-spin" class="card-main-text"></i></td></tr>`;
        const result = await fetchData(`/users/admins?page=${page}&limit=15&search=${encodeURIComponent(searchTerm)}`);
        if (result && result.success) {
            if(adminsTableBody) renderTable(adminsTableBody, result.data, 'admin');
            if(adminPaginationDiv) renderPagination(adminPaginationDiv, result.pagination, loadAdmins, searchTerm);
        } else {
            if(adminsTableBody) adminsTableBody.innerHTML = `<tr><td colspan="6" class="card-main-text">Помилка завантаження адміністраторів.</td></tr>`;
            if(adminPaginationDiv) renderPagination(adminPaginationDiv, null, loadAdmins);
        }
    }

    async function loadGroupsAndSupervisors(loadGroupsOpt = true, loadSupervisorsOpt = true) {
        if (loadGroupsOpt && studyGroupSelectCreate && editStudyGroupSelect) {
            const groupsResult = await fetchData('/data/studygroups');
            loadedGroups = (groupsResult && groupsResult.success) ? groupsResult.data : [];
            if (loadedGroups.length > 0) {
                populateSelect(studyGroupSelectCreate, loadedGroups, 'study_group_id', 'group_name', 'Виберіть групу...');
                populateSelect(editStudyGroupSelect, loadedGroups, 'study_group_id', 'group_name', 'Виберіть групу...');
            } else {
                studyGroupSelectCreate.innerHTML = '<option value="" disabled selected class="card-main-text">Помилка завантаження груп</option>';
                editStudyGroupSelect.innerHTML = '<option value="" disabled selected class="card-main-text">Помилка завантаження груп</option>';
            }
        }
        if (loadSupervisorsOpt && supervisorSelectStudentCreate && supervisorSelectAdminCreate && editSupervisorSelectStudent && editSupervisorSelectAdmin) {
            const supervisorsResult = await fetchData('/data/supervisors');
            loadedSupervisors = (supervisorsResult && supervisorsResult.success) ? supervisorsResult.data : [];
            if (loadedSupervisors.length > 0) {
                populateSelect(supervisorSelectStudentCreate, loadedSupervisors, 'supervisor_id', 'full_name', 'Виберіть керівника...');
                populateSelect(supervisorSelectAdminCreate, loadedSupervisors, 'supervisor_id', 'full_name', 'Не прив\'язувати', true);
                populateSelect(editSupervisorSelectStudent, loadedSupervisors, 'supervisor_id', 'full_name', 'Виберіть керівника...');
                populateSelect(editSupervisorSelectAdmin, loadedSupervisors, 'supervisor_id', 'full_name', 'Не прив\'язано', true);
            } else {
                supervisorSelectStudentCreate.innerHTML = '<option value="" disabled selected class="card-main-text">Помилка завантаження керівників</option>';
                supervisorSelectAdminCreate.innerHTML = '<option value="" class="card-main-text">Помилка завантаження керівників</option>';
                editSupervisorSelectStudent.innerHTML = '<option value="" disabled selected class="card-main-text">Помилка завантаження керівників</option>';
                editSupervisorSelectAdmin.innerHTML = '<option value="" class="card-main-text">Помилка завантаження керівників</option>';
            }
        }
    }

    function renderTable(tbody, data, type) {
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            const cols = type === 'teacher' ? 7 : (type === 'admin' ? 6 : 6);
            tbody.innerHTML = `<tr><td colspan="${cols}" class="card-main-text">Немає даних для відображення.</td></tr>`;
            return;
        }
        data.forEach(item => {
            const row = document.createElement('tr');
            row.dataset.item = JSON.stringify(item);
            const statusClass = item.is_active ? 'status-active card-main-text' : 'status-inactive card-main-text';
            const statusText = item.is_active ? 'Активний' : 'Неактивний';
            const toggleStatusIcon = item.is_active ? 'fa-toggle-on' : 'fa-toggle-off';
            const toggleStatusTitle = item.is_active ? 'Деактивувати' : 'Активувати';
            const toggleStatusBtnClass = item.is_active ? 'active-status' : 'inactive-status';
            let cells = '';

            switch (type) {
                case 'student':
                    cells = `
                        <td class="card-main-text">${item.student_id || 'N/A'}</td>
                        <td class="card-main-text">${item.full_name || 'N/A'}</td>
                        <td class="card-main-text">${item.email || 'N/A'}</td>
                        <td class="card-main-text">${item.group_name || 'N/A'}</td>
                        <td class="card-main-text"><span class="${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="action-button edit-btn" data-id="${item.account_id}" data-type="student" title="Редагувати"><i class="fas fa-edit" class="card-main-text"></i></button>
                            <button class="action-button status-btn ${toggleStatusBtnClass}" data-id="${item.account_id}" data-status="${item.is_active ? '1' : '0'}" title="${toggleStatusTitle}"><i class="fas ${toggleStatusIcon}" class="card-main-text"></i></button>
                            <button class="action-button delete-btn" data-id="${item.account_id}" data-name="${item.full_name || item.email}" title="Видалити"><i class="fas fa-trash-alt card-main-text"></i></button>
                        </td>`;
                    break;
                case 'teacher':
                    cells = `
                        <td class="card-main-text">${item.supervisor_id || 'N/A'}</td>
                        <td class="card-main-text">${item.full_name || 'N/A'}</td>
                        <td class="card-main-text">${item.email || 'N/A'}</td>
                        <td class="card-main-text">${item.supervisor_department || 'N/A'}</td>
                        <td class="card-main-text">${item.position || 'N/A'}</td>
                        <td class="card-main-text"><span class="${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="action-button edit-btn" data-id="${item.account_id}" data-type="teacher" title="Редагувати"><i class="fas fa-edit" class="card-main-text"></i></button>
                            <button class="action-button status-btn ${toggleStatusBtnClass}" data-id="${item.account_id}" data-status="${item.is_active ? '1' : '0'}" title="${toggleStatusTitle}"><i class="fas ${toggleStatusIcon}" class="card-main-text"></i></button>
                            <button class="action-button delete-btn" data-id="${item.account_id}" data-name="${item.full_name || item.email}" title="Видалити"><i class="fas fa-trash-alt card-main-text"></i></button>
                        </td>`;
                    break;
                case 'admin':
                    const createdAt = item.created_at ? new Date(item.created_at).toLocaleDateString('uk-UA') : 'N/A';
                    const lastLogin = item.last_login ? new Date(item.last_login).toLocaleString('uk-UA') : 'Ніколи';
                    cells = `
                        <td class="card-main-text">${item.account_id || 'N/A'}</td>
                        <td class="card-main-text">${item.email || 'N/A'}</td>
                        <td class="card-main-text">${createdAt}</td>
                        <td class="card-main-text">${lastLogin}</td>
                        <td class="card-main-text"><span class="${statusClass}">${statusText}</span></td>
                        <td>
                            <button class="action-button edit-btn" data-id="${item.account_id}" data-type="admin" title="Редагувати"><i class="fas fa-edit" class="card-main-text"></i></button>
                            <button class="action-button status-btn ${toggleStatusBtnClass}" data-id="${item.account_id}" data-status="${item.is_active ? '1' : '0'}" title="${toggleStatusTitle}"><i class="fas ${toggleStatusIcon}" class="card-main-text"></i></button>
                            <button class="action-button delete-btn" data-id="${item.account_id}" data-name="${item.email}" title="Видалити"><i class="fas fa-trash-alt card-main-text"></i></button>
                        </td>`;
                    break;
            }
            row.innerHTML = cells;
            tbody.appendChild(row);
        });
        addTableActionListeners(tbody);
    }

    function renderPagination(container, pagination, loadFunction, searchTerm = '') {
        if (!container) return;
        container.innerHTML = '';
        if (!pagination || pagination.totalPages <= 1) return;

        const { currentPage, totalPages } = pagination;

        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-btn prev-btn';
        prevButton.title = 'Попередня сторінка';
        prevButton.disabled = currentPage === 1;
        prevButton.innerHTML = '<span class="card-main-text">&laquo;</span>';
        prevButton.addEventListener('click', () => loadFunction(currentPage - 1, searchTerm));
        container.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info card-main-text';
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        container.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-btn next-btn';
        nextButton.title = 'Наступна сторінка';
        nextButton.disabled = currentPage === totalPages;
        nextButton.innerHTML = '<span class="card-main-text">&raquo;</span>';
        nextButton.addEventListener('click', () => loadFunction(currentPage + 1, searchTerm));
        container.appendChild(nextButton);
    }

    function populateSelect(selectElement, data, valueField, textField, defaultOptionText, addEmptyOption = true) {
        if (!selectElement) return;
        selectElement.innerHTML = '';
        if (addEmptyOption) {
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = defaultOptionText;
            defaultOption.className = 'card-main-text';
            if (selectElement.hasAttribute('required') && defaultOptionText !== 'Не прив\'язувати' && defaultOptionText !== 'Не прив\'язано' ) {
                defaultOption.disabled = true;
            }
            defaultOption.selected = true;
            selectElement.appendChild(defaultOption);
        }
        if (data && data.length > 0) {
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueField];
                option.textContent = item[textField];
                option.className = 'card-main-text';
                selectElement.appendChild(option);
            });
        }
    }

    function addTableActionListeners(tbody) {
        tbody.querySelectorAll('.status-btn').forEach(button => {
            button.addEventListener('click', handleStatusToggle);
        });
        tbody.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDeleteUser);
        });
        tbody.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEditUser);
        });
    }

    async function handleStatusToggle(event) {
        const button = event.currentTarget;
        const accountId = button.getAttribute('data-id');
        const currentStatus = button.getAttribute('data-status') === '1';
        const newStatus = !currentStatus;
        const confirmation = confirm(`Ви впевнені, що хочете ${newStatus ? 'активувати' : 'деактивувати'} цей обліковий запис?`);
        if (!confirmation) return;

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin" class="card-main-text"></i>';

        const result = await fetchData(`/users/${accountId}/status`, 'PUT', { isActive: newStatus });

        button.disabled = false;
        if (result && result.success) {
            const activeTabId = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
            if (activeTabId === 'manage-students') loadStudents(currentStudentPage, studentSearchTerm);
            else if (activeTabId === 'manage-teachers') loadTeachers(currentTeacherPage, teacherSearchTerm);
            else if (activeTabId === 'manage-admins') loadAdmins(currentAdminPage, adminSearchTerm);
        } else {
            alert(`Помилка зміни статусу: ${result?.error || 'Невідома помилка'}`);
            const iconClass = currentStatus ? 'fa-toggle-on' : 'fa-toggle-off';
            button.innerHTML = `<i class="fas ${iconClass}" class="card-main-text"></i>`;
        }
    }

    async function handleDeleteUser(event) {
        const button = event.currentTarget;
        const accountId = button.getAttribute('data-id');
        const userName = button.getAttribute('data-name') || `ID: ${accountId}`;

        const confirmation = prompt(`ПОПЕРЕДЖЕННЯ: Видалення користувача (${userName}) є НЕЗВОРОТНИМ і видалить усі пов'язані дані.\n\nДля підтвердження введіть "${userName}":`);

        if (confirmation === null || confirmation.trim() !== userName.trim()) {
            if (confirmation !== null) alert('Підтвердження не співпало. Видалення скасовано.');
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin card-main-text"></i>';

        const result = await fetchData(`/users/${accountId}`, 'DELETE');

        button.disabled = false;
        if (result && result.success) {
            const activeTabId = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
            if (activeTabId === 'manage-students') loadStudents(currentStudentPage, studentSearchTerm);
            else if (activeTabId === 'manage-teachers') loadTeachers(currentTeacherPage, teacherSearchTerm);
            else if (activeTabId === 'manage-admins') loadAdmins(currentAdminPage, adminSearchTerm);
            alert(`Обліковий запис ${userName} успішно видалено.`);
        } else {
            alert(`Помилка видалення: ${result?.error || 'Невідома помилка'}`);
            button.innerHTML = '<i class="fas fa-trash-alt card-main-text"></i>';
        }
    }

    async function handleEditUser(event) {
        const button = event.currentTarget;
        const accountId = button.getAttribute('data-id');
        const userType = button.getAttribute('data-type');
        clearFormMessages();
        clearInlineErrors(editForm);
        editForm.reset();

        const result = await fetchData(`/users/${accountId}/details`);

        if (result && result.success && result.account) {
            currentlyEditingAccountData = result;
            openEditModal(result.account, result.profile, userType);
        } else {
            alert(`Помилка завантаження даних для редагування: ${result?.error || 'Не вдалося отримати деталі'}`);
        }
    }

    function openEditModal(accountData, profileData, userType) {
        editModalTitle.textContent = `Редагувати: ${accountData.email}`;
        editAccountIdInput.value = accountData.account_id;
        editUserTypeInput.value = userType;

        editForm.querySelector('#edit-email').value = accountData.email || '';
        editForm.querySelector('#edit-status').value = accountData.is_active ? '1' : '0';

        editProfileFieldsDiv.style.display = 'none';
        editStudentFieldsDiv.style.display = 'none';
        editTeacherFieldsDiv.style.display = 'none';
        editAdminFieldsDiv.style.display = 'none';

        if (profileData) {
            editProfileFieldsDiv.style.display = 'block';
            editForm.querySelector('#edit-fullName').value = profileData.full_name || '';

            if (userType === 'student') {
                editStudentFieldsDiv.style.display = 'block';
                editForm.querySelector('#edit-studentcardnumber').value = profileData.student_card_number || '';
                editForm.querySelector('#edit-department-student').value = profileData.department || '';
                editForm.querySelector('#edit-phone-student').value = profileData.phone || '';
                populateSelect(editStudyGroupSelect, loadedGroups, 'study_group_id', 'group_name', 'Виберіть групу...');
                editStudyGroupSelect.value = profileData.study_group_id || '';
                populateSelect(editSupervisorSelectStudent, loadedSupervisors, 'supervisor_id', 'full_name', 'Виберіть керівника...');
                editSupervisorSelectStudent.value = profileData.supervisor_id || '';
            } else if (userType === 'teacher' || (userType === 'admin' && accountData.supervisor_id && profileData)) {
                editTeacherFieldsDiv.style.display = 'block';
                editForm.querySelector('#edit-department-teacher').value = profileData.department || '';
                editForm.querySelector('#edit-phone-teacher').value = profileData.phone || '';
                editForm.querySelector('#edit-position').value = profileData.position || '';
                editForm.querySelector('#edit-teacherstatus').value = profileData.teacher_status || '';
                editForm.querySelector('#edit-specialization').value = profileData.specialization || '';
            }
        }
        
        if (userType === 'admin') {
            editAdminFieldsDiv.style.display = 'block';
            populateSelect(editSupervisorSelectAdmin, loadedSupervisors, 'supervisor_id', 'full_name', 'Не прив\'язано', true);
            editSupervisorSelectAdmin.value = accountData.supervisor_id || '';
            if (!profileData && accountData.supervisor_id) {
            } else if (!accountData.supervisor_id) { 
                 editProfileFieldsDiv.style.display = 'none';
                 editTeacherFieldsDiv.style.display = 'none';
            }
        }
        editModal.style.display = 'flex';
    }

    closeModalButton.onclick = () => {
        editModal.style.display = 'none';
        currentlyEditingAccountData = null;
    }
    window.onclick = (event) => {
        if (event.target === editModal) {
            editModal.style.display = 'none';
            currentlyEditingAccountData = null;
        }
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userType = document.getElementById('edit-userType').value;
        let currentValidationConfig;
        if (userType === 'student') {
            currentValidationConfig = editFormStudentConfig;
        } else if (userType === 'teacher') {
            currentValidationConfig = editFormTeacherConfig;
        } else if (userType === 'admin') {
            currentValidationConfig = editFormAdminConfig;
        } else {
            return;
        }
        
        if (!validateForm(editForm, currentValidationConfig)) {
            return;
        }
        
        const payload = {};

        payload['edit-email'] = document.getElementById('edit-email').value;
        payload['edit-status'] = document.getElementById('edit-status').value;

        const fullNameField = document.getElementById('edit-fullName');
        if (fullNameField && fullNameField.offsetParent !== null) {
            payload['edit-fullName'] = fullNameField.value;
        }

        if (userType === 'student') {
            payload['edit-studentcardnumber'] = document.getElementById('edit-studentcardnumber').value;
            payload['edit-department'] = document.getElementById('edit-department-student').value;
            payload['edit-phone'] = document.getElementById('edit-phone-student').value;
            payload['edit-studygroupid'] = document.getElementById('edit-studygroupid').value;
            payload['edit-supervisorid'] = document.getElementById('edit-supervisorid-student').value;
        } else if (userType === 'teacher' || (userType === 'admin' && currentlyEditingAccountData?.profile)) {
            payload['edit-department'] = document.getElementById('edit-department-teacher').value;
            payload['edit-phone'] = document.getElementById('edit-phone-teacher').value;
            payload['edit-position'] = document.getElementById('edit-position').value;
            payload['edit-teacherstatus'] = document.getElementById('edit-teacherstatus').value;
            payload['edit-specialization'] = document.getElementById('edit-specialization').value;
        }

        if (userType === 'admin') {
            const adminSupervisorField = document.getElementById('edit-supervisorid-admin');
            if (adminSupervisorField && adminSupervisorField.offsetParent !== null) {
                 payload['edit-supervisorid'] = adminSupervisorField.value;
                 if (payload['edit-supervisorid'] === "") payload['edit-supervisorid'] = null;
            }
        }
        
        payload.originalAccountData = {
            email: currentlyEditingAccountData?.account?.email,
            role: currentlyEditingAccountData?.account?.role,
            student_id: currentlyEditingAccountData?.account?.student_id,
            supervisor_id: currentlyEditingAccountData?.account?.supervisor_id,
        };

        const submitButton = editForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = 'Збереження... <i class="fas fa-spinner fa-spin card-main-text"></i>';

        const accountId = document.getElementById('edit-accountId').value;
        const result = await fetchData(`/users/${accountId}/details`, 'PUT', payload);

        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;

        if (result && result.success) {
            displayMessage(getFormMessageElement('editForm'), result.message || 'Дані успішно оновлено!', 'success');
            setTimeout(() => {
                editModal.style.display = 'none';
                currentlyEditingAccountData = null;
                const activeTabId = document.querySelector('.tab-button.active')?.getAttribute('data-tab');
                if (activeTabId === 'manage-students') loadStudents(currentStudentPage, studentSearchTerm);
                else if (activeTabId === 'manage-teachers') loadTeachers(currentTeacherPage, teacherSearchTerm);
                else if (activeTabId === 'manage-admins') loadAdmins(currentAdminPage, adminSearchTerm);
            }, 1500);
        } else {
            if (result && result.errors) {
                const clientErrorsForDisplay = {};
                for (const serverErrorKey in result.errors) {
                    const errorSpanDomId = serverErrorKey + "-error";
                    clientErrorsForDisplay[errorSpanDomId] = result.errors[serverErrorKey];
                }
                showInlineErrors(editForm, clientErrorsForDisplay);
            } else {
                displayMessage(getFormMessageElement('editForm'), result?.error || 'Помилка збереження.', 'error');
            }
        }
    });

    if(createStudentForm) createStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(createStudentForm, createStudentFormConfig)) {
            return;
        }
        const formData = new FormData(createStudentForm);
        const data = {};
        for (const [htmlName, value] of formData.entries()) {
            if (htmlName === 'fullName') data.fullName = value;
            else if (htmlName === 'email') data.email = value;
            else if (htmlName === 'phoneNumber') data.phoneNumber = value;
            else if (htmlName === 'studentCardNumber') data.studentCardNumber = value;
            else if (htmlName === 'department') data.department = value;
            else if (htmlName === 'studyGroupId') data.studyGroupId = value;
            else if (htmlName === 'supervisorId') data.supervisorId = value;
            else if (htmlName === 'password') data.password = value;
        }
         if (data.supervisorId === "") data.supervisorId = null;


        const submitButton = createStudentForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = 'Створення... <i class="fas fa-spinner fa-spin card-main-text"></i>';
        const result = await fetchData('/create/student', 'POST', data);
        submitButton.disabled = false;
        submitButton.textContent = 'Створити Студента';
        if (result && result.success) {
            displayMessage(getFormMessageElement('createStudentForm'), result.message || 'Студента успішно створено!', 'success');
            createStudentForm.reset();
            document.querySelector('.tab-button[data-tab="manage-students"]').click();
        } else {
            if (result && result.errors) {
                 const clientErrors = {};
                for (const serverKey in result.errors) {
                    let clientErrorInputId = serverKey; 
                    if(serverKey === 'fullName') clientErrorInputId = 'create-fullName';
                    else if(serverKey === 'email') clientErrorInputId = 'create-email';
                    else if(serverKey === 'phoneNumber') clientErrorInputId = 'create-phone';
                    else if(serverKey === 'studentCardNumber') clientErrorInputId = 'create-studentCard';
                    else if(serverKey === 'department') clientErrorInputId = 'create-department';
                    else if(serverKey === 'studyGroupId') clientErrorInputId = 'create-studyGroup';
                    else if(serverKey === 'supervisorId') clientErrorInputId = 'create-supervisor';
                    else if(serverKey === 'password') clientErrorInputId = 'create-password-student';
                    else if (serverKey.startsWith('create-') && serverKey.endsWith('-student')) {
                        clientErrorInputId = serverKey;
                    } else if (serverKey.startsWith('create-')) {
                         clientErrorInputId = serverKey;
                    }


                    clientErrors[`${clientErrorInputId}-error`] = result.errors[serverKey];
                }
                showInlineErrors(createStudentForm, clientErrors);
            } else {
                 displayMessage(getFormMessageElement('createStudentForm'), result?.error || 'Помилка створення студента.', 'error');
            }
        }
    });

    if(createTeacherForm) createTeacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm(createTeacherForm, createTeacherFormConfig)) {
            return;
        }
        const formData = new FormData(createTeacherForm);
        const data = {};
         for (const [htmlName, value] of formData.entries()) {
            if(htmlName === 'fullName') data.fullName = value;
            else if(htmlName === 'email') data.email = value;
            else if(htmlName === 'phone') data.phone = value;
            else if(htmlName === 'department') data.department = value;
            else if(htmlName === 'position') data.position = value;
            else if(htmlName === 'teacher_status') data.teacher_status = value;
            else if(htmlName === 'specialization') data.specialization = value;
            else if(htmlName === 'password') data.password = value;
        }


        const submitButton = createTeacherForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = 'Створення... <i class="fas fa-spinner fa-spin card-main-text"></i>';
        const result = await fetchData('/create/teacher', 'POST', data);
        submitButton.disabled = false;
        submitButton.textContent = 'Створити Викладача';
        if (result && result.success) {
            displayMessage(getFormMessageElement('createTeacherForm'), result.message || 'Викладача успішно створено!', 'success');
            createTeacherForm.reset();
            document.querySelector('.tab-button[data-tab="manage-teachers"]').click();
        } else {
             if (result && result.errors) {
                const clientErrors = {};
                for (const serverKey in result.errors) {
                    let clientErrorInputId = serverKey;
                    if(serverKey === 'fullName') clientErrorInputId = 'create-teacher-fullName';
                    else if(serverKey === 'email') clientErrorInputId = 'create-teacher-email';
                    else if(serverKey === 'phone') clientErrorInputId = 'create-teacher-phone';
                    else if(serverKey === 'department') clientErrorInputId = 'create-teacher-department';
                    else if(serverKey === 'position') clientErrorInputId = 'create-teacher-position';
                    else if(serverKey === 'teacher_status') clientErrorInputId = 'create-teacher-status';
                    else if(serverKey === 'specialization') clientErrorInputId = 'create-teacher-specialization';
                    else if(serverKey === 'password') clientErrorInputId = 'create-password-teacher';
                     else if (serverKey.startsWith('create-teacher-')) {
                        clientErrorInputId = serverKey;
                    } else if (serverKey.startsWith('create-') && serverKey.endsWith('-teacher')) {
                        clientErrorInputId = serverKey;
                    }


                    clientErrors[`${clientErrorInputId}-error`] = result.errors[serverKey];
                }
                showInlineErrors(createTeacherForm, clientErrors);
            } else {
                 displayMessage(getFormMessageElement('createTeacherForm'), result?.error || 'Помилка створення викладача.', 'error');
            }
        }
    });

    if(createAdminForm) createAdminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(createAdminForm, createAdminFormConfig)) {
            return;
        }
        const formData = new FormData(createAdminForm);
        const data = {};
        for (const [htmlName, value] of formData.entries()) {
            if(htmlName === 'email') data.email = value;
            else if(htmlName === 'password') data.password = value;
            else if(htmlName === 'supervisorId') data.supervisorId = value;
        }
        if (!data.supervisorId || data.supervisorId === "") data.supervisorId = null;
        
        const submitButton = createAdminForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = 'Створення... <i class="fas fa-spinner fa-spin card-main-text"></i>';
        const result = await fetchData('/create/admin', 'POST', data);
        submitButton.disabled = false;
        submitButton.textContent = 'Створити Адміна';
        if (result && result.success) {
            displayMessage(getFormMessageElement('createAdminForm'), result.message || 'Адміністратора успішно створено!', 'success');
            createAdminForm.reset();
            document.querySelector('.tab-button[data-tab="manage-admins"]').click();
        } else {
             if (result && result.errors) {
                 const clientErrors = {};
                for (const serverKey in result.errors) {
                     let clientErrorInputId = serverKey;
                     if(serverKey === 'email') clientErrorInputId = 'create-admin-email';
                     else if(serverKey === 'password') clientErrorInputId = 'create-password-admin';
                     else if(serverKey === 'supervisorId') clientErrorInputId = 'link-supervisor';
                     else if (serverKey.startsWith('create-admin-')) {
                        clientErrorInputId = serverKey;
                    } else if (serverKey.startsWith('create-') && serverKey.endsWith('-admin')) {
                         clientErrorInputId = serverKey;
                    }


                    clientErrors[`${clientErrorInputId}-error`] = result.errors[serverKey];
                }
                showInlineErrors(createAdminForm, clientErrors);
            } else {
                 displayMessage(getFormMessageElement('createAdminForm'), result?.error || 'Помилка створення адміністратора.', 'error');
            }
        }
    });

    if(studentSearchInput) {
        let studentSearchTimeout;
        studentSearchInput.addEventListener('input', () => {
            clearTimeout(studentSearchTimeout);
            studentSearchTimeout = setTimeout(() => {
                loadStudents(1, studentSearchInput.value.trim());
            }, 350);
        });
    }

    if(teacherSearchInput) {
        let teacherSearchTimeout;
        teacherSearchInput.addEventListener('input', () => {
            clearTimeout(teacherSearchTimeout);
            teacherSearchTimeout = setTimeout(() => {
                loadTeachers(1, teacherSearchInput.value.trim());
            }, 350);
        });
    }
    
    if(adminSearchInput) {
        let adminSearchTimeout;
        adminSearchInput.addEventListener('input', () => {
            clearTimeout(adminSearchTimeout);
            adminSearchTimeout = setTimeout(() => {
                loadAdmins(1, adminSearchInput.value.trim());
            }, 350);
        });
    }

    if(refreshStudentsBtn) refreshStudentsBtn.addEventListener('click', () => loadStudents(currentStudentPage, studentSearchTerm));
    if(refreshTeachersBtn) refreshTeachersBtn.addEventListener('click', () => loadTeachers(currentTeacherPage, teacherSearchTerm));
    if(refreshAdminsBtn) refreshAdminsBtn.addEventListener('click', () => loadAdmins(currentAdminPage, adminSearchTerm));

    if (studentsTableBody) loadStudents();
    if (studyGroupSelectCreate || supervisorSelectStudentCreate || supervisorSelectAdminCreate) {
        loadGroupsAndSupervisors(true, true);
    }
});
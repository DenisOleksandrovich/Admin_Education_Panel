import { getAuthHeaders, getUserInfo, showNotification } from './authUtils.js';

const backendUrl = 'http://localhost:3000';
let currentAssignmentId = null;
let currentAssignmentTitle = '';
let allSubmissionsForCurrentAssignment = [];

const pageTitleSpanEl = document.getElementById('checkPageAssignmentTitle');
const assignmentDeadlineEl = document.getElementById('checkPageAssignmentDeadline');
const backToTasksLink = document.getElementById('backToTasksLink');

const searchInputEl = document.getElementById('submissionSearchInput');
const clearSearchBtnEl = document.getElementById('clearSubmissionSearch');
const statusFilterEl = document.getElementById('submissionStatusFilter');
const sortFilterEl = document.getElementById('submissionSortFilter');
const submissionsTableBodyEl = document.getElementById('assignmentSubmissionsTableBody');
const noSubmissionsMsgEl = document.getElementById('noSubmissionsMessage');

const detailedReviewOverlay = document.getElementById('detailedSubmissionReviewOverlay');
const detailedReviewTitleEl = document.getElementById('detailedReviewTitle');
const closeDetailedReviewModalBtn = document.getElementById('closeDetailedReviewModal');
const reviewAssignmentTitleEl = document.getElementById('reviewAssignmentTitle');
const reviewAssignmentDetailsLinkEl = document.getElementById('reviewAssignmentDetailsLink');
const reviewStudentNameEl = document.getElementById('reviewStudentName');
const reviewStudentGroupEl = document.getElementById('reviewStudentGroup');
const reviewSubmissionDateEl = document.getElementById('reviewSubmissionDate');
const reviewCurrentStatusEl = document.getElementById('reviewCurrentStatus');
const reviewCurrentGradeEl = document.getElementById('reviewCurrentGrade');
const reviewSubmissionFileLinkEl = document.getElementById('reviewSubmissionFileLink');
const reviewSubmissionVersionsListEl = document.getElementById('reviewSubmissionVersionsList');
const reviewVersionCountEl = document.getElementById('reviewVersionCount');
const gradeStarsContainerEl = document.getElementById('gradeStarsContainer');
const submissionGradeInputHiddenEl = document.getElementById('submissionGradeInputHidden');
const submissionNewStatusSelectEl = document.getElementById('submissionNewStatusSelect');
const supervisorCommentInputEl = document.getElementById('supervisorCommentInput');
const saveSubmissionReviewBtn = document.getElementById('saveSubmissionReviewBtn');
const reviewSubmissionCommentsListEl = document.getElementById('reviewSubmissionCommentsList');
const reviewCommentCountEl = document.getElementById('reviewCommentCount');

let currentDetailedSubmissionId = null;
let currentUserInfo = null;
let submissionDataForModal = null;

function getStatusClass(status) {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('протерміновано')) return 'status-overdue';
    if (statusLower.includes('прийнято')) return 'status-completed';
    if (statusLower.includes('зараховано')) return 'status-zaraxovano';
    if (statusLower.includes('перевірці')) return 'status-in-review';
    if (statusLower.includes('доопрацювання')) return 'status-finalization';
    if (statusLower.includes('відхилено')) return 'status-rejected';
    if (statusLower.includes('пізня здача')) return 'status-pizno';
    return 'status-pending';
}

async function loadSubmissionsForPage(assignmentId) {
    if (!submissionsTableBodyEl || !noSubmissionsMsgEl) return;
    submissionsTableBodyEl.innerHTML = `<tr><td colspan="7" style="text-align:center;" class="card-main-text">Завантаження...</td></tr>`;
    noSubmissionsMsgEl.style.display = 'none';

    try {
        const headers = getAuthHeaders();
        const response = await fetch(`${backendUrl}/assignments/${assignmentId}/submissions`, { headers });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`HTTP ${response.status}: ${errData.error || 'Не вдалося завантажити роботи'}`);
        }
        allSubmissionsForCurrentAssignment = await response.json();
        if (allSubmissionsForCurrentAssignment.length > 0 && allSubmissionsForCurrentAssignment[0].submission_id !== null) {
            const firstSub = allSubmissionsForCurrentAssignment[0];
            currentAssignmentTitle = firstSub.assignment_title || 'Завдання';
            if(pageTitleSpanEl) pageTitleSpanEl.textContent = currentAssignmentTitle;
            if(assignmentDeadlineEl) assignmentDeadlineEl.textContent = firstSub.assignment_deadline ? new Date(firstSub.assignment_deadline).toLocaleDateString('uk-UA') : 'Не вказано';
            if(reviewAssignmentDetailsLinkEl && firstSub.original_assignment_id) reviewAssignmentDetailsLinkEl.href = `task_detail_view.html?assignmentId=${firstSub.original_assignment_id}`;

        } else if (allSubmissionsForCurrentAssignment.length > 0 && allSubmissionsForCurrentAssignment[0].submission_id === null) {
            const assignDetails = allSubmissionsForCurrentAssignment[0];
            currentAssignmentTitle = assignDetails.assignment_title || 'Завдання';
             if(pageTitleSpanEl) pageTitleSpanEl.textContent = currentAssignmentTitle;
            if(assignmentDeadlineEl) assignmentDeadlineEl.textContent = assignDetails.assignment_deadline ? new Date(assignDetails.assignment_deadline).toLocaleDateString('uk-UA') : 'Не вказано';
            if(reviewAssignmentDetailsLinkEl && assignDetails.original_assignment_id) reviewAssignmentDetailsLinkEl.href = `task_detail_view.html?assignmentId=${assignDetails.original_assignment_id}`;
            allSubmissionsForCurrentAssignment = [];
        }
         else {
            if(pageTitleSpanEl) pageTitleSpanEl.textContent = "Немає даних про завдання";
            if(assignmentDeadlineEl) assignmentDeadlineEl.textContent = "N/A";
            allSubmissionsForCurrentAssignment = [];
        }
        renderSubmissionsTable();
    } catch (error) {
        console.error("Помилка завантаження робіт для сторінки:", error);
        if(submissionsTableBodyEl) submissionsTableBodyEl.innerHTML = `<tr><td colspan="7" class="error-text" style="text-align:center;">Помилка завантаження: ${error.message}</td></tr>`;
        showNotification(`Не вдалося завантажити роботи: ${error.message}`, 'error');
    }
}

function renderSubmissionsTable() {
    if (!submissionsTableBodyEl || !noSubmissionsMsgEl) return;
    submissionsTableBodyEl.innerHTML = '';

    const searchTerm = searchInputEl?.value.toLowerCase() || '';
    const statusFilter = statusFilterEl?.value || '';
    const sortOption = sortFilterEl?.value || 'upload_time_desc';

    let filteredSubmissions = allSubmissionsForCurrentAssignment.filter(sub => {
        if (!sub.submission_id) return false;
        const studentNameMatch = sub.student_name?.toLowerCase().includes(searchTerm);
        const groupNameMatch = sub.group_name?.toLowerCase().includes(searchTerm);
        const statusMatch = !statusFilter || sub.submission_status === statusFilter;
        return (studentNameMatch || groupNameMatch) && statusMatch;
    });

    filteredSubmissions.sort((a, b) => {
        switch (sortOption) {
            case 'upload_time_asc': return new Date(a.upload_time) - new Date(b.upload_time);
            case 'student_name_asc': return (a.student_name || '').localeCompare(b.student_name || '', 'uk');
            case 'student_name_desc': return (b.student_name || '').localeCompare(a.student_name || '', 'uk');
            case 'submission_status_asc': return (a.submission_status || '').localeCompare(b.submission_status || '', 'uk');
            case 'upload_time_desc':
            default:
                return new Date(b.upload_time) - new Date(a.upload_time);
        }
    });

    if (filteredSubmissions.length === 0) {
        noSubmissionsMsgEl.style.display = 'block';
        return;
    }
    noSubmissionsMsgEl.style.display = 'none';

    filteredSubmissions.forEach(sub => {
        const row = submissionsTableBodyEl.insertRow();
        row.insertCell().textContent = sub.student_name || 'Н/Д';
        row.insertCell().textContent = sub.group_name || 'Н/Д';
        row.insertCell().textContent = new Date(sub.upload_time).toLocaleString('uk-UA');

        const statusCell = row.insertCell();
        const statusSpan = document.createElement('span');
        statusSpan.className = `submission-status ${getStatusClass(sub.submission_status)}`;
        statusSpan.textContent = sub.submission_status || 'Н/Д';
        statusCell.appendChild(statusSpan);

        row.insertCell().textContent = sub.grade !== null ? `${sub.grade}/10` : '---';

        const fileCell = row.insertCell();
        fileCell.className = 'file-link';
        if (sub.file_name) {
            const isUrl = /^(https?|ftp):\/\//.test(sub.file_name);
            const downloadUrl = isUrl ? sub.file_name : `${backendUrl}/uploads/${encodeURIComponent(sub.file_name)}`;
            const displayFileName = isUrl ? decodeURIComponent(sub.file_name.split('/').pop() || sub.file_name) : sub.file_name;
            fileCell.innerHTML = `<a href="${downloadUrl}" target="_blank" title="${decodeURIComponent(sub.file_name)}">${displayFileName.length > 25 ? displayFileName.substring(0,22)+'...' : displayFileName}</a>`;
        } else {
            fileCell.textContent = 'Н/Д';
        }

        const actionsCell = row.insertCell();
        const detailButton = document.createElement('button');
        detailButton.className = 'card-main-text task-action-button open-detailed-review';
        detailButton.title = 'Детальна перевірка';
        detailButton.innerHTML = '<i class="fas fa-eye" class="card-main-text"></i>';
        detailButton.dataset.submissionId = sub.submission_id;
        detailButton.addEventListener('click', () => openDetailedSubmissionReviewModal(sub.submission_id));
        actionsCell.appendChild(detailButton);
    });
}

function setupGradeStars() {
    if (!gradeStarsContainerEl || !submissionGradeInputHiddenEl) return;
    gradeStarsContainerEl.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const star = document.createElement('i');
        star.classList.add('fas', 'fa-star', 'grade-star');
        star.dataset.value = i;
        star.addEventListener('click', () => {
            submissionGradeInputHiddenEl.value = i;
            updateStarSelection(i);
        });
        star.addEventListener('mouseover', () => highlightStars(i, true));
        star.addEventListener('mouseout', () => highlightStars(parseInt(submissionGradeInputHiddenEl.value) || 0, false));
        gradeStarsContainerEl.appendChild(star);
    }
    updateStarSelection(parseInt(submissionGradeInputHiddenEl.value) || 0);
}

function updateStarSelection(selectedValue) {
    const stars = gradeStarsContainerEl?.querySelectorAll('.grade-star');
    if(!stars) return;
    stars.forEach(star => {
        star.classList.toggle('selected', parseInt(star.dataset.value) <= selectedValue);
    });
}
function highlightStars(hoverValue, isHovering) {
    const stars = gradeStarsContainerEl?.querySelectorAll('.grade-star');
    if(!stars) return;
    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        if (isHovering) {
            star.classList.toggle('hovered', starValue <= hoverValue);
        } else {
            star.classList.remove('hovered');
        }
    });
}

async function openDetailedSubmissionReviewModal(submissionId) {
    currentDetailedSubmissionId = submissionId;
    if (!detailedReviewOverlay) return;
    detailedReviewOverlay.style.display = 'flex';

    if(reviewAssignmentTitleEl) reviewAssignmentTitleEl.textContent = 'Завантаження...';
    if(reviewStudentNameEl) reviewStudentNameEl.textContent = '';
    if(reviewStudentGroupEl) reviewStudentGroupEl.textContent = '';
    if(reviewSubmissionDateEl) reviewSubmissionDateEl.textContent = '';
    if(reviewCurrentStatusEl) { reviewCurrentStatusEl.textContent = ''; reviewCurrentStatusEl.className = 'submission-status';}
    if(reviewCurrentGradeEl) reviewCurrentGradeEl.textContent = '';
    if(submissionGradeInputHiddenEl) submissionGradeInputHiddenEl.value = '';
    updateStarSelection(0);
    if(submissionNewStatusSelectEl) submissionNewStatusSelectEl.value = 'На перевірці';
    if(supervisorCommentInputEl) supervisorCommentInputEl.value = '';
    if(reviewSubmissionFileLinkEl) reviewSubmissionFileLinkEl.innerHTML = '';
    if(reviewSubmissionVersionsListEl) reviewSubmissionVersionsListEl.innerHTML = '<li>Завантаження...</li>';
    if(reviewSubmissionCommentsListEl) reviewSubmissionCommentsListEl.innerHTML = '<div>Завантаження...</div>';
    if(reviewVersionCountEl) reviewVersionCountEl.textContent = '0';
    if(reviewCommentCountEl) reviewCommentCountEl.textContent = '0';


    try {
        const headers = getAuthHeaders();
        const subResponse = await fetch(`${backendUrl}/submissions/${submissionId}`, { headers });
        if (!subResponse.ok) throw new Error(`Не вдалося завантажити дані здачі: ${subResponse.status}`);
        submissionDataForModal = await subResponse.json();

        if(detailedReviewTitleEl) detailedReviewTitleEl.textContent = `Перевірка: ${submissionDataForModal.assignment_title || 'Завдання'} - ${submissionDataForModal.student_name || 'Студент'}`;
        if(reviewAssignmentTitleEl) reviewAssignmentTitleEl.textContent = submissionDataForModal.assignment_title || 'Н/Д';
        if(reviewAssignmentDetailsLinkEl && submissionDataForModal.assignment_id) reviewAssignmentDetailsLinkEl.href = `task_detail_view.html?assignmentId=${submissionDataForModal.assignment_id}`;

        if(reviewStudentNameEl) reviewStudentNameEl.textContent = submissionDataForModal.student_name || 'Н/Д';
        if(reviewStudentGroupEl) reviewStudentGroupEl.textContent = submissionDataForModal.group_name || 'Група Н/Д';
        if(reviewSubmissionDateEl) reviewSubmissionDateEl.textContent = new Date(submissionDataForModal.upload_time).toLocaleString('uk-UA');
        if(reviewCurrentStatusEl) {
            reviewCurrentStatusEl.textContent = submissionDataForModal.status || 'Н/Д';
            reviewCurrentStatusEl.className = `card-main-text submission-status ${getStatusClass(submissionDataForModal.status)}`;
        }
        const gradeValue = submissionDataForModal.grade !== null ? parseInt(submissionDataForModal.grade) : null;
        if(reviewCurrentGradeEl) reviewCurrentGradeEl.textContent = gradeValue !== null ? `${gradeValue}/10` : 'Немає';
        if(submissionGradeInputHiddenEl) submissionGradeInputHiddenEl.value = gradeValue !== null ? gradeValue : '';
        updateStarSelection(gradeValue !== null ? gradeValue : 0);
        if(submissionNewStatusSelectEl) submissionNewStatusSelectEl.value = submissionDataForModal.status || 'На перевірці';
        if(supervisorCommentInputEl && submissionDataForModal.supervisor_comment) supervisorCommentInputEl.value = submissionDataForModal.supervisor_comment;


        if (reviewSubmissionFileLinkEl) {
            if (submissionDataForModal.file_name) {
                 const isUrl = /^(https?|ftp):\/\//.test(submissionDataForModal.file_name);
                 const downloadUrl = isUrl ? submissionDataForModal.file_name : `${backendUrl}/uploads/${encodeURIComponent(submissionDataForModal.file_name)}`;
                 const displayFileName = isUrl ? decodeURIComponent(submissionDataForModal.file_name.split('/').pop() || submissionDataForModal.file_name) : submissionDataForModal.file_name;
                 reviewSubmissionFileLinkEl.innerHTML = `<a href="${downloadUrl}" target="_blank">${displayFileName} <i class="fas fa-external-link-alt"></i></a>`;
            } else {
                 reviewSubmissionFileLinkEl.textContent = 'Файл/посилання не надано.';
            }
        }

        if (reviewSubmissionVersionsListEl && reviewVersionCountEl) {
            const versionsResponse = await fetch(`${backendUrl}/submissions/${submissionId}/versions`, { headers });
            if (versionsResponse.ok) {
                const responseData = await versionsResponse.json();
                const versions = responseData.versions || [];
                reviewVersionCountEl.textContent = versions.length;
                reviewSubmissionVersionsListEl.innerHTML = '';
                if (versions.length > 0) {
                    versions.forEach(v => {
                        const li = document.createElement('li');
                        const versionNumberDisplay = `${v.major_version !== undefined ? v.major_version : '1'}.${v.minor_version !== undefined ? v.minor_version : '0'}`;
                        const displayVersionFileName = v.file_name ? (v.file_name.split('/').pop() || v.file_name) : 'файл версії';
                        const versionFileUrl = v.file_url || '#';

                        let versionHtml = `Версія ${versionNumberDisplay} (${new Date(v.upload_time).toLocaleString('uk-UA')}): <a href="${versionFileUrl}" target="_blank" title="${v.file_name || ''}">${displayVersionFileName}</a>`;

                        if (submissionDataForModal && submissionDataForModal.grade !== null && submissionDataForModal.grade !== undefined) {
                            versionHtml += ` <span class="version-grade-display card-main-text" style="font-weight: bold;">(Оцінка: ${submissionDataForModal.grade}/10)</span>`;
                        }
                        li.innerHTML = versionHtml;
                        reviewSubmissionVersionsListEl.appendChild(li);
                    });
                } else {
                    reviewSubmissionVersionsListEl.innerHTML = '<li class="card-main-text">Історія версій відсутня.</li>';
                }
            } else {
                reviewSubmissionVersionsListEl.innerHTML = '<li class="card-main-text">Помилка завантаження версій.</li>';
            }
        }

        if (reviewSubmissionCommentsListEl && reviewCommentCountEl) {
            const commentsResponse = await fetch(`${backendUrl}/submissions/${submissionId}/comments`, { headers });
            if (commentsResponse.ok) {
                const commentsData = await commentsResponse.json();
                const comments = commentsData.comments || commentsData || [];
                reviewCommentCountEl.textContent = comments.length;
                reviewSubmissionCommentsListEl.innerHTML = '';
                if (comments.length > 0) {
                    comments.forEach(comment => {
                        const commentDiv = document.createElement('div');
                        commentDiv.className = 'comment-item';
                        commentDiv.innerHTML = `
                            <div class="comment-header">
                                <span class="comment-author">${comment.author_name || 'Анонім'} (${comment.author_role || 'Користувач'})</span>
                                <span class="comment-date">${new Date(comment.comment_date).toLocaleString('uk-UA')}</span>
                            </div>
                            <div class="comment-text">${comment.comment_text}</div>`;
                        reviewSubmissionCommentsListEl.appendChild(commentDiv);
                    });
                } else {
                    reviewSubmissionCommentsListEl.innerHTML = '<div class="card-main-text">Коментарів до цієї роботи ще немає.</div>';
                }
            } else {
                reviewSubmissionCommentsListEl.innerHTML = '<div class="card-main-text">Помилка завантаження коментарів.</div>';
            }
        }
    } catch (error) {
        console.error("Помилка завантаження деталей здачі:", error);
        if(detailedReviewTitleEl) detailedReviewTitleEl.textContent = "Помилка завантаження";
        showNotification(`Не вдалося завантажити деталі: ${error.message}`, 'error', 'notification-container-tasks');
    }
}

async function handleSaveReview() {
    if (!currentDetailedSubmissionId) {
        showNotification('ID зданої роботи не визначено.', 'error');
        return;
    }

    const grade = submissionGradeInputHiddenEl?.value !== '' ? parseInt(submissionGradeInputHiddenEl.value, 10) : null;
    const status = submissionNewStatusSelectEl?.value;
    const supervisorComment = supervisorCommentInputEl?.value.trim();

    if (grade === null && !status && !supervisorComment) {
        showNotification('Виберіть оцінку, новий статус або напишіть коментар.', 'warning', 'notification-container-tasks');
        return;
    }
     if (grade !== null && (isNaN(grade) || grade < 0 || grade > 10)) {
        showNotification('Оцінка повинна бути числом від 0 до 10.', 'warning', 'notification-container-tasks');
        return;
    }

    const payload = {};
    if (grade !== null) payload.grade = grade;
    if (status) payload.status = status;
    if (supervisorComment) payload.supervisor_comment = supervisorComment;


    if(saveSubmissionReviewBtn) {
        saveSubmissionReviewBtn.disabled = true;
        saveSubmissionReviewBtn.textContent = 'Збереження...';
    }

    try {
        const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
        const response = await fetch(`${backendUrl}/submissions/${currentDetailedSubmissionId}/review`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error || `HTTP помилка: ${response.status}`);
        }
        showNotification('Перевірку успішно збережено!', 'success', 'notification-container-tasks');
        closeDetailedReviewModal();
        if (currentAssignmentId) {
             await loadSubmissionsForPage(currentAssignmentId);
        }
    } catch (error) {
        console.error("Помилка збереження перевірки:", error);
        showNotification(`Помилка: ${error.message}`, 'error', 'notification-container-tasks');
    } finally {
         if(saveSubmissionReviewBtn) {
            saveSubmissionReviewBtn.disabled = false;
            saveSubmissionReviewBtn.textContent = 'Зберегти перевірку';
        }
    }
}

function closeDetailedReviewModal() {
    if (detailedReviewOverlay) detailedReviewOverlay.style.display = 'none';
    currentDetailedSubmissionId = null;
    submissionDataForModal = null;
}

function initPageEventListeners() {
    if (searchInputEl) searchInputEl.addEventListener('input', renderSubmissionsTable);
    if (clearSearchBtnEl) {
        clearSearchBtnEl.addEventListener('click', () => {
            if(searchInputEl) searchInputEl.value = '';
            renderSubmissionsTable();
        });
        searchInputEl.addEventListener('input', () => {
            clearSearchBtnEl.style.display = searchInputEl.value ? 'flex' : 'none';
        });
         clearSearchBtnEl.style.display = searchInputEl.value ? 'flex' : 'none';
    }
    if (statusFilterEl) statusFilterEl.addEventListener('change', renderSubmissionsTable);
    if (sortFilterEl) sortFilterEl.addEventListener('change', renderSubmissionsTable);

    if (closeDetailedReviewModalBtn) closeDetailedReviewModalBtn.addEventListener('click', closeDetailedReviewModal);
    if (detailedReviewOverlay) {
        detailedReviewOverlay.addEventListener('click', (event) => {
            if (event.target === detailedReviewOverlay) closeDetailedReviewModal();
        });
    }
    if (saveSubmissionReviewBtn) saveSubmissionReviewBtn.addEventListener('click', handleSaveReview);

    setupGradeStars();
}

async function initializeCheckPage() {
    currentUserInfo = await getUserInfo();
     if (!currentUserInfo || (currentUserInfo.role !== 'supervisor' && currentUserInfo.role !== 'admin')) {
        if(document.getElementById('assignmentCheckPageContent')) document.getElementById('assignmentCheckPageContent').innerHTML = '<p class="card-main-text error-text">Доступ заборонено. Ця сторінка призначена для викладачів та адміністраторів.</p>';
        if(pageTitleSpanEl) pageTitleSpanEl.textContent = 'Доступ заборонено';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const assignmentIdFromUrl = urlParams.get('assignmentId');

    if (assignmentIdFromUrl) {
        currentAssignmentId = parseInt(assignmentIdFromUrl, 10);
        if (!isNaN(currentAssignmentId)) {
            if(backToTasksLink) backToTasksLink.href = `tasks.html`;
            await loadSubmissionsForPage(currentAssignmentId);
        } else {
            if(pageTitleSpanEl) pageTitleSpanEl.textContent = 'Невірний ID Завдання';
            if(submissionsTableBodyEl) submissionsTableBodyEl.innerHTML = `<tr><td colspan="7" class="error-text" style="text-align:center;">Невірний ID завдання в URL.</td></tr>`;
        }
    } else {
        if(pageTitleSpanEl) pageTitleSpanEl.textContent = 'ID Завдання не вказано';
        if(submissionsTableBodyEl) submissionsTableBodyEl.innerHTML = `<tr><td colspan="7" class="card-main-text" style="text-align:center;">ID завдання не передано в URL. Поверніться на <a href="tasks.html">сторінку завдань</a> та виберіть завдання для перевірки.</td></tr>`;
    }
    initPageEventListeners();
}

document.addEventListener('DOMContentLoaded', initializeCheckPage);
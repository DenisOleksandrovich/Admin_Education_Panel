import { getAuthHeaders, getUserInfo, showNotification } from './authUtils.js';

const backendUrl = 'http://localhost:3000';
let currentUserInfo = null; // Зробимо доступною на рівні модуля

function formatDate(dateString, type = 'submission') {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        const formattedDate = date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        if (type === 'assignment') {
            return `Дедлайн: ${formattedDate}`;
        } else {
            return `Завантажено: ${formattedDate}`;
        }
    } catch (e) {
        return 'Error Date';
    }
}

function displayStats(stats) {
    const fields = {
        'stat-students-value': stats.total_students,
        'stat-supervisors-value': stats.total_supervisors,
        'stat-completed-submissions-value': stats.completed_submissions,
        'stat-diplomas-value': stats.total_diplomas
    };
    for (const id in fields) {
        const element = document.getElementById(id);
        if (element) {
            element.className = 'stat-value card-main-text';
            element.textContent = fields[id] !== null && fields[id] !== undefined ? fields[id] : '-';
        }
    }
    document.querySelectorAll('.stat-card .stat-title').forEach(el => el.classList.add('card-large-text'));
    document.querySelectorAll('.stat-card .stat-icon').forEach(el => el.classList.add('card-main-text'));
}

function displayLatestSubmissions(submissions, userRole = 'student') {
    const listElement = document.getElementById('latest-submissions-list');
    const titleElement = document.getElementById('assignments-submissions-title');

    if (!listElement || !titleElement) {
        return;
    }
    listElement.innerHTML = '';
    listElement.className = 'task-list';

    const isStudent = userRole === 'student';
    titleElement.textContent = isStudent ? 'Призначені завдання' : 'Останні здачі робіт';

    if (!submissions || submissions.length === 0) {
        const message = isStudent ? 'Немає призначених завдань.' : 'Немає недавніх здач робіт.';
        listElement.innerHTML = `<li class="task-item placeholder-item"><p class="card-main-text">${message}</p></li>`;
        return;
    }

    submissions.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'task-item';
        listItem.dataset.assignmentId = item.assignment_id;
        if(item.student_id) {
            listItem.dataset.studentId = item.student_id;
        }
        if(item.submission_id) {
            listItem.dataset.submissionId = item.submission_id;
        }
        listItem.style.cursor = 'pointer';

        const name = item.student_name || item.supervisor_name || 'Невідомо';
        const dateToDisplay = isStudent ? item.deadline : item.upload_time;
        const dateType = isStudent ? 'assignment' : 'submission';
        const formattedDate = formatDate(dateToDisplay, dateType);
        const statusText = item.status || 'Невідомо';
        const displayStatusText = (isStudent && statusText.toLowerCase() === 'опубліковано') ? 'Призначено' : statusText;
        const statusClass = `status-${statusText.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`;
        const nameParts = name.split(' ');
        const initials = nameParts.length >= 2 ? (nameParts[0][0] + nameParts[1][0]) : (nameParts[0] ? nameParts[0][0] : '?');

        listItem.innerHTML = `
            <div class="task-header">
                 <span class="task-title card-large-text">${item.assignment_title || 'Без назви'}</span>
                 <span class="task-status ${statusClass} card-main-text">${displayStatusText}</span>
            </div>
            <div class="task-meta">
                 <div class="task-student">
                     <div class="student-avatar card-main-text">${initials.toUpperCase()}</div>
                     <span class="card-main-text">${name}</span>
                 </div>
                 <span class="task-date card-main-text">${formattedDate}</span>
            </div>
        `;

        listItem.addEventListener('click', () => {
            if (item.assignment_id) {
                if (currentUserInfo && currentUserInfo.role === 'student') {
                    window.location.href = `task_detail_view.html?assignmentId=${item.assignment_id}`;
                } else if (currentUserInfo && (currentUserInfo.role === 'supervisor' || currentUserInfo.role === 'admin')) {
                    if (item.submission_id) {
                        window.location.href = `assignment_check.html?assignmentId=${item.assignment_id}&submissionIdToOpen=${item.submission_id}`;
                    } else {
                        window.location.href = `assignment_check.html?assignmentId=${item.assignment_id}`;
                    }
                } else {
                    showNotification('Не вдалося визначити вашу роль для перенаправлення.', 'error');
                }
            } else {
                showNotification('Не вдалося відкрити деталі: відсутній ID завдання.', 'error');
            }
        });
        listElement.appendChild(listItem);
    });
}

function displayTopStudents(students) {
    const listElement = document.getElementById('top-students-list');
    if (!listElement) {
        return;
    }
    listElement.innerHTML = '';
    listElement.className = 'student-list';

    if (!students || students.length === 0) {
        listElement.innerHTML = '<li class="student-item placeholder-item"><p class="card-main-text">Немає даних про студентів.</p></li>';
        return;
    }

    students.forEach((student, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'student-item';
        const nameParts = (student.full_name || '').split(' ');
        const initials = nameParts.length >= 2 ? (nameParts[0][0] + nameParts[1][0]) : (nameParts[0] ? nameParts[0][0] : '?');
        listItem.innerHTML = `
            <span class="student-rank card-main-text">${index + 1}</span>
            <div class="student-avatar card-main-text">${initials.toUpperCase()}</div>
            <div class="student-details">
                <span class="student-name card-large-text">${student.full_name || 'Ім\'я невідоме'}</span><br>
                <span class="student-info card-main-text">${student.group_name || 'Група не вказана'}</span>
            </div>
            <div class="student-progress">
                 <div class="progress-bar" title="${student.total_progress !== null ? student.total_progress + '%' : ''}">
                     <div class="progress-fill" style="width: ${student.total_progress !== null ? student.total_progress : 0}%;"></div>
                 </div>
                 <span class="card-main-text">${student.total_progress !== null ? student.total_progress + '%' : '-'}</span>
            </div>
        `;
        listElement.appendChild(listItem);
    });
}

function displayMiniCalendar(eventsByDate) {
    const calendarBody = document.getElementById('miniCalendarBody');
    const calendarTitle = document.getElementById('miniCalendarTitle');
    const calendarCard = document.getElementById('miniCalendarCard');

    if (!calendarBody || !calendarTitle || !calendarCard) {
        return;
    }

    calendarBody.innerHTML = '';
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const monthName = today.toLocaleString('uk', { month: 'long' });
    calendarTitle.textContent = `Календар (${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${currentYear})`;
    calendarTitle.className = 'card-title';
    calendarCard.onclick = () => { window.location.href = 'calendar.html'; };

    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    let startingDay = firstDayOfMonth.getDay();
    startingDay = startingDay === 0 ? 6 : startingDay - 1;
    let date = 1;
    let cells = [];

    for (let i = 0; i < startingDay; i++) {
        cells.push('<td class="empty-cell"></td>');
    }

    while (date <= daysInMonth) {
        const currentDateObj = new Date(currentYear, currentMonth, date);
        const dateStr = currentDateObj.toISOString().split('T')[0];
        const isToday = date === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
        const dayEvents = eventsByDate && eventsByDate[dateStr] ? eventsByDate[dateStr] : [];
        const hasEvents = dayEvents.length > 0;
        let cellClass = 'day-cell current-month';
        if (isToday) cellClass += ' today';
        if (hasEvents) cellClass += ' has-events';
        let eventDotsHtml = '';
        if (hasEvents) {
            eventDotsHtml = '<div class="event-dots-container">';
            dayEvents.slice(0, 3).forEach(event => {
                const eventTypeClass = getEventClass(event.event_type).replace('event-', 'event-dot event-dot-');
                eventDotsHtml += `<span class="${eventTypeClass}"></span>`;
            });
            eventDotsHtml += '</div>';
        }
        cells.push(`<td class="${cellClass}">${date}${eventDotsHtml}</td>`);
        date++;
    }

    while (cells.length % 7 !== 0) {
        cells.push('<td class="empty-cell"></td>');
    }
    let tableHtml = '';
    for (let i = 0; i < cells.length; i += 7) {
        tableHtml += `<tr>${cells.slice(i, i + 7).join('')}</tr>`;
    }
    calendarBody.innerHTML = tableHtml;
}

function getEventClass(eventType) {
     switch (eventType) {
        case 'Семінар': return 'event-type-seminar';
        case 'Конференція': return 'event-type-conference';
        case 'Лекція': return 'event-type-lecture';
        case 'Практика': return 'event-type-practice';
        case 'Дедлайн': return 'event-type-deadline';
        case 'Виставка': return 'event-type-exhibition';
        case 'Екзамен': return 'event-type-exam';
        case 'Зустріч': return 'event-type-meeting';
        case 'Інше': return 'event-type-other';
        default: return 'event-type-common';
    }
}

async function fetchDashboardData() {
    try {
        const response = await fetch(`${backendUrl}/api/dashboard`, { headers: getAuthHeaders() });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
            return data.data;
        } else {
            throw new Error(data.error || 'Failed to fetch dashboard data');
        }
    } catch (error) {
        showNotification(`Помилка завантаження даних дашборду: ${error.message}`, 'error');
        return null;
    }
}

async function getCurrentUserInfo() {
    try {
        const userInfoResult = await getUserInfo();
        if (!userInfoResult) {
            throw new Error("User info is null or invalid.");
        }
        return userInfoResult;
    } catch (error) {
        throw error;
    }
}

function updateHeaderTitle(role) {
    const mainTitle = document.querySelector('.main-title');
    if (mainTitle) {
        mainTitle.classList.add('header-text');
        switch (role) {
            case 'admin': mainTitle.textContent = 'Панель адміністратора'; break;
            case 'supervisor': mainTitle.textContent = 'Панель викладача'; break;
            case 'student': mainTitle.textContent = 'Кабінет студента'; break;
            default: mainTitle.textContent = 'Загальний огляд';
        }
    }
}

function updateNotificationBadge(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.classList.add('card-main-text');
        if (count > 0) {
            badge.textContent = count > 9 ? '9+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

async function initializeDashboard() {
    try {
        currentUserInfo = await getCurrentUserInfo(); // Присвоюємо глобальній змінній
        if (!currentUserInfo || !currentUserInfo.role) {
            showNotification('Не вдалося отримати інформацію про користувача. Спробуйте увійти знову.', 'error');
            return;
        }
        updateHeaderTitle(currentUserInfo.role);

        const dashboardData = await fetchDashboardData();
        if (dashboardData) {
            if (dashboardData.stats) displayStats(dashboardData.stats);
            if (dashboardData.latestSubmissions) displayLatestSubmissions(dashboardData.latestSubmissions, currentUserInfo.role);
            if (dashboardData.topStudents) displayTopStudents(dashboardData.topStudents);
            if (dashboardData.calendarEvents) displayMiniCalendar(dashboardData.calendarEvents);
            if (dashboardData.unreadNotifications !== undefined) {
                 updateNotificationBadge(dashboardData.unreadNotifications);
            }
        } else {
            displayStats({});
            displayLatestSubmissions([], currentUserInfo.role);
            displayTopStudents([]);
            displayMiniCalendar({});
            updateNotificationBadge(0);
        }
    } catch (error) {
        showNotification('Помилка ініціалізації панелі приладів.', 'error');
        updateHeaderTitle('guest');
        displayStats({});
        displayLatestSubmissions([], 'guest');
        displayTopStudents([]);
        displayMiniCalendar({});
        updateNotificationBadge(0);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});
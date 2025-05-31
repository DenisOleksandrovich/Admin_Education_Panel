import { getAuthHeaders, getUserInfo } from './authUtils.js';

document.addEventListener('DOMContentLoaded', async function () {
    let currentDate = new Date();
    let currentView = 'month';
    let allEvents = {};
    let filteredEvents = {};
    let currentUserRole = null;
    let allFetchedGroups = [];

    const backendUrl = 'http://localhost:3000';

    const calendarGrid = document.getElementById('calendarGrid');
    const weekGridContainer = document.getElementById('weekGrid');
    const yearGridContainer = document.getElementById('yearGrid');
    const upcomingList = document.getElementById('upcoming-events-list');
    const currentMonthYearDisplay = document.getElementById('currentMonthYear');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const todayButton = document.getElementById('todayButton');
    const viewButtons = document.querySelectorAll('.view-button');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const eventTypeFilter = document.getElementById('eventTypeFilter');
    const groupFilterCalendar = document.getElementById('groupFilterCalendar');
    const modal = document.getElementById('eventModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const emptyResultsDiv = document.getElementById('emptyResults');
    const upcomingEmptyResultsDiv = document.getElementById('upcomingEmptyResults');
    const weekdaysDiv = document.querySelector('.calendar-weekdays');

    const monthView = document.getElementById('monthView');
    const weekView = document.getElementById('weekView');
    const yearView = document.getElementById('yearView');
    const allViews = [monthView, weekView, yearView];

    const addEventModal = document.getElementById('addEventModal');
    const closeAddModalBtn = document.getElementById('closeAddModalBtn');
    const addEventForm = document.getElementById('addEventForm');
    const addEventBtn = document.getElementById('addEventBtn');
    const searchEventsBtn = document.getElementById('searchEventsBtn');
    const cancelAddEventBtn = document.getElementById('cancelAddEventBtn');
    const addEventErrorDiv = document.getElementById('addEventError');
    const selectedGroupsDisplay = document.getElementById('selectedGroupsDisplay');


    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px';
        notification.style.borderRadius = '4px';
        notification.style.zIndex = '10000';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.5s ease-in-out';

        if (type === 'success') {
            notification.style.backgroundColor = 'rgb(212, 237, 218)';
            notification.style.color = 'rgb(21, 87, 36)';
        } else if (type === 'error') {
            notification.style.backgroundColor = 'rgb(248, 215, 218)';
            notification.style.color = 'rgb(114, 28, 36)';
        }
        document.body.appendChild(notification);
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
        });
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 5000);
    }

    async function fetchAllGroupsOnce() {
        if (allFetchedGroups.length > 0) {
            return allFetchedGroups;
        }
        try {
            const response = await fetch(`${backendUrl}/api/groups`);
            if (!response.ok) throw new Error(`HTTP помилка! Статус: ${response.status}`);
            allFetchedGroups = await response.json();
            return allFetchedGroups;
        } catch (error) {
            console.error('Не вдалося завантажити загальний список груп:', error);
            allFetchedGroups = [];
            return [];
        }
    }


    function updateUIBasedOnRole(role) {
        currentUserRole = role;
        const isPrivilegedUser = role === 'supervisor' || role === 'admin';

        if (addEventBtn) addEventBtn.style.display = isPrivilegedUser ? 'flex' : 'none';
        if (searchEventsBtn) searchEventsBtn.style.display = role === 'student' ? 'flex' : 'none';
        if (searchInput) searchInput.placeholder = role === 'student' ? "Пошук подій..." : "Пошук...";
        if (groupFilterCalendar) groupFilterCalendar.style.display = isPrivilegedUser ? 'inline-block' : 'none';
    }

    async function initializeApp() {
        showLoading();
        try {
            await fetchAllGroupsOnce();
            const userInfo = await getUserInfo();
            const role = userInfo?.role;
            updateUIBasedOnRole(role || 'student');

            await populateEventTypeFilter();
            if (currentUserRole === 'supervisor' || currentUserRole === 'admin') {
                await populateGroupFilterCalendar();
            }
            setActiveViewButton();
            await updateView();
        } catch (error) {
            console.error("Помилка під час ініціалізації програми:", error);
            showErrorState("Помилка ініціалізації. Спробуйте оновити сторінку.");
        } finally {
            hideLoading();
        }
    }

    await initializeApp();

    prevButton.addEventListener('click', () => changeDate(-1));
    nextButton.addEventListener('click', () => changeDate(1));
    todayButton.addEventListener('click', goToToday);
    viewButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const newView = event.target.dataset.view;
            if (newView && newView !== currentView) {
                currentView = newView;
                currentDate = new Date();
                setActiveViewButton();
                updateView();
            }
        });
    });

    searchInput.addEventListener('input', handleFilterChange);
    eventTypeFilter.addEventListener('change', handleFilterChange);
    if (groupFilterCalendar) groupFilterCalendar.addEventListener('change', handleFilterChange);
    clearSearchBtn.addEventListener('click', clearSearch);

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeEventModal);
    if (modal) modal.addEventListener('click', (event) => {
        if (event.target === modal) closeEventModal();
    });

    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            if (currentUserRole === 'supervisor' || currentUserRole === 'admin') {
                openAddEventModal();
            } else {
                showNotification("У вас недостатньо прав для додавання подій.", "error");
            }
        });
    }

    if (searchEventsBtn) {
        searchEventsBtn.addEventListener('click', () => {
            if (searchInput) searchInput.focus();
        });
    }

    if (closeAddModalBtn) closeAddModalBtn.addEventListener('click', closeAddEventModal);
    if (cancelAddEventBtn) cancelAddEventBtn.addEventListener('click', closeAddEventModal);
    if (addEventModal) {
        addEventModal.addEventListener('click', (event) => {
            if (event.target === addEventModal) closeAddEventModal();
        });
    }
    if (addEventForm) addEventForm.addEventListener('submit', handleAddEventSubmit);

    async function updateView() {
        showLoading();
        updateDisplayHeader();
        hideAllViews();
        try {
            if (currentView === 'year') {
                allEvents = await fetchEventsForYear(currentDate.getFullYear());
            } else {
                allEvents = await fetchEventsForMonth(currentDate.getFullYear(), currentDate.getMonth() + 1);
            }
            applyFilters();
            renderCurrentView();
            renderUpcomingEvents();
        } catch (error) {
            showErrorState("Не вдалося оновити представлення календаря.");
        } finally {
            hideLoading();
        }
    }

    function renderCurrentView() {
        hideAllViews();
        let viewHasContent = false;
        switch (currentView) {
            case 'month':
                viewHasContent = renderMonthView();
                if (monthView) monthView.style.display = 'block';
                if (weekdaysDiv) weekdaysDiv.style.display = 'grid';
                break;
            case 'week':
                viewHasContent = renderWeekView();
                if (weekView) weekView.style.display = 'block';
                break;
            case 'year':
                viewHasContent = renderYearView();
                if (yearView) yearView.style.display = 'block';
                break;
            default:
                viewHasContent = renderMonthView();
                if (monthView) monthView.style.display = 'block';
                if (weekdaysDiv) weekdaysDiv.style.display = 'grid';
        }
        const filtersActive = searchInput.value.trim() !== '' || eventTypeFilter.value !== '' || (groupFilterCalendar && groupFilterCalendar.value !== '');
        const noEventsAtAllForView = Object.keys(allEvents).length === 0;
        if (!viewHasContent && (filtersActive || noEventsAtAllForView) && emptyResultsDiv) {
            emptyResultsDiv.style.display = 'flex';
        } else if (emptyResultsDiv) {
            emptyResultsDiv.style.display = 'none';
        }
    }

    function changeDate(offset) {
        switch (currentView) {
            case 'month': currentDate.setMonth(currentDate.getMonth() + offset); break;
            case 'week': currentDate.setDate(currentDate.getDate() + (offset * 7)); break;
            case 'year': currentDate.setFullYear(currentDate.getFullYear() + offset); break;
        }
        updateView();
    }

    function goToToday() {
        currentDate = new Date();
        updateView();
    }

    function updateDisplayHeader() {
        let displayText = '';
        const year = currentDate.getFullYear();
        const monthIndex = currentDate.getMonth();
        const monthName = currentDate.toLocaleString('uk', { month: 'long' });
        const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        switch (currentView) {
            case 'month': displayText = `${capitalizedMonth} ${year}`; break;
            case 'week':
                const weekStart = getWeekStartDate(currentDate);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                const startMonthName = weekStart.toLocaleString('uk', { month: 'short' }).replace('.','');
                const endMonthName = weekEnd.toLocaleString('uk', { month: 'short' }).replace('.','');
                if(weekStart.getFullYear() !== weekEnd.getFullYear()) {
                    displayText = `${weekStart.getDate()} ${startMonthName} ${weekStart.getFullYear()} - ${weekEnd.getDate()} ${endMonthName} ${weekEnd.getFullYear()}`;
                } else if(weekStart.getMonth() !== weekEnd.getMonth()){
                    displayText = `${weekStart.getDate()} ${startMonthName} - ${weekEnd.getDate()} ${endMonthName} ${year}`;
                } else {
                    displayText = `${weekStart.getDate()} - ${weekEnd.getDate()} ${capitalizedMonth} ${year}`;
                }
                break;
            case 'year': displayText = `${year}`; break;
        }
        if (currentMonthYearDisplay) currentMonthYearDisplay.textContent = displayText;
    }

    function setActiveViewButton() {
        viewButtons.forEach(button => button.classList.toggle('active', button.dataset.view === currentView));
    }

    function hideAllViews() {
        allViews.forEach(view => { if (view) view.style.display = 'none'; });
        if (emptyResultsDiv) emptyResultsDiv.style.display = 'none';
        if (weekdaysDiv) weekdaysDiv.style.display = 'none';
    }

    function renderMonthView() {
        if (!calendarGrid || !weekdaysDiv) return false;
        calendarGrid.style.display = 'grid';
        calendarGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        let startingDay = firstDayOfMonth.getDay();
        startingDay = startingDay === 0 ? 6 : startingDay - 1;
        const today = new Date();
        const todayString = dateToYyyyMmDd(today);
        let hasAnyEventsInView = false;
        for (let i = 0; i < startingDay; i++) calendarGrid.appendChild(createDayCell(null, true));
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateKey = dateToYyyyMmDd(date);
            const isToday = (dateKey === todayString);
            const dayEvents = filteredEvents[dateKey] || [];
            if (dayEvents.length > 0) hasAnyEventsInView = true;
            calendarGrid.appendChild(createDayCell(date, false, isToday, dayEvents));
        }
        const totalCells = startingDay + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) calendarGrid.appendChild(createDayCell(null, true));
        return hasAnyEventsInView;
    }

    function createDayCell(date, isOtherMonth, isToday = false, events = []) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (isOtherMonth) dayDiv.classList.add('other-month');
        if (isToday) dayDiv.classList.add('today');
        if (date) {
            const dayNumberSpan = document.createElement('span');
            dayNumberSpan.className = 'day-number card-main-text';
            dayNumberSpan.textContent = date.getDate();
            dayDiv.appendChild(dayNumberSpan);
            events.forEach(event => {
                const eventDiv = createEventElement(event, 'grid');
                if (eventDiv) dayDiv.appendChild(eventDiv);
            });
        }
        return dayDiv;
    }

    function renderWeekView() {
        if (!weekGridContainer) return false;
        weekGridContainer.innerHTML = '';
        const weekStart = getWeekStartDate(currentDate);
        const today = new Date();
        const todayString = dateToYyyyMmDd(today);
        let hasAnyEventsInView = false;
        const headerRow = document.createElement('div');
        headerRow.className = 'week-grid-header';
        headerRow.appendChild(createWeekHeaderCell('', 'time-header'));
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            const isToday = dateToYyyyMmDd(day) === todayString;
            headerRow.appendChild(createWeekHeaderCell(`${day.toLocaleString('uk', { weekday: 'short' })} ${day.getDate()}`, 'day-header', isToday));
        }
        weekGridContainer.appendChild(headerRow);
        for (let hour = 0; hour < 24; hour++) {
            const hourRow = document.createElement('div');
            hourRow.className = 'week-grid-row';
            const timeSlot = document.createElement('div');
            timeSlot.className = 'week-time-slot card-main-text';
            timeSlot.textContent = `${String(hour).padStart(2, '0')}:00`;
            hourRow.appendChild(timeSlot);
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate() + i);
                const dateKey = dateToYyyyMmDd(day);
                const isToday = dateKey === todayString;
                const dayCol = document.createElement('div');
                dayCol.className = 'week-day-column';
                if(isToday) dayCol.classList.add('today');
                dayCol.dataset.date = dateKey;
                dayCol.dataset.hour = hour;
                const eventsForHour = (filteredEvents[dateKey] || []).filter(event => {
                    try { const eventDate = new Date(event.event_date); return !isNaN(eventDate.getTime()) && eventDate.getHours() === hour; } catch { return false; }
                });
                if (eventsForHour.length > 0) {
                    hasAnyEventsInView = true;
                    eventsForHour.forEach(event => { const eventDiv = createEventElement(event, 'week'); if (eventDiv) dayCol.appendChild(eventDiv); });
                }
                hourRow.appendChild(dayCol);
            }
            weekGridContainer.appendChild(hourRow);
        }
        weekGridContainer.style.gridTemplateColumns = `60px repeat(7, 1fr)`;
        return hasAnyEventsInView;
    }

    function createWeekHeaderCell(text, typeClass, isToday = false) {
        const cell = document.createElement('div');
        cell.className = `week-${typeClass}-cell card-large-text`;
        if (isToday) cell.classList.add('today');
        cell.textContent = text;
        return cell;
    }

    function renderYearView() {
        if (!yearGridContainer) return false;
        yearGridContainer.innerHTML = '';
        const year = currentDate.getFullYear();
        const today = new Date();
        const todayString = dateToYyyyMmDd(today);
        let hasAnyEventsInView = false;
        const eventsCountPerDay = {};
        for (const dateKey in allEvents) {
            if(allEvents[dateKey] && allEvents[dateKey].length > 0) {
                eventsCountPerDay[dateKey] = allEvents[dateKey].length;
                hasAnyEventsInView = true;
            }
        }
        for (let month = 0; month < 12; month++) {
            const miniMonthDiv = document.createElement('div');
            miniMonthDiv.className = 'mini-month';
            const header = document.createElement('div');
            header.className = 'mini-month-header card-large-text';
            const monthDate = new Date(year, month);
            const monthName = monthDate.toLocaleString('uk', { month: 'long' });
            header.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            header.addEventListener('click', () => { currentView = 'month'; currentDate = new Date(year, month, 1); setActiveViewButton(); updateView(); });
            miniMonthDiv.appendChild(header);
            const grid = document.createElement('div');
            grid.className = 'mini-calendar-grid';
            const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
            weekdays.forEach(wd => { const wdHeader = document.createElement('div'); wdHeader.className = 'mini-day-header card-main-text'; wdHeader.textContent = wd; grid.appendChild(wdHeader); });
            const firstDayOfMonth = new Date(year, month, 1);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            let startingDay = firstDayOfMonth.getDay();
            startingDay = startingDay === 0 ? 6 : startingDay - 1;
            for (let i = 0; i < startingDay; i++) grid.appendChild(createMiniDayCell(null, true));
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(year, month, i);
                const dateKey = dateToYyyyMmDd(date);
                const isToday = dateKey === todayString;
                const hasEvents = eventsCountPerDay[dateKey] > 0;
                grid.appendChild(createMiniDayCell(date, false, isToday, hasEvents));
            }
            const totalCells = startingDay + daysInMonth;
            const remainingCells = (7 - (totalCells % 7)) % 7;
            for (let i = 0; i < remainingCells; i++) grid.appendChild(createMiniDayCell(null, true));
            miniMonthDiv.appendChild(grid);
            yearGridContainer.appendChild(miniMonthDiv);
        }
        return hasAnyEventsInView;
    }

    function createMiniDayCell(date, isOtherMonth, isToday = false, hasEvents = false) {
        const cell = document.createElement('div');
        cell.className = 'mini-day card-main-text';
        if (isOtherMonth) cell.classList.add('other-month');
        else {
            cell.textContent = date.getDate();
            if (isToday) cell.classList.add('today');
            if (hasEvents) cell.classList.add('has-events');
            cell.addEventListener('click', () => { currentView = 'month'; currentDate = date; setActiveViewButton(); updateView(); });
        }
        return cell;
    }

    function handleFilterChange() {
        applyFilters();
        renderCurrentView();
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedType = eventTypeFilter.value;
        const selectedCalendarGroupName = groupFilterCalendar && groupFilterCalendar.value ? groupFilterCalendar.value : "";
        const searchDay = extractDayFromSearch(searchTerm);

        if (clearSearchBtn) clearSearchBtn.style.display = searchTerm ? 'flex' : 'none';

        filteredEvents = {};
        for (const date in allEvents) {
            if (!allEvents[date]) continue;
            const dayOfMonth = parseInt(date.split('-')[2], 10);
            const dayMatchesSearch = searchDay !== null && dayOfMonth === searchDay;

            const eventsForDate = allEvents[date].filter(event => {
                if (!event) return false;
                const eventNameLower = event.event_name?.toLowerCase() || '';
                const eventDescLower = event.event_description?.toLowerCase() || '';
                const eventVenueLower = event.venue?.toLowerCase() || '';
                const eventGroupsString = event.groups || '';
                const eventSupervisorLower = event.supervisor?.toLowerCase() || '';
                const eventType = event.event_type || '';

                const matchesSearchTerm = !searchTerm || (searchDay === null && (
                    eventNameLower.includes(searchTerm) || eventDescLower.includes(searchTerm) ||
                    eventVenueLower.includes(searchTerm) || eventGroupsString.toLowerCase().includes(searchTerm) ||
                    eventSupervisorLower.includes(searchTerm)
                ));
                const matchesType = !selectedType || eventType === selectedType;
                const matchesDay = searchDay === null || dayMatchesSearch;

                let matchesSelectedCalendarGroup = true;
                if (selectedCalendarGroupName && (currentUserRole === 'supervisor' || currentUserRole === 'admin')) {
                    const eventGroupNames = eventGroupsString.split(',').map(g => g.trim());
                    matchesSelectedCalendarGroup = eventGroupNames.includes(selectedCalendarGroupName);
                }

                if (searchDay !== null) return matchesDay && matchesType && matchesSelectedCalendarGroup;
                else return matchesSearchTerm && matchesType && matchesSelectedCalendarGroup;
            });
            if (eventsForDate.length > 0) filteredEvents[date] = eventsForDate;
        }
    }

    function extractDayFromSearch(term) {
        const num = parseInt(term, 10);
        if (!isNaN(num) && num >= 1 && num <= 31 && /^\d+$/.test(term)) return num;
        return null;
    }

    function clearSearch() {
        searchInput.value = '';
        handleFilterChange();
    }

    async function fetchEventsForMonth(year, month) {
        const headers = getAuthHeaders();
        if (!headers['Authorization']) console.warn(`WorkspaceEventsForMonth: Не знайдено токен автентифікації для ${year}-${month}.`);
        try {
            const response = await fetch(`${backendUrl}/api/events-by-date?year=${year}&month=${month}`, { headers });
            if (!response.ok) {
                let errorBody = null; try { errorBody = await response.json(); } catch(e) {}
                const tokenStatus = headers['Authorization'] ? 'Токен було надіслано.' : 'Токен НЕ було надіслано.';
                throw new Error(`HTTP помилка! Статус: ${response.status}. ${errorBody?.error || ''} (${tokenStatus})`);
            }
            const data = await response.json();
            return data || {};
        } catch (error) {
            console.error(`Помилка завантаження подій для ${year}-${month}:`, error);
            throw error;
        }
    }

    async function fetchEventsForYear(year) {
        let yearData = {};
        const monthPromises = Array.from({ length: 12 }, (_, i) => fetchEventsForMonth(year, i + 1));
        try {
            const results = await Promise.allSettled(monthPromises);
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') yearData = { ...yearData, ...result.value };
                else console.error(`Помилка завантаження подій для ${year}-${index + 1}:`, result.reason);
            });
            return yearData;
        } catch (error) {
            console.error('Неочікувана помилка при паралельному завантаженні року:', error);
            throw error;
        }
    }

    function createEventElement(event, context = 'grid') {
        if (!event || !event.event_date) return null;
        let eventDate;
        try { eventDate = new Date(event.event_date); if (isNaN(eventDate.getTime())) throw new Error('Invalid Date'); }
        catch (e) { console.error(`Некоректна дата для події ${event.event_id || 'ID?'}: ${event.event_date}`); return null; }

        if (context === 'grid') {
            const eventDiv = document.createElement('div');
            eventDiv.className = `event ${getEventClass(event.event_type)}`;
            eventDiv.title = `${event.event_name}\nТип: ${event.event_type}\nЧас: ${eventDate.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}`;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'event-name card-main-text'; nameSpan.textContent = event.event_name;
            eventDiv.appendChild(nameSpan);
            eventDiv.addEventListener('click', (e) => { e.stopPropagation(); openEventModal(event); });
            return eventDiv;
        } else if (context === 'week') {
            const eventDiv = document.createElement('div');
            eventDiv.className = `event ${getEventClass(event.event_type)}`;
            eventDiv.title = `${event.event_name}\nТип: ${event.event_type}\nЧас: ${eventDate.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}`;
            const minutes = eventDate.getMinutes(); const duration = event.duration || 60;
            const topPercent = (minutes / 60) * 100; const heightPercent = Math.min((duration / 60) * 100, 100 - topPercent);
            eventDiv.style.top = `${topPercent}%`; eventDiv.style.height = `${heightPercent}%`;
            eventDiv.style.minHeight = '20px'; eventDiv.style.position = 'absolute';
            eventDiv.style.left = '3px'; eventDiv.style.right = '3px'; eventDiv.style.overflow = 'hidden';
            eventDiv.innerHTML = `<span class="event-name card-main-text">${event.event_name}</span><span class="event-time card-main-text">${eventDate.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}</span>`;
            eventDiv.addEventListener('click', (e) => { e.stopPropagation(); openEventModal(event); });
            return eventDiv;
        } else if (context === 'upcoming') {
            const listItem = document.createElement('li');
            listItem.className = `upcoming-item`;
            listItem.innerHTML = `
                <div class="upcoming-date"><div class="upcoming-day card-title">${eventDate.getDate()}</div><div class="upcoming-month card-main-text">${eventDate.toLocaleString('uk', { month: 'short' }).replace('.','')}</div></div>
                <div class="upcoming-content">
                    <div class="upcoming-title-text card-large-text">${event.event_name}</div>
                    <div class="upcoming-info card-main-text">
                        ${event.event_type ? `<span><i class="fas fa-tag"></i> ${event.event_type}</span>` : ''}
                        <span><i class="fas fa-clock"></i> ${eventDate.toLocaleTimeString('uk', { hour: '2-digit', minute: '2-digit' })}</span>
                        ${event.venue ? `<span><i class="fas fa-map-marker-alt"></i> ${event.venue}</span>` : ''}
                        ${event.groups ? `<span><i class="fas fa-users"></i> ${event.groups}</span>` : ''}
                    </div></div><div class="upcoming-type ${getTypeClass(event.event_type)}">${event.event_type || ''}</div>`;
            listItem.addEventListener('click', () => openEventModal(event));
            return listItem;
        }
        return null;
    }

    function renderUpcomingEvents() {
        if (!upcomingList) return;
        upcomingList.innerHTML = '';
        let upcomingFound = false; const now = new Date(); now.setHours(0,0,0,0);
        const allUpcomingEvents = Object.values(allEvents).flat();
        const futureEvents = allUpcomingEvents.filter(event => { if (!event || !event.event_date) return false; try { return new Date(event.event_date) >= now; } catch { return false; } });
        futureEvents.sort((a, b) => { try { return new Date(a.event_date) - new Date(b.event_date); } catch { return 0; } });
        futureEvents.forEach(event => { const listItem = createEventElement(event, 'upcoming'); if (listItem) { upcomingList.appendChild(listItem); upcomingFound = true; } });
        if (!upcomingFound && upcomingEmptyResultsDiv) upcomingEmptyResultsDiv.style.display = 'flex';
        else if (upcomingEmptyResultsDiv) upcomingEmptyResultsDiv.style.display = 'none';
    }

    function openEventModal(event) {
        if (!modal || !event || typeof event !== 'object') return;
        let eventDate;
        try { eventDate = new Date(event.event_date); if (isNaN(eventDate.getTime())) throw new Error('Invalid Date'); }
        catch (e) { console.error(`Некоректна дата для модального вікна: ${event.event_date}`); eventDate = null; }
        document.getElementById('modal-event-name').textContent = event.event_name || 'Без назви';
        document.getElementById('modal-event-date').textContent = eventDate ? eventDate.toLocaleString('uk', { dateStyle: 'long', timeStyle: 'short' }) : 'N/A';
        document.getElementById('modal-event-venue').textContent = event.venue || 'Не вказано';
        document.getElementById('modal-event-type').textContent = event.event_type || 'Не вказано';
        document.getElementById('modal-event-duration').textContent = event.duration ? `${event.duration} хв.` : 'Не вказано';
        document.getElementById('modal-event-supervisor').textContent = event.supervisor || 'Не вказано';
        document.getElementById('modal-event-description').textContent = event.event_description || 'Немає опису';
        document.getElementById('modal-event-groups').textContent = event.groups || 'Не вказано';
        modal.classList.add('show');
    }

    function closeEventModal() { if (modal) modal.classList.remove('show'); }

    function getEventClass(eventType) {
        switch (eventType) {
            case 'Семінар': return 'event-type-seminar'; case 'Конференція': return 'event-type-conference';
            case 'Лекція': return 'event-type-lecture'; case 'Практика': return 'event-type-practice';
            case 'Дедлайн': return 'event-type-deadline'; case 'Виставка': return 'event-type-exhibition';
            case 'Екзамен': return 'event-type-exam'; case 'Зустріч': return 'event-type-meeting';
            case 'Інше': return 'event-type-other'; default: return 'event-type-common';
        }
    }
    function getTypeClass(eventType) { if (!eventType) return 'type-common'; return `type-${eventType.toLowerCase().replace(/\s+/g, '-')}`; }
    function getWeekStartDate(date) { const d = new Date(date); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); }
    function dateToYyyyMmDd(date) { if (!date || isNaN(date.getTime())) return ''; const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }

    async function populateEventTypeFilter() { await populateEventTypeSelect('eventTypeFilter', 'Всі типи', true); }

    function openAddEventModal() {
        if (!addEventModal) return;
        if (addEventForm) addEventForm.reset();
        if (addEventErrorDiv) addEventErrorDiv.style.display = 'none';
        addEventModal.classList.add('show');
        populateAddModalSelects();
        updateSelectedGroupsDisplay();
    }
    function closeAddEventModal() { if (addEventModal) addEventModal.classList.remove('show'); }

    async function populateAddModalSelects() {
        await populateEventTypeSelect('addEventType', 'Оберіть тип...');
        await populateSupervisorSelect();
        await populateGroupButtons();
    }

    async function populateEventTypeSelect(selectId, placeholder, addAllTypesOption = false) {
        const selectElement = document.getElementById(selectId);
        if (!selectElement) return;
        selectElement.innerHTML = '';
        if (addAllTypesOption) { const allOption = document.createElement('option'); allOption.value = ""; allOption.textContent = placeholder; selectElement.appendChild(allOption); }
        else { const ph = document.createElement('option'); ph.value = ""; ph.disabled = true; ph.selected = true; ph.textContent = placeholder; selectElement.appendChild(ph); }
        try {
            const response = await fetch(`${backendUrl}/api/event-types`);
            if (!response.ok) throw new Error(`HTTP помилка! Статус: ${response.status}`);
            const types = await response.json();
            types.forEach(type => { if (type) { const option = document.createElement('option'); option.value = type; option.textContent = type; selectElement.appendChild(option); } });
        } catch (error) {
            console.error(`Не вдалося завантажити типи подій для #${selectId}:`, error);
            const errOpt = document.createElement('option'); errOpt.value = ""; errOpt.disabled = true; errOpt.textContent = "Помилка типів";
            if (!addAllTypesOption || selectElement.options.length <=1 ) selectElement.appendChild(errOpt);
        }
    }

    async function populateSupervisorSelect() {
        const selectElement = document.getElementById('addEventSupervisor');
        if (!selectElement) return;
        selectElement.innerHTML = '<option value="" disabled selected>Завантаження...</option>';
        try {
            const response = await fetch(`${backendUrl}/api/supervisors`);
            if (!response.ok) throw new Error(`HTTP помилка! Статус: ${response.status}`);
            const supervisors = await response.json();
            selectElement.innerHTML = '<option value="" disabled selected>Оберіть викладача...</option>';
            supervisors.forEach(supervisor => { const option = document.createElement('option'); option.value = supervisor.supervisor_id; option.textContent = `(${supervisor.supervisor_id}) ${supervisor.full_name}`; selectElement.appendChild(option); });
        } catch (error) {
            console.error('Не вдалося завантажити викладачів:', error);
            selectElement.innerHTML = '<option value="" disabled selected>Помилка викладачів</option>';
        }
    }

    async function populateGroupButtons() {
        const container = document.getElementById('addEventGroups');
        if (!container) return;
        container.innerHTML = '<p class="card-main-text"><i>Завантаження груп...</i></p>';
        container.className = 'group-selection-grid';
        const groups = allFetchedGroups.length > 0 ? allFetchedGroups : await fetchAllGroupsOnce();
        container.innerHTML = '';
        if (groups.length === 0) { container.innerHTML = '<p class="card-main-text"><i>Немає доступних груп.</i></p>'; updateSelectedGroupsDisplay(); return; }

        const allGroupsButton = document.createElement('button');
        allGroupsButton.type = 'button';
        allGroupsButton.className = 'group-button card-main-text all-groups-button';
        allGroupsButton.textContent = 'Всі групи';
        allGroupsButton.dataset.groupId = 'all';
        allGroupsButton.addEventListener('click', function() {
            const isSelected = this.classList.toggle('selected');
            const individualGroupButtons = container.querySelectorAll('.group-button:not(.all-groups-button)');
            individualGroupButtons.forEach(btn => btn.classList.toggle('selected', isSelected));
            updateSelectedGroupsDisplay();
        });
        container.appendChild(allGroupsButton);

        groups.forEach(group => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'group-button card-main-text';
            button.textContent = group.group_name;
            button.dataset.groupId = group.study_group_id;
            button.addEventListener('click', function() {
                this.classList.toggle('selected');
                checkAllGroupsButtonState();
                updateSelectedGroupsDisplay();
            });
            container.appendChild(button);
        });
        checkAllGroupsButtonState();
        updateSelectedGroupsDisplay();
    }

    function checkAllGroupsButtonState() {
        const container = document.getElementById('addEventGroups');
        if (!container) return;
        const allGroupsBtn = container.querySelector('.all-groups-button');
        const individualGroupButtons = Array.from(container.querySelectorAll('.group-button:not(.all-groups-button)'));
        if (!allGroupsBtn || individualGroupButtons.length === 0) return;
        const allSelected = individualGroupButtons.every(btn => btn.classList.contains('selected'));
        allGroupsBtn.classList.toggle('selected', allSelected);
    }

    function updateSelectedGroupsDisplay() {
        if (!selectedGroupsDisplay || !addEventForm) return;
        const groupContainer = document.getElementById('addEventGroups');
        if (!groupContainer) {selectedGroupsDisplay.textContent = 'Не обрано'; return;}

        const allGroupsBtn = groupContainer.querySelector('.group-button.all-groups-button');
        const selectedIndividualButtons = Array.from(groupContainer.querySelectorAll('.group-button.selected:not(.all-groups-button)'));

        if (allGroupsBtn && allGroupsBtn.classList.contains('selected') && allFetchedGroups.length > 0) {
            selectedGroupsDisplay.textContent = 'Обрано: Всі групи';
        } else if (selectedIndividualButtons.length > 0) {
            const selectedNames = selectedIndividualButtons.map(btn => btn.textContent);
            if (selectedNames.length > 3) {
                selectedGroupsDisplay.textContent = `Обрано: ${selectedNames.length} груп(и)`;
            } else {
                selectedGroupsDisplay.textContent = `Обрано: ${selectedNames.join(', ')}`;
            }
        } else {
            selectedGroupsDisplay.textContent = 'Не обрано';
        }
    }


    async function populateGroupFilterCalendar() {
        if (!groupFilterCalendar) return;
        groupFilterCalendar.innerHTML = '<option value="">Всі групи</option>';
        const groups = allFetchedGroups.length > 0 ? allFetchedGroups : await fetchAllGroupsOnce();
        if (groups.length > 0) {
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.group_name;
                option.textContent = group.group_name;
                groupFilterCalendar.appendChild(option);
            });
        } else {
             groupFilterCalendar.innerHTML = '<option value="">Групи не знайдено</option>';
        }
    }


    async function handleAddEventSubmit(event) {
        event.preventDefault();
        if(addEventErrorDiv) addEventErrorDiv.style.display = 'none';
        const submitButton = document.getElementById('submitAddEventBtn');
        if(submitButton) { submitButton.disabled = true; submitButton.textContent = 'Додавання...'; }

        const formData = new FormData(addEventForm);
        const eventData = Object.fromEntries(formData.entries());

        const groupContainer = document.getElementById('addEventGroups');
        const allGroupsBtnSelected = groupContainer && groupContainer.querySelector('.group-button.all-groups-button')?.classList.contains('selected');

        if (allGroupsBtnSelected && allFetchedGroups.length > 0) {
            eventData.group_ids = allFetchedGroups.map(g => g.study_group_id);
        } else {
            const selectedGroupButtons = addEventForm.querySelectorAll('#addEventGroups .group-button.selected:not(.all-groups-button)');
            eventData.group_ids = Array.from(selectedGroupButtons).map(button => button.dataset.groupId);
        }


        if (!eventData.event_date) { showAddEventError("Будь ласка, вкажіть дату та час події."); if(submitButton){ submitButton.disabled = false; submitButton.textContent = 'Додати подію';} return; }
        if (!eventData.event_name || eventData.event_name.trim() === '') { showAddEventError("Будь ласка, вкажіть назву події."); if(submitButton){ submitButton.disabled = false; submitButton.textContent = 'Додати подію';} return; }
        if (!eventData.event_type) { showAddEventError("Будь ласка, оберіть тип події."); if(submitButton){ submitButton.disabled = false; submitButton.textContent = 'Додати подію';} return; }
        if (!eventData.group_ids || eventData.group_ids.length === 0) { showAddEventError("Будь ласка, оберіть хоча б одну групу."); if(submitButton){ submitButton.disabled = false; submitButton.textContent = 'Додати подію';} return; }


        const headers = getAuthHeaders(); headers['Content-Type'] = 'application/json';
        try {
            const response = await fetch(`${backendUrl}/api/events`, { method: 'POST', headers: headers, body: JSON.stringify(eventData) });
            const responseText = await response.text();
            if (!response.ok) {
                let errorMsg = `HTTP помилка! Статус: ${response.status}`;
                try { const errorJson = JSON.parse(responseText); errorMsg = errorJson.error || errorJson.message || errorMsg; }
                catch (e) { if(responseText && responseText.length < 200) errorMsg = responseText; }
                throw new Error(errorMsg);
            }
            closeAddEventModal();
            showNotification('Нову подію успішно створено', 'success');
            await updateView();
        } catch (error) {
            const displayError = error.message || 'Не вдалося додати подію.';
            showAddEventError(`Помилка: ${displayError}`);
            showNotification(`Помилка створення події: ${displayError}`, 'error');
        } finally {
            if(submitButton) { submitButton.disabled = false; submitButton.textContent = 'Додати подію'; }
        }
    }

    function showAddEventError(message) { if (addEventErrorDiv) { addEventErrorDiv.textContent = message; addEventErrorDiv.style.display = 'block'; } }
    function showLoading() { }
    function hideLoading() { }
    function showErrorState(customMessage = "Не вдалося завантажити або відобразити дані.") {
        console.error("Сталася помилка відображення:", customMessage);
        hideAllViews();
        const errContent = `<div class="empty-results-content"><i class="fas fa-exclamation-triangle no-results-icon card-main-text"></i><p class="card-title">Помилка</p><p class="card-main-text">${customMessage} Перевірте консоль.</p></div>`;
        if (emptyResultsDiv) { emptyResultsDiv.innerHTML = errContent; emptyResultsDiv.style.display = 'flex'; }
        if (upcomingEmptyResultsDiv) { upcomingEmptyResultsDiv.innerHTML = `<div class="empty-results-content"><i class="fas fa-exclamation-triangle no-results-icon card-main-text"></i><p class="card-title">Помилка</p></div>`; upcomingEmptyResultsDiv.style.display = 'flex'; }
        showNotification(customMessage, 'error');
    }
});
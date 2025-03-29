const events = [
  { date: new Date(2025, 2, 4), type: 'personal', text: 'Консультація з керівником' },
  { date: new Date(2025, 2, 18), type: 'personal', text: 'Особиста зустріч з експертом' },
  { date: new Date(2025, 2, 10), type: 'common', text: 'Нарада кафедри' },
  { date: new Date(2025, 2, 15), type: 'common', text: 'Загальне засідання факультету' },
  { date: new Date(2025, 2, 15), type: 'common', text: 'Збір студентів груп' },
  { date: new Date(2025, 2, 5), type: 'deadline', text: 'Дедлайн: Проект дипломної роботи' },
  { date: new Date(2025, 2, 22), type: 'deadline', text: 'Дедлайн: Курсовий проект' },
  { date: new Date(2025, 2, 6), type: 'assignment', text: 'Нове завдання: Затвердження списку літератури' },
  { date: new Date(2025, 2, 19), type: 'assignment', text: 'Нове завдання: Додатковий модуль' },
  { date: new Date(2025, 2, 7), type: 'graded', text: 'Оцінено: Лаб. робота №5' },
  { date: new Date(2025, 2, 12), type: 'graded', text: 'Оцінено: Презентація дипломного проекту' },
  { date: new Date(2025, 2, 8), type: 'revision', text: 'Повернено на доопрацювання: Тест №2' },
  { date: new Date(2025, 2, 17), type: 'revision', text: 'Повернено на доопрацювання: Розділ методології' }
];

document.addEventListener("DOMContentLoaded", function () {
  generateCalendar();
});

function generateCalendar() {
  const calendarGrid = document.querySelector(".calendar-grid");
  calendarGrid.innerHTML = "";
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  let startDay = firstDayOfMonth.getDay();
  if (startDay === 0) startDay = 7;
  const daysFromPrevMonth = startDay - 1;
  const totalDaysInMonth = lastDayOfMonth.getDate();
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const totalCells = 6 * 7;
  for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
    let dayNumber;
    let cellClass = "calendar-day";
    if (cellIndex < daysFromPrevMonth) {
      dayNumber = prevMonthLastDay - daysFromPrevMonth + cellIndex + 1;
      cellClass += " other-month";
    } else if (cellIndex < daysFromPrevMonth + totalDaysInMonth) {
      dayNumber = cellIndex - daysFromPrevMonth + 1;
      const today = new Date();
      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        dayNumber === today.getDate()
      ) {
        cellClass += " current-day";
      }
    } else {
      dayNumber = cellIndex - (daysFromPrevMonth + totalDaysInMonth) + 1;
      cellClass += " other-month";
    }
    const dayDiv = document.createElement("div");
    dayDiv.className = cellClass;
    const dayNumberDiv = document.createElement("div");
    dayNumberDiv.className = "day-number";
    dayNumberDiv.textContent = dayNumber;
    dayDiv.appendChild(dayNumberDiv);
    const eventList = document.createElement("ul");
    eventList.className = "event-list";
    if (cellIndex >= daysFromPrevMonth && cellIndex < daysFromPrevMonth + totalDaysInMonth) {
      events.forEach(ev => {
        if (
          ev.date.getFullYear() === year &&
          ev.date.getMonth() === month &&
          ev.date.getDate() === dayNumber
        ) {
          const li = document.createElement("li");
          li.className = "event-item event-" + ev.type;
          li.textContent = ev.text;
          eventList.appendChild(li);
        }
      });
    }
    dayDiv.appendChild(eventList);
    calendarGrid.appendChild(dayDiv);
  }
}
document.addEventListener("DOMContentLoaded", function () {
    // Отображение календаря
    const calendarTable = document.querySelector(".calendar tbody");
    if (calendarTable) {
        generateCalendar();
    }

    // Темная/светлая тема
    const themeToggle = document.getElementById("theme-toggle");
    const darkIcon = document.getElementById("dark-icon");
    const lightIcon = document.getElementById("light-icon");

    function updateIcons(theme) {
        if (darkIcon && lightIcon) {
            darkIcon.style.display = theme === "dark" ? "none" : "inline-block";
            lightIcon.style.display = theme === "dark" ? "inline-block" : "none";
        }
    }

    // Сначала применяем сохранённую тему
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    updateIcons(savedTheme);

    // Только теперь навешиваем обработчик клика
    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const currentTheme = document.body.getAttribute("data-theme") || "light";
            const newTheme = currentTheme === "light" ? "dark" : "light";

            console.log("Переключаем на тему:", newTheme);

            document.body.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateIcons(newTheme);
        });
    }

    // Выделение текущего дня в календаре
    let today = new Date();
    let day = today.getDate();
    let cells = document.querySelectorAll(".calendar .current-month");

    cells.forEach(cell => {
        if (parseInt(cell.textContent, 10) === day) {
            cell.classList.add("today");
        }
    });
});

// Функция генерации календаря
function generateCalendar() {
    const calendarTable = document.querySelector(".calendar tbody");

    if (!calendarTable) {
        console.error("Ошибка: контейнер календаря не найден.");
        return;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    calendarTable.innerHTML = "";

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDateOfPrevMonth = new Date(year, month, 0).getDate();

    let dayCounter = 1;
    let rows = "";
    // Корректировка первого дня недели (если неделя начинается с понедельника)
    let firstWeekday = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    for (let row = 0; row < 6; row++) {
        let cells = "";

        for (let col = 0; col < 7; col++) {
            let cellClass = "current-month";
            let cellDate;

            if (row === 0 && col < firstWeekday) {
                cellDate = lastDateOfPrevMonth - firstWeekday + col + 1;
                cellClass = "other-month";
            } else if (dayCounter > lastDateOfMonth) {
                cellDate = dayCounter - lastDateOfMonth;
                cellClass = "other-month";
                dayCounter++;
            } else {
                cellDate = dayCounter;
                if (cellDate === today) {
                    cellClass += " today";
                }
                dayCounter++;
            }

            cells += `<td class="${cellClass}">${cellDate}</td>`;
        }

        rows += `<tr>${cells}</tr>`;
    }

    calendarTable.innerHTML = rows;
}

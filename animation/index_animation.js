document.addEventListener("DOMContentLoaded", function () {
    const calendarTable = document.querySelector(".calendar tbody");
    if (calendarTable) {
        generateCalendar();
    }

    const themeToggle = document.getElementById("theme-toggle");
    const darkIcon = document.getElementById("dark-icon");
    const lightIcon = document.getElementById("light-icon");

    function updateIcons(theme) {
        if (darkIcon && lightIcon) {
            darkIcon.style.display = theme === "dark" ? "none" : "inline-block";
            lightIcon.style.display = theme === "dark" ? "inline-block" : "none";
        }
    }

    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", savedTheme);
    updateIcons(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const currentTheme = document.body.getAttribute("data-theme") || "light";
            const newTheme = currentTheme === "light" ? "dark" : "light";

            console.log("Перемикаємо на тему:", newTheme);

            document.body.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateIcons(newTheme);
        });
    }

    let today = new Date();
    let day = today.getDate();
    let cells = document.querySelectorAll(".calendar .current-month");

    cells.forEach(cell => {
        if (parseInt(cell.textContent, 10) === day) {
            cell.classList.add("today");
        }
    });
});

function generateCalendar() {
    const calendarTable = document.querySelector(".calendar tbody");

    if (!calendarTable) {
        console.error("Помилка: контейнер календаря не знайдено.");
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
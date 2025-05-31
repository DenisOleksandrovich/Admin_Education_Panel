const express = require('express');
const router = express.Router();
const db = require('../db'); // Убедитесь, что путь к db правильный
const { authenticateToken } = require('../middleware/auth');

// --- Основной маршрут для дашборда ---
// GET /api/dashboard (путь теперь относительный '/')
router.get('/dashboard', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();
        const userRole = req.user?.role;
        const userGroupId = req.user?.groupId;
        const userId = req.user?.userId; // ID студента или преподавателя

        // --- 1. Получение статистики ---
        const [studentResult, supervisorResult, submissionsResult, diplomaResult] = await Promise.all([
            connection.query("SELECT COUNT(*) as count FROM students"),
            connection.query("SELECT COUNT(*) as count FROM supervisors"),
            connection.query("SELECT COUNT(*) as count FROM submissions WHERE status = 'Прийнято'"),
            connection.query("SELECT COUNT(*) as count FROM assignments WHERE type LIKE '%Диплом%'")
        ]);
        const stats = {
            total_students: studentResult[0]?.[0]?.count || 0,
            total_supervisors: supervisorResult[0]?.[0]?.count || 0,
            completed_submissions: submissionsResult[0]?.[0]?.count || 0,
            total_diplomas: diplomaResult[0]?.[0]?.count || 0
        };

        // --- 2. Получение топ студентов (С ИМЕНЕМ ГРУППЫ) ---
        // *** ИСПРАВЛЕНО: Добавлен JOIN и выборка group_name ***
        const topStudentsSql = `
            SELECT
                s.student_id, s.full_name, s.total_progress,
                sg.group_name  -- Добавляем название группы
            FROM students s
            LEFT JOIN study_groups sg ON s.study_group_id = sg.study_group_id -- Соединяем с таблицей групп
            WHERE s.total_progress IS NOT NULL
            ORDER BY s.total_progress DESC
            LIMIT 5;
        `;
        const [topStudents] = await connection.query(topStudentsSql);
        // *** КОНЕЦ ИСПРАВЛЕНИЯ ***

        // --- 3. Получение последних сдач/заданий ---
        let latestSubmissionsOrAssignments = [];
        if (userRole === 'student') {
            const studentAssignmentsSql = `
                SELECT
                    a.assignment_id, a.title as assignment_title, a.deadline, a.status,
                    sp.full_name as supervisor_name, -- Имя преподавателя для задания
                    a.assignment_id as student_id -- Временный хак, лучше адаптировать фронтенд
                FROM assignments a
                JOIN assignment_study_group asg ON a.assignment_id = asg.assignment_id
                LEFT JOIN supervisors sp ON a.posted_by = sp.supervisor_id -- Получаем имя преподавателя
                WHERE asg.study_group_id = ?
                  AND a.status NOT IN ('Виконано', 'Прийнято')
                ORDER BY a.deadline ASC, a.created_at DESC
                LIMIT 5;
            `;
             const [studentAssignments] = await connection.query(studentAssignmentsSql, [userGroupId]);
             latestSubmissionsOrAssignments = studentAssignments;
             latestSubmissionsOrAssignments.forEach(a => {
                 if (a.deadline && new Date(a.deadline) < new Date() && a.status !== 'Протерміновано') {
                     a.status = 'Протерміновано';
                 }
                 a.upload_time = a.deadline; // Используем дедлайн как дату
             });

        } else {
            const latestSubmissionsSql = `
                SELECT
                    s.submission_id, s.upload_time, s.status, s.assignment_id, s.student_id,
                    a.title as assignment_title,
                    st.full_name as student_name
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.assignment_id
                JOIN students st ON s.student_id = st.student_id
                ORDER BY s.upload_time DESC
                LIMIT 5;
            `;
            const [latestSubmissions] = await connection.query(latestSubmissionsSql);
            latestSubmissionsOrAssignments = latestSubmissions;
        }


        // --- 4. Получение событий календаря ---
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDayOfMonth = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')} 23:59:59`;

        let calendarSql = `
          SELECT e.event_id, e.event_name, e.event_date, e.event_type
          FROM events e
          LEFT JOIN event_groups eg ON e.event_id = eg.event_id
          WHERE e.event_date BETWEEN ? AND ?
        `;
        const calendarParams = [startDate, endDate];

        if (userRole === 'student') {
            if (userGroupId) {
                calendarSql += ` AND (eg.group_id = ? OR e.event_id NOT IN (SELECT DISTINCT event_id FROM event_groups))`;
                calendarParams.push(userGroupId);
            } else {
                calendarSql += ` AND e.event_id NOT IN (SELECT DISTINCT event_id FROM event_groups)`;
            }
        }
        calendarSql += ` GROUP BY e.event_id ORDER BY e.event_date ASC;`;

        const [calendarEventsRaw] = await connection.query(calendarSql, calendarParams);
        const calendarEvents = {};
        calendarEventsRaw.forEach(event => {
            try {
                const eventDate = new Date(event.event_date);
                if (isNaN(eventDate.getTime())) return;
                const dateStr = eventDate.toISOString().split('T')[0];
                if (!calendarEvents[dateStr]) {
                    calendarEvents[dateStr] = [];
                }
                calendarEvents[dateStr].push(event);
            } catch (e) {
                console.error(`Error processing calendar event date: ${event.event_date}`, e);
            }
        });

        // --- 5. Получение количества непрочитанных уведомлений ---
        let unreadNotifications = 0;
        // Пример запроса (адаптируйте под вашу схему)
        /*
        const [notificationResult] = await connection.query(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0",
             [accountId]
        );
        unreadNotifications = notificationResult[0]?.count || 0;
        */

        connection.release();

        // --- Отправка собранных данных ---
        res.json({
            success: true,
            data: {
                stats: stats,
                topStudents: topStudents, // Теперь содержит group_name
                latestSubmissions: latestSubmissionsOrAssignments,
                calendarEvents: calendarEvents,
                unreadNotifications: unreadNotifications
            }
        });

    } catch (error) {
        if (connection) connection.release();
        console.error('Ошибка получения данных для дашборда:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера при получении данных для дашборда' });
    }
});


// --- Вспомогательные маршруты (если они все еще нужны отдельно) ---
// Убедитесь, что пути относительные (без /api)

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => { // Путь исправлен
    let connection;
    try {
        connection = await db.getConnection();
        const [studentResult, supervisorResult, submissionsResult, diplomaResult] = await Promise.all([
            connection.query("SELECT COUNT(*) as count FROM students"),
            connection.query("SELECT COUNT(*) as count FROM supervisors"),
            connection.query("SELECT COUNT(*) as count FROM submissions WHERE status = 'Прийнято'"),
            connection.query("SELECT COUNT(*) as count FROM assignments WHERE type LIKE '%Диплом%'")
        ]);
        connection.release();
        const stats = {
            total_students: studentResult[0]?.[0]?.count || 0,
            total_supervisors: supervisorResult[0]?.[0]?.count || 0,
            completed_submissions: submissionsResult[0]?.[0]?.count || 0,
            total_diplomas: diplomaResult[0]?.[0]?.count || 0
        };
        res.json({ success: true, stats });
    } catch (error) {
        if (connection) connection.release();
        console.error('Ошибка получения статистики для дашборда:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера при получении статистики' });
    }
});

// GET /api/students/top
router.get('/students/top', authenticateToken, async (req, res) => { // Путь исправлен
    const limit = parseInt(req.query.limit, 10) || 5;
    if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ success: false, error: 'Некорректный параметр limit' });
    }
    let connection;
    try {
        connection = await db.getConnection();
        // *** ИСПРАВЛЕНО: Добавлен JOIN и выборка group_name ***
        const sql = `
            SELECT
                s.student_id, s.full_name, s.total_progress,
                sg.group_name
            FROM students s
            LEFT JOIN study_groups sg ON s.study_group_id = sg.study_group_id
            WHERE s.total_progress IS NOT NULL
            ORDER BY s.total_progress DESC
            LIMIT ?;
        `;
        const [results] = await connection.query(sql, [limit]);
        connection.release();
        res.json({ success: true, students: results || [] });
    } catch (error) {
        if (connection) connection.release();
        console.error('Ошибка получения топ студентов:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера при получении топ студентов' });
    }
});

// GET /api/submissions/latest
router.get('/submissions/latest', authenticateToken, async (req, res) => { // Путь исправлен
    const limit = parseInt(req.query.limit, 10) || 5;
    if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({ success: false, error: 'Некорректный параметр limit' });
    }
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `
            SELECT
                s.submission_id, s.upload_time, s.status, s.assignment_id, s.student_id,
                a.title as assignment_title,
                st.full_name as student_name
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.assignment_id
            JOIN students st ON s.student_id = st.student_id
            ORDER BY s.upload_time DESC
            LIMIT ?;
        `;
        const [results] = await connection.query(sql, [limit]);
        connection.release();
        res.json({ success: true, submissions: results || [] });
    } catch (error) {
        if (connection) connection.release();
        console.error('Ошибка получения последних работ:', error);
        res.status(500).json({ success: false, error: 'Ошибка сервера при получении последних работ' });
    }
});

module.exports = router;

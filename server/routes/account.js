const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

router.get('/api/user/profile', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const accountId = req.user.accountId;

    if (!userId || !userRole || !accountId) {
        return res.status(400).json({ success: false, error: 'Неповні дані користувача в токені.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        let profileQuery;
        let profileParams = [userId];

        const accountQuery = 'SELECT account_id, email, role, last_login, created_at FROM accounts WHERE account_id = ?';
        const [accountResult] = await connection.query(accountQuery, [accountId]);
        const accountData = accountResult[0];

        if (!accountData) {
            connection.release();
            return res.status(404).json({ success: false, error: 'Акаунт не знайдено.' });
        }

        let profileData = null;
        let supervisorData = null;

        if (userRole === 'student') {
            profileQuery = `
                SELECT s.*, sg.group_name, sg.specialty, sg.course
                FROM students s
                LEFT JOIN study_groups sg ON s.study_group_id = sg.study_group_id
                WHERE s.student_id = ?`;
            const [profileResult] = await connection.query(profileQuery, profileParams);
            if (profileResult.length > 0) {
                profileData = profileResult[0];
                if (profileData.supervisor_id) {
                    const supervisorQuery = `
                        SELECT supervisor_id, full_name, email, phone, department, position, teacher_status, specialization, avatar
                        FROM supervisors
                        WHERE supervisor_id = ?;
                    `;
                    const [supervisorResult] = await connection.query(supervisorQuery, [profileData.supervisor_id]);
                    if (supervisorResult.length > 0) {
                        supervisorData = supervisorResult[0];
                    }
                }
            }
        } else if (userRole === 'supervisor') {
            profileQuery = 'SELECT * FROM supervisors WHERE supervisor_id = ?';
            const [profileResult] = await connection.query(profileQuery, profileParams);
             if (profileResult.length > 0) {
                 profileData = profileResult[0];
             }
        } else if (userRole === 'admin') {
             profileData = { full_name: 'Адміністратор', department: 'Адміністрація' };
        }

        connection.release();

        if (!profileData && userRole !== 'admin') {
             return res.status(404).json({ success: false, error: 'Профіль користувача не знайдено.' });
        }

        res.json({
            success: true,
            account: accountData,
            profile: profileData,
            supervisor: supervisorData
        });

    } catch (error) {
        if (connection) connection.release();
        console.error(`Error fetching profile data for user ${userId}, role ${userRole}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні профілю.' });
    }
});

router.put('/api/account/student-profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ success: false, error: 'Доступ заборонено.' });
    }
    const studentId = req.user.userId;
    const accountId = req.user.accountId;
    const { full_name, student_card_number, department, phone, email } = req.body;

    if (!full_name || !student_card_number || !department || !phone || !email) {
        return res.status(400).json({ success: false, error: 'Будь ласка, заповніть усі обов\'язкові поля.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Некоректна адреса електронної пошти.' });
    }
    const phoneRegex = /^\+?[0-9\s\-()]{10,}$/;
    if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, error: 'Некоректний номер телефону.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const studentUpdateQuery = `
            UPDATE students
            SET full_name = ?, student_card_number = ?, department = ?, phone = ?, email = ?
            WHERE student_id = ?;
        `;
        const [studentUpdateResult] = await connection.query(studentUpdateQuery, [
            full_name, student_card_number, department, phone, email, studentId
        ]);

        if (studentUpdateResult.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, error: 'Профіль студента не знайдено.' });
        }

        const [currentAccount] = await connection.query('SELECT email FROM accounts WHERE account_id = ?', [accountId]);
        if (currentAccount.length > 0 && currentAccount[0].email !== email) {
            const [existingAccount] = await connection.query(
                'SELECT account_id FROM accounts WHERE email = ? AND account_id != ?',
                [email, accountId]
            );
            if (existingAccount.length > 0) {
                await connection.rollback();
                connection.release();
                return res.status(409).json({ success: false, error: 'Цей email вже використовується іншим акаунтом.' });
            }
            await connection.query('UPDATE accounts SET email = ? WHERE account_id = ?', [email, accountId]);
        }

        await connection.commit();
        connection.release();
        res.json({ success: true, message: 'Профіль успішно оновлено.' });

    } catch (error) {
         if (connection) {
             await connection.rollback();
             connection.release();
         }
        console.error(`Error updating student profile for student ${studentId}:`, error);
         if (error.code === 'ER_DUP_ENTRY') {
              const isEmailDuplicate = error.sqlMessage?.includes('accounts.email') || error.sqlMessage?.includes('students.email');
              const isCardDuplicate = error.sqlMessage?.includes('students.student_card_number');
              let errorMessage = 'Помилка: Дублююче значення.';
              if (isEmailDuplicate) errorMessage = 'Помилка: Цей email вже існує.';
              if (isCardDuplicate) errorMessage = 'Помилка: Цей номер студентського квитка вже існує.';
              return res.status(409).json({ success: false, error: errorMessage });
         }
        res.status(500).json({ success: false, error: 'Помилка сервера при оновленні профілю.' });
    }
});

router.put('/api/account/supervisor-profile', authenticateToken, async (req, res) => {
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Доступ заборонено.' });
    }
    const supervisorId = req.user.userId;
    const accountId = req.user.accountId;
    const { full_name, department, phone, email, position, specialization, teacher_status } = req.body;

    if (!full_name || !department || !phone || !email) {
        return res.status(400).json({ success: false, error: 'Будь ласка, заповніть обов\'язкові поля: ПІБ, Кафедра/Відділ, Телефон, Email.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const supervisorUpdateQuery = `
            UPDATE supervisors
            SET full_name = ?, department = ?, phone = ?, email = ?, position = ?, specialization = ?, teacher_status = ?
            WHERE supervisor_id = ?;
        `;
        const [supervisorUpdateResult] = await connection.query(supervisorUpdateQuery, [
            full_name, department, phone, email, position || 'Професор', specialization, teacher_status || 'Доступний', supervisorId
        ]);

        if (supervisorUpdateResult.affectedRows === 0) {
             await connection.rollback();
             connection.release();
             return res.status(404).json({ success: false, error: 'Профіль керівника не знайдено.' });
        }

        const [currentAccount] = await connection.query('SELECT email FROM accounts WHERE account_id = ?', [accountId]);
        if (currentAccount.length > 0 && currentAccount[0].email !== email) {
            const [existingAccount] = await connection.query('SELECT account_id FROM accounts WHERE email = ? AND account_id != ?', [email, accountId]);
            if (existingAccount.length > 0) {
                await connection.rollback();
                connection.release();
                return res.status(409).json({ success: false, error: 'Цей email вже використовується іншим акаунтом.' });
            }
            await connection.query('UPDATE accounts SET email = ? WHERE account_id = ?', [email, accountId]);
        }

        await connection.commit();
        connection.release();
        res.json({ success: true, message: 'Профіль успішно оновлено.' });
    } catch (error) {
        if (connection) { await connection.rollback(); connection.release(); }
        console.error(`Error updating supervisor profile for supervisor ${supervisorId}:`, error);
        if (error.code === 'ER_DUP_ENTRY' && (error.sqlMessage?.includes('accounts.email') || error.sqlMessage?.includes('supervisors.email'))) {
            return res.status(409).json({ success: false, error: 'Помилка: Цей email вже існує.' });
        }
        res.status(500).json({ success: false, error: 'Помилка сервера при оновленні профілю керівника.' });
    }
});

router.get('/api/account/activity-logs', authenticateToken, async (req, res) => {
    const accountId = req.user?.accountId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!accountId || !userId || !userRole) {
        return res.status(400).json({ success: false, error: 'Неповні дані користувача в токені.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const logQuery = `
            SELECT log_id, user_type, user_id, action, description, timestamp
            FROM activity_logs
            WHERE user_id = ? AND user_type = ?
            ORDER BY timestamp DESC
            LIMIT 50;
        `;
        const [logs] = await connection.query(logQuery, [userId, userRole]);
        connection.release();
        res.json({ success: true, logs: logs });
    } catch (error) {
        if (connection) connection.release();
        console.error(`Error fetching activity logs for account ${accountId} (User: ${userId}, Role: ${userRole}):`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні логів активності.' });
    }
});

router.get('/api/account/sessions', authenticateToken, async (req, res) => {
    const accountId = req.user?.accountId;
    const currentSessionId = req.user?.currentSessionId;

    if (!accountId) {
         return res.status(400).json({ success: false, error: 'ID акаунту не знайдено в токені.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const sessionQuery = `
            SELECT session_id, user_type, login_time, logout_time, ip_address, user_agent, status
            FROM login_sessions
            WHERE account_id = ?
            ORDER BY login_time DESC
            LIMIT 50;
        `;
        const [sessions] = await connection.query(sessionQuery, [accountId]);
        connection.release();

        let currentIP = null;
        let currentUserAgent = null;
        const processedSessions = sessions.map(session => {
            const isCurrent = currentSessionId ? (session.session_id === currentSessionId) : false;
            if (isCurrent) {
                currentIP = session.ip_address;
                currentUserAgent = session.user_agent;
            }
            return { ...session, isCurrent: isCurrent };
        });

        const finalSessions = processedSessions.map(session => {
             const isSimilar = !session.isCurrent && currentIP !== null && session.ip_address === currentIP && session.user_agent === currentUserAgent;
             return { ...session, isSimilar: isSimilar };
        });

        res.json({ success: true, sessions: finalSessions });
    } catch (error) {
        if (connection) connection.release();
        console.error(`Error fetching sessions for account ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні сесій.' });
    }
});

router.post('/api/account/sessions/block', authenticateToken, async (req, res) => {
    const { session_id } = req.body;
    const accountId = req.user?.accountId;
    const currentSessionId = req.user?.currentSessionId;

    if (!session_id || !accountId) {
        return res.status(400).json({ success: false, error: 'Відсутні необхідні дані для блокування (session_id).' });
    }

    if (currentSessionId && parseInt(session_id, 10) === parseInt(currentSessionId, 10)) {
        return res.status(403).json({ success: false, error: 'Неможливо заблокувати поточну сесію.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const blockReason = 'Заблоковано користувачем з інтерфейсу акаунту';
        const blockQuery = `
            INSERT INTO blocked_sessions (session_id, account_id, reason, created_at)
            VALUES (?, ?, ?, NOW());
        `;
        const [blockResult] = await connection.query(blockQuery, [session_id, accountId, blockReason]);

        if (blockResult.affectedRows === 0) {
             await connection.rollback();
             connection.release();
             return res.status(500).json({ success: false, error: 'Не вдалося записати блокування в історію.' });
        }

        const updateSessionQuery = `
            UPDATE login_sessions
            SET status = 'blocked', logout_time = NOW()
            WHERE session_id = ? AND account_id = ? AND status = 'active';
         `;
         const [updateResult] = await connection.query(updateSessionQuery, [session_id, accountId]);

         if (updateResult.affectedRows === 0) {
             console.warn(`Session ${session_id} for account ${accountId} was not active when attempting to block, but block record created.`);
         }

        await connection.commit();
        connection.release();

        res.json({ success: true, message: 'Сесію успішно заблоковано та додано до історії.' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error(`Error blocking session ${session_id} for account ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при блокуванні сесії.' });
    }
});

router.get('/api/account/activity-logs/all', authenticateToken, async (req, res) => {
    const accountId = req.user?.accountId;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const filterDate = req.query.date;
    const filterType = req.query.type;

    if (!accountId || !userId || !userRole) {
        return res.status(400).json({ success: false, error: 'Неповні дані користувача.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        let whereClauses = ['user_id = ?', 'user_type = ?'];
        let queryParams = [userId, userRole];

        if (filterDate) { whereClauses.push('DATE(timestamp) = ?'); queryParams.push(filterDate); }
        if (filterType) { whereClauses.push('action = ?'); queryParams.push(filterType); }

        const whereString = whereClauses.join(' AND ');
        const countQuery = `SELECT COUNT(*) as total FROM activity_logs WHERE ${whereString}`;
        const [countResult] = await connection.query(countQuery, queryParams);
        const totalLogs = countResult[0].total;
        const totalPages = Math.ceil(totalLogs / limit);

        const logQuery = `
            SELECT log_id, user_type, user_id, action, description, timestamp
            FROM activity_logs
            WHERE ${whereString}
            ORDER BY timestamp DESC
            LIMIT ? OFFSET ?;
        `;
        const queryParamsWithPagination = [...queryParams, limit, offset];
        const [logs] = await connection.query(logQuery, queryParamsWithPagination);
        connection.release();
        res.json({
            success: true,
            logs: logs,
            pagination: { currentPage: page, totalPages: totalPages, totalLogs: totalLogs, limit: limit }
        });
    } catch (error) {
        if (connection) connection.release();
        console.error(`Error fetching all activity logs for account ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні логів.' });
    }
});

router.get('/api/account/sessions/all', authenticateToken, async (req, res) => {
    const accountId = req.user?.accountId;
    const currentSessionId = req.user?.currentSessionId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const filterDate = req.query.date;
    const filterStatus = req.query.status;

    if (!accountId) {
         return res.status(400).json({ success: false, error: 'ID акаунту не знайдено в токені.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        let whereClauses = ['account_id = ?'];
        let queryParams = [accountId];

        if (filterDate) { whereClauses.push('DATE(login_time) = ?'); queryParams.push(filterDate); }
        if (filterStatus) { whereClauses.push('status = ?'); queryParams.push(filterStatus); }

        const whereString = whereClauses.join(' AND ');
        const countQuery = `SELECT COUNT(*) as total FROM login_sessions WHERE ${whereString}`;
        const [countResult] = await connection.query(countQuery, queryParams);
        const totalSessions = countResult[0].total;
        const totalPages = Math.ceil(totalSessions / limit);

        const sessionQuery = `
            SELECT session_id, user_type, login_time, logout_time, ip_address, user_agent, status
            FROM login_sessions
            WHERE ${whereString}
            ORDER BY login_time DESC
            LIMIT ? OFFSET ?;
        `;
        const finalQueryParams = [...queryParams, limit, offset];
        const [sessions] = await connection.query(sessionQuery, finalQueryParams);
        connection.release();

        let currentIP = null;
        let currentUserAgent = null;
        const processedSessions = sessions.map(session => {
             const isCurrent = currentSessionId ? (session.session_id === currentSessionId) : false;
             if(isCurrent) { currentIP = session.ip_address; currentUserAgent = session.user_agent; }
            return { ...session, isCurrent: isCurrent, isSimilar: false };
        });

         if (currentIP && currentUserAgent) {
             processedSessions.forEach(session => {
                 if (!session.isCurrent && session.ip_address === currentIP && session.user_agent === currentUserAgent) { session.isSimilar = true; }
             });
         }
        res.json({
            success: true,
            sessions: processedSessions,
            pagination: { currentPage: page, totalPages: totalPages, totalSessions: totalSessions, limit: limit }
         });
    } catch (error) {
        if (connection) connection.release();
        console.error(`Error fetching all sessions for account ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні сесій.' });
    }
});

router.get('/api/account/blocked-sessions', authenticateToken, async (req, res) => {
    const accountId = req.user?.accountId;

    if (!accountId) {
        return res.status(400).json({ success: false, error: 'ID акаунту не знайдено в токені.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const query = `
            SELECT blocked_session_id, session_id, reason, created_at
            FROM blocked_sessions
            WHERE account_id = ?
            ORDER BY created_at DESC;
        `;
        const [blockedSessions] = await connection.query(query, [accountId]);
        connection.release();
        res.json({ success: true, blockedSessions: blockedSessions });
    } catch (error) {
        if (connection) connection.release();
        console.error(`Помилка отримання заблокованих сесій для акаунта ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні заблокованих сесій.' });
    }
});

router.delete('/api/account/blocked-sessions/:blocked_session_id', authenticateToken, async (req, res) => {
    const { blocked_session_id } = req.params;
    const accountId = req.user?.accountId;

    if (!blocked_session_id || !accountId) {
        return res.status(400).json({ success: false, error: 'Відсутній ID запису блокування або ID користувача.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [blockedEntry] = await connection.query(
            "SELECT session_id FROM blocked_sessions WHERE blocked_session_id = ? AND account_id = ?",
            [blocked_session_id, accountId]
        );

        if (blockedEntry.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, error: 'Запис про блокування не знайдено або доступ заборонено.' });
        }

        const originalSessionId = blockedEntry[0].session_id;

        const [deleteResult] = await connection.query(
            "DELETE FROM blocked_sessions WHERE blocked_session_id = ? AND account_id = ?",
            [blocked_session_id, accountId]
        );

        if (deleteResult.affectedRows > 0) {
            if (originalSessionId) {
                await connection.query(
                   "UPDATE login_sessions SET status = 'logged_out', logout_time = IFNULL(logout_time, NOW()) WHERE session_id = ? AND account_id = ? AND status = 'blocked'",
                   [originalSessionId, accountId]
                );
            }
            await connection.commit();
            connection.release();
            res.json({ success: true, message: 'Запис про блокування сесії видалено, статус сесії оновлено.' });
        } else {
            await connection.rollback();
            connection.release();
            res.status(404).json({ success: false, error: 'Запис про блокування не знайдено або він не належить цьому користувачу (повторна перевірка).' });
        }
    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error(`Помилка видалення запису блокування ${blocked_session_id} для акаунта ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при видаленні запису про блокування.' });
    }
});

module.exports = router;
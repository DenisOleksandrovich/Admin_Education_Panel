const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secure_secret_key_here_replace_this!';
const SALT_ROUNDS = 10;

router.post('/api/forgot-password/verify', async (req, res) => {
    const { fullName, email, studentCardNumber, department, phone } = req.body;

    if (!fullName || !email || !studentCardNumber || !department || !phone) {
        return res.status(400).json({ success: false, error: 'Будь ласка, заповніть усі поля' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const studentQuery = `
            SELECT s.student_id, s.email, acc.is_active
            FROM students s
            LEFT JOIN accounts acc ON s.email = acc.email
            WHERE s.full_name = ? AND s.email = ? AND s.student_card_number = ? AND s.department = ? AND s.phone = ?
            LIMIT 1
        `;
        const [students] = await connection.query(studentQuery, [fullName, email, studentCardNumber, department, phone]);
        connection.release();

        if (students.length > 0) {
            const student = students[0];
            if (student.is_active === 1) {
                res.json({ success: true });
            } else {
                 res.status(403).json({ success: false, error: 'Акаунт знайдено, але він неактивний.' });
            }
        } else {
            res.status(404).json({ success: false, error: 'Студента з такими даними не знайдено.' });
        }
    } catch (error) {
        if (connection) connection.release();
        console.error('Server error during password recovery verification:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера під час перевірки даних' });
    }
});


router.post('/api/forgot-password/reset', async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ success: false, error: 'Необхідно вказати email та новий пароль' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Новий пароль повинен містити щонайменше 8 символів' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [accounts] = await connection.query(
            'SELECT account_id, role, student_id, supervisor_id FROM accounts WHERE email = ? AND is_active = 1 LIMIT 1',
            [email]
        );

        if (accounts.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ success: false, error: 'Акаунт для скидання пароля не знайдено.' });
        }

        const account = accounts[0];
        const accountId = account.account_id;
        const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await connection.query(
            'UPDATE accounts SET password_hash = ? WHERE account_id = ?',
            [newHashedPassword, accountId]
        );

        await connection.commit();
        connection.release();

        res.json({ success: true, message: 'Пароль успішно змінено' });

    } catch (error) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        console.error('Server error during password reset:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера під час скидання пароля' });
    }
});


router.post('/api/login', async (req, res) => {
    const { username, password, remember } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Будь ласка, введіть email та пароль' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [accounts] = await connection.query('SELECT * FROM accounts WHERE email = ? LIMIT 1', [username]);

        if (accounts.length === 0) {
            connection.release();
            return res.status(401).json({ success: false, error: 'Невірний email або пароль' });
        }

        const account = accounts[0];

        const currentIpAddress = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || req.connection?.socket?.remoteAddress;

        const [ipBlockedSessions] = await connection.query(
            "SELECT session_id FROM login_sessions WHERE account_id = ? AND ip_address = ? AND status = 'blocked' LIMIT 1",
            [account.account_id, currentIpAddress]
        );

        if (ipBlockedSessions.length > 0) {
            connection.release();
            return res.status(403).json({ success: false, error: 'Доступ з цієї IP-адреси для вашого акаунта тимчасово обмежено. Будь ласка, зверніться до адміністратора.' });
        }

        if (!account.is_active) {
            connection.release();
            return res.status(403).json({ success: false, error: 'Ваш обліковий запис деактивовано. Будь ласка, зверніться до служби підтримки.' });
        }

        const isPasswordValid = await bcrypt.compare(password, account.password_hash);

        if (!isPasswordValid) {
            connection.release();
            return res.status(401).json({ success: false, error: 'Невірний email або пароль' });
        }

        let userId = null;
        let studentGroupId = null;
        let groupInfo = null;
        let unreadCount = 0;

        if (account.role === 'student' && account.student_id) {
            userId = account.student_id;
            const [studentData] = await connection.query(
                `SELECT s.study_group_id, sg.group_name, sg.specialty, sg.course
                 FROM students s
                 LEFT JOIN study_groups sg ON s.study_group_id = sg.study_group_id
                 WHERE s.student_id = ?`,
                [userId]
            );
            if (studentData.length > 0) {
                studentGroupId = studentData[0].study_group_id;
                groupInfo = {
                    study_group_id: studentData[0].study_group_id,
                    group_name: studentData[0].group_name,
                    specialty: studentData[0].specialty,
                    course: studentData[0].course
                };
            }
        } else if (account.role === 'supervisor' && account.supervisor_id) {
            userId = account.supervisor_id;
        } else {
            userId = account.account_id;
        }

        await connection.query('UPDATE accounts SET last_login = NOW() WHERE account_id = ?', [account.account_id]);

        const ipAddress = currentIpAddress;
        const userAgent = req.headers['user-agent'];

        const [sessionResult] = await connection.query(
            `INSERT INTO login_sessions (account_id, user_type, ip_address, user_agent, status, login_time)
             VALUES (?, ?, ?, ?, 'active', NOW())`,
            [account.account_id, account.role, ipAddress, userAgent]
        );
        const newSessionId = sessionResult.insertId;

        connection.release();

        const payload = {
            accountId: account.account_id,
            userId: userId,
            role: account.role,
            email: account.email,
            groupId: studentGroupId,
            currentSessionId: newSessionId
        };
        const expiresIn = remember ? '24h' : '1h';
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

        res.json({
            success: true,
            message: 'Вхід успішний!',
            token: token,
            userRole: account.role,
            userId: userId,
            accountId: account.account_id,
            groupInfo: groupInfo,
            unreadNotifications: unreadCount
        });

    } catch (error) {
        if (connection) connection.release();
        console.error('Server error during login:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера під час спроби входу' });
    }
});


router.post('/api/register/student', async (req, res) => {
    const {
        fullName, email, studentCardNumber, department, phoneNumber,
        password,
        studyGroupId,
        supervisorId
    } = req.body;

    if (!fullName || !email || !studentCardNumber || !department || !phoneNumber || !password || !studyGroupId || !supervisorId) {
        return res.status(400).json({ success: false, error: 'Будь ласка, заповніть усі обов\'язкові поля, включаючи групу та керівника' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'Пароль повинен містити щонайменше 8 символів' });
    }
    if (isNaN(parseInt(studyGroupId, 10))) {
        return res.status(400).json({ success: false, error: 'Некоректний ідентифікатор групи' });
    }
    if (isNaN(parseInt(supervisorId, 10))) {
        return res.status(400).json({ success: false, error: 'Некоректний ідентифікатор керівника' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existingAccount] = await connection.query('SELECT account_id FROM accounts WHERE email = ? LIMIT 1', [email]);
        if (existingAccount.length > 0) {
            await connection.rollback(); connection.release();
            return res.status(409).json({ success: false, error: 'Обліковий запис з таким email вже існує' });
        }
        const [existingStudentEmail] = await connection.query('SELECT student_id FROM students WHERE email = ? LIMIT 1', [email]);
        if (existingStudentEmail.length > 0) {
            await connection.rollback(); connection.release();
            return res.status(409).json({ success: false, error: 'Студент з таким email вже існує' });
        }
        const [existingStudentCard] = await connection.query('SELECT student_id FROM students WHERE student_card_number = ? LIMIT 1', [studentCardNumber]);
        if (existingStudentCard.length > 0) {
            await connection.rollback(); connection.release();
            return res.status(409).json({ success: false, error: 'Студент з таким номером квитка вже існує' });
        }
        const [existingGroup] = await connection.query('SELECT study_group_id FROM study_groups WHERE study_group_id = ? LIMIT 1', [studyGroupId]);
        if (existingGroup.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(400).json({ success: false, error: 'Обрана група не існує' });
        }
        const [existingSupervisor] = await connection.query('SELECT supervisor_id FROM supervisors WHERE supervisor_id = ? LIMIT 1', [supervisorId]);
        if (existingSupervisor.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(400).json({ success: false, error: 'Обраний керівник не існує' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const studentInsertQuery = `
            INSERT INTO students
            (full_name, email, student_card_number, department, phone, study_group_id, supervisor_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [studentResult] = await connection.query(studentInsertQuery, [
            fullName, email, studentCardNumber, department, phoneNumber, studyGroupId, supervisorId
        ]);
        const newStudentId = studentResult.insertId;
        if (!newStudentId) throw new Error('Не вдалося створити запис студента');

        const accountInsertQuery = `
            INSERT INTO accounts (email, password_hash, role, student_id, is_active, created_at) VALUES (?, ?, 'student', ?, 1, NOW())
        `;
        const [accountResult] = await connection.query(accountInsertQuery, [ email, hashedPassword, newStudentId ]);
        if (!accountResult.insertId) throw new Error('Не вдалося створити обліковий запис');

        await connection.commit();
        connection.release();

        res.status(201).json({
            success: true,
            message: 'Студента успішно зареєстровано!',
            studentId: newStudentId,
            accountId: accountResult.insertId
        });

    } catch (error) {
        console.error('Error during student registration:', error);
        if (connection) { await connection.rollback(); connection.release(); }
        res.status(500).json({ success: false, error: 'Помилка сервера під час реєстрації' });
    }
});

router.get('/api/user/profile', authenticateToken, async (req, res) => {
    const accountId = req.user.accountId;
    const role = req.user.role;
    const userId = req.user.userId;

    try {
        let profileData = null;
        let accountData = null;

        const [accounts] = await db.query('SELECT account_id, email, role, is_active, last_login, created_at FROM accounts WHERE account_id = ?', [accountId]);
        if (accounts.length === 0) {
            return res.status(404).json({ success: false, error: 'Акаунт не знайдено' });
        }
        accountData = accounts[0];

        if (role === 'student' && userId) {
            const studentProfileQuery = `
                SELECT s.student_id, s.full_name, s.email, s.student_card_number,
                       s.department, s.phone, s.supervisor_id, s.total_progress, s.diploma_id,
                       s.study_group_id, sg.group_name, sg.specialty, sg.course
                FROM students s
                LEFT JOIN study_groups sg ON s.study_group_id = sg.study_group_id
                WHERE s.student_id = ?
                LIMIT 1;
            `;
            const [students] = await db.query(studentProfileQuery, [userId]);
            if (students.length > 0) {
                profileData = students[0];
            }
        } else if ((role === 'supervisor' || role === 'admin') && userId) {
            const [supervisors] = await db.query('SELECT * FROM supervisors WHERE supervisor_id = ?', [userId]);
            if (supervisors.length > 0) {
                profileData = supervisors[0];
            }
        }

        res.json({
            success: true,
            account: accountData,
            profile: profileData
        });

    } catch (error) {
        console.error(`Error fetching profile for account ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні профілю' });
    }
});

router.get('/api/user/group', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const role = req.user.role;
    const studentGroupId = req.user.groupId;

    if (role !== 'student') {
        return res.status(403).json({ success: false, error: 'Доступ заборонено: Тільки для студентів' });
    }

    if (!studentGroupId) {
         return res.status(404).json({ success: false, error: 'Група студента не знайдена (відсутній ID групи)' });
    }

    try {
        const [groupData] = await db.query(`
            SELECT study_group_id, group_name, specialty, course
            FROM study_groups
            WHERE study_group_id = ?
        `, [studentGroupId]);

        if (groupData.length === 0) {
            return res.status(404).json({ success: false, error: 'Група студента не знайдена в базі даних' });
        }

        res.json({
            success: true,
            groupInfo: groupData[0]
        });

    } catch (error) {
        console.error(`Error fetching group info for student ${userId} with groupId ${studentGroupId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні інформації про групу' });
    }
});

router.put('/api/user/profile/student', authenticateToken, async (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ success: false, error: 'Доступ заборонено: Тільки студенти можуть оновлювати свій профіль' });
    }

    const studentId = req.user.userId;
    const { phone, email } = req.body;

    if (!phone || typeof phone !== 'string') {
         return res.status(400).json({ success: false, error: 'Некоректний або відсутній номер телефону' });
    }
     if (email && typeof email !== 'string') {
          return res.status(400).json({ success: false, error: 'Некоректний email' });
     }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [studentUpdateResult] = await connection.query(
            'UPDATE students SET phone = ? WHERE student_id = ?',
            [phone, studentId]
        );

        if (studentUpdateResult.affectedRows === 0) {
             await connection.rollback();
             connection.release();
            return res.status(404).json({ success: false, error: 'Профіль студента не знайдено' });
        }

        if (email && email !== req.user.email) {
             const [existing] = await connection.query('SELECT account_id FROM accounts WHERE email = ? AND account_id != ?', [email, req.user.accountId]);
             if (existing.length > 0) {
                 await connection.rollback();
                 connection.release();
                 return res.status(409).json({ success: false, error: 'Цей email вже використовується іншим акаунтом' });
             }

             await connection.query('UPDATE accounts SET email = ? WHERE account_id = ?', [email, req.user.accountId]);
             await connection.query('UPDATE students SET email = ? WHERE student_id = ?', [email, studentId]);
        }

        await connection.commit();
        connection.release();

        res.json({ success: true, message: 'Профіль успішно оновлено' });

    } catch (error) {
        if (connection) { await connection.rollback(); connection.release(); }
        console.error(`Error updating student profile ${studentId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при оновленні профілю' });
    }
});

router.put('/api/user/profile/supervisor', authenticateToken, async (req, res) => {
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Доступ заборонено' });
    }
    const supervisorIdToUpdate = (req.user.role === 'admin' && req.body.targetSupervisorId) ? req.body.targetSupervisorId : req.user.userId;
    const accountIdToUpdate = req.user.accountId;

    const { phone, teacher_status, email } = req.body;

    if (!phone || typeof phone !== 'string') {
        return res.status(400).json({ success: false, error: 'Некоректний або відсутній номер телефону' });
    }
     if (teacher_status && typeof teacher_status !== 'string') {
         return res.status(400).json({ success: false, error: 'Некоректний статус викладача' });
     }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [supervisorUpdateResult] = await connection.query(
            'UPDATE supervisors SET phone = ?, teacher_status = ? WHERE supervisor_id = ?',
            [phone, teacher_status, supervisorIdToUpdate]
        );

        if (supervisorUpdateResult.affectedRows === 0) {
            await connection.rollback(); connection.release();
            return res.status(404).json({ success: false, error: 'Профіль викладача не знайдено' });
        }

        if (email && email !== req.user.email && supervisorIdToUpdate === req.user.userId) {
            const [existing] = await connection.query('SELECT account_id FROM accounts WHERE email = ? AND account_id != ?', [email, accountIdToUpdate]);
             if (existing.length > 0) {
                 await connection.rollback(); connection.release();
                 return res.status(409).json({ success: false, error: 'Цей email вже використовується іншим акаунтом' });
             }
             await connection.query('UPDATE accounts SET email = ? WHERE account_id = ?', [email, accountIdToUpdate]);
             await connection.query('UPDATE supervisors SET email = ? WHERE supervisor_id = ?', [email, supervisorIdToUpdate]);
        }

        await connection.commit();
        connection.release();

        res.json({ success: true, message: 'Профіль викладача успішно оновлено' });

    } catch (error) {
        if (connection) { await connection.rollback(); connection.release(); }
        console.error(`Error updating supervisor profile ${supervisorIdToUpdate}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при оновленні профілю викладача' });
    }
});

router.put('/api/user/password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const accountId = req.user.accountId;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Будь ласка, введіть поточний та новий паролі' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, error: 'Новий пароль повинен містити щонайменше 8 символів' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, error: 'Новий пароль не може співпадати з поточним' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [accounts] = await connection.query('SELECT password_hash, role, student_id, supervisor_id FROM accounts WHERE account_id = ?', [accountId]);
        if (accounts.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(404).json({ success: false, error: 'Акаунт не знайдено' });
        }
        const account = accounts[0];

        const isPasswordValid = await bcrypt.compare(currentPassword, account.password_hash);
        if (!isPasswordValid) {
            await connection.rollback(); connection.release();
            return res.status(401).json({ success: false, error: 'Невірний поточний пароль' });
        }

        const newHashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

        await connection.query('UPDATE accounts SET password_hash = ? WHERE account_id = ?', [newHashedPassword, accountId]);

        await connection.commit();
        connection.release();

        res.json({ success: true, message: 'Пароль успішно змінено' });

    } catch (error) {
        if (connection) { await connection.rollback(); connection.release(); }
        console.error(`Error changing password for account ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при зміні пароля' });
    }
});

router.post('/api/logout', authenticateToken, async (req, res) => {
    const accountId = req.user.accountId;
    const currentSessionId = req.user.currentSessionId;

    if (!currentSessionId) {
        return res.status(400).json({ success: false, error: 'ID поточної сесії не знайдено в токені.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.query(
            "UPDATE login_sessions SET logout_time = NOW(), status = 'logged_out' WHERE session_id = ? AND account_id = ? AND status = 'active'",
            [currentSessionId, accountId]
        );
        connection.release();
        res.json({ success: true, message: 'Вихід успішний.' });

    } catch (error) {
        if (connection) connection.release();
        console.error(`Error during logout for account ${accountId}, session ${currentSessionId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера під час виходу.' });
    }
});

module.exports = router;
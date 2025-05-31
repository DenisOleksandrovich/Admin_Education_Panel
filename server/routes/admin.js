const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        console.warn(`Unauthorized access attempt to admin route by user: ${req.user?.userId} (Role: ${req.user?.role})`);
        res.status(403).json({ success: false, error: 'Доступ заборонено: потрібні права адміністратора.' });
    }
};

// Middleware authenticateToken и isAdmin применяются ко всем маршрутам ниже
router.use(authenticateToken, isAdmin);

// --- Вспомогательная функция для проверки существования email ---
async function checkEmailExists(connection, email, excludeAccountId = null) {
    let query = 'SELECT account_id FROM accounts WHERE email = ?';
    const params = [email];
    if (excludeAccountId) {
        query += ' AND account_id != ?';
        params.push(excludeAccountId);
    }
    query += ' LIMIT 1';
    const [existing] = await connection.query(query, params);
    return existing.length > 0;
}

// --- Маршрут для получения списка студентов (с поиском) ---
router.get('/users/students', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    let connection;

    try {
        connection = await db.getConnection();
        const searchPattern = `%${searchTerm}%`;
        const queryParams = [searchPattern, searchPattern, searchPattern];

        let countQuery = `
            SELECT COUNT(s.student_id) as total
            FROM students s
            LEFT JOIN accounts a ON s.email = a.email
            WHERE (s.full_name LIKE ? OR s.email LIKE ? OR s.student_card_number LIKE ?)
        `;
        let dataQuery = `
            SELECT
                s.student_id, s.full_name, s.email, s.student_card_number,
                s.department AS student_department, s.phone AS student_phone,
                s.study_group_id, s.supervisor_id, sg.group_name,
                a.account_id, a.is_active
            FROM students s
            LEFT JOIN accounts a ON s.email = a.email
            LEFT JOIN study_groups sg ON s.study_group_id = sg.study_group_id
            WHERE (s.full_name LIKE ? OR s.email LIKE ? OR s.student_card_number LIKE ?)
            ORDER BY s.full_name ASC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await connection.query(countQuery, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const [students] = await connection.query(dataQuery, [...queryParams, limit, offset]);

        connection.release();
        res.json({
            success: true,
            data: students,
            pagination: { currentPage: page, totalPages: totalPages, totalItems: totalItems, limit: limit }
        });
    } catch (error) {
        if (connection) connection.release();
        console.error('Admin Error fetching students:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні списку студентів.' });
    }
});

// --- Маршрут для получения списка преподавателей (с поиском) ---
router.get('/users/teachers', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || '';
    let connection;

    try {
        connection = await db.getConnection();
        const searchPattern = `%${searchTerm}%`;
        const queryParams = [searchPattern, searchPattern, searchPattern];

        let countQuery = `
            SELECT COUNT(sup.supervisor_id) as total
            FROM supervisors sup
            LEFT JOIN accounts a ON sup.email = a.email
            WHERE (sup.full_name LIKE ? OR sup.email LIKE ? OR sup.department LIKE ?)
        `;
        let dataQuery = `
            SELECT
                sup.supervisor_id, sup.full_name, sup.email,
                sup.department AS supervisor_department, sup.phone AS supervisor_phone,
                sup.position, sup.teacher_status, sup.specialization,
                a.account_id, a.is_active
            FROM supervisors sup
            LEFT JOIN accounts a ON sup.email = a.email
            WHERE (sup.full_name LIKE ? OR sup.email LIKE ? OR sup.department LIKE ?)
            ORDER BY sup.full_name ASC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await connection.query(countQuery, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const [teachers] = await connection.query(dataQuery, [...queryParams, limit, offset]);

        connection.release();
        res.json({
            success: true,
            data: teachers,
            pagination: { currentPage: page, totalPages: totalPages, totalItems: totalItems, limit: limit }
        });
    } catch (error) {
        if (connection) connection.release();
        console.error('Admin Error fetching teachers:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні списку викладачів.' });
    }
});

// --- Маршрут для получения списка администраторов (с поиском) ---
router.get('/users/admins', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.search || ''; // Получаем поисковый запрос
    let connection;
    try {
        connection = await db.getConnection();
        const searchPattern = `%${searchTerm}%`;
        const queryParams = [];
        let whereClause = "WHERE a.role = 'admin'"; // Базовое условие

        // Добавляем условие поиска, если searchTerm не пустой
        if (searchTerm) {
            whereClause += " AND a.email LIKE ?"; // Ищем по email
            queryParams.push(searchPattern);
        }

        // Запрос для подсчета общего количества записей (с учетом поиска)
        const countQuery = `SELECT COUNT(a.account_id) as total FROM accounts a ${whereClause}`;
        const [countResult] = await connection.query(countQuery, queryParams);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Запрос для получения данных (с учетом поиска, лимита и смещения)
        const dataQuery = `
            SELECT a.account_id, a.email, a.created_at, a.last_login, a.is_active, a.supervisor_id, s.full_name as supervisor_name
            FROM accounts a
            LEFT JOIN supervisors s ON a.supervisor_id = s.supervisor_id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `;
        // Добавляем параметры лимита и смещения к существующим параметрам поиска
        const finalDataParams = [...queryParams, limit, offset];
        const [admins] = await connection.query(dataQuery, finalDataParams);

        connection.release();
        res.json({
            success: true, data: admins,
            pagination: { currentPage: page, totalPages: totalPages, totalItems: totalItems, limit: limit }
        });
    } catch (error) {
        if (connection) connection.release();
        console.error('Admin Error fetching admins:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні списку адміністраторів.' });
    }
});


// --- Маршруты создания пользователей (студент, преподаватель, админ) ---
router.post('/create/student', async (req, res) => {
    const { fullName, email, studentCardNumber, department, phoneNumber, password, studyGroupId, supervisorId } = req.body;

    if (!fullName || !email || !studentCardNumber || !department || !phoneNumber || !password || !studyGroupId || !supervisorId) {
        return res.status(400).json({ success: false, error: 'Будь ласка, заповніть усі обов\'язкові поля.', errors: { /*Можно добавить детальные ошибки для каждого поля*/ } });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, errors: { 'create-password-student': 'Пароль повинен містити щонайменше 8 символів.' } });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        if (await checkEmailExists(connection, email)) {
            await connection.rollback(); connection.release();
            return res.status(409).json({ success: false, errors: { 'create-email': 'Обліковий запис з таким email вже існує.' } });
        }
        const [existingStudentCard] = await connection.query('SELECT student_id FROM students WHERE student_card_number = ? LIMIT 1', [studentCardNumber]);
        if (existingStudentCard.length > 0) {
            await connection.rollback(); connection.release();
            return res.status(409).json({ success: false, errors: { 'create-studentCard': 'Студент з таким номером квитка вже існує.' } });
        }
        const [existingGroup] = await connection.query('SELECT study_group_id FROM study_groups WHERE study_group_id = ? LIMIT 1', [studyGroupId]);
        if (existingGroup.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(400).json({ success: false, errors: { 'create-studyGroup': 'Обрана група не існує.' } });
        }
        const [existingSupervisor] = await connection.query('SELECT supervisor_id FROM supervisors WHERE supervisor_id = ? LIMIT 1', [supervisorId]);
        if (existingSupervisor.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(400).json({ success: false, errors: { 'create-supervisor': 'Обраний керівник не існує.' } });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const studentInsertQuery = `INSERT INTO students (full_name, email, student_card_number, department, phone, study_group_id, supervisor_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [studentResult] = await connection.query(studentInsertQuery, [fullName, email, studentCardNumber, department, phoneNumber, studyGroupId, supervisorId]);
        const newStudentId = studentResult.insertId;
        if (!newStudentId) throw new Error('Не вдалося створити запис студента');

        const accountInsertQuery = `INSERT INTO accounts (email, password_hash, role, student_id, is_active, created_at) VALUES (?, ?, 'student', ?, 1, NOW())`;
        const [accountResult] = await connection.query(accountInsertQuery, [email, hashedPassword, newStudentId]);
        if (!accountResult.insertId) throw new Error('Не вдалося створити обліковий запис');

        const groupStudentQuery = 'INSERT INTO group_students (group_id, student_id) VALUES (?, ?)';
        await connection.query(groupStudentQuery, [studyGroupId, newStudentId]);

        await connection.commit();
        connection.release();

        console.log(`Admin ${req.user.email} created new student: ${email}, StudentID: ${newStudentId}, AccountID: ${accountResult.insertId}`);
        res.status(201).json({ success: true, message: 'Студента успішно створено!', studentId: newStudentId, accountId: accountResult.insertId });

    } catch (error) {
        console.error('Admin Error creating student:', error);
        if (connection) { await connection.rollback(); connection.release(); }
        if (error.code === 'ER_DUP_ENTRY') {
            const field = error.message.includes('email') ? 'create-email' : 'create-studentCard';
            const message = error.message.includes('email') ? 'Email вже використовується.' : 'Номер квитка вже існує.';
            return res.status(409).json({ success: false, errors: { [field]: message } });
        }
        res.status(500).json({ success: false, error: 'Помилка сервера під час створення студента.' });
    }
});

router.post('/create/teacher', async (req, res) => {
    const { fullName, email, phone, department, position, teacher_status, specialization, password } = req.body;

    if (!fullName || !email || !phone || !department || !password) {
        return res.status(400).json({ success: false, error: 'Будь ласка, заповніть поля: ПІБ, Email, Телефон, Кафедра, Пароль.', errors: { /* Детальные ошибки */ } });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, errors: { 'create-password-teacher': 'Пароль повинен містити щонайменше 8 символів.' } });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        if (await checkEmailExists(connection, email)) {
            await connection.rollback(); connection.release();
            return res.status(409).json({ success: false, errors: { 'create-teacher-email': 'Обліковий запис з таким email вже існує.' } });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const supervisorInsertQuery = `INSERT INTO supervisors (full_name, email, phone, department, position, teacher_status, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [supervisorResult] = await connection.query(supervisorInsertQuery, [fullName, email, phone, department, position || null, teacher_status || 'Доступний', specialization || null]);
        const newSupervisorId = supervisorResult.insertId;
        if (!newSupervisorId) throw new Error('Не вдалося створити запис викладача');

        const accountInsertQuery = `INSERT INTO accounts (email, password_hash, role, supervisor_id, is_active, created_at) VALUES (?, ?, 'supervisor', ?, 1, NOW())`;
        const [accountResult] = await connection.query(accountInsertQuery, [email, hashedPassword, newSupervisorId]);
        if (!accountResult.insertId) throw new Error('Не вдалося створити обліковий запис');

        await connection.commit();
        connection.release();

        console.log(`Admin ${req.user.email} created new teacher: ${email}, SupervisorID: ${newSupervisorId}, AccountID: ${accountResult.insertId}`);
        res.status(201).json({ success: true, message: 'Викладача успішно створено!', supervisorId: newSupervisorId, accountId: accountResult.insertId });

    } catch (error) {
        console.error('Admin Error creating teacher:', error);
        if (connection) { await connection.rollback(); connection.release(); }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, errors: { 'create-teacher-email': 'Помилка: Email вже використовується.' } });
        }
        res.status(500).json({ success: false, error: 'Помилка сервера під час створення викладача.' });
    }
});

router.post('/create/admin', async (req, res) => {
    const { email, password, supervisorId } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email та пароль є обов\'язковими.', errors: {} });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, errors: { 'create-password-admin': 'Пароль повинен містити щонайменше 8 символів.' } });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        if (await checkEmailExists(connection, email)) {
            await connection.rollback(); connection.release();
            return res.status(409).json({ success: false, errors: { 'create-admin-email': 'Обліковий запис з таким email вже існує.' } });
        }

        let supervisorLink = supervisorId ? parseInt(supervisorId, 10) : null;
        if (supervisorLink) {
            const [existingSupervisor] = await connection.query('SELECT supervisor_id FROM supervisors WHERE supervisor_id = ? LIMIT 1', [supervisorLink]);
            if (existingSupervisor.length === 0) {
                console.warn(`Admin creation: Provided supervisorId ${supervisorLink} not found. Creating admin without link.`);
                supervisorLink = null;
            }
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const accountInsertQuery = `INSERT INTO accounts (email, password_hash, role, supervisor_id, is_active, created_at) VALUES (?, ?, 'admin', ?, 1, NOW())`;
        const [accountResult] = await connection.query(accountInsertQuery, [email, hashedPassword, supervisorLink]);
        if (!accountResult.insertId) throw new Error('Не вдалося створити обліковий запис адміністратора');

        await connection.commit();
        connection.release();

        console.log(`Admin ${req.user.email} created new admin: ${email}, AccountID: ${accountResult.insertId}, Linked SupervisorID: ${supervisorLink || 'None'}`);
        res.status(201).json({ success: true, message: 'Адміністратора успішно створено!', accountId: accountResult.insertId });

    } catch (error) {
        console.error('Admin Error creating admin:', error);
        if (connection) { await connection.rollback(); connection.release(); }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, errors: { 'create-admin-email': 'Помилка: Email вже використовується.' } });
        }
        res.status(500).json({ success: false, error: 'Помилка сервера під час створення адміністратора.' });
    }
});

// --- Маршруты управления пользователями (статус, удаление, детали, обновление) ---
router.put('/users/:accountId/status', async (req, res) => {
    const { accountId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive === 'undefined' || isActive === null) {
        return res.status(400).json({ success: false, error: 'Необхідно вказати новий статус (isActive).' });
    }

    const newStatus = (isActive === true || isActive === 1 || isActive === 'true' || isActive === '1') ? 1 : 0;
    const targetAccountId = parseInt(accountId, 10);

    // Предотвращение деактивации собственного аккаунта администратора
    if (targetAccountId === req.user.accountId && newStatus === 0) {
        return res.status(403).json({ success: false, error: 'Неможливо деактивувати власний обліковий запис адміністратора.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        const [result] = await connection.query(
            'UPDATE accounts SET is_active = ? WHERE account_id = ?',
            [newStatus, targetAccountId]
        );
        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Обліковий запис не знайдено.' });
        }

        console.log(`Admin ${req.user.email} updated status for account ${targetAccountId} to ${newStatus === 1 ? 'active' : 'inactive'}`);
        res.json({ success: true, message: `Статус облікового запису успішно змінено на ${newStatus === 1 ? 'Активний' : 'Неактивний'}.` });

    } catch (error) {
        if (connection) connection.release();
        console.error(`Admin Error updating status for account ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при оновленні статусу.' });
    }
});

router.delete('/users/:accountId', async (req, res) => {
    const { accountId } = req.params;
    const targetAccountId = parseInt(accountId, 10);

    if (targetAccountId === req.user.accountId) {
        return res.status(403).json({ success: false, error: 'Неможливо видалити власний обліковий запис адміністратора.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [accountInfo] = await connection.query('SELECT role, student_id, supervisor_id, email FROM accounts WHERE account_id = ?', [targetAccountId]);

        if (accountInfo.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(404).json({ success: false, error: 'Обліковий запис не знайдено.' });
        }

        const { role, student_id, supervisor_id, email } = accountInfo[0];

        console.log(`Deleting universal records for account ID: ${targetAccountId}`);
        await connection.query('DELETE FROM support_messages WHERE account_id = ?', [targetAccountId]);
        await connection.query('DELETE FROM assignment_changes WHERE changed_by_account_id = ?', [targetAccountId]);
        await connection.query('DELETE FROM submission_comments WHERE account_id = ?', [targetAccountId]);


        if (role === 'student' && student_id) {
            console.log(`Attempting delete cascade for student ID: ${student_id}`);

            const [studentSubmissions] = await connection.query('SELECT submission_id FROM submissions WHERE student_id = ?', [student_id]);
            for (const submission of studentSubmissions) {
                await connection.query('DELETE FROM submission_comments WHERE submission_id = ?', [submission.submission_id]);
                await connection.query('DELETE FROM submission_versions WHERE submission_id = ?', [submission.submission_id]);
            }
            await connection.query('DELETE FROM submissions WHERE student_id = ?', [student_id]);

            await connection.query('DELETE FROM assignment_comments WHERE student_id = ?', [student_id]);
            await connection.query('DELETE FROM student_feedback WHERE student_id = ?', [student_id]);
            await connection.query('DELETE FROM group_students WHERE student_id = ?', [student_id]);
            await connection.query('DELETE FROM notification_reads WHERE student_id = ?', [student_id]);

            await connection.query('DELETE FROM students WHERE student_id = ?', [student_id]);

        } else if ((role === 'supervisor' || (role === 'admin' && supervisor_id)) && supervisor_id) {
            console.log(`Attempting delete cascade for supervisor ID: ${supervisor_id}`);

            if (role === 'supervisor') {
                 const [assignedStudents] = await connection.query('SELECT student_id FROM students WHERE supervisor_id = ? LIMIT 1', [supervisor_id]);
                 if (assignedStudents.length > 0) {
                     await connection.rollback(); connection.release();
                     return res.status(409).json({ success: false, error: 'Неможливо видалити: Керівник має призначених студентів. Перепризначте їх спочатку.' });
                 }
            }
            await connection.query('UPDATE students SET supervisor_id = NULL WHERE supervisor_id = ?', [supervisor_id]);

            await connection.query('DELETE FROM assignment_coauthors WHERE supervisor_id = ?', [supervisor_id]);
            await connection.query('DELETE FROM assignment_comments WHERE supervisor_id = ?', [supervisor_id]);
            await connection.query('DELETE FROM student_feedback WHERE supervisor_id = ?', [supervisor_id]);
            await connection.query('DELETE FROM supervisor_student WHERE supervisor_id = ?', [supervisor_id]);
            await connection.query('DELETE FROM notification_reads WHERE supervisor_id = ?', [supervisor_id]);
            
            await connection.query('UPDATE assignments SET posted_by_supervisor_id = NULL WHERE posted_by_supervisor_id = ?', [supervisor_id]);
            await connection.query('UPDATE events SET supervisor_id = NULL WHERE supervisor_id = ?', [supervisor_id]);
            await connection.query('UPDATE notifications SET supervisor_id = NULL WHERE supervisor_id = ?', [supervisor_id]);

            await connection.query('DELETE FROM supervisors WHERE supervisor_id = ?', [supervisor_id]);
        }

        console.log(`Deleting session records for account ID: ${targetAccountId}`);
        await connection.query('DELETE FROM login_sessions WHERE account_id = ?', [targetAccountId]);
        await connection.query('DELETE FROM blocked_sessions WHERE account_id = ?', [targetAccountId]);

        console.log(`Deleting account record for ID: ${targetAccountId}`);
        const [deleteResult] = await connection.query('DELETE FROM accounts WHERE account_id = ?', [targetAccountId]);

        if (deleteResult.affectedRows === 0) {
            const [stillExistsCheck] = await connection.query('SELECT account_id FROM accounts WHERE account_id = ?', [targetAccountId]);
            if (stillExistsCheck.length > 0) {
                throw new Error(`Failed to delete account ${targetAccountId}, but it still exists.`);
            } else {
                console.log(`Account ${targetAccountId} was already deleted, likely by a cascade.`);
            }
        } else {
            console.log(`Successfully deleted account ${targetAccountId} explicitly.`);
        }

        await connection.commit();
        connection.release();

        console.log(`Admin ${req.user.email} DELETED user account ${targetAccountId} (Email: ${email}, Role: ${role})`);
        res.json({ success: true, message: 'Обліковий запис та пов\'язані дані успішно видалено.' });

    } catch (error) {
        if (connection) { await connection.rollback(); connection.release(); }
        console.error(`Admin Error deleting account ${accountId}:`, error); //
        if (error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ success: false, error: 'Неможливо видалити: Запис використовується в інших частинах системи. Можливо, потрібно спочатку видалити або перепризначити залежні елементи (напр., завдання, коментарі, події, сповіщення, пов\'язані з цим користувачем).' });
        }
        res.status(500).json({ success: false, error: 'Помилка сервера при видаленні облікового запису.' });
    }
});

router.get('/users/:accountId/details', async (req, res) => {
    const { accountId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const [account] = await connection.query('SELECT * FROM accounts WHERE account_id = ?', [accountId]);

        if (account.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, error: 'Обліковий запис не знайдено.' });
        }

        const accData = account[0];
        let profileData = null;

        if (accData.role === 'student' && accData.student_id) {
            const [studentProfile] = await connection.query('SELECT * FROM students WHERE student_id = ?', [accData.student_id]);
            if (studentProfile.length > 0) profileData = studentProfile[0];
        } else if ((accData.role === 'supervisor' || accData.role === 'admin') && accData.supervisor_id) {
            const [supervisorProfile] = await connection.query('SELECT * FROM supervisors WHERE supervisor_id = ?', [accData.supervisor_id]);
            if (supervisorProfile.length > 0) profileData = supervisorProfile[0];
        }
        connection.release();
        res.json({ success: true, account: accData, profile: profileData });

    } catch (error) {
        if (connection) connection.release();
        console.error(`Admin Error fetching details for account ${accountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні деталей користувача.' });
    }
});

router.put('/users/:accountId/details', async (req, res) => {
    const { accountId } = req.params;
    const updates = req.body;
    // Получаем оригинальные данные, переданные с фронтенда для проверок
    const { role, student_id, supervisor_id, email: currentEmail } = updates.originalAccountData || {};
    const newEmail = updates['edit-email'];
    const isActive = updates['edit-status'];

    if (!role) {
         return res.status(400).json({ success: false, error: 'Відсутня роль користувача для оновлення.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let profileUpdateQuery = '';
        let profileParams = [];
        const accountUpdateFields = [];
        const accountUpdateParams = [];

        // Обновление статуса аккаунта
        if (typeof isActive !== 'undefined') {
            const newStatus = (isActive === '1' || isActive === 1 || isActive === true) ? 1 : 0;
            if (!(parseInt(accountId, 10) === req.user.accountId && newStatus === 0)) { // Предотвращение самодеактивации
                accountUpdateFields.push('is_active = ?');
                accountUpdateParams.push(newStatus);
            } else {
                 console.warn(`Admin ${req.user.email} attempted self-deactivation (Account ID: ${accountId}) - ignored.`);
            }
        }

        // Обновление email (с проверкой на дубликат)
        if (newEmail && newEmail !== currentEmail) {
            if (await checkEmailExists(connection, newEmail, accountId)) {
                await connection.rollback(); connection.release();
                return res.status(409).json({ success: false, errors: { 'edit-email': 'Цей email вже використовується іншим акаунтом.' } });
            }
            accountUpdateFields.push('email = ?');
            accountUpdateParams.push(newEmail);
            // Потребуется обновить email и в таблице профиля (students/supervisors)
        }

        // Обновление данных профиля в зависимости от роли
        if (role === 'student' && student_id) {
            const studentFieldsToUpdate = {};
            if (updates['edit-fullName']) studentFieldsToUpdate.full_name = updates['edit-fullName'];
            if (updates['edit-studentcardnumber']) studentFieldsToUpdate.student_card_number = updates['edit-studentcardnumber'];
            if (updates['edit-department']) studentFieldsToUpdate.department = updates['edit-department']; // Имя поля из формы
            if (updates['edit-phone']) studentFieldsToUpdate.phone = updates['edit-phone']; // Имя поля из формы
            if (updates['edit-studygroupid']) studentFieldsToUpdate.study_group_id = updates['edit-studygroupid'];
            if (updates['edit-supervisorid']) studentFieldsToUpdate.supervisor_id = updates['edit-supervisorid']; // Имя поля из формы
            if (newEmail && newEmail !== currentEmail) studentFieldsToUpdate.email = newEmail; // Обновляем email и здесь

             if (Object.keys(studentFieldsToUpdate).length > 0) {
                 const setClauses = Object.keys(studentFieldsToUpdate).map(key => `${key} = ?`).join(', ');
                 profileParams = [...Object.values(studentFieldsToUpdate), student_id];
                 profileUpdateQuery = `UPDATE students SET ${setClauses} WHERE student_id = ?`;

                 // Обновляем связь с группой, если она изменилась
                 if (studentFieldsToUpdate.study_group_id) {
                      await connection.query('DELETE FROM group_students WHERE student_id = ?', [student_id]);
                      await connection.query('INSERT INTO group_students (group_id, student_id) VALUES (?, ?)', [studentFieldsToUpdate.study_group_id, student_id]);
                 }
            }
        } else if ((role === 'supervisor' || role === 'admin') && supervisor_id) {
             const supervisorFieldsToUpdate = {};
             if (updates['edit-fullName']) supervisorFieldsToUpdate.full_name = updates['edit-fullName'];
             if (updates['edit-department']) supervisorFieldsToUpdate.department = updates['edit-department']; // Имя поля из формы
             if (updates['edit-phone']) supervisorFieldsToUpdate.phone = updates['edit-phone']; // Имя поля из формы
             if (updates['edit-position']) supervisorFieldsToUpdate.position = updates['edit-position'];
             if (updates['edit-teacherstatus']) supervisorFieldsToUpdate.teacher_status = updates['edit-teacherstatus'];
             if (updates['edit-specialization']) supervisorFieldsToUpdate.specialization = updates['edit-specialization'];
             if (newEmail && newEmail !== currentEmail) supervisorFieldsToUpdate.email = newEmail; // Обновляем email и здесь

              if (Object.keys(supervisorFieldsToUpdate).length > 0) {
                  const setClauses = Object.keys(supervisorFieldsToUpdate).map(key => `${key} = ?`).join(', ');
                  profileParams = [...Object.values(supervisorFieldsToUpdate), supervisor_id];
                  profileUpdateQuery = `UPDATE supervisors SET ${setClauses} WHERE supervisor_id = ?`;
              }
        }

         // Обновление связи админа с преподавателем (если админ и поле было в форме)
        if (role === 'admin') {
             const newSupervisorLinkStr = updates['edit-supervisorid']; // Имя поля из формы
             if (typeof newSupervisorLinkStr !== 'undefined') { // Если поле было передано
                 const newSupervisorLink = newSupervisorLinkStr ? parseInt(newSupervisorLinkStr, 10) : null;
                 // Проверяем, нужно ли обновлять supervisor_id в таблице accounts
                 const [currentAdminAccount] = await connection.query('SELECT supervisor_id FROM accounts WHERE account_id = ?', [accountId]);
                 if (currentAdminAccount.length > 0 && currentAdminAccount[0].supervisor_id !== newSupervisorLink) {
                     accountUpdateFields.push('supervisor_id = ?');
                     accountUpdateParams.push(newSupervisorLink);
                 }
             }
         }

        // Выполнение запросов на обновление
        if (profileUpdateQuery) {
            await connection.query(profileUpdateQuery, profileParams);
        }
        if (accountUpdateFields.length > 0) {
            const accountQuery = `UPDATE accounts SET ${accountUpdateFields.join(', ')} WHERE account_id = ?`;
            accountUpdateParams.push(accountId);
            const [accountUpdateResult] = await connection.query(accountQuery, accountUpdateParams);
            if (accountUpdateResult.affectedRows === 0) {
                await connection.rollback(); connection.release();
                return res.status(404).json({ success: false, error: 'Не вдалося оновити обліковий запис (не знайдено).' });
            }
        }

        await connection.commit();
        connection.release();

        console.log(`Admin ${req.user.email} updated details for account ${accountId}`);
        res.json({ success: true, message: 'Дані користувача успішно оновлено.' });

    } catch (error) {
        if (connection) { await connection.rollback(); connection.release(); }
        console.error(`Admin Error updating details for account ${accountId}:`, error);
         if (error.code === 'ER_DUP_ENTRY') {
             return res.status(409).json({ success: false, errors: { 'edit-email': 'Цей email вже використовується іншим акаунтом.' } });
         }
        res.status(500).json({ success: false, error: 'Помилка сервера при оновленні даних користувача.' });
    }
});

// --- Маршруты для получения вспомогательных данных (группы, преподаватели) ---
router.get('/data/studygroups', async (req, res) => {
    try {
        const [groups] = await db.query('SELECT study_group_id, group_name FROM study_groups ORDER BY group_name');
        res.json({ success: true, data: groups });
    } catch (error) {
        console.error('Admin Error fetching study groups:', error);
        res.status(500).json({ success: false, error: 'Помилка завантаження груп.' });
    }
});

router.get('/data/supervisors', async (req, res) => {
    try {
        const [supervisors] = await db.query('SELECT supervisor_id, full_name FROM supervisors ORDER BY full_name');
        res.json({ success: true, data: supervisors });
    } catch (error) {
        console.error('Admin Error fetching supervisors:', error);
        res.status(500).json({ success: false, error: 'Помилка завантаження керівників.' });
    }
});



module.exports = router;


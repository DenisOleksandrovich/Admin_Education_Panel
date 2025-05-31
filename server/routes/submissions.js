const express = require('express');
const router = express.Router();
const db = require('../db');
const upload = require('../multer-config');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

router.use((req, res, next) => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (err) {
      console.error("Error creating uploads directory:", err);
    }
  }
  next();
});

router.get('/students/:accountId', authenticateToken, async (req, res) => {
  const accountId = parseInt(req.params.accountId, 10);
  if (isNaN(accountId)) {
    return res.status(400).json({ success: false, error: 'Недійсний ID облікового запису.' });
  }
  try {
    const [accounts] = await db.query(
      `SELECT student_id FROM accounts WHERE account_id = ?`,
      [accountId]
    );
    if (accounts.length === 0) {
      return res.status(404).json({ success: false, error: 'Обліковий запис не знайдено' });
    }
    const studentId = accounts[0].student_id;
    if (!studentId) {
      return res.status(404).json({ success: false, error: 'Цей обліковий запис не пов\'язаний зі студентом' });
    }
    const [students] = await db.query(
      `SELECT student_id, full_name, email, student_card_number, department, study_group_id, phone, supervisor_id, total_progress, diploma_id
       FROM students WHERE student_id = ?`,
      [studentId]
    );
    if (students.length === 0) {
      return res.status(404).json({ success: false, error: 'Дані студента не знайдено' });
    }
    res.json({ success: true, student: students[0] });
  } catch (error) {
    console.error('Error fetching student data by account ID:', error);
    res.status(500).json({ success: false, error: 'Не вдалося отримати дані студента' });
  }
});

router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const { assignmentId, studentId } = req.query;
    let query = `
      SELECT 
        s.*, 
        a.title as assignment_title, 
        st.full_name as student_name, 
        sg.group_name,
        (SELECT sv.file_name FROM submission_versions sv WHERE sv.submission_id = s.submission_id ORDER BY sv.major_version DESC, sv.minor_version DESC LIMIT 1) as latest_content,
        (SELECT GROUP_CONCAT(CONCAT_WS('.', sv.major_version, sv.minor_version) ORDER BY sv.major_version DESC, sv.minor_version DESC SEPARATOR ', ') FROM submission_versions sv WHERE sv.submission_id = s.submission_id) as version_history_display,
        (SELECT CONCAT_WS('.', MAX(sv.major_version), MAX(CASE WHEN sv.major_version = (SELECT MAX(major_version) FROM submission_versions sv_inner WHERE sv_inner.submission_id = s.submission_id) THEN sv.minor_version ELSE 0 END)) 
          FROM submission_versions sv WHERE sv.submission_id = s.submission_id) as current_version_number_display
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      JOIN students st ON s.student_id = st.student_id
      LEFT JOIN study_groups sg ON st.study_group_id = sg.study_group_id
    `;
    const params = [];
    const conditions = [];

    if (assignmentId) {
      conditions.push("s.assignment_id = ?");
      params.push(assignmentId);
    }
    if (studentId) {
      conditions.push("s.student_id = ?");
      params.push(studentId);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY s.upload_time DESC";

    const [submissions] = await db.query(query, params);
    
    const enrichedSubmissions = await Promise.all(submissions.map(async (sub) => {
        const [versions] = await db.query(
            `SELECT version_id, submission_id, file_name, upload_time, major_version, minor_version 
             FROM submission_versions 
             WHERE submission_id = ? 
             ORDER BY major_version DESC, minor_version DESC`,
            [sub.submission_id]
        );
        return { ...sub, versions: versions, file_name: sub.latest_content };
    }));

    res.json(enrichedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Не вдалося отримати здані роботи', details: error.message });
  }
});

router.get('/submissions/:id/versions', authenticateToken, async (req, res) => {
    const submissionId = parseInt(req.params.id, 10);
    if (isNaN(submissionId)) {
        return res.status(400).json({ error: 'Недійсний ID роботи для версій' });
    }

    try {
        console.log('Request Protocol:', req.protocol);
        console.log("Request Host:", req.get('host'));

        const [versionsFromDb] = await db.query(
            `SELECT 
               sv.version_id, 
               sv.submission_id, 
               sv.file_name, 
               sv.upload_time, 
               sv.major_version, 
               sv.minor_version
             FROM submission_versions sv
             WHERE sv.submission_id = ?
             ORDER BY sv.major_version DESC, sv.minor_version DESC`,
            [submissionId]
        );

        const versionsWithUrls = versionsFromDb.map(v => {
            let fileUrl = null;
            if (v.file_name) {
                const isLikelyUrl = /^(https?|ftp):\/\//i.test(v.file_name);
                if (isLikelyUrl) {
                    fileUrl = v.file_name;
                } else {
                    fileUrl = `${req.protocol}://${req.get('host')}/api/submissions/file/version/${v.version_id}`;
                }
            }
            return {
                version_id: v.version_id,
                submission_id: v.submission_id,
                file_name: v.file_name,
                upload_time: v.upload_time,
                major_version: v.major_version,
                minor_version: v.minor_version,
                file_url: fileUrl
            };
        });

        res.json({ versions: versionsWithUrls });

    } catch (error) {
        console.error(`Помилка отримання версій для роботи ID ${submissionId} (GET /submissions/:id/versions в submissions.js):`, error);
        res.status(500).json({
            error: 'Не вдалося отримати версії роботи (серверна помилка в submissions.js)',
            details: error.sqlMessage || error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

router.post('/submissions', authenticateToken, upload.single('submissionFile'), async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const { assignmentId, studentId, submissionLink, adminUpload, adminUserId } = req.body;
    let submissionContent = null; 

    let actualStudentId = studentId;
    if (adminUpload === 'true' && req.user.role === 'admin' && adminUserId) {
        actualStudentId = null; 
    } else if (!studentId || isNaN(parseInt(studentId, 10))) {
        if(connection) await connection.rollback();
        if(connection) connection.release();
        return res.status(400).json({ error: 'Потрібно вказати дійсний ID студента' });
    }

    const parsedAssignmentId = parseInt(assignmentId, 10);
    if (isNaN(parsedAssignmentId)) {
      if(connection) await connection.rollback();
      if(connection) connection.release();
      return res.status(400).json({ error: 'Потрібно вказати дійсний ID завдання' });
    }

    if (req.file) {
      submissionContent = req.file.filename; 
    } else if (submissionLink && submissionLink.trim() !== '') {
      submissionContent = submissionLink.trim(); 
    } else {
      if(connection) await connection.rollback();
      if(connection) connection.release();
      return res.status(400).json({ error: 'Потрібно завантажити файл (submissionFile) або надати посилання (submissionLink)' });
    }
    
    if (actualStudentId) { 
        const [existing] = await connection.query(
          'SELECT submission_id FROM submissions WHERE assignment_id = ? AND student_id = ?',
          [parsedAssignmentId, actualStudentId]
        );
        if (existing.length > 0) {
          if(connection) await connection.rollback();
          if(connection) connection.release();
          return res.status(409).json({
            error: 'Робота для цього завдання та студента вже існує. Використовуйте PUT для оновлення.',
            submission_id: existing[0].submission_id 
          });
        }
    }

    const [assignmentDetails] = await connection.query('SELECT deadline FROM assignments WHERE assignment_id = ?', [parsedAssignmentId]);
    if (assignmentDetails.length === 0) {
        if(connection) await connection.rollback();
        if(connection) connection.release();
        return res.status(404).json({ error: 'Завдання не знайдено.' });
    }
    const assignmentDeadline = new Date(assignmentDetails[0].deadline);
    const now = new Date();
    let currentStatus = 'На перевірці';
    if (now > assignmentDeadline) {
        currentStatus = 'Пізня здача';
    }

    const [submissionResult] = await connection.query(
      `INSERT INTO submissions (assignment_id, student_id, file_name, status, upload_time) 
       VALUES (?, ?, ?, ?, NOW())`,
      [parsedAssignmentId, actualStudentId, submissionContent, currentStatus]
    );
    const submissionId = submissionResult.insertId;

    const [versionResult] = await connection.query(
      `INSERT INTO submission_versions (submission_id, file_name, major_version, minor_version, upload_time)
       VALUES (?, ?, 1, 0, NOW())`,
      [submissionId, submissionContent]
    );
    const newVersionId = versionResult.insertId;

    await connection.commit();
    res.status(201).json({
      message: 'Роботу успішно створено',
      submission_id: submissionId,
      version_id: newVersionId,
      major_version: 1,
      minor_version: 0,
      content: submissionContent, 
      newStatus: currentStatus,
      file_url: req.file ? `/api/submissions/file/version/${newVersionId}` : (submissionLink || null)
    });

  } catch (error) {
    if(connection) await connection.rollback();
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Помилка видалення завантаженого файлу після помилки БД:", err);
      });
    }
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Не вдалося створити здану роботу', details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.put('/submissions/:id', authenticateToken, upload.single('submissionFile'), async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const submissionId = parseInt(req.params.id, 10);
    const { submissionLink, isEditMode, isResubmissionAfterReturn, isLateSubmissionByDeadline } = req.body;
    
    const userRole = req.user.role;
    const userAccountId = req.user.accountId; 
    let actualCurrentUserStudentId;

    if (userRole === 'student') {
        if (!userAccountId) {
            await connection.rollback();
            connection.release();
            return res.status(401).json({ error: 'Не вдалося визначити ID облікового запису користувача для перевірки прав.' });
        }
        
        const [accountLinkRows] = await connection.query('SELECT student_id FROM accounts WHERE account_id = ?', [userAccountId]);
        
        if (accountLinkRows.length === 0 || !accountLinkRows[0].student_id) {
            await connection.rollback();
            connection.release();
            return res.status(403).json({ error: 'Ваш обліковий запис не пов\'язаний з профілем студента, або student_id відсутній.' });
        }
        actualCurrentUserStudentId = accountLinkRows[0].student_id;
    }

    let newSubmissionContent = null; 

    if (isNaN(submissionId)) {
      await connection.rollback();
      connection.release();
      return res.status(400).json({ error: 'Недійсний ID зданої роботи' });
    }
    
    const [existingSubmissionArray] = await connection.query(
      'SELECT s.*, a.deadline as assignment_deadline FROM submissions s JOIN assignments a ON s.assignment_id = a.assignment_id WHERE s.submission_id = ?',
      [submissionId]
    );

    if (existingSubmissionArray.length === 0) {
      await connection.rollback();
      connection.release();
      if (req.file && req.file.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Здану роботу не знайдено' });
    }
    const existingSubmission = existingSubmissionArray[0];

    if (userRole === 'student' && String(existingSubmission.student_id) !== String(actualCurrentUserStudentId)) {
        await connection.rollback();
        connection.release();
        if (req.file && req.file.path) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Ви можете оновлювати тільки власні роботи.' });
    }
    
    const [lastVersionRecArray] = await connection.query(
      `SELECT version_id, file_name, major_version, minor_version 
       FROM submission_versions 
       WHERE submission_id = ? 
       ORDER BY major_version DESC, minor_version DESC 
       LIMIT 1`,
      [submissionId]
    );
    const lastVersion = lastVersionRecArray[0]; 

    if (req.file) {
      newSubmissionContent = req.file.filename;
    } else if (submissionLink && submissionLink.trim() !== '') {
      newSubmissionContent = submissionLink.trim();
    } else if (JSON.parse(isEditMode === 'true') && lastVersion && lastVersion.file_name) {
        newSubmissionContent = lastVersion.file_name;
    } else {
        await connection.rollback();
        connection.release();
        if (req.file && req.file.path) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Для оновлення потрібно завантажити новий файл або надати нове посилання.' });
    }

    const assignmentDeadline = new Date(existingSubmission.assignment_deadline);
    const submissionUploadedDate = new Date(existingSubmission.upload_time); 
    const now = new Date();
    const isAssignmentOverdueByDeadline = now > assignmentDeadline;
    
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const timeSinceLastPhysicalUpload = now.getTime() - submissionUploadedDate.getTime(); 
    const isWithin7DaysOfLastUpload = timeSinceLastPhysicalUpload <= sevenDaysInMs;

    let newMajorVersion = lastVersion ? lastVersion.major_version : 1;
    let newMinorVersion = lastVersion ? lastVersion.minor_version : 0;
    let finalSubmissionStatus = existingSubmission.status;

    const editModeFlag = JSON.parse(isEditMode === 'true'); 
    const resubmissionAfterReturnFlag = JSON.parse(isResubmissionAfterReturn === 'true');
    const lateSubmissionByDeadlineFlag = JSON.parse(isLateSubmissionByDeadline === 'true');

    if (userRole === 'student') {
        const isCurrentStatusGradedOrRejected = ['прийнято', 'зараховано', 'відхилено', 'перевірено'].includes(existingSubmission.status?.toLowerCase());

        if (isCurrentStatusGradedOrRejected && !resubmissionAfterReturnFlag) {
            if(connection) { await connection.rollback(); connection.release(); }
            if (req.file && req.file.path) fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Робота вже перевірена або відхилена, оновлення неможливе без повернення на доопрацювання.' });
        }
        
        if (editModeFlag && isWithin7DaysOfLastUpload && !isAssignmentOverdueByDeadline && !isCurrentStatusGradedOrRejected) {
            newMinorVersion = (lastVersion ? lastVersion.minor_version : -1) + 1; 
            newMajorVersion = lastVersion ? lastVersion.major_version : 1; 
            finalSubmissionStatus = isAssignmentOverdueByDeadline ? 'Пізня здача' : 'На перевірці';
        } else if (resubmissionAfterReturnFlag || existingSubmission.status?.toLowerCase() === 'потребує доопрацювання') {
            newMajorVersion = (lastVersion ? lastVersion.major_version : 0) + 1; 
            newMinorVersion = 0; 
            finalSubmissionStatus = isAssignmentOverdueByDeadline ? 'Пізня здача' : 'На перевірці';
        } else if (lateSubmissionByDeadlineFlag && !editModeFlag && !resubmissionAfterReturnFlag) { 
            newMajorVersion = (lastVersion ? lastVersion.major_version : 0) + 1;
            newMinorVersion = 0;
            finalSubmissionStatus = 'Пізня здача';
        } else if (!isAssignmentOverdueByDeadline && !editModeFlag && !resubmissionAfterReturnFlag && !isCurrentStatusGradedOrRejected) { 
             newMajorVersion = (lastVersion ? lastVersion.major_version : 0) + 1;
             newMinorVersion = 0;
             finalSubmissionStatus = 'На перевірці';
        } else if (editModeFlag && (!isWithin7DaysOfLastUpload || isAssignmentOverdueByDeadline)) {
             if(connection) { await connection.rollback(); connection.release(); }
             if (req.file && req.file.path) fs.unlinkSync(req.file.path);
             return res.status(403).json({ error: 'Редагування поточної версії можливе лише протягом 7 днів після її здачі та до завершення дедлайну завдання. Ви можете здати роботу як нову версію.' });
        }
        else {
             if(connection) { await connection.rollback(); connection.release(); }
             if (req.file && req.file.path) fs.unlinkSync(req.file.path);
             return res.status(400).json({ error: 'Не вдалося визначити логіку оновлення версії для студента.' });
        }
    } else if (userRole === 'supervisor' || userRole === 'admin') {
        if (lastVersion) {
            newMajorVersion = lastVersion.major_version;
            newMinorVersion = lastVersion.minor_version +1; 
        } else {
            newMajorVersion = 1;
            newMinorVersion = 0;
        }
        finalSubmissionStatus = existingSubmission.status; 
    }

    await connection.query(
      `UPDATE submissions SET status = ?, upload_time = NOW(), file_name = ? 
       WHERE submission_id = ?`,
      [finalSubmissionStatus, newSubmissionContent, submissionId] 
    );
    
    const [newVersionInsertResult] = await connection.query(
      `INSERT INTO submission_versions (submission_id, file_name, major_version, minor_version, upload_time)
       VALUES (?, ?, ?, ?, NOW())`,
      [submissionId, newSubmissionContent, newMajorVersion, newMinorVersion]
    );
    const newVersionId = newVersionInsertResult.insertId;

    await connection.commit();
    res.status(200).json({
      message: 'Роботу успішно оновлено',
      submission_id: submissionId,
      version_id: newVersionId,
      major_version: newMajorVersion,
      minor_version: newMinorVersion,
      content: newSubmissionContent, 
      newStatus: finalSubmissionStatus,
      file_url: req.file ? `/api/submissions/file/version/${newVersionId}` : (newSubmissionContent && /^(https?|ftp):\/\//i.test(newSubmissionContent) ? newSubmissionContent : null)
    });

  } catch (error) {
    if(connection) await connection.rollback();
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Помилка видалення завантаженого файлу після помилки БД:", err);
      });
    }
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Не вдалося оновити здану роботу', details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/api/submissions/file/version/:versionId', authenticateToken, async (req, res) => {
    const versionId = parseInt(req.params.versionId, 10);
    try {
        const [versionDetails] = await db.query(
            `SELECT sv.file_name, s.student_id AS submission_owner_student_id, s.assignment_id, a.posted_by_supervisor_id
             FROM submission_versions sv
             JOIN submissions s ON sv.submission_id = s.submission_id
             JOIN assignments a ON s.assignment_id = a.assignment_id
             WHERE sv.version_id = ?`,
            [versionId]
        );

        if (versionDetails.length === 0) {
            return res.status(404).json({ error: 'Файл версії або запис версії не знайдено' });
        }

        const { file_name } = versionDetails[0];

        if (!file_name) {
             return res.status(404).json({ error: 'Контент для цієї версії відсутній.' });
        }
        
        const isUrl = /^(https?|ftp):\/\//i.test(file_name);
        if (isUrl) {
            return res.status(400).json({ error: 'Цей запис є посиланням, а не файлом для завантаження з сервера.' });
        }
        const filePath = path.join(__dirname, '..', 'uploads', file_name);
        if (fs.existsSync(filePath)) {
            res.download(filePath, file_name, (err) => { 
                if (err) {
                    console.error("Помилка відправки файлу:", err);
                    if (!res.headersSent) {
                         res.status(500).json({ error: 'Не вдалося завантажити файл.' });
                    }
                }
            });
        } else {
            return res.status(404).json({ error: 'Файл не знайдено на сервері.' });
        }

    } catch (error) {
        console.error('Error downloading submission file version:', error);
        res.status(500).json({ error: 'Помилка сервера при спробі завантажити файл' });
    }
});

router.put('/submissions/:submissionId/grade', authenticateToken, async (req, res) => {
    const submissionId = parseInt(req.params.submissionId, 10);
    const { grade } = req.body;
    const reviewerAccountId = req.user?.accountId;
    const reviewerRole = req.user?.role;
    const reviewerSupervisorId = req.user?.supervisor_id;

    if (isNaN(submissionId)) {
        return res.status(400).json({ error: 'Недійсний ID зданої роботи' });
    }
    if (grade === undefined || isNaN(parseFloat(grade)) || parseFloat(grade) < 0 || parseFloat(grade) > 100) {
        return res.status(400).json({ error: 'Оцінка повинна бути числом від 0 до 100.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [submissionDetailsArray] = await connection.query(
            `SELECT s.student_id, s.assignment_id, s.status as current_status,
                    a.title AS assignment_title, a.posted_by_supervisor_id
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.assignment_id
             WHERE s.submission_id = ?`,
            [submissionId]
        );

        if (submissionDetailsArray.length === 0) {
            await connection.rollback(); connection.release();
            return res.status(404).json({ error: 'Здану роботу не знайдено.' });
        }
        const submissionInfo = submissionDetailsArray[0];
        const { student_id, assignment_id, assignment_title, posted_by_supervisor_id, current_status } = submissionInfo;

        let canGrade = false;
        if (reviewerRole === 'admin') {
            canGrade = true;
        } else if (reviewerRole === 'supervisor') {
            if (String(posted_by_supervisor_id) === String(reviewerSupervisorId)) {
                canGrade = true;
            } else {
                const [coauthorsCheck] = await connection.query(
                    'SELECT 1 FROM assignment_coauthors WHERE assignment_id = ? AND supervisor_id = ?',
                    [assignment_id, reviewerSupervisorId]
                );
                if (coauthorsCheck.length > 0) canGrade = true;
            }
        }

        if (!canGrade) {
            await connection.rollback(); connection.release();
            return res.status(403).json({ error: 'Ви не маєте прав для оцінювання цієї роботи.' });
        }
        
        let newStatus = current_status;
        if (current_status === 'На перевірці' || current_status === 'Пізня здача' || current_status === 'Потребує доопрацювання') {
            newStatus = parseFloat(grade) >= 60 ? 'Прийнято' : 'Потребує доопрацювання'; 
        }

        await connection.query(
            'UPDATE submissions SET grade = ?, status = ?, grade_time = NOW() WHERE submission_id = ?',
            [parseFloat(grade), newStatus, submissionId]
        );
        
        if (student_id) {
             let reviewerFullName = 'Викладач';
            if (reviewerRole === 'supervisor' && reviewerSupervisorId) {
                const [supervisorData] = await connection.query(`SELECT full_name FROM supervisors WHERE supervisor_id = ?`, [reviewerSupervisorId]);
                if (supervisorData.length > 0 && supervisorData[0].full_name) reviewerFullName = supervisorData[0].full_name;
            } else if (reviewerRole === 'admin' && reviewerAccountId) {
                 const [adminAccountData] = await connection.query(`SELECT email FROM accounts WHERE account_id = ?`, [reviewerAccountId]);
                if (adminAccountData.length > 0 && adminAccountData[0].email) reviewerFullName = adminAccountData[0].email;
                else reviewerFullName = "Адміністрація";
            }
            const notificationTitle = `Вашу роботу "${assignment_title}" оцінено`;
            const notificationMessage = `${reviewerFullName} оцінив(ла) Вашу роботу "${assignment_title}" на ${parseFloat(grade)}/100. Новий статус: ${newStatus}.`;
            await connection.query(
                `INSERT INTO notifications (type, title, message, student_id, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                ['grade', notificationTitle, notificationMessage, student_id]
            );
        }

        await connection.commit();
        res.json({ message: 'Оцінка успішно збережена.', newStatus: newStatus });
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error saving grade:', error);
        res.status(500).json({ error: 'Не вдалося зберегти оцінку.', details: error.message });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/submissions/:id/comments', authenticateToken, async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id, 10);
    if (isNaN(submissionId)) {
      return res.status(400).json({ error: 'Недійсний ID зданої роботи' });
    }
    const [comments] = await db.query(
      `SELECT
        sc.comment_id, sc.submission_id, sc.comment_text, sc.comment_date, sc.account_id,
        COALESCE(s.full_name, sup.full_name, acc.email) as author_name
       FROM submission_comments sc
       LEFT JOIN accounts acc ON sc.account_id = acc.account_id
       LEFT JOIN students s ON acc.student_id = s.student_id
       LEFT JOIN supervisors sup ON acc.supervisor_id = sup.supervisor_id
       WHERE sc.submission_id = ?
       ORDER BY sc.comment_date ASC`,
      [submissionId]
    );
    res.json({comments: comments});
  } catch (error) {
    console.error('Error fetching submission comments:', error);
    res.status(500).json({ error: 'Не вдалося отримати коментарі до зданої роботи' });
  }
});

router.post('/submissions/:id/comments', authenticateToken, async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id, 10);
    const { comment } = req.body;
    const accountId = req.user?.accountId;
    if (isNaN(submissionId)) return res.status(400).json({ error: 'Недійсний ID зданої роботи' });
    if (!comment || comment.trim() === '') return res.status(400).json({ error: 'Текст коментаря є обов\'язковим' });
    if (!accountId) return res.status(401).json({ error: 'Користувач не автентифікований або ID акаунту відсутній' });
    
    const [submissionInfo] = await db.query('SELECT student_id, assignment_id FROM submissions WHERE submission_id = ?', [submissionId]);
    if (submissionInfo.length === 0) return res.status(404).json({ error: 'Здану роботу не знайдено' });
    const {student_id, assignment_id} = submissionInfo[0];

    const [result] = await db.query(
      `INSERT INTO submission_comments (submission_id, comment_text, account_id, comment_date)
       VALUES (?, ?, ?, NOW())`,
      [submissionId, comment.trim(), accountId]
    );
    let authorName = 'Невідомий користувач';
    if (accountId) {
      const [authorData] = await db.query(
        `SELECT COALESCE(s.full_name, sup.full_name, acc.email) as name
         FROM accounts acc
         LEFT JOIN students s ON acc.student_id = s.student_id
         LEFT JOIN supervisors sup ON acc.supervisor_id = sup.supervisor_id
         WHERE acc.account_id = ?`, [accountId]
      );
      if (authorData.length > 0) authorName = authorData[0].name;
    }
    const newComment = {
      comment_id: result.insertId, submission_id: submissionId,
      comment_text: comment.trim(), account_id: accountId,
      comment_date: new Date(), author_name: authorName
    };
    
    const [assignmentDetails] = await db.query('SELECT title, posted_by_supervisor_id FROM assignments WHERE assignment_id = ?', [assignment_id]);
    const assignmentTitle = assignmentDetails[0]?.title || 'Невідоме завдання';
    
    res.status(201).json({ message: 'Коментар успішно додано', comment: newComment });
  } catch (error) {
    console.error('Error adding submission comment:', error);
    res.status(500).json({ error: 'Не вдалося додати коментар' });
  }
});

module.exports = router;
const express = require('express');
const cors = require('cors');
const db = require('./db'); // модуль подключения к БД
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Использование CORS для разрешения запросов с другого порта (например, с фронтенда на порту 8000)
app.use(cors({
  origin: 'http://localhost:8000', // ваш фронтенд
}));

app.use(express.json());





const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    
    // Создаем директорию, если она не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Используем временную метку для обеспечения уникальности имен файлов
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // ограничение размера файла 10MB
  }
});





app.get('/api/study-groups', async (req, res) => {
  try {
    const [groups] = await db.query(`SELECT study_group_id, group_name FROM study_groups`);
    res.json(groups);
  } catch (err) {
    console.error('Failed to fetch study groups:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




// =======================
// ЭНДПОИНТЫ ДЛЯ СОБЫТИЙ
// =======================

// 1. Получить список событий за указанный месяц/год
app.get('/api/events', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || (new Date().getMonth() + 1);
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  
  // Получаем последний день месяца через SQL-функцию LAST_DAY
  const endDateQuery = `SELECT LAST_DAY(?) AS lastDay`;
  try {
    const [endResult] = await db.query(endDateQuery, [startDate]);
    if (endResult.length === 0) {
      return res.status(400).json({ error: 'Неверная дата' });
    }
    const lastDay = endResult[0].lastDay;
    
    const sql = `
      SELECT event_id, supervisor_id, event_name, event_date, event_description, venue, event_type, duration
      FROM events
      WHERE event_date BETWEEN ? AND ?
      ORDER BY event_date ASC
    `;
    const [rows] = await db.query(sql, [startDate, lastDay]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});

// 2. Получить событие по id
app.get('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const sql = `SELECT * FROM events WHERE event_id = ?`;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении события' });
  }
});

// 3. Создать новое событие
app.post('/api/events', async (req, res) => {
  const { supervisor_id, event_name, event_date, event_description, venue, event_type, duration } = req.body;
  try {
    const sql = `
      INSERT INTO events (supervisor_id, event_name, event_date, event_description, venue, event_type, duration)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [supervisor_id, event_name, event_date, event_description, venue, event_type, duration]);
    res.status(201).json({ event_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании события' });
  }
});

// 4. Обновить событие по id
app.put('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  const { supervisor_id, event_name, event_date, event_description, venue, event_type, duration } = req.body;
  try {
    const sql = `
      UPDATE events
      SET supervisor_id = ?, event_name = ?, event_date = ?, event_description = ?, venue = ?, event_type = ?, duration = ?
      WHERE event_id = ?
    `;
    const [result] = await db.query(sql, [supervisor_id, event_name, event_date, event_description, venue, event_type, duration, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }
    res.json({ message: 'Событие обновлено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обновлении события' });
  }
});

// 5. Удалить событие по id
app.delete('/api/events/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const sql = `DELETE FROM events WHERE event_id = ?`;
    const [result] = await db.query(sql, [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Событие не найдено' });
    }
    res.json({ message: 'Событие удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при удалении события' });
  }
});





// ============================
// ЭНДПОИНТЫ ДЛЯ СУПЕРВИЗОРОВ
// (с учетом структуры таблицы supervisors)
// ============================

app.get('/api/supervisors', async (req, res) => {
  try {
    const sql = `
      SELECT
        supervisor_id,
        full_name,
        email,
        phone,
        department,
        avatar,
        teacher_status,
        position,
        specialization
      FROM supervisors
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Помилка отримання викладачів:', err);
    res.status(500).json({ error: 'Помилка при отриманні викладачів' });
  }
});

// === Пошук викладача ===
app.get('/api/supervisors/search', async (req, res) => {
  const { q } = req.query;
  try {
    if (!q || q.trim() === '') {
      const [rows] = await db.query(`
        SELECT
          supervisor_id,
          full_name,
          email,
          phone,
          department,
          avatar,
          teacher_status,
          position,
          specialization
        FROM supervisors
      `);
      return res.json(rows);
    }

    const sql = `
      SELECT
        supervisor_id,
        full_name,
        email,
        phone,
        department,
        avatar,
        teacher_status,
        position,
        specialization
      FROM supervisors
      WHERE CONCAT_WS(' ', supervisor_id, full_name, email, phone, department, teacher_status, position, specialization)
        LIKE ?
    `;
    const queryParam = `%${q}%`;
    const [rows] = await db.query(sql, [queryParam]);
    res.json(rows);
  } catch (err) {
    console.error('Помилка пошуку викладача:', err);
    res.status(500).json({ error: 'Помилка при пошуку викладача' });
  }
});





// =======================
// ЕНДПОІНТИ ДЛЯ СТУДЕНТІВ
// (з урахуванням структури таблиці students)
// =======================

app.get('/api/students', async (req, res) => {
  try {
    const sql = `
      SELECT
        s.student_id,
        s.full_name,  -- не перейменовуємо, щоб клієнт використовував student.full_name
        s.email,
        s.student_card_number,
        s.department,
        s.phone,
        s.total_progress,
        s.diploma_id,
        s.study_group_id,
        s.supervisor_id,
        g.group_name,
        g.specialty,
        g.course,
        sp.full_name AS supervisor_name,
        sp.email AS supervisor_email
      FROM students s
      LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
      LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка при отриманні даних студентів' });
  }
});



app.get('/api/students/search', async (req, res) => {
  const { q } = req.query;
  try {
    // Якщо запит порожній – повертаємо всіх студентів
    if (!q || q.trim() === '') {
      const sqlAll = `
        SELECT
          s.student_id,
          s.full_name,
          s.email,
          s.student_card_number,
          s.department,
          s.phone,
          s.total_progress,
          s.diploma_id,
          s.study_group_id,
          s.supervisor_id,
          g.group_name,
          g.specialty,
          g.course,
          sp.full_name AS supervisor_name,
          sp.email AS supervisor_email
        FROM students s
        LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
        LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
      `;
      const [rows] = await db.query(sqlAll);
      return res.json(rows);
    }
    
    const sql = `
      SELECT
        s.student_id,
        s.full_name,
        s.email,
        s.student_card_number,
        s.department,
        s.phone,
        s.total_progress,
        s.diploma_id,
        s.study_group_id,
        s.supervisor_id,
        g.group_name,
        g.specialty,
        g.course,
        sp.full_name AS supervisor_name,
        sp.email AS supervisor_email
      FROM students s
      LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
      LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
      WHERE CONCAT_WS(' ', s.student_id, s.full_name, s.email, s.student_card_number, s.department, s.study_group_id, s.phone, s.supervisor_id, s.total_progress, s.diploma_id) LIKE ?
    `;
    const queryParam = `%${q}%`;
    const [rows] = await db.query(sql, [queryParam]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Помилка при пошуку студента' });
  }
});






app.get('/api/events-by-date', async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || (new Date().getMonth() + 1);
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;

  try {
    // Получаем последний день месяца
    const endDateQuery = `SELECT LAST_DAY(?) AS lastDay`;
    const [endResult] = await db.query(endDateQuery, [startDate]);

    if (endResult.length === 0 || !endResult[0].lastDay) {
      return res.status(400).json({ error: 'Неверная дата' });
    }

    const lastDay = endResult[0].lastDay;

    // Запрос событий с учетом времени
    const sql = `
      SELECT 
          e.event_id, 
          e.supervisor_id, 
          e.event_name, 
          CONVERT_TZ(e.event_date, '+00:00', '+03:00') AS formatted_date, 
          e.event_description, 
          e.venue, 
          e.event_type, 
          e.duration,
          s.full_name AS supervisor_name,
          GROUP_CONCAT(sg.group_name ORDER BY sg.group_name SEPARATOR ', ') AS study_groups
      FROM events e
      LEFT JOIN supervisors s ON e.supervisor_id = s.supervisor_id
      LEFT JOIN event_groups eg ON e.event_id = eg.event_id
      LEFT JOIN study_groups sg ON eg.group_id = sg.study_group_id
      WHERE e.event_date BETWEEN ? AND ?
      GROUP BY e.event_id
      ORDER BY e.event_date ASC;
    `;

    const [rows] = await db.query(sql, [startDate, lastDay]);

    console.log("События из БД:", rows);

    // Создаем объект со всеми днями месяца
    const eventsByDate = {};
    let currentDate = new Date(startDate);
    let lastDate = new Date(lastDay);

    console.log(`Создаем пустые дни в eventsByDate с ${startDate} по ${lastDay}...`);
    while (currentDate <= lastDate) {
      const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
      eventsByDate[dateStr] = [];
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Заполняем объект событиями
    rows.forEach(event => {
      let dateStr;
      
      // Проверяем, является ли event.formatted_date объектом Date
      if (event.formatted_date instanceof Date) {
        dateStr = event.formatted_date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        try {
          dateStr = new Date(event.formatted_date).toISOString().split('T')[0];
        } catch (error) {
          console.error(`Ошибка преобразования даты: ${event.formatted_date}`, error);
          return;
        }
      }

      if (!eventsByDate[dateStr]) {
        console.warn(`Дата ${dateStr} не найдена в eventsByDate, создаем пустой массив.`);
        eventsByDate[dateStr] = [];
      }

      eventsByDate[dateStr].push({
        event_id: event.event_id,
        event_name: event.event_name,
        event_description: event.event_description,
        event_date: event.formatted_date, // Оставляем дату с учетом часового пояса
        venue: event.venue,
        event_type: event.event_type,
        duration: event.duration,
        supervisor: event.supervisor_name || 'Невідомо',
        groups: event.study_groups || 'Всі групи', // Исправлено на study_groups
      });
    });

    console.log("Отправляем события:", eventsByDate);
    res.json(eventsByDate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении данных' });
  }
});





app.get('/api/notifications/:userId', async (req, res) => {
  console.log('>>> NOTIFICATIONS ROUTE HIT:', req.params.userId);

  const userId = parseInt(req.params.userId, 10);

  try {
    // Получаем ID группы студента
    const [groupResult] = await db.query(`
      SELECT group_id FROM group_students WHERE student_id = ?
    `, [userId]);

    const groupId = groupResult.length > 0 ? groupResult[0].group_id : null;

    // Получаем все релевантные уведомления
    const [notifications] = await db.query(`
      SELECT id, type, title, message, created_at
      FROM notifications
      WHERE 
        (user_id = ? OR user_id IS NULL)
        AND (group_id IS NULL OR group_id = ?)
      ORDER BY created_at DESC
    `, [userId, groupId]);

    res.json({ notifications });

  } catch (error) {
    console.error('Ошибка при получении уведомлений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});



app.post('/api/notifications', async (req, res) => {
  try {
    const connection = await db;
    const notificationData = req.body;

    const [result] = await connection.execute(
      `INSERT INTO notifications 
      (user_id, supervisor_id, group_id, type, title, message, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        notificationData.user_id || null,
        notificationData.supervisor_id || null,
        notificationData.group_id || null,
        notificationData.type,
        notificationData.title,
        notificationData.message
      ]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Ошибка при создании уведомления:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера при создании уведомления'
    });
  }
});










// Get assignments with specific status for specific groups with history of changes and comments
app.get('/assignments', async (req, res) => {
  try {
    const query = `
      SELECT 
        a.*, 
        GROUP_CONCAT(DISTINCT sg.group_name SEPARATOR ', ') AS \`groups\`,
        DATEDIFF(a.deadline, CURRENT_TIMESTAMP()) AS days_remaining
      FROM assignments a
      LEFT JOIN assignment_study_group asg ON a.assignment_id = asg.assignment_id
      LEFT JOIN study_groups sg ON asg.study_group_id = sg.study_group_id
      WHERE a.status IN ('Опубліковано', 'Протерміновано')
      GROUP BY a.assignment_id
      ORDER BY a.deadline ASC
    `;

    const [assignments] = await db.query(query);
    const assignmentIds = assignments.map(a => a.assignment_id);

    let changes = {}, comments = {}, documents = {};

    if (assignmentIds.length > 0) {
      // Запит змін
      const [changeLogs] = await db.query(`
        SELECT 
          ac.assignment_id,
          ac.change_date,
          ac.change_description,
          s.full_name AS changed_by_name
        FROM assignment_changes ac
        LEFT JOIN supervisors s ON ac.changed_by = s.supervisor_id
        WHERE ac.assignment_id IN (?)
        ORDER BY ac.change_date DESC
      `, [assignmentIds]);

      changes = changeLogs.reduce((acc, row) => {
        if (!acc[row.assignment_id]) acc[row.assignment_id] = [];
        acc[row.assignment_id].push({
          date: row.change_date,
          description: row.change_description,
          changed_by: row.changed_by_name || 'Невідомо'
        });
        return acc;
      }, {});

      // Запит коментарів
      const [commentRows] = await db.query(`
        SELECT 
          ac.assignment_id,
          ac.comment_date,
          ac.comment_text,
          s.full_name AS student_name,
          sp.full_name AS supervisor_name
        FROM assignment_comments ac
        LEFT JOIN students s ON ac.student_id = s.student_id
        LEFT JOIN supervisors sp ON ac.supervisor_id = sp.supervisor_id
        WHERE ac.assignment_id IN (?)
        ORDER BY ac.comment_date ASC
      `, [assignmentIds]);

      comments = commentRows.reduce((acc, row) => {
        if (!acc[row.assignment_id]) acc[row.assignment_id] = [];
        acc[row.assignment_id].push({
          date: row.comment_date,
          text: row.comment_text,
          author: row.student_name || row.supervisor_name || 'Невідомо'
        });
        return acc;
      }, {});

      // Запит документів
      const [docRows] = await db.query(`
        SELECT assignment_id, document_url
        FROM assignment_documents
        WHERE assignment_id IN (?)
      `, [assignmentIds]);

      documents = docRows.reduce((acc, row) => {
        if (!acc[row.assignment_id]) acc[row.assignment_id] = [];
        acc[row.assignment_id].push(row.document_url);
        return acc;
      }, {});
    }

    const enrichedAssignments = assignments.map(a => ({
      ...a,
      groups: a.groups || '',
      attachments: documents[a.assignment_id] || [],
      changes: changes[a.assignment_id] || [],
      comments: comments[a.assignment_id] || []
    }));

    res.json(enrichedAssignments);
  } catch (error) {
    console.error('Error fetching enriched assignments:', error);
    res.status(500).json({ error: 'Failed to fetch enriched assignments' });
  }
});




// Create new assignment
app.post('/assignments_create', async (req, res) => {
  const { title, description, deadline, attachments, groups, taskType, allowText, allowFile, fileTypes } = req.body;
  const posted_by = 1; // Temporarily hardcoded or from session
  
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    // 1. Insert the main assignment record
    const [assignmentResult] = await connection.query(
      `INSERT INTO assignments 
        (title, description, posted_by, deadline, status, type, allow_text, allow_file, allow_pdf, allow_doc, allow_zip)
       VALUES (?, ?, ?, ?, 'Опубліковано', ?, ?, ?, ?, ?, ?)`, 
      [
        title,
        description,
        posted_by,
        new Date(deadline),
        taskType,
        allowText ? 1 : 0,
        allowFile ? 1 : 0,
        fileTypes.pdf ? 1 : 0,
        fileTypes.doc ? 1 : 0,
        fileTypes.zip ? 1 : 0
      ]
    );
    
    const assignmentId = assignmentResult.insertId;
    
    // 2. Save assigned study groups
    if (groups && groups.length > 0) {
      const groupValues = groups.map(groupId => [assignmentId, parseInt(groupId)]);
      await connection.query(
        `INSERT INTO assignment_study_group (assignment_id, study_group_id) VALUES ?`,
        [groupValues]
      );
    }
    
    // 3. Save document attachments
    if (attachments && attachments.length > 0) {
      const docValues = attachments.map(url => [assignmentId, url]);
      await connection.query(
        `INSERT INTO assignment_documents (assignment_id, document_url) VALUES ?`,
        [docValues]
      );
    }
    
    // 4. Create deadline event
    const [eventResult] = await connection.query(
      `INSERT INTO events 
        (supervisor_id, event_name, event_date, event_description, event_type, duration) 
       VALUES (?, ?, ?, ?, 'Дедлайн', ?)`,
      [
        posted_by,
        `Дедлайн: ${title}`,
        new Date(deadline),
        `Кінцевий термін здачі завдання "${title}"`,
        60 // Default duration of 1 hour
      ]
    );
    
    const eventId = eventResult.insertId;
    
    // 5. Connect event with assignment
    await connection.query(
      `INSERT INTO event_assignments (event_id, assignment_id) VALUES (?, ?)`,
      [eventId, assignmentId]
    );
    
    // 6. Connect event with groups (same groups as the assignment)
    if (groups && groups.length > 0) {
      const eventGroupValues = groups.map(groupId => [eventId, parseInt(groupId)]);
      await connection.query(
        `INSERT INTO event_groups (event_id, group_id) VALUES ?`,
        [eventGroupValues]
      );
    }
    
    // 7. Create initial change record
    await connection.query(
      `INSERT INTO assignment_changes 
        (assignment_id, changed_by, change_description) 
       VALUES (?, ?, ?)`,
      [
        assignmentId,
        posted_by,
        `Створено нове завдання "${title}"`
      ]
    );
    
    // Commit all changes
    await connection.commit();
    
    res.status(201).json({ 
      id: assignmentId, 
      eventId: eventId,
      message: 'Assignment created successfully with deadline event'
    });
    
  } catch (err) {
    // Rollback in case of error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr);
      }
    }
    
    console.error('Error creating assignment:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  } finally {
    // Release connection back to the pool
    if (connection) {
      connection.release();
    }
  }
});








// Get single assignment by ID with all details
app.get('/assignments/:id', async (req, res) => {
  const assignmentId = parseInt(req.params.id, 10);
  if (isNaN(assignmentId)) {
    return res.status(400).json({ error: 'Invalid assignment ID' });
  }

  try {
    // Основне завдання
    const [assignments] = await db.query(`
      SELECT 
        a.*, 
        GROUP_CONCAT(DISTINCT sg.group_name SEPARATOR ', ') AS \`groups\`,
        DATEDIFF(a.deadline, CURRENT_TIMESTAMP()) AS days_remaining
      FROM assignments a
      LEFT JOIN assignment_study_group asg ON a.assignment_id = asg.assignment_id
      LEFT JOIN study_groups sg ON asg.study_group_id = sg.study_group_id
      WHERE a.assignment_id = ?
      GROUP BY a.assignment_id
      LIMIT 1
    `, [assignmentId]);

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const assignment = assignments[0];

    // Зміни
    const [changeLogs] = await db.query(`
      SELECT 
        ac.change_date,
        ac.change_description,
        s.full_name AS changed_by_name
      FROM assignment_changes ac
      LEFT JOIN supervisors s ON ac.changed_by = s.supervisor_id
      WHERE ac.assignment_id = ?
      ORDER BY ac.change_date DESC
    `, [assignmentId]);

    const changes = changeLogs.map(row => ({
      date: row.change_date,
      description: row.change_description,
      changed_by: row.changed_by_name || 'Невідомо'
    }));

    // Коментарі
    const [commentRows] = await db.query(`
      SELECT 
        ac.comment_date,
        ac.comment_text,
        s.full_name AS student_name,
        sp.full_name AS supervisor_name
      FROM assignment_comments ac
      LEFT JOIN students s ON ac.student_id = s.student_id
      LEFT JOIN supervisors sp ON ac.supervisor_id = sp.supervisor_id
      WHERE ac.assignment_id = ?
      ORDER BY ac.comment_date ASC
    `, [assignmentId]);

    const comments = commentRows.map(row => ({
      date: row.comment_date,
      text: row.comment_text,
      author: row.student_name || row.supervisor_name || 'Невідомо'
    }));

    // Документи
    const [docRows] = await db.query(`
      SELECT document_url
      FROM assignment_documents
      WHERE assignment_id = ?
    `, [assignmentId]);

    const attachments = docRows.map(row => row.document_url);

    // Формування відповіді
    const enrichedAssignment = {
      ...assignment,
      groups: assignment.groups || '',
      attachments,
      changes,
      comments
    };

    res.json(enrichedAssignment);
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ error: 'Failed to fetch assignment details' });
  }
});





// Add comment to an assignment
app.post('/assignments/:id/comments', async (req, res) => {
  const assignmentId = parseInt(req.params.id, 10);
  const { comment } = req.body;
  
  // Validate input
  if (isNaN(assignmentId)) {
    return res.status(400).json({ error: 'Invalid assignment ID' });
  }
  
  if (!comment || comment.trim() === '') {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  
  try {
    // Check if assignment exists
    const [assignments] = await db.query(
      'SELECT assignment_id FROM assignments WHERE assignment_id = ?', 
      [assignmentId]
    );
    
    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // We're adding comments as a student with ID 1 (hardcoded for now)
    const studentId = 1;
    
    // Insert the comment
    const [result] = await db.query(
      `INSERT INTO assignment_comments 
       (assignment_id, comment_text, student_id) 
       VALUES (?, ?, ?)`,
      [assignmentId, comment, studentId]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('Failed to add comment');
    }
    
    // Get the newly created comment with author info
    const [commentRows] = await db.query(
      `SELECT 
        ac.comment_id,
        ac.comment_text,
        ac.comment_date,
        s.full_name AS author
       FROM assignment_comments ac
       LEFT JOIN students s ON ac.student_id = s.student_id
       WHERE ac.comment_id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      comment: commentRows[0]
    });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});









// Статический путь для доступа к файлам
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// GET запрос для получения списка всех отправлений
app.get('/submissions', async (req, res) => {
  try {
    const { assignmentId, studentId } = req.query;
    let query = `
      SELECT s.*, 
             a.title as assignment_title, 
             CONCAT(st.last_name, ' ', st.first_name) as student_name
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      JOIN students st ON s.student_id = st.student_id
    `;
    
    const params = [];
    
    // Добавляем условия фильтрации, если они есть
    if (assignmentId || studentId) {
      query += " WHERE ";
      
      if (assignmentId) {
        query += "s.assignment_id = ?";
        params.push(assignmentId);
        
        if (studentId) {
          query += " AND s.student_id = ?";
          params.push(studentId);
        }
      } else if (studentId) {
        query += "s.student_id = ?";
        params.push(studentId);
      }
    }
    
    // Сортируем по времени загрузки (новые сначала)
    query += " ORDER BY s.upload_time DESC";
    
    const [submissions] = await db.query(query, params);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});


// GET request for getting all submissions
app.get('/submissions', async (req, res) => {
  try {
    const { assignmentId, studentId } = req.query;
    let query = `
      SELECT s.*, 
             a.title as assignment_title, 
             st.full_name as student_name
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      JOIN students st ON s.student_id = st.student_id
    `;
    
    const params = [];
    
    // Add filtering conditions if they exist
    if (assignmentId || studentId) {
      query += " WHERE ";
      
      if (assignmentId) {
        query += "s.assignment_id = ?";
        params.push(assignmentId);
        
        if (studentId) {
          query += " AND s.student_id = ?";
          params.push(studentId);
        }
      } else if (studentId) {
        query += "s.student_id = ?";
        params.push(studentId);
      }
    }
    
    // Sort by upload time (newest first)
    query += " ORDER BY s.upload_time DESC";
    
    const [submissions] = await db.query(query, params);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// GET request for getting a specific submission by ID
app.get('/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const [submissions] = await db.query(
      `SELECT s.*, 
              a.title as assignment_title, 
              st.full_name as student_name
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       JOIN students st ON s.student_id = st.student_id
       WHERE s.submission_id = ?`,
      [submissionId]
    );
    
    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(submissions[0]);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// GET endpoint for getting student details by ID (handling full_name)
app.get('/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const [students] = await db.query(
      `SELECT student_id, full_name, email
       FROM students 
       WHERE student_id = ?`,
      [studentId]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Handle the full_name format appropriately
    const fullNameParts = students[0].full_name.split(' ');
    const student = {
      student_id: students[0].student_id,
      email: students[0].email,
      full_name: students[0].full_name,
      // Assuming first part is last name (Ukrainian/Russian naming convention)
      last_name: fullNameParts[0] || '',
      first_name: fullNameParts.slice(1).join(' ') || ''
    };
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});



// GET запрос для получения статистики по отправлениям для преподавателя
app.get('/submissions/stats/assignments/:assignmentId', async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    
    // Получаем статистику по отправлениям для конкретного задания
    const [stats] = await db.query(
      `SELECT 
         COUNT(*) as total_submissions,
         SUM(CASE WHEN status = 'На перевірці' THEN 1 ELSE 0 END) as pending_count,
         SUM(CASE WHEN status = 'Прийнято' THEN 1 ELSE 0 END) as accepted_count,
         SUM(CASE WHEN status = 'Протерміновано' THEN 1 ELSE 0 END) as overdue_count,
         ROUND(AVG(grade), 1) as average_grade
       FROM submissions
       WHERE assignment_id = ?`,
      [assignmentId]
    );
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({ error: 'Failed to fetch submission statistics' });
  }
});


// Adding this route just in case it's needed elsewhere in your application
app.get('/study-groups/:id', async (req, res) => {
  try {
    const groupId = req.params.id;
    const [groups] = await db.query(
      `SELECT * FROM study_groups WHERE study_group_id = ?`,
      [groupId]
    );
    
    if (groups.length === 0) {
      return res.status(404).json({ error: 'Study group not found' });
    }
    
    res.json(groups[0]);
  } catch (error) {
    console.error('Error fetching study group:', error);
    res.status(500).json({ error: 'Failed to fetch study group' });
  }
});


// GET запрос для получения конкретного отправления по ID
app.get('/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const [submissions] = await db.query(
      `SELECT s.*, 
              a.title as assignment_title, 
              CONCAT(st.last_name, ' ', st.first_name) as student_name
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       JOIN students st ON s.student_id = st.student_id
       WHERE s.submission_id = ?`,
      [submissionId]
    );
    
    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(submissions[0]);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// GET запрос для получения версий отправления
app.get('/submissions/:id/versions', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const [versions] = await db.query(
      `SELECT * FROM submission_versions
       WHERE submission_id = ?
       ORDER BY version_number DESC`,
      [submissionId]
    );
    
    res.json(versions);
  } catch (error) {
    console.error('Error fetching submission versions:', error);
    res.status(500).json({ error: 'Failed to fetch submission versions' });
  }
});

// GET запрос для получения комментариев к отправлению
app.get('/submissions/:id/comments', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const [comments] = await db.query(
      `SELECT * FROM submission_comments
       WHERE submission_id = ?
       ORDER BY comment_id ASC`,
      [submissionId]
    );
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching submission comments:', error);
    res.status(500).json({ error: 'Failed to fetch submission comments' });
  }
});

// POST запрос для создания нового отправления
app.post('/submissions', upload.single('submissionFile'), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { assignmentId, studentId, submissionLink } = req.body;
    let fileName = null;
    
    // Проверяем обязательные поля
    if (!assignmentId || !studentId) {
      return res.status(400).json({ error: 'Assignment ID and Student ID are required' });
    }
    
    // Если загружен файл, используем его имя, иначе используем ссылку
    if (req.file) {
      fileName = req.file.filename;
    } else if (submissionLink) {
      fileName = submissionLink;
    } else {
      return res.status(400).json({ error: 'Either file or link is required' });
    }
    
    // Проверяем, существует ли уже отправление для этого задания и студента
    const [existingSubmissions] = await connection.query(
      'SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [assignmentId, studentId]
    );
    
    // Если отправление уже существует, возвращаем ошибку (для создания нового должен использоваться PUT запрос)
    if (existingSubmissions.length > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        error: 'Submission already exists for this assignment and student',
        submission_id: existingSubmissions[0].submission_id 
      });
    }
    
    // Создаем новое отправление
    const [submissionResult] = await connection.query(
      `INSERT INTO submissions 
       (assignment_id, student_id, file_name, status) 
       VALUES (?, ?, ?, 'На перевірці')`,
      [assignmentId, studentId, fileName]
    );
    
    const submissionId = submissionResult.insertId;
    
    // Создаем первую версию отправления
    await connection.query(
      `INSERT INTO submission_versions 
       (submission_id, file_name, version_number) 
       VALUES (?, ?, 1)`,
      [submissionId, fileName]
    );
    
    await connection.commit();
    
    res.status(201).json({
      message: 'Submission created successfully',
      submission_id: submissionId,
      version_number: 1
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  } finally {
    connection.release();
  }
});

// PUT запрос для обновления существующего отправления
app.put('/submissions/:id', upload.single('submissionFile'), async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const submissionId = req.params.id;
    const { submissionLink } = req.body;
    let fileName = null;
    
    // Если загружен файл, используем его имя, иначе используем ссылку
    if (req.file) {
      fileName = req.file.filename;
    } else if (submissionLink) {
      fileName = submissionLink;
    } else {
      return res.status(400).json({ error: 'Either file or link is required' });
    }
    
    // Проверяем, существует ли отправление
    const [existingSubmissions] = await connection.query(
      'SELECT * FROM submissions WHERE submission_id = ?',
      [submissionId]
    );
    
    if (existingSubmissions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Обновляем файл/ссылку в отправлении
    await connection.query(
      `UPDATE submissions 
       SET file_name = ?, status = 'На перевірці', upload_time = CURRENT_TIMESTAMP 
       WHERE submission_id = ?`,
      [fileName, submissionId]
    );
    
    // Получаем текущий максимальный номер версии
    const [versionResult] = await connection.query(
      `SELECT MAX(version_number) as max_version 
       FROM submission_versions 
       WHERE submission_id = ?`,
      [submissionId]
    );
    
    const nextVersionNumber = (versionResult[0].max_version || 0) + 1;
    
    // Создаем новую версию отправления
    await connection.query(
      `INSERT INTO submission_versions 
       (submission_id, file_name, version_number) 
       VALUES (?, ?, ?)`,
      [submissionId, fileName, nextVersionNumber]
    );
    
    await connection.commit();
    
    res.status(200).json({
      message: 'Submission updated successfully',
      submission_id: submissionId,
      version_number: nextVersionNumber
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  } finally {
    connection.release();
  }
});

// PUT запрос для обновления оценки отправления
app.put('/submissions/:id/grade', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { grade } = req.body;
    
    if (grade === undefined || grade < 0 || grade > 100) {
      return res.status(400).json({ error: 'Valid grade between 0 and 100 is required' });
    }
    
    await db.query(
      `UPDATE submissions 
       SET grade = ?, 
           grade_time = CURRENT_TIMESTAMP, 
           status = 'Прийнято'
       WHERE submission_id = ?`,
      [grade, submissionId]
    );
    
    res.json({ message: 'Grade updated successfully' });
  } catch (error) {
    console.error('Error updating grade:', error);
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

// POST запрос для добавления комментария к отправлению
app.post('/submissions/:id/comments', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    // Проверяем, существует ли отправление
    const [submissions] = await db.query(
      'SELECT * FROM submissions WHERE submission_id = ?',
      [submissionId]
    );
    
    if (submissions.length === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Добавляем комментарий
    const [result] = await db.query(
      `INSERT INTO submission_comments (submission_id, comment_text) 
       VALUES (?, ?)`,
      [submissionId, comment]
    );
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment_id: result.insertId
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// DELETE запрос для удаления комментария
app.delete('/submissions/comments/:commentId', async (req, res) => {
  try {
    const commentId = req.params.commentId;
    
    const [result] = await db.query(
      'DELETE FROM submission_comments WHERE comment_id = ?',
      [commentId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// GET запрос для получения статистики по отправлениям для преподавателя
app.get('/submissions/stats/assignments/:assignmentId', async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    
    // Получаем статистику по отправлениям для конкретного задания
    const [stats] = await db.query(
      `SELECT 
         COUNT(*) as total_submissions,
         SUM(CASE WHEN status = 'На перевірці' THEN 1 ELSE 0 END) as pending_count,
         SUM(CASE WHEN status = 'Прийнято' THEN 1 ELSE 0 END) as accepted_count,
         SUM(CASE WHEN status = 'Протерміновано' THEN 1 ELSE 0 END) as overdue_count,
         ROUND(AVG(grade), 1) as average_grade
       FROM submissions
       WHERE assignment_id = ?`,
      [assignmentId]
    );
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({ error: 'Failed to fetch submission statistics' });
  }
});

// GET запрос для получения статистики по отправлениям для студента
app.get('/submissions/stats/students/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Получаем статистику по отправлениям для конкретного студента
    const [stats] = await db.query(
      `SELECT 
         COUNT(*) as total_submissions,
         SUM(CASE WHEN status = 'На перевірці' THEN 1 ELSE 0 END) as pending_count,
         SUM(CASE WHEN status = 'Прийнято' THEN 1 ELSE 0 END) as accepted_count,
         SUM(CASE WHEN status = 'Протерміновано' THEN 1 ELSE 0 END) as overdue_count,
         ROUND(AVG(grade), 1) as average_grade
       FROM submissions
       WHERE student_id = ?`,
      [studentId]
    );
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching submission stats:', error);
    res.status(500).json({ error: 'Failed to fetch submission statistics' });
  }
});

// Маршрут для получения каталога загруженных файлов
app.get('/uploads', (req, res) => {
  const uploadsDir = path.join(__dirname, 'uploads');
  
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('Error reading uploads directory:', err);
      return res.status(500).json({ error: 'Failed to read uploads directory' });
    }
    
    res.json(files);
  });
});

// Проверка на просроченные отправления (можно запускать по расписанию)
async function checkOverdueSubmissions() {
  try {
    // Получаем все отправления, срок которых истек, но статус не "Протерміновано"
    const [result] = await db.query(`
      UPDATE submissions s
      JOIN assignments a ON s.assignment_id = a.assignment_id
      SET s.status = 'Протерміновано'
      WHERE a.deadline < NOW()
      AND s.status = 'На перевірці'
    `);
    
    console.log(`Updated ${result.affectedRows} overdue submissions`);
  } catch (error) {
    console.error('Error checking overdue submissions:', error);
  }
}

// Запуск проверки при старте сервера
checkOverdueSubmissions();

// Запуск проверки каждые 24 часа
setInterval(checkOverdueSubmissions, 24 * 60 * 60 * 1000);

// Экспортируем маршрутизацию для использования в других файлах
module.exports = app;







// =======================
// Запуск сервера
// =======================
app.listen(port, () => {
  console.log(`Сервер почав роботу на http://localhost:${port}`);
});

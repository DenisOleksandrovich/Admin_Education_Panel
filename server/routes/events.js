const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.post('/api/events', authenticateToken, async (req, res) => {
    console.log("Тіло запиту, отримане на бекенді:", req.body);
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ заборонено: Тільки викладачі або адміністратори можуть створювати події.' });
    }

    const {
        event_name,
        event_date,
        event_description,
        venue,
        event_type,
        duration,
        group_ids,
        supervisor_id // Змінено з selected_supervisor_id на supervisor_id
    } = req.body;

    if (!event_name || !event_date || !event_type) {
        return res.status(400).json({
            error: "Відсутні обов'язкові поля: event_name, event_date, event_type."
        });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        let actual_supervisor_id_for_event;

        if (req.user.role === 'admin') {
            // Тепер перевіряємо supervisor_id, отриманий з req.body
            if (!supervisor_id) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: "Адміністратор повинен обрати викладача для події." });
            }
            const [supervisorCheck] = await connection.query("SELECT supervisor_id FROM supervisors WHERE supervisor_id = ?", [supervisor_id]);
            if (supervisorCheck.length === 0) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ error: "Обраний викладач не знайдений." });
            }
            actual_supervisor_id_for_event = supervisor_id;

        } else if (req.user.role === 'supervisor') {
            const [accountRows] = await connection.query("SELECT supervisor_id FROM accounts WHERE account_id = ? AND role = 'supervisor'", [req.user.userId]);
            if (accountRows.length === 0 || !accountRows[0].supervisor_id) {
                await connection.rollback();
                connection.release();
                return res.status(403).json({ error: "Профіль викладача не знайдено або не пов'язаний з обліковим записом користувача." });
            }
            actual_supervisor_id_for_event = accountRows[0].supervisor_id;
        } else {
            // Цей випадок малоймовірний через попередню перевірку ролі, але залишаємо для безпеки
            await connection.rollback();
            connection.release();
            return res.status(403).json({ error: "Роль користувача не дозволяє створювати події." });
        }

        const eventSql = `
            INSERT INTO events (supervisor_id, event_name, event_date, event_description, venue, event_type, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [eventResult] = await connection.query(eventSql, [
            actual_supervisor_id_for_event,
            event_name,
            event_date,
            event_description || null,
            venue || null,
            event_type,
            duration || null
        ]);

        const newEventId = eventResult.insertId;

        if (group_ids && Array.isArray(group_ids) && group_ids.length > 0) {
            const groupSql = `
                INSERT INTO event_groups (event_id, group_id) VALUES ?
            `;
            // Переконуємося, що group_ids є масивом чисел
            const groupValues = group_ids.map(groupId => [newEventId, parseInt(groupId, 10)]).filter(pair => !isNaN(pair[1]));

            if (groupValues.length > 0) {
                 await connection.query(groupSql, [groupValues]);
            }
        }

        await connection.commit();
        res.status(201).json({
            event_id: newEventId,
            message: 'Подію та пов\'язані групи успішно створено'
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error(`Помилка створення події (POST /api/events) для account_id ${req.user.userId}, role ${req.user.role}:`, err);
        res.status(500).json({
            error: 'Помилка сервера при створенні події',
            details: err.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

router.get('/events', authenticateToken, async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const month = req.query.month || (new Date().getMonth() + 1);
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;

  const endDateQuery = `SELECT LAST_DAY(?) AS lastDay`;
  try {
    const [endResult] = await db.query(endDateQuery, [startDate]);
    if (endResult.length === 0 || !endResult[0].lastDay) {
      return res.status(400).json({ error: 'Некоректна дата' });
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
    console.error('Помилка отримання подій (GET /events):', err);
    res.status(500).json({ error: 'Помилка сервера при отриманні даних' });
  }
});

router.get('/events/:id', authenticateToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
      return res.status(400).json({ error: 'Недійсний ID події' });
  }
  try {
    const sql = `SELECT * FROM events WHERE event_id = ?`;
    const [rows] = await db.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Подію не знайдено' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Помилка отримання події (GET /events/:id):', err);
    res.status(500).json({ error: 'Помилка сервера при отриманні події' });
  }
});


router.put('/events/:id', authenticateToken, async (req, res) => {
   if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ заборонено' });
    }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
      return res.status(400).json({ error: 'Недійсний ID події' });
  }
  const { event_name, event_date, event_description, venue, event_type, duration } = req.body;

   try {
     if (!event_name || !event_date || !event_type) {
       return res.status(400).json({ error: "Відсутні обов'язкові поля для оновлення події: event_name, event_date, event_type." });
     }

    const sql = `
      UPDATE events
      SET event_name = ?, event_date = ?, event_description = ?, venue = ?, event_type = ?, duration = ?
      WHERE event_id = ?
    `;
    const [result] = await db.query(sql, [event_name, event_date, event_description, venue, event_type, duration, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Подію не знайдено для оновлення' });
    }
    res.json({ message: 'Подію оновлено' });
  } catch (err) {
    console.error('Помилка оновлення події (PUT /events/:id):', err);
    res.status(500).json({ error: 'Помилка сервера при оновленні події' });
  }
});

router.delete('/events/:id', authenticateToken, async (req, res) => {
   if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ заборонено' });
    }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
      return res.status(400).json({ error: 'Недійсний ID події' });
  }
  let connection;
  try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      const deleteGroupsSql = `DELETE FROM event_groups WHERE event_id = ?`;
      await connection.query(deleteGroupsSql, [id]);

      const deleteEventSql = `DELETE FROM events WHERE event_id = ?`;
      const [result] = await connection.query(deleteEventSql, [id]);

      await connection.commit();

      if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Подію не знайдено для видалення' });
      }
      res.json({ message: 'Подію та пов\'язані групи видалено' });

  } catch (err) {
      if (connection) {
          await connection.rollback();
      }
      console.error('Помилка видалення події (DELETE /events/:id):', err);
      res.status(500).json({ error: 'Помилка сервера при видаленні події', details: err.message });
  } finally {
      if (connection) {
          connection.release();
      }
  }
});


router.get('/api/events-by-date', authenticateToken, async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || (new Date().getMonth() + 1);
  const userRole = req.user?.role;
  const userGroupId = req.user?.groupId;

  if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'Некоректний місяць' });
  }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')} 23:59:59`;

  try {
    let sql = `
      SELECT
          e.event_id, e.supervisor_id, e.event_name, e.event_date,
          e.event_description, e.venue, e.event_type, e.duration,
          s.full_name AS supervisor_name,
          GROUP_CONCAT(DISTINCT sg.group_name ORDER BY sg.group_name SEPARATOR ', ') AS study_groups
      FROM events e
      LEFT JOIN supervisors s ON e.supervisor_id = s.supervisor_id
      LEFT JOIN event_groups eg ON e.event_id = eg.event_id
      LEFT JOIN study_groups sg ON eg.group_id = sg.study_group_id
      WHERE e.event_date BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];

    if (userRole === 'student') {
        if (userGroupId) {
            sql += ` AND (eg.group_id = ? OR e.event_id NOT IN (SELECT DISTINCT event_id FROM event_groups))`;
            params.push(userGroupId);
        } else {
             sql += ` AND e.event_id NOT IN (SELECT DISTINCT event_id FROM event_groups)`;
        }
    }

    sql += `
      GROUP BY e.event_id
      ORDER BY e.event_date ASC;
    `;

    const [rows] = await db.query(sql, params);

    const eventsByDate = {};
    let currentDateLoop = new Date(year, month - 1, 1);
    let lastDateOfMonthLoop = new Date(year, month, 0);

    while (currentDateLoop <= lastDateOfMonthLoop) {
        const dateStr = currentDateLoop.toISOString().split('T')[0];
        eventsByDate[dateStr] = [];
        currentDateLoop.setDate(currentDateLoop.getDate() + 1);
    }

    rows.forEach(event => {
        let eventDateObj;
        try {
            eventDateObj = new Date(event.event_date);
            if (isNaN(eventDateObj.getTime())) {
                 throw new Error('Invalid Date object from DB value');
            }
        } catch (e) {
            console.error(`Could not parse event_date '${event.event_date}' for event ID: ${event.event_id}. Skipping.`);
            return;
        }

        const dateStr = eventDateObj.getFullYear() + '-' +
                        String(eventDateObj.getMonth() + 1).padStart(2, '0') + '-' +
                        String(eventDateObj.getDate()).padStart(2, '0');

        if (eventsByDate.hasOwnProperty(dateStr)) {
             eventsByDate[dateStr].push({
                event_id: event.event_id,
                event_name: event.event_name,
                event_description: event.event_description,
                event_date: event.event_date,
                venue: event.venue,
                event_type: event.event_type,
                duration: event.duration,
                supervisor: event.supervisor_name || 'Невідомо',
                groups: event.study_groups || 'Для всіх',
             });
        } else {
             console.warn(`Event date ${dateStr} (from DB value ${event.event_date}) is outside the requested month ${year}-${month} for event ID: ${event.event_id}. Skipping.`);
        }
    });

    res.json(eventsByDate);
  } catch (err) {
    console.error('Помилка отримання подій для календаря (GET /events-by-date):', err);
    res.status(500).json({ error: 'Помилка сервера при отриманні даних для календаря' });
  }
});

router.get('/api/event-types', async (req, res) => {
    try {
        const sql = `SELECT DISTINCT event_type FROM events WHERE event_type IS NOT NULL AND event_type != '' ORDER BY event_type ASC`;
        const [rows] = await db.query(sql);
        const types = rows.map(row => row.event_type);
        res.json(types);
    } catch (err) {
        console.error('Помилка отримання типів подій (GET /event-types):', err);
        res.status(500).json({ error: 'Помилка сервера при отриманні типів подій' });
    }
});

router.get('/api/supervisors', async (req, res) => {
    try {
        const sql = `SELECT supervisor_id, full_name FROM supervisors ORDER BY full_name ASC`;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error('Помилка отримання викладачів (GET /api/supervisors):', err);
        res.status(500).json({ error: 'Помилка сервера при отриманні викладачів' });
    }
});

router.get('/api/groups', async (req, res) => {
    try {
        const sql = `SELECT study_group_id, group_name FROM study_groups ORDER BY group_name ASC`;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error('Помилка отримання груп (GET /api/groups):', err);
        res.status(500).json({ error: 'Помилка сервера при отриманні груп' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/api/groups', async (req, res) => {
  try {
    const [groups] = await db.query(`SELECT study_group_id, group_name FROM study_groups`);
    res.json(groups);
  } catch (err) {
    console.error('Failed to fetch study groups:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/students', async (req, res) => {
  try {
    const sql = `
      SELECT
        s.student_id, s.full_name, s.email, s.student_card_number,
        s.department, s.phone, s.total_progress, s.diploma_id,
        s.study_group_id, s.supervisor_id,
        g.group_name, g.specialty, g.course,
        sp.full_name AS supervisor_name, sp.email AS supervisor_email
      FROM students s
      LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
      LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
      ORDER BY s.full_name ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении всех студентов (GET /api/students):', err);
    res.status(500).json({ error: 'Помилка при отриманні даних студентів' });
  }
});


router.get('/api/students/search', async (req, res) => {
  const { q } = req.query;
  try {
    let sql;
    let params = [];
    const baseSql = `
      SELECT
        s.student_id, s.full_name, s.email, s.student_card_number,
        s.department, s.phone, s.total_progress, s.diploma_id,
        s.study_group_id, s.supervisor_id,
        g.group_name, g.specialty, g.course,
        sp.full_name AS supervisor_name, sp.email AS supervisor_email
      FROM students s
      LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
      LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
    `;

    if (!q || q.trim() === '') {
       sql = baseSql + ` ORDER BY s.full_name ASC`;
    } else {
       sql = baseSql + `
        WHERE
          s.full_name LIKE ? OR
          s.email LIKE ? OR
          s.student_card_number LIKE ? OR
          s.department LIKE ? OR
          s.phone LIKE ? OR
          g.group_name LIKE ? OR
          g.specialty LIKE ? OR
          sp.full_name LIKE ?
        ORDER BY s.full_name ASC
      `;
      const queryParam = `%${q}%`;
      params = [queryParam, queryParam, queryParam, queryParam, queryParam, queryParam, queryParam, queryParam];
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при поиске студента (GET /api/students/search):', err);
    res.status(500).json({ error: 'Помилка при пошуку студента' });
  }
});


router.get('/api/students/filter', async (req, res) => {
  const {
    q,
    group_id,
    specialty, // Filter by specialty name
    department, // Filter by department name
    supervisor_id,
    progress_filter,
    sort_by,
    sort_direction
  } = req.query;

  try {
    let sql = `
      SELECT
        s.student_id, s.full_name, s.email, s.student_card_number,
        s.department, s.phone, s.total_progress, s.diploma_id,
        s.study_group_id, s.supervisor_id,
        g.group_name, g.specialty, g.course,
        sp.full_name AS supervisor_name, sp.email AS supervisor_email
      FROM students s
      LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
      LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
      WHERE 1=1
    `;
    const params = [];

    if (q && q.trim() !== '') {
      sql += ` AND (
        s.full_name LIKE ? OR s.email LIKE ? OR s.student_card_number LIKE ? OR
        s.department LIKE ? OR s.phone LIKE ? OR g.group_name LIKE ? OR
        g.specialty LIKE ? OR sp.full_name LIKE ?
      )`;
      const searchPattern = `%${q}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (group_id) {
      sql += ` AND s.study_group_id = ?`;
      params.push(group_id);
    }

    if (specialty) {
      sql += ` AND g.specialty = ?`;
      params.push(specialty);
    }

    if (department) {
      sql += ` AND s.department = ?`;
      params.push(department);
    }

    if (supervisor_id) {
      sql += ` AND s.supervisor_id = ?`;
      params.push(supervisor_id);
    }

    if (progress_filter) {
      switch (progress_filter) {
        case 'low': sql += ` AND (s.total_progress < 30 OR s.total_progress IS NULL)`; break;
        case 'medium': sql += ` AND s.total_progress BETWEEN 30 AND 70`; break;
        case 'high': sql += ` AND s.total_progress > 70 AND s.total_progress < 100`; break;
        case 'no-progress': sql += ` AND (s.total_progress = 0 OR s.total_progress IS NULL)`; break;
        case 'completed': sql += ` AND s.total_progress = 100`; break;
      }
    }

    let orderBy = 's.full_name';
    const direction = (sort_direction && sort_direction.toLowerCase() === 'desc') ? 'DESC' : 'ASC';
    switch (sort_by) {
        case 'name': orderBy = 's.full_name'; break;
        case 'progress': orderBy = 's.total_progress'; break;
        case 'group': orderBy = 'g.group_name'; break;
        case 'department': orderBy = 's.department'; break;
        default: orderBy = 's.full_name'; // Default sort
    }
    sql += ` ORDER BY ${orderBy} ${direction}`;

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при фильтрации студентов (GET /api/students/filter):', err);
    res.status(500).json({ error: 'Помилка при фільтрації студентів' });
  }
});


router.get('/api/study-groups', async (req, res) => {
  try {
    const [groups] = await db.query(`
      SELECT study_group_id, group_name, specialty, course
      FROM study_groups
      ORDER BY group_name ASC
    `);
    // Return only ID and name for simpler dropdowns if needed
    const simpleGroups = groups.map(g => ({ study_group_id: g.study_group_id, group_name: g.group_name }));
    res.json(simpleGroups);
    // Or return full data: res.json(groups);
  } catch (err) {
    console.error('Failed to fetch study groups (GET /api/study-groups):', err);
    res.status(500).json({ error: 'Server error fetching study groups' });
  }
});


router.get('/api/specialties', async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT specialty as id, specialty as name
      FROM study_groups
      WHERE specialty IS NOT NULL AND specialty != ''
      ORDER BY name ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Помилка при отриманні списку спеціальностей (GET /api/specialties):', err);
    res.status(500).json({ error: 'Помилка при отриманні списку спеціальностей' });
  }
});


router.get('/api/student-departments', async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT department as id, department as name
      FROM students
      WHERE department IS NOT NULL AND department != ''
      ORDER BY name ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Помилка при отриманні списку департаментів студентів (GET /api/student-departments):', err);
    res.status(500).json({ error: 'Помилка при отриманні списку департаментів' });
  }
});


router.get('/api/students/stats', async (req, res) => {
  try {
    const sql = `
      SELECT
        COUNT(*) as total_students,
        COUNT(CASE WHEN total_progress = 100 THEN 1 END) as completed,
        COUNT(CASE WHEN total_progress < 30 OR total_progress IS NULL THEN 1 END) as low_progress,
        COUNT(CASE WHEN total_progress BETWEEN 30 AND 70 THEN 1 END) as medium_progress,
        COUNT(CASE WHEN total_progress > 70 AND total_progress < 100 THEN 1 END) as high_progress,
        COUNT(CASE WHEN total_progress = 0 OR total_progress IS NULL THEN 1 END) as no_progress,
        ROUND(AVG(total_progress), 2) as average_progress
      FROM students
    `;
    const [rows] = await db.query(sql);
    res.json(rows[0] || {});
  } catch (err) {
    console.error('Ошибка при получении статистики студентов (GET /api/students/stats):', err);
    res.status(500).json({ error: 'Помилка при отриманні статистики студентів' });
  }
});


router.get('/api/students/no-supervisor', async (req, res) => {
  try {
    const sql = `
      SELECT
        s.student_id, s.full_name, s.email, s.student_card_number,
        s.department, s.phone, s.total_progress, s.diploma_id,
        s.study_group_id, g.group_name, g.specialty, g.course
      FROM students s
      LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
      WHERE s.supervisor_id IS NULL OR s.supervisor_id = '' OR s.supervisor_id = 0
      ORDER BY s.full_name ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении студентов без руководителя (GET /api/students/no-supervisor):', err);
    res.status(500).json({ error: 'Помилка при отриманні студентів без керівника' });
  }
});


router.get('/api/students/low-progress', async (req, res) => {
  try {
    const sql = `
      SELECT
        s.student_id, s.full_name, s.email, s.student_card_number,
        s.department, s.phone, s.total_progress, s.diploma_id,
        s.study_group_id, s.supervisor_id,
        g.group_name, g.specialty, g.course,
        sp.full_name AS supervisor_name
      FROM students s
      LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
      LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
      WHERE s.total_progress < 30 OR s.total_progress IS NULL
      ORDER BY s.total_progress ASC, s.full_name ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении студентов с низким прогрессом (GET /api/students/low-progress):', err);
    res.status(500).json({ error: 'Помилка при отриманні студентів з низьким прогресом' });
  }
});


router.get('/api/students/completed', async (req, res) => {
  try {
    const sql = `
      SELECT
        s.student_id, s.full_name, s.email, s.student_card_number,
        s.department, s.phone, s.total_progress, s.diploma_id,
        s.study_group_id, s.supervisor_id,
        g.group_name, g.specialty, g.course,
        sp.full_name AS supervisor_name
      FROM students s
      LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
      LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
      WHERE s.total_progress = 100
      ORDER BY s.full_name ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении студентов, завершивших работу (GET /api/students/completed):', err);
    res.status(500).json({ error: 'Помилка при отриманні студентів, які завершили роботу' });
  }
});


router.get('/api/students/:searchType/:value', async (req, res) => {
  try {
    const { searchType, value } = req.params;
    let query = '';
    let params = [];

    const baseQuery = `
        SELECT s.student_id, s.full_name, s.email, s.student_card_number,
               s.department, s.phone, s.total_progress, s.diploma_id,
               s.study_group_id, s.supervisor_id,
               g.group_name, g.specialty, g.course,
               sp.full_name AS supervisor_name
        FROM students s
        LEFT JOIN study_groups g ON s.study_group_id = g.study_group_id
        LEFT JOIN supervisors sp ON s.supervisor_id = sp.supervisor_id
    `;

    if (searchType === 'id') {
      query = baseQuery + ` WHERE s.student_id = ?`;
      params = [value];
    } else if (searchType === 'name') {
      query = baseQuery + ` WHERE s.full_name LIKE ?`;
       params = [`%${value}%`];
    } else {
      return res.status(400).json({ success: false, error: 'Invalid search type' });
    }

    const [students] = await db.execute(query, params);

    if (students.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, student: students[0] });
  } catch (error) {
    console.error('Error fetching student by type/value (GET /api/students/:searchType/:value):', error);
    res.status(500).json({ success: false, error: 'Server error while fetching student information' });
  }
});


router.get('/api/groups/:searchType/:value', async (req, res) => {
  try {
    const { searchType, value } = req.params;
    let query = '';
    let params = [];

    if (searchType === 'id') {
      query = `SELECT * FROM study_groups WHERE study_group_id = ?`;
      params = [value];
    } else if (searchType === 'name') {
      query = `SELECT * FROM study_groups WHERE group_name LIKE ?`;
       params = [`%${value}%`];
    } else {
      return res.status(400).json({ success: false, error: 'Invalid search type' });
    }

    const [groups] = await db.execute(query, params);

    if (groups.length === 0) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    res.json({ success: true, group: groups[0] });
  } catch (error) {
    console.error('Error fetching group by type/value (GET /api/groups/:searchType/:value):', error);
    res.status(500).json({ success: false, error: 'Server error while fetching group information' });
  }
});


router.get('/api/study-groups/:id', async (req, res) => {
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
    console.error('Error fetching study group by ID (GET /api/study-groups/:id):', error);
    res.status(500).json({ error: 'Failed to fetch study group' });
  }
});


module.exports = router;
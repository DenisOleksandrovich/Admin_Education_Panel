const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/api/study-groups', async (req, res) => {
  try {
    const [groups] = await db.query(`SELECT study_group_id, group_name FROM study_groups`);
    res.json(groups);
  } catch (err) {
    console.error('Failed to fetch study groups:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/api/supervisors', async (req, res) => {
  try {
    const sql = `
      SELECT
        supervisor_id, full_name, email, phone, department, avatar,
        teacher_status, position, specialization
      FROM supervisors
      ORDER BY full_name ASC
    `;
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Помилка отримання викладачів (GET /api/supervisors):', err);
    res.status(500).json({ error: 'Помилка при отриманні викладачів' });
  }
});

router.get('/api/supervisors/search', async (req, res) => {
  const { q } = req.query;
  try {
    let sql;
    let params = [];
    const baseSql = `
        SELECT
          supervisor_id, full_name, email, phone, department, avatar,
          teacher_status, position, specialization
        FROM supervisors
      `;
    if (!q || q.trim() === '') {
       sql = baseSql + ` ORDER BY full_name ASC`;
    } else {
       sql = baseSql + `
        WHERE
          full_name LIKE ? OR
          email LIKE ? OR
          department LIKE ? OR
          position LIKE ? OR
          specialization LIKE ?
        ORDER BY full_name ASC
      `;
      const queryParam = `%${q}%`;
      params = [queryParam, queryParam, queryParam, queryParam, queryParam];
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Помилка пошуку викладача (GET /api/supervisors/search):', err);
    res.status(500).json({ error: 'Помилка при пошуку викладача' });
  }
});

router.get('/api/supervisors/filter', async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    const departmentValue = req.query.department_id;
    const positionValue = req.query.position_id;
    const specializationValue = req.query.specialization_id;
    const statusValue = req.query.status;
    const sortBy = req.query.sort_by || 'name';
    const sortDirection = req.query.sort_direction || 'asc';

    let query = `
      SELECT supervisor_id, full_name, email, phone, department,
             avatar, teacher_status, position, specialization
      FROM supervisors
      WHERE 1=1
    `;
    const params = [];

    if (searchQuery) {
      query += ` AND (full_name LIKE ? OR department LIKE ? OR position LIKE ? OR specialization LIKE ? OR email LIKE ?)`;
      const searchPattern = `%${searchQuery}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
    if (departmentValue) {
      query += ` AND department = ?`;
      params.push(departmentValue);
    }
    if (positionValue) {
      query += ` AND position = ?`;
      params.push(positionValue);
    }
    if (specializationValue) {
      query += ` AND specialization = ?`;
      params.push(specializationValue);
    }
    if (statusValue) {
      query += ` AND teacher_status = ?`;
      params.push(statusValue);
    }

    let orderByField;
    switch (sortBy) {
      case 'name': orderByField = 'full_name'; break;
      case 'department': orderByField = 'department'; break;
      case 'position': orderByField = 'position'; break;
      default: orderByField = 'full_name';
    }
    const direction = sortDirection.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${orderByField} ${direction}`;

    const [supervisors] = await db.execute(query, params);
    res.json(supervisors);
  } catch (error) {
    console.error('Помилка фільтрації викладачів (GET /api/supervisors/filter):', error);
    res.status(500).json({ error: 'Помилка сервера при фільтрації' });
  }
});

router.get('/api/departments', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT department as id, department as name
      FROM supervisors
      WHERE department IS NOT NULL AND department != ''
      ORDER BY name ASC
    `;
    const [departments] = await db.execute(query);
    res.json(departments);
  } catch (error) {
    console.error('Помилка отримання списку кафедр (GET /api/departments):', error);
    res.status(500).json({ error: 'Помилка сервера при отриманні даних' });
  }
});

router.get('/api/positions', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT position as id, position as name
      FROM supervisors
      WHERE position IS NOT NULL AND position != ''
      ORDER BY name ASC
    `;
    const [positions] = await db.execute(query);
    res.json(positions);
  } catch (error) {
    console.error('Помилка отримання списку посад (GET /api/positions):', error);
    res.status(500).json({ error: 'Помилка сервера при отриманні даних' });
  }
});

router.get('/api/specializations', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT specialization as id, specialization as name
      FROM supervisors
      WHERE specialization IS NOT NULL AND specialization != ''
      ORDER BY name ASC
    `;
    const [specializations] = await db.execute(query);
    res.json(specializations);
  } catch (error) {
    console.error('Помилка отримання списку спеціалізацій (GET /api/specializations):', error);
    res.status(500).json({ error: 'Помилка сервера при отриманні даних' });
  }
});

router.get('/api/statuses', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT teacher_status as id, teacher_status as name
      FROM supervisors
      WHERE teacher_status IS NOT NULL AND teacher_status != ''
      ORDER BY name ASC
    `;
    const [statuses] = await db.execute(query);
    res.json(statuses);
  } catch (error) {
    console.error('Помилка отримання списку статусів (GET /api/statuses):', error);
    res.status(500).json({ error: 'Помилка сервера при отриманні даних' });
  }
});

router.get('/api/supervisors/students-count', async (req, res) => {
  try {
    const query = `
      SELECT s.supervisor_id, COUNT(st.student_id) as students_count
      FROM supervisors s
      LEFT JOIN students st ON s.supervisor_id = st.supervisor_id
      GROUP BY s.supervisor_id
    `;
    const [counts] = await db.execute(query);
    const countMap = counts.reduce((acc, item) => {
        acc[item.supervisor_id] = item.students_count;
        return acc;
    }, {});
    res.json(countMap);
  } catch (error) {
    console.error('Помилка отримання кількості студентів у викладачів (GET /api/supervisors/students-count):', error);
    res.status(500).json({ error: 'Помилка сервера при отриманні даних' });
  }
});

router.get('/api/supervisors/:supervisorId/dashboard-data', async (req, res) => {
    const { supervisorId } = req.params;
    let connection;
    try {
        connection = await db.getConnection();
        const [supervisorDetails] = await connection.query('SELECT * FROM supervisors WHERE supervisor_id = ?', [supervisorId]);

        if (supervisorDetails.length === 0) {
            connection.release();
            return res.status(404).json({ success: false, error: 'Викладача не знайдено' });
        }

        const [assignedStudents] = await connection.query(
            'SELECT student_id, full_name, email FROM students WHERE supervisor_id = ? ORDER BY full_name ASC',
            [supervisorId]
        );

        const [pendingReviewCountResult] = await connection.query(
            `SELECT COUNT(s.submission_id) as pending_review_count
             FROM submissions s
             JOIN assignments a ON s.assignment_id = a.assignment_id
             WHERE a.posted_by_supervisor_id = ? AND s.status IN ('Submitted', 'Resubmitted', 'Pending Review', 'На перевірці')`,
            [supervisorId]
        );
        
        connection.release();
        res.json({
            success: true,
            details: {
                supervisor: supervisorDetails[0],
                assignedStudents: assignedStudents,
                pendingReviewCount: pendingReviewCountResult[0].pending_review_count || 0
            }
        });
    } catch (error) {
        if (connection) connection.release();
        console.error(`Помилка отримання детальної інформації для викладача ${supervisorId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при отриманні детальної інформації' });
    }
});

router.get('/api/supervisors/:searchType/:value', async (req, res) => {
  try {
    const { searchType, value } = req.params;
    let query = '';
    let params = [];

    if (searchType === 'id') {
      query = `SELECT * FROM supervisors WHERE supervisor_id = ?`;
      params = [value];
    } else if (searchType === 'name') {
      query = `SELECT * FROM supervisors WHERE full_name LIKE ?`;
      params = [`%${value}%`];
    } else {
      return res.status(400).json({ success: false, error: 'Недійсний тип пошуку' });
    }

    const [supervisors] = await db.execute(query, params);

    if (supervisors.length === 0) {
      return res.status(404).json({ success: false, error: 'Викладача не знайдено' });
    }
    res.json({ success: true, supervisor: supervisors[0] });
  } catch (error) {
    console.error('Помилка отримання викладача за типом/значенням (GET /api/supervisors/:searchType/:value):', error);
    res.status(500).json({ success: false, error: 'Помилка сервера при отриманні інформації про викладача' });
  }
});

module.exports = router;
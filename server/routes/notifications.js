const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.get('/api/notification-types', async (req, res) => {
    try {
        const [columnInfo] = await db.query(`
            SELECT COLUMN_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = 'notifications'
              AND COLUMN_NAME = 'type'
        `, [db.pool.config.connectionConfig.database]);

        if (columnInfo.length === 0) {
            return res.status(404).json({ error: 'Column type not found in notifications table.' });
        }
        const enumString = columnInfo[0].COLUMN_TYPE;
        const match = enumString.match(/^enum\((.*)\)$/i);
        if (!match || !match[1]) {
             return res.status(500).json({ error: 'Could not parse notification types.' });
        }
        const types = match[1].split(',').map(val => val.trim().replace(/^'(.*)'$/, '$1'));
        res.json({ types });
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching notification types.' });
    }
});

router.get('/api/notifications/me', authenticateToken, async (req, res) => {
    const userIdFromToken = req.user.userId;
    const userRoleFromToken = req.user.role;
    const { q, type, sort_by = 'date', sort_direction = 'desc', status } = req.query;

    if (isNaN(userIdFromToken) || userIdFromToken === null || userIdFromToken === undefined) {
        return res.status(400).json({ error: 'Invalid user ID in token.' });
    }

    let targetUserRole = userRoleFromToken;
    let userGroupId = null;

    try {
        if (targetUserRole === 'student') {
            const [studentRows] = await db.query('SELECT study_group_id FROM students WHERE student_id = ? LIMIT 1', [userIdFromToken]);
            if (studentRows.length > 0) {
                userGroupId = studentRows[0].study_group_id;
            }
        }

        const queryParams = [];
        let notificationConditions = [];
        const systemNotificationCondition = '(n.user_id IS NULL AND n.supervisor_id IS NULL AND n.group_id IS NULL)';

        if (targetUserRole === 'student') {
            notificationConditions.push('n.user_id = ?');
            queryParams.push(userIdFromToken);
            if (userGroupId) {
                notificationConditions.push('n.group_id = ?');
                queryParams.push(userGroupId);
            }
            notificationConditions.push(systemNotificationCondition);
        } else if (targetUserRole === 'supervisor' || targetUserRole === 'admin') {
            notificationConditions.push('n.supervisor_id = ?');
            queryParams.push(userIdFromToken);
            notificationConditions.push(systemNotificationCondition);
        } else {
            return res.status(403).json({ error: 'Unsupported user role for notifications.' });
        }

        if (notificationConditions.length === 0) {
            return res.json({ notifications: [] });
        }
        
        const combinedTargetConditions = `(${notificationConditions.join(' OR ')})`;

        const readCheckParamsForSubquery = [userIdFromToken];
        let readCheckSubquerySqlPart;

        if (targetUserRole === 'student') {
            readCheckSubquerySqlPart = `EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.student_id = ?)`;
        } else if (targetUserRole === 'supervisor' || targetUserRole === 'admin') {
            readCheckSubquerySqlPart = `EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.supervisor_id = ?)`;
        } else {
            readCheckSubquerySqlPart = '0';
            readCheckParamsForSubquery.pop();
        }

        let sqlBase = `
          SELECT
            n.id AS notification_id, n.type, n.title, n.message, n.created_at,
            n.user_id AS target_user_id, n.group_id AS target_group_id, n.supervisor_id AS target_supervisor_id,
            (${readCheckSubquerySqlPart}) AS is_read
          FROM notifications n
        `;

        let whereClauses = [combinedTargetConditions];
        const finalSqlParams = [...readCheckParamsForSubquery, ...queryParams];

        if (type && type !== '') {
            whereClauses.push('n.type = ?');
            finalSqlParams.push(type);
        }
        if (q && q.trim() !== '') {
            whereClauses.push('(n.title LIKE ? OR n.message LIKE ?)');
            const searchTerm = `%${q.trim()}%`;
            finalSqlParams.push(searchTerm, searchTerm);
        }

        if (status === 'unread') {
            if (targetUserRole === 'student') {
                whereClauses.push(`NOT EXISTS (SELECT 1 FROM notification_reads nr_filter WHERE nr_filter.notification_id = n.id AND nr_filter.student_id = ?)`);
            } else if (targetUserRole === 'supervisor' || targetUserRole === 'admin') {
                whereClauses.push(`NOT EXISTS (SELECT 1 FROM notification_reads nr_filter WHERE nr_filter.notification_id = n.id AND nr_filter.supervisor_id = ?)`);
            }
            finalSqlParams.push(userIdFromToken);
        } else if (status === 'read') {
            if (targetUserRole === 'student') {
                whereClauses.push(`EXISTS (SELECT 1 FROM notification_reads nr_filter WHERE nr_filter.notification_id = n.id AND nr_filter.student_id = ?)`);
            } else if (targetUserRole === 'supervisor' || targetUserRole === 'admin') {
                whereClauses.push(`EXISTS (SELECT 1 FROM notification_reads nr_filter WHERE nr_filter.notification_id = n.id AND nr_filter.supervisor_id = ?)`);
            }
            finalSqlParams.push(userIdFromToken);
        }
        
        let sql = `${sqlBase} WHERE ${whereClauses.join(' AND ')}`;

        let orderBy = 'n.created_at';
        if (sort_by === 'title') orderBy = 'n.title';
        else if (sort_by === 'type') orderBy = 'n.type';
        const direction = sort_direction?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
        sql += ` ORDER BY ${orderBy} ${direction} LIMIT 100`;
        
        const [notifications] = await db.query(sql, finalSqlParams);
        res.json({ notifications });

    } catch (error) {
        console.error(`Server error fetching notifications for user ${userIdFromToken} (role ${userRoleFromToken}):`, error);
        res.status(500).json({ error: 'Server error while fetching notifications.' });
    }
});

router.put('/api/notifications/:notificationId/read', authenticateToken, async (req, res) => {
    const notificationId = parseInt(req.params.notificationId, 10);
    const currentUserId = req.user.userId; 
    const currentUserRole = req.user.role;

    if (isNaN(notificationId)) {
        return res.status(400).json({ error: 'Invalid notification ID.' });
    }

    try {
        const [notifCheck] = await db.query('SELECT id FROM notifications WHERE id = ?', [notificationId]);
        if (notifCheck.length === 0) {
             return res.status(404).json({ error: 'Notification not found.' });
        }

        let insertSql;
        let insertParams;

        if (currentUserRole === 'student') {
            insertSql = `INSERT IGNORE INTO notification_reads (notification_id, student_id, read_at) VALUES (?, ?, NOW())`;
            insertParams = [notificationId, currentUserId];
        } else if (currentUserRole === 'supervisor' || currentUserRole === 'admin') {
            insertSql = `INSERT IGNORE INTO notification_reads (notification_id, supervisor_id, read_at) VALUES (?, ?, NOW())`;
            insertParams = [notificationId, currentUserId];
        } else {
             return res.status(400).json({ error: 'Unknown user role.' });
        }

        const [result] = await db.query(insertSql, insertParams);

        if (result.affectedRows > 0 || result.warningStatus === 0) {
            res.json({ success: true, message: 'Notification marked as read.' });
        } else {
             res.status(200).json({ success: true, message: 'Notification was already marked as read or no change made.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification as read.' });
    }
});

router.get('/api/notifications/unread/count', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    let userGroupId = null;

    try {
        let targetConditions = [];
        const queryParams = [];
        
        const systemNotificationCondition = '(n.user_id IS NULL AND n.supervisor_id IS NULL AND n.group_id IS NULL)';
        let specificRoleReadCheck;

        if (userRole === 'student') {
            const [studentData] = await db.query('SELECT study_group_id FROM students WHERE student_id = ? LIMIT 1', [userId]);
            userGroupId = studentData[0]?.study_group_id;
            
            let studentConditions = ['n.user_id = ?'];
            queryParams.push(userId);
            if (userGroupId) {
                studentConditions.push('n.group_id = ?');
                queryParams.push(userGroupId);
            }
            studentConditions.push(systemNotificationCondition);
            targetConditions.push(`(${studentConditions.join(' OR ')})`);
            specificRoleReadCheck = `NOT EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.student_id = ?)`;
            queryParams.push(userId);

        } else if (userRole === 'supervisor' || userRole === 'admin') {
            let supervisorConditions = ['n.supervisor_id = ?'];
            queryParams.push(userId);
            supervisorConditions.push(systemNotificationCondition);
            targetConditions.push(`(${supervisorConditions.join(' OR ')})`);
            specificRoleReadCheck = `NOT EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.supervisor_id = ?)`;
            queryParams.push(userId);
        } else {
             return res.status(403).json({ success: false, error: 'Unknown user role.' });
        }
        
        const countSql = `
            SELECT COUNT(n.id) as unreadCount
            FROM notifications n
            WHERE (${targetConditions.join(' AND ')}) AND ${specificRoleReadCheck}
        `;
        
        const [countResult] = await db.query(countSql, queryParams);
        const unreadCount = countResult[0]?.unreadCount || 0;

        res.json({ success: true, unreadCount });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error fetching unread notification count.' });
    }
});

router.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const userRole = req.user.role;
    let userGroupId = null;

    try {
        let targetConditionsArray = [];
        const findUnreadParams = [];
        const systemNotificationCondition = '(n.user_id IS NULL AND n.supervisor_id IS NULL AND n.group_id IS NULL)';
        let specificRoleReadCheckInner;


        if (userRole === 'student') {
            const [studentData] = await db.query(`SELECT study_group_id FROM students WHERE student_id = ? LIMIT 1`, [userId]);
            userGroupId = studentData[0]?.study_group_id;
            
            let studentSpecificConditions = ['n.user_id = ?'];
            findUnreadParams.push(userId);
            if (userGroupId) {
                studentSpecificConditions.push('n.group_id = ?');
                findUnreadParams.push(userGroupId);
            }
            studentSpecificConditions.push(systemNotificationCondition);
            targetConditionsArray.push(`(${studentSpecificConditions.join(' OR ')})`);
            specificRoleReadCheckInner = `NOT EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.student_id = ?)`;
            findUnreadParams.push(userId);

        } else if (userRole === 'supervisor' || userRole === 'admin') {
            let supervisorSpecificConditions = ['n.supervisor_id = ?'];
            findUnreadParams.push(userId);
            supervisorSpecificConditions.push(systemNotificationCondition);
            targetConditionsArray.push(`(${supervisorSpecificConditions.join(' OR ')})`);
            specificRoleReadCheckInner = `NOT EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notification_id = n.id AND nr.supervisor_id = ?)`;
            findUnreadParams.push(userId);
        } else {
            return res.status(403).json({ error: 'Unsupported user role.' });
        }

        const findUnreadSql = `
            SELECT n.id
            FROM notifications n
            WHERE (${targetConditionsArray.join(' AND ')}) AND ${specificRoleReadCheckInner}
        `;
        
        const [unreadNotifications] = await db.query(findUnreadSql, findUnreadParams);

        if (unreadNotifications.length === 0) {
             return res.json({ success: true, message: 'No unread notifications to mark.' });
        }

        const notificationIds = unreadNotifications.map(n => n.id);
        let insertSql;
        const valuesToInsert = [];
        const now = new Date();

        if (userRole === 'student') {
            insertSql = `INSERT IGNORE INTO notification_reads (notification_id, student_id, read_at) VALUES ?`;
            notificationIds.forEach(id => valuesToInsert.push([id, userId, now]));
        } else if (userRole === 'supervisor' || userRole === 'admin') {
            insertSql = `INSERT IGNORE INTO notification_reads (notification_id, supervisor_id, read_at) VALUES ?`;
            notificationIds.forEach(id => valuesToInsert.push([id, userId, now]));
        }

        if (valuesToInsert.length > 0) {
            const [result] = await db.query(insertSql, [valuesToInsert]);
            res.json({ success: true, message: `${result.affectedRows} notifications marked as read.` });
        } else {
             res.json({ success: true, message: 'No unread notifications were updated.' });
        }

    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all notifications as read.' });
    }
});

router.post('/api/notifications', authenticateToken, async (req, res) => {
  const { type, title, message, target_user_id, target_group_id, target_supervisor_id } = req.body;

  if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      return res.status(403).json({ error: 'Forbidden: Only admins or supervisors can create notifications.'});
  }

  if (!type || !title || !message) {
    return res.status(400).json({ error: 'Type, title, and message are required.' });
  }
   const validTypes = ['assignment','event','grade','message','system'];
   if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `Invalid notification type: ${type}` });
   }

  try {
      const [result] = await db.query(
        `INSERT INTO notifications
           (type, title, message, user_id, group_id, supervisor_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          type,
          title,
          message,
          target_user_id || null,
          target_group_id || null,
          target_supervisor_id || null
        ]
      );
      res.status(201).json({ message: 'Notification created.', notification_id: result.insertId });
  } catch (error) {
      res.status(500).json({ error: 'Server error while creating notification.' });
  }
});

module.exports = router;
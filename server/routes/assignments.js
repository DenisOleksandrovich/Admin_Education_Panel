const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

async function enrichTasksWithDetails(tasksToEnrich) {
    if (!tasksToEnrich || tasksToEnrich.length === 0) {
        return [];
    }
    const assignmentIds = tasksToEnrich.map(a => a.assignment_id);

    const [changeLogs] = await db.query(`
        SELECT
            ac.assignment_id,
            ac.change_date,
            ac.change_description,
            COALESCE(s.full_name, acc.email) AS changed_by_name
        FROM assignment_changes ac
        LEFT JOIN supervisors s ON ac.changed_by = s.supervisor_id
        LEFT JOIN accounts acc ON ac.changed_by_account_id = acc.account_id
        WHERE ac.assignment_id IN (?)
        ORDER BY ac.assignment_id, ac.change_date DESC
    `, [assignmentIds]);

    const changesMap = changeLogs.reduce((acc, row) => {
        if (!acc[row.assignment_id]) acc[row.assignment_id] = [];
        acc[row.assignment_id].push({
            date: row.change_date,
            description: row.change_description,
            changed_by: row.changed_by_name || 'Система'
        });
        return acc;
    }, {});

    const [commentRows] = await db.query(`
        SELECT
            ac.assignment_id,
            ac.comment_id,
            ac.comment_date,
            ac.comment_text,
            st.full_name AS student_name,
            sp_comment.full_name AS supervisor_name,
            acc_comment.email AS admin_name
        FROM assignment_comments ac
        LEFT JOIN students st ON ac.student_id = st.student_id
        LEFT JOIN supervisors sp_comment ON ac.supervisor_id = sp_comment.supervisor_id
        LEFT JOIN accounts acc_comment ON ac.admin_id = acc_comment.account_id
        WHERE ac.assignment_id IN (?)
        ORDER BY ac.assignment_id, ac.comment_date ASC
    `, [assignmentIds]);

    const commentsMap = commentRows.reduce((acc, row) => {
        if (!acc[row.assignment_id]) acc[row.assignment_id] = [];
        acc[row.assignment_id].push({
            id: row.comment_id,
            date: row.comment_date,
            text: row.comment_text,
            author: row.student_name || row.supervisor_name || row.admin_name || 'Система'
        });
        return acc;
    }, {});

    const [docRows] = await db.query(`
        SELECT
            assignment_id,
            document_url AS url,
            'link' AS type
        FROM assignment_documents
        WHERE assignment_id IN (?)
        ORDER BY assignment_id
    `, [assignmentIds]);

    const documentsMap = docRows.reduce((acc, row) => {
      if (!acc[row.assignment_id]) acc[row.assignment_id] = [];
      acc[row.assignment_id].push({ url: row.url, type: row.type });
      return acc;
    }, {});

    return tasksToEnrich.map(a => ({
        ...a,
        groups: a.group_ids ? a.group_ids.split(',').map(id => parseInt(id, 10)) : [],
        group_names: a.group_names || '',
        attachments: documentsMap[a.assignment_id] || [],
        changes: changesMap[a.assignment_id] || [],
        comments: commentsMap[a.assignment_id] || []
    }));
}

router.get('/assignments', authenticateToken, async (req, res) => {
    const userRole = req.user?.role;
    const userGroupId = req.user?.groupId;
    const studentIdFromToken = (userRole === 'student') ? req.user.userId : null;
    const supervisorIdFromToken = (userRole === 'supervisor') ? req.user.userId : null;

    try {
        let queryAssignments = '';
        const queryParams = [];

        const baseSelectFields = `
            SELECT
                a.*,
                GROUP_CONCAT(DISTINCT sg.study_group_id) AS group_ids,
                GROUP_CONCAT(DISTINCT sg.group_name SEPARATOR ', ') AS group_names,
                DATEDIFF(a.deadline, NOW()) AS days_remaining,
                COALESCE(sp_author.full_name, acc_posted_by.email) AS posted_by_name,
                (SELECT GROUP_CONCAT(s_coauthor.full_name SEPARATOR ', ')
                    FROM assignment_coauthors ac_list
                    JOIN supervisors s_coauthor ON ac_list.supervisor_id = s_coauthor.supervisor_id
                    WHERE ac_list.assignment_id = a.assignment_id
                ) as coauthor_names
        `;

        const baseFromJoins = `
            FROM assignments a
            LEFT JOIN assignment_study_group asg ON a.assignment_id = asg.assignment_id
            LEFT JOIN study_groups sg ON asg.study_group_id = sg.study_group_id
            LEFT JOIN supervisors sp_author ON a.posted_by_supervisor_id = sp_author.supervisor_id
            LEFT JOIN accounts acc_posted_by ON a.posted_by_admin_id = acc_posted_by.account_id
        `;

        if (userRole === 'student') {
            const studentSpecificSelect = `
                ,
                (SELECT s.status
                 FROM submissions s
                 WHERE s.assignment_id = a.assignment_id AND s.student_id = ?
                 ORDER BY s.upload_time DESC
                 LIMIT 1
                ) AS student_submission_status,
                (SELECT s.grade
                 FROM submissions s
                 WHERE s.assignment_id = a.assignment_id AND s.student_id = ?
                 ORDER BY s.upload_time DESC
                 LIMIT 1
                ) AS student_submission_grade
            `;

            queryAssignments = `${baseSelectFields} ${studentSpecificSelect} ${baseFromJoins}`;
            queryParams.push(studentIdFromToken, studentIdFromToken);

            if (userGroupId) {
                queryAssignments += ` WHERE (asg.study_group_id = ? OR a.assignment_id NOT IN (SELECT DISTINCT assignment_id FROM assignment_study_group))`;
                queryParams.push(userGroupId);
            } else {
                queryAssignments += ` WHERE a.assignment_id NOT IN (SELECT DISTINCT assignment_id FROM assignment_study_group)`;
            }
            queryAssignments += ` GROUP BY a.assignment_id ORDER BY a.deadline ASC, a.created_at DESC`;

            const [assignments] = await db.query(queryAssignments, queryParams);
            const enrichedAssignments = await enrichTasksWithDetails(assignments);
            return res.json(enrichedAssignments);

        } else if (userRole === 'supervisor' && supervisorIdFromToken) {
            const supervisorSpecificSelect = `
                SELECT
                    a.*,
                    GROUP_CONCAT(DISTINCT sg.study_group_id) AS group_ids,
                    GROUP_CONCAT(DISTINCT sg.group_name SEPARATOR ', ') AS group_names,
                    DATEDIFF(a.deadline, NOW()) AS days_remaining,
                    COALESCE(sp_author.full_name, acc_posted_by.email) AS posted_by_name,
                    CASE
                        WHEN a.posted_by_supervisor_id = ? THEN 'author'
                        WHEN EXISTS (
                            SELECT 1 FROM assignment_coauthors ac_check
                            WHERE ac_check.assignment_id = a.assignment_id AND ac_check.supervisor_id = ?
                        ) THEN 'coauthor'
                        ELSE 'other_related'
                    END AS current_user_relation,
                    (SELECT GROUP_CONCAT(s_coauthor.full_name SEPARATOR ', ')
                        FROM assignment_coauthors ac_list
                        JOIN supervisors s_coauthor ON ac_list.supervisor_id = s_coauthor.supervisor_id
                        WHERE ac_list.assignment_id = a.assignment_id
                    ) as coauthor_names
            `;

            const supervisorTasksQuery = `
                ${supervisorSpecificSelect}
                ${baseFromJoins}
                WHERE a.posted_by_supervisor_id = ? OR EXISTS (
                    SELECT 1 FROM assignment_coauthors ac
                    WHERE ac.assignment_id = a.assignment_id AND ac.supervisor_id = ?
                )
                GROUP BY a.assignment_id
                ORDER BY FIELD(current_user_relation, 'author', 'coauthor'), a.deadline ASC, a.created_at DESC
            `;
            const supervisorTasksParams = [supervisorIdFromToken, supervisorIdFromToken, supervisorIdFromToken, supervisorIdFromToken];
            const [supervisorTasks] = await db.query(supervisorTasksQuery, supervisorTasksParams);
            const enrichedSupervisorTasks = await enrichTasksWithDetails(supervisorTasks);

            const fetchedSupervisorTaskIds = supervisorTasks.map(t => t.assignment_id);

            const otherTasksBaseSelectFields = `
                SELECT
                    a.*,
                    GROUP_CONCAT(DISTINCT sg.study_group_id) AS group_ids,
                    GROUP_CONCAT(DISTINCT sg.group_name SEPARATOR ', ') AS group_names,
                    DATEDIFF(a.deadline, NOW()) AS days_remaining,
                    COALESCE(sp_author.full_name, acc_posted_by.email) AS posted_by_name,
                    (SELECT GROUP_CONCAT(s_coauthor.full_name SEPARATOR ', ')
                        FROM assignment_coauthors ac_list
                        JOIN supervisors s_coauthor ON ac_list.supervisor_id = s_coauthor.supervisor_id
                        WHERE ac_list.assignment_id = a.assignment_id
                    ) as coauthor_names
            `;

            let otherTasksQuery = `
                ${otherTasksBaseSelectFields}
                ${baseFromJoins}
                WHERE
                    (
                        a.posted_by_admin_id IS NOT NULL OR
                        a.assignment_id NOT IN (SELECT DISTINCT asg_filter.assignment_id FROM assignment_study_group asg_filter)
                    )
                    AND (a.posted_by_supervisor_id IS NULL OR a.posted_by_supervisor_id != ?)
                    AND NOT EXISTS (
                        SELECT 1 FROM assignment_coauthors ac_other_check
                        WHERE ac_other_check.assignment_id = a.assignment_id AND ac_other_check.supervisor_id = ?
                    )
            `;
            const otherTasksParams = [supervisorIdFromToken, supervisorIdFromToken];

            if (fetchedSupervisorTaskIds.length > 0) {
                const placeholders = fetchedSupervisorTaskIds.map(() => '?').join(',');
                otherTasksQuery += ` AND a.assignment_id NOT IN (${placeholders}) `;
                otherTasksParams.push(...fetchedSupervisorTaskIds);
            }
            otherTasksQuery += ` GROUP BY a.assignment_id ORDER BY a.deadline ASC, a.created_at DESC`;

            const [otherTasks] = await db.query(otherTasksQuery, otherTasksParams);
            const enrichedOtherTasks = await enrichTasksWithDetails(otherTasks);

            return res.json({
                supervisorTasks: enrichedSupervisorTasks,
                otherTasks: enrichedOtherTasks
            });

        } else {
            queryAssignments = `${baseSelectFields} ${baseFromJoins} GROUP BY a.assignment_id ORDER BY a.deadline ASC, a.created_at DESC`;
            const [assignments] = await db.query(queryAssignments);
            const enrichedAssignments = await enrichTasksWithDetails(assignments);
            return res.json(enrichedAssignments);
        }

    } catch (error) {
        console.error('Помилка отримання збагачених завдань (GET /assignments):', error);
        res.status(500).json({ error: 'Не вдалося отримати збагачені завдання', details: error.message });
    }
});

router.post('/assignments_create', authenticateToken, async (req, res) => {
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ заборонено: Тільки викладачі або адміністратори можуть створювати завдання.' });
    }

    const {
        title, description, deadline, attachments, groups, taskType,
        allowText, allowFile, fileTypes, status,
        coauthors: coauthorIdsFromRequest, // Array of selected supervisor IDs
        designated_author_supervisor_id // ID of the supervisor marked with a star (main author by frontend)
    } = req.body;

    // For debugging:
    console.log('--- DEBUG: /assignments_create ---');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User Role:', req.user.role, '| User ID (supervisor):', req.user.userId, '| User Account ID (admin):', req.user.accountId);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('---------------------------------');

    const creatorRole = req.user.role;
    const creatorSupervisorId = (creatorRole === 'supervisor') ? req.user.userId : null;
    const creatorAdminAccountId = (creatorRole === 'admin') ? req.user.accountId : null;

    let effectiveAuthorSupervisorId = null; // The supervisor ID to be stored in assignments.posted_by_supervisor_id

    if (designated_author_supervisor_id) {
        effectiveAuthorSupervisorId = parseInt(designated_author_supervisor_id, 10);
        if (isNaN(effectiveAuthorSupervisorId)) {
            console.error('Invalid designated_author_supervisor_id:', designated_author_supervisor_id);
            return res.status(400).json({ error: "Недійсний ID призначеного основного автора-викладача." });
        }
    } else if (creatorRole === 'supervisor') {
        effectiveAuthorSupervisorId = creatorSupervisorId;
    }

    console.log('Effective Author Supervisor ID (for assignments.posted_by_supervisor_id):', effectiveAuthorSupervisorId);

    if (!title || !deadline || !taskType) {
        return res.status(400).json({ error: "Відсутні обов'язкові поля: title, deadline, taskType." });
    }

    if (!Array.isArray(groups)) {
        console.log('Validation fail: groups is not an array. Received:', groups);
        return res.status(400).json({ error: "Дані про групи мають бути передані як масив." });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [assignmentResult] = await connection.query(
            `INSERT INTO assignments
                (title, description, posted_by_supervisor_id, posted_by_admin_id, deadline, status, type, allow_text, allow_file, allow_pdf, allow_doc, allow_zip, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                title, description || null,
                effectiveAuthorSupervisorId,
                (creatorRole === 'admin' && !effectiveAuthorSupervisorId) ? creatorAdminAccountId : null,
                new Date(deadline), status || 'Опубліковано', taskType,
                allowText ? 1 : 0, allowFile ? 1 : 0,
                fileTypes?.pdf ? 1 : 0,
                fileTypes?.doc ? 1 : 0,
                fileTypes?.zip ? 1 : 0
            ]
        );
        const assignmentId = assignmentResult.insertId;

        if (groups.length > 0) {
            const groupValues = groups.map(groupId => [assignmentId, parseInt(groupId, 10)]).filter(gv => !isNaN(gv[1]));
            if (groupValues.length > 0) {
                await connection.query(
                    `INSERT INTO assignment_study_group (assignment_id, study_group_id) VALUES ?`,
                    [groupValues]
                );
            }
        }

        const coauthorsToInsert = [];
        const uniqueCoauthorSupervisorIds = new Set();

        if (coauthorIdsFromRequest && Array.isArray(coauthorIdsFromRequest)) {
            coauthorIdsFromRequest.forEach(idStr => {
                const id = parseInt(idStr, 10);
                if (!isNaN(id)) {
                    uniqueCoauthorSupervisorIds.add(id);
                }
            });
        }

        if (effectiveAuthorSupervisorId) {
            uniqueCoauthorSupervisorIds.add(effectiveAuthorSupervisorId);
        }

        uniqueCoauthorSupervisorIds.forEach(supervisorId => {
            const role = (supervisorId === effectiveAuthorSupervisorId) ? 'Автор' : 'Співавтор';
            coauthorsToInsert.push([assignmentId, supervisorId, role]);
        });

        if (coauthorsToInsert.length > 0) {
            await connection.query(
                `INSERT INTO assignment_coauthors (assignment_id, supervisor_id, coauthor_role) VALUES ?`,
                [coauthorsToInsert]
            );
        }

        if (attachments && attachments.length > 0) {
          const docValues = attachments.map(url => [assignmentId, url.trim()]).filter(dv => dv[1] && typeof dv[1] === 'string');
          if (docValues.length > 0) {
              await connection.query(
                  `INSERT INTO assignment_documents (assignment_id, document_url) VALUES ?`,
                  [docValues]
              );
          }
        }

        const deadlineDate = new Date(deadline);
        // CORRECTED INSERT INTO events: Removed admin_id
        const [eventResult] = await connection.query(
            `INSERT INTO events
                (supervisor_id, event_name, event_date, event_description, event_type, duration)
            VALUES (?, ?, ?, ?, 'Дедлайн', ?)`, // admin_id removed from field list
            [
                effectiveAuthorSupervisorId, // Event is associated with the supervisor if one is designated/creator
                `Дедлайн: ${title}`,
                deadlineDate,
                `Кінцевий термін здачі завдання "${title}"`, // event_description
                60 // duration
            ]
        );
        const eventId = eventResult.insertId;

        try {
            await connection.query(
                `INSERT INTO event_assignments (event_id, assignment_id) VALUES (?, ?)`,
                [eventId, assignmentId]
            );
        } catch (eventAssignError) {
            console.warn("Не вдалося зв'язати подію із завданням:", eventAssignError.message);
        }

        if (groups.length > 0) {
            const eventGroupValues = groups.map(groupId => [eventId, parseInt(groupId, 10)]).filter(egv => !isNaN(egv[1]));
            if (eventGroupValues.length > 0) {
                await connection.query(
                    `INSERT INTO event_groups (event_id, group_id) VALUES ?`,
                    [eventGroupValues]
                );
            }
        }

        let logChangedBySupervisorId = null;
        let logChangedByAccountId = null;

        if (creatorRole === 'supervisor') {
            logChangedBySupervisorId = creatorSupervisorId;
        } else if (creatorRole === 'admin') {
            logChangedByAccountId = creatorAdminAccountId;
        }

        if (logChangedBySupervisorId !== null || logChangedByAccountId !== null) {
            await connection.query(
                `INSERT INTO assignment_changes
                    (assignment_id, changed_by, changed_by_account_id, change_description, change_date)
                VALUES (?, ?, ?, ?, NOW())`,
                [assignmentId, logChangedBySupervisorId, logChangedByAccountId, `Створено нове завдання "${title}".`]
            );
        }

        await connection.commit();
        console.log('Assignment created successfully. ID:', assignmentId);
        res.status(201).json({
            id: assignmentId,
            eventId: eventId,
            message: 'Завдання успішно створено разом з подією дедлайну.'
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error during /assignments_create route:', err);
        res.status(500).json({ error: 'Помилка сервера під час створення завдання.', details: err.message });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/assignments/:id', authenticateToken, async (req, res) => {
    const assignmentId = parseInt(req.params.id, 10);
    const userRole = req.user?.role;
    const userGroupId = req.user?.groupId;
    const studentIdFromToken = (userRole === 'student') ? req.user.userId : null;
    const supervisorIdFromToken = (userRole === 'supervisor') ? req.user.userId : null;

    if (isNaN(assignmentId)) {
        return res.status(400).json({ error: 'Недійсний ID завдання' });
    }

    try {
        let assignmentQuery = `
            SELECT
                a.*,
                GROUP_CONCAT(DISTINCT sg.study_group_id) AS group_ids,
                GROUP_CONCAT(DISTINCT sg.group_name SEPARATOR ', ') AS group_names,
                DATEDIFF(a.deadline, NOW()) AS days_remaining,
                COALESCE(sp.full_name, acc_posted_by.email) AS posted_by_name,
                (SELECT GROUP_CONCAT(s_coauthor.full_name SEPARATOR ', ')
                    FROM assignment_coauthors ac_list
                    JOIN supervisors s_coauthor ON ac_list.supervisor_id = s_coauthor.supervisor_id
                    WHERE ac_list.assignment_id = a.assignment_id
                ) as coauthor_names_detail
        `;
        const queryParams = [];

        if (userRole === 'student' && studentIdFromToken) {
            assignmentQuery += `,
                (SELECT s.status
                 FROM submissions s
                 WHERE s.assignment_id = a.assignment_id AND s.student_id = ?
                 ORDER BY s.upload_time DESC
                 LIMIT 1
                ) AS student_submission_status,
                (SELECT s.grade
                 FROM submissions s
                 WHERE s.assignment_id = a.assignment_id AND s.student_id = ?
                 ORDER BY s.upload_time DESC
                 LIMIT 1
                ) AS student_submission_grade
            `;
            queryParams.push(studentIdFromToken, studentIdFromToken);
        }

        assignmentQuery += `
            FROM assignments a
            LEFT JOIN assignment_study_group asg ON a.assignment_id = asg.assignment_id
            LEFT JOIN study_groups sg ON asg.study_group_id = sg.study_group_id
            LEFT JOIN supervisors sp ON a.posted_by_supervisor_id = sp.supervisor_id
            LEFT JOIN accounts acc_posted_by ON a.posted_by_admin_id = acc_posted_by.account_id
            WHERE a.assignment_id = ?
            GROUP BY a.assignment_id
        `;
        queryParams.push(assignmentId);


        const [assignments] = await db.query(assignmentQuery, queryParams);


        if (assignments.length === 0) {
            return res.status(404).json({ error: 'Завдання не знайдено' });
        }
        const assignment = assignments[0];

        const assignedGroups = assignment.group_ids ? assignment.group_ids.split(',').map(id => parseInt(id, 10)) : [];

        if (userRole === 'student') {
            const isAssignedToAll = !assignedGroups || assignedGroups.length === 0;
            if (!isAssignedToAll && userGroupId && !assignedGroups.includes(userGroupId)) {
                 return res.status(403).json({ error: 'Доступ до цього завдання заборонено для вашої групи' });
            }
            if (!isAssignedToAll && !userGroupId && assignedGroups.length > 0) {
                 return res.status(403).json({ error: 'Доступ до цього завдання заборонено (завдання для конкретних груп)' });
            }
        } else if (userRole === 'supervisor') {
             const [coauthorsCheck] = await db.query(
                'SELECT 1 FROM assignment_coauthors WHERE assignment_id = ? AND supervisor_id = ?',
                [assignmentId, supervisorIdFromToken]
            );
            const isCoauthor = coauthorsCheck.length > 0;

            if (assignment.posted_by_supervisor_id !== supervisorIdFromToken && !isCoauthor && assignment.posted_by_admin_id === null) {
                 return res.status(403).json({ error: 'Ви можете переглядати тільки власні завдання, завдання у співавторстві або завдання, створені адміністрацією.' });
            }
        }

        const [changeLogs] = await db.query(`
            SELECT
                ac.change_date,
                ac.change_description,
                COALESCE(s.full_name, acc.email) AS changed_by_name
            FROM assignment_changes ac
            LEFT JOIN supervisors s ON ac.changed_by = s.supervisor_id
            LEFT JOIN accounts acc ON ac.changed_by_account_id = acc.account_id
            WHERE ac.assignment_id = ? ORDER BY ac.change_date DESC
        `, [assignmentId]);
        const changes = changeLogs.map(row => ({
            date: row.change_date, description: row.change_description,
            changed_by: row.changed_by_name || 'Система'
        }));

        const [commentRows] = await db.query(`
            SELECT
                ac.comment_id,
                ac.comment_date,
                ac.comment_text,
                st.full_name AS student_name,
                sp_comment.full_name AS supervisor_name,
                acc_comment.email AS admin_name
            FROM assignment_comments ac
            LEFT JOIN students st ON ac.student_id = st.student_id
            LEFT JOIN supervisors sp_comment ON ac.supervisor_id = sp_comment.supervisor_id
            LEFT JOIN accounts acc_comment ON ac.admin_id = acc_comment.account_id
            WHERE ac.assignment_id = ? ORDER BY ac.comment_date ASC
        `, [assignmentId]);
        const comments = commentRows.map(row => ({
            id: row.comment_id,
            date: row.comment_date, text: row.comment_text,
            author: row.student_name || row.supervisor_name || row.admin_name || 'Система'
        }));

        const [docRows] = await db.query(`
            SELECT
                document_url AS url,
                'link' AS type
            FROM assignment_documents
            WHERE assignment_id = ?
        `, [assignmentId]);
        const attachments = docRows.map(row => ({ url: row.url, type: row.type }));

        const [coauthorRows] = await db.query(`
            SELECT s.supervisor_id, s.full_name, ac.coauthor_role
            FROM assignment_coauthors ac
            JOIN supervisors s ON ac.supervisor_id = s.supervisor_id
            WHERE ac.assignment_id = ?
        `, [assignmentId]);


        const enrichedAssignment = {
            ...assignment,
            coauthor_names: assignment.coauthor_names_detail,
            coauthors: coauthorRows.map(row => ({
                id: row.supervisor_id,
                name: row.full_name,
                role: row.coauthor_role
            })),
            groups: assignedGroups,
            group_names: assignment.group_names || '',
            posted_by_name: assignment.posted_by_name || 'Адміністрація',
            attachments,
            changes,
            comments
        };
        delete enrichedAssignment.coauthor_names_detail;


        res.json(enrichedAssignment);
    } catch (error) {
        console.error(`Помилка отримання деталей завдання ID ${assignmentId} (GET /assignments/:id):`, error);
        res.status(500).json({ error: 'Не вдалося отримати деталі завдання' });
    }
});

router.post('/assignments/:id/comments', authenticateToken, async (req, res) => {
    const assignmentId = parseInt(req.params.id, 10);
    const { comment } = req.body;
    const userAccountId = req.user.accountId;
    const userRole = req.user.role;
    const studentIdFromToken = (userRole === 'student') ? req.user.userId : null;
    const supervisorIdFromToken = (userRole === 'supervisor') ? req.user.userId : null;

    if (isNaN(assignmentId)) return res.status(400).json({ error: 'Недійсний ID завдання' });
    if (!comment || comment.trim() === '') return res.status(400).json({ error: 'Текст коментаря є обов\'язковим' });

    try {
        const [assignments] = await db.query('SELECT assignment_id FROM assignments WHERE assignment_id = ?', [assignmentId]);
        if (assignments.length === 0) return res.status(404).json({ error: 'Завдання не знайдено' });

        let studentIdForDb = null;
        let supervisorIdForDb = null;
        let adminIdForDb = null;
        let authorName = 'Невідомо';

        if (userRole === 'student') {
            studentIdForDb = studentIdFromToken;
            const [studentData] = await db.query('SELECT full_name FROM students WHERE student_id = ?', [studentIdFromToken]);
            if (studentData.length > 0) authorName = studentData[0].full_name;
        } else if (userRole === 'supervisor') {
            supervisorIdForDb = supervisorIdFromToken;
            const [supervisorData] = await db.query('SELECT full_name FROM supervisors WHERE supervisor_id = ?', [supervisorIdFromToken]);
            if (supervisorData.length > 0) authorName = supervisorData[0].full_name;
        } else if (userRole === 'admin') {
            adminIdForDb = userAccountId;
            const [adminAccountData] = await db.query('SELECT email FROM accounts WHERE account_id = ?', [userAccountId]);
             if (adminAccountData.length > 0) authorName = adminAccountData[0].email;
        }

        const [result] = await db.query(
            `INSERT INTO assignment_comments (assignment_id, comment_text, student_id, supervisor_id, admin_id, comment_date)
            VALUES (?, ?, ?, ?, ?, NOW())`,
            [assignmentId, comment.trim(), studentIdForDb, supervisorIdForDb, adminIdForDb]
        );

        const newComment = {
            comment_id: result.insertId,
            comment_text: comment.trim(),
            comment_date: new Date(),
            author: authorName
        };

        res.status(201).json({ success: true, comment: newComment });

    } catch (error) {
        console.error(`Помилка додавання коментаря до завдання ${assignmentId} (POST /assignments/:id/comments):`, error);
        res.status(500).json({ error: 'Не вдалося додати коментар' });
    }
});

router.put('/assignments/:id', authenticateToken, async (req, res) => {
    const assignmentId = parseInt(req.params.id, 10);
    const editorAccountId = req.user.accountId;
    const editorSupervisorId = (req.user.role === 'supervisor') ? req.user.userId : null;
    const editorRole = req.user.role;

    if (isNaN(assignmentId)) {
        return res.status(400).json({ error: 'Недійсний ID завдання' });
    }

    const {
        title, description, deadline, groups, taskType,
        allowText, allowFile, fileTypes, attachments,
        status, coauthors
    } = req.body;

    if (!title || !deadline || !taskType) {
        return res.status(400).json({ error: "Відсутні обов'язкові поля: title, deadline, taskType" });
    }
    if ((!groups || groups.length === 0) && editorRole === 'supervisor') {
         return res.status(400).json({ error: "Для викладача обов'язково вказати групи при редагуванні" });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existingAssignments] = await connection.query(
            'SELECT posted_by_supervisor_id, posted_by_admin_id, deadline as old_deadline, title as old_title FROM assignments WHERE assignment_id = ?',
            [assignmentId]
        );
        if (existingAssignments.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Завдання не знайдено' });
        }

        const currentAssignmentData = existingAssignments[0];
        const oldDeadline = new Date(currentAssignmentData.old_deadline);
        const oldTitle = currentAssignmentData.old_title;

        const [existingCoauthors] = await connection.query(
            'SELECT supervisor_id FROM assignment_coauthors WHERE assignment_id = ?',
            [assignmentId]
        );
        const coauthorSupervisorIds = existingCoauthors.map(c => c.supervisor_id);

        const canEdit = editorRole === 'admin' ||
                        (editorRole === 'supervisor' && editorSupervisorId === currentAssignmentData.posted_by_supervisor_id) ||
                        (editorRole === 'supervisor' && coauthorSupervisorIds.includes(editorSupervisorId));

        if (!canEdit) {
            await connection.rollback();
            connection.release();
            return res.status(403).json({ error: 'У вас немає прав для редагування цього завдання.' });
        }

        const newDeadline = new Date(deadline);

        await connection.query(
            `UPDATE assignments SET
                title = ?, description = ?, deadline = ?, type = ?,
                allow_text = ?, allow_file = ?, allow_pdf = ?, allow_doc = ?, allow_zip = ?,
                status = ?, updated_at = NOW()
            WHERE assignment_id = ?`,
            [
                title, description || null, newDeadline, taskType,
                allowText ? 1 : 0, allowFile ? 1 : 0,
                fileTypes?.pdf ? 1 : 0, fileTypes?.doc ? 1 : 0, fileTypes?.zip ? 1 : 0,
                status || 'Опубліковано',
                assignmentId
            ]
        );

        await connection.query('DELETE FROM assignment_coauthors WHERE assignment_id = ?', [assignmentId]);
        if (coauthors && coauthors.length > 0) {
            const coauthorValues = coauthors.map(supervisorId =>
                [assignmentId, parseInt(supervisorId, 10), 'Співавтор']
            ).filter(cv => !isNaN(cv[1]));
            if (coauthorValues.length > 0) {
                await connection.query(
                    `INSERT INTO assignment_coauthors (assignment_id, supervisor_id, coauthor_role) VALUES ?`,
                    [coauthorValues]
                );
            }
        }

        await connection.query('DELETE FROM assignment_study_group WHERE assignment_id = ?', [assignmentId]);
        if (groups && groups.length > 0) {
            const groupValues = groups.map(groupId => [assignmentId, parseInt(groupId, 10)]).filter(gv => !isNaN(gv[1]));
            if (groupValues.length > 0) {
                await connection.query(
                    `INSERT INTO assignment_study_group (assignment_id, study_group_id) VALUES ?`,
                    [groupValues]
                );
            }
        }

        await connection.query('DELETE FROM assignment_documents WHERE assignment_id = ?', [assignmentId]);
        if (attachments && attachments.length > 0) {
          const docValues = attachments.map(url => [assignmentId, url.trim()]).filter(dv => dv[1]);
          if (docValues.length > 0) {
              await connection.query(
                  `INSERT INTO assignment_documents (assignment_id, document_url) VALUES ?`,
                  [docValues]
              );
          }
        }

        let changeDescription = `Оновлено деталі завдання "${title}".`;

        if (newDeadline.getTime() !== oldDeadline.getTime() || title !== oldTitle) {
            const [eventAssignments] = await connection.query(
                'SELECT event_id FROM event_assignments WHERE assignment_id = ?',
                [assignmentId]
            );
            let eventIdToUpdateOrCreate;
            if (eventAssignments.length > 0) {
                eventIdToUpdateOrCreate = eventAssignments[0].event_id;
                const eventName = `Дедлайн оновлено: ${title}`;
                const eventDescription = `Новий кінцевий термін здачі завдання "${title}" встановлено на ${newDeadline.toLocaleString('uk-UA')}`;
                await connection.query(
                    'UPDATE events SET event_date = ?, event_name = ?, event_description = ? WHERE event_id = ?',
                    [newDeadline, eventName, eventDescription, eventIdToUpdateOrCreate]
                );
                changeDescription += ` Дедлайн змінено на ${newDeadline.toLocaleString('uk-UA')}.`;
            } else {
                const postedBySupervisorForEvent = currentAssignmentData.posted_by_supervisor_id || editorSupervisorId;
                const postedByAdminForEvent = currentAssignmentData.posted_by_admin_id || (editorRole === 'admin' ? editorAccountId : null);
                const [newEventResult] = await connection.query(
                    `INSERT INTO events (supervisor_id, admin_id, event_name, event_date, event_description, event_type, duration)
                    VALUES (?, ?, ?, ?, ?, 'Дедлайн', ?)`,
                    [
                        postedBySupervisorForEvent, postedByAdminForEvent,
                        `Дедлайн: ${title}`, newDeadline,
                        `Кінцевий термін здачі завдання "${title}" встановлено на ${newDeadline.toLocaleString('uk-UA')}`, 60
                    ]
                );
                eventIdToUpdateOrCreate = newEventResult.insertId;
                await connection.query(
                    `INSERT INTO event_assignments (event_id, assignment_id) VALUES (?, ?)`,
                    [eventIdToUpdateOrCreate, assignmentId]
                );
                if (groups && groups.length > 0) {
                    const eventGroupValues = groups.map(groupId => [eventIdToUpdateOrCreate, parseInt(groupId, 10)]).filter(egv => !isNaN(egv[1]));
                    if (eventGroupValues.length > 0) {
                        await connection.query(
                            `INSERT INTO event_groups (event_id, group_id) VALUES ?`,
                            [eventGroupValues]
                        );
                    }
                }
                changeDescription += ` Дедлайн встановлено на ${newDeadline.toLocaleString('uk-UA')}.`;
            }
            if (newDeadline.getTime() !== oldDeadline.getTime()) {
                const actionVerb = newDeadline > oldDeadline ? "продовжено" : "скорочено";
                const notificationTitle = `Дедлайн для завдання "${title}" змінено!`;
                const notificationMessage = `Термін виконання завдання "${title}" було ${actionVerb}. Новий дедлайн: ${newDeadline.toLocaleString('uk-UA')}.`;
                if (groups && groups.length > 0) {
                    const notificationPromises = groups.map(groupId => {
                        const parsedGroupId = parseInt(groupId, 10);
                        if (!isNaN(parsedGroupId)) {
                            return connection.query(
                                `INSERT INTO notifications (group_id, type, title, message, created_at)
                                VALUES (?, 'system', ?, ?, NOW())`, // ВИПРАВЛЕНО: type змінено на 'system'
                                [parsedGroupId, notificationTitle, notificationMessage]
                            );
                        }
                        return Promise.resolve();
                    });
                    await Promise.all(notificationPromises);
                }
            }
        }

        let logChangedBySupervisor = null;
        let logChangedByAccount = null;

        if (editorRole === 'supervisor') {
            logChangedBySupervisor = editorSupervisorId;
        } else if (editorRole === 'admin') {
            logChangedByAccount = editorAccountId;
        }

        if (logChangedBySupervisor !== null || logChangedByAccount !== null) {
             try {
                await connection.query(
                    `INSERT INTO assignment_changes
                        (assignment_id, changed_by, changed_by_account_id, change_description, change_date)
                    VALUES (?, ?, ?, ?, NOW())`,
                    [assignmentId, logChangedBySupervisor, logChangedByAccount, changeDescription]
                );
            } catch (logError) {
                 console.error('Помилка при логуванні зміни завдання (продовжуємо):', logError);
            }
        }

        await connection.commit();

        res.status(200).json({
            id: assignmentId,
            message: 'Завдання успішно оновлено'
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error(`Помилка оновлення завдання ID ${assignmentId} (PUT /assignments/:id):`, err);
        res.status(500).json({ error: 'Помилка сервера під час оновлення завдання', details: err.message });
    } finally {
        if (connection) connection.release();
    }
});

router.delete('/assignments/:id', authenticateToken, async (req, res) => {
    const assignmentId = parseInt(req.params.id, 10);
    const editorAccountId = req.user.accountId;
    const editorSupervisorId = (req.user.role === 'supervisor') ? req.user.userId : null;
    const editorRole = req.user.role;

    if (isNaN(assignmentId)) {
        return res.status(400).json({ error: 'Недійсний ID завдання' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [existingAssignments] = await connection.query(
            'SELECT posted_by_supervisor_id, posted_by_admin_id FROM assignments WHERE assignment_id = ?',
            [assignmentId]
        );
        if (existingAssignments.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Завдання не знайдено' });
        }
        const currentAssignmentData = existingAssignments[0];

        const [existingCoauthors] = await connection.query(
            'SELECT supervisor_id FROM assignment_coauthors WHERE assignment_id = ?',
            [assignmentId]
        );
        const coauthorSupervisorIds = existingCoauthors.map(c => c.supervisor_id);

        const canDelete = editorRole === 'admin' ||
                          (editorRole === 'supervisor' && editorSupervisorId === currentAssignmentData.posted_by_supervisor_id) ||
                          (editorRole === 'supervisor' && coauthorSupervisorIds.includes(editorSupervisorId));

        if (!canDelete) {
            await connection.rollback();
            connection.release();
            return res.status(403).json({ error: 'У вас немає прав для видалення цього завдання.' });
        }

        const [eventAssignments] = await connection.query(
            'SELECT event_id FROM event_assignments WHERE assignment_id = ?', [assignmentId]
        );

        await connection.query('DELETE FROM assignment_coauthors WHERE assignment_id = ?', [assignmentId]);
        await connection.query('DELETE FROM assignment_study_group WHERE assignment_id = ?', [assignmentId]);
        await connection.query('DELETE FROM assignment_documents WHERE assignment_id = ?', [assignmentId]);
        await connection.query('DELETE FROM submissions WHERE assignment_id = ?', [assignmentId]); // Corrected table name
        await connection.query('DELETE FROM assignment_comments WHERE assignment_id = ?', [assignmentId]);
        await connection.query('DELETE FROM assignment_changes WHERE assignment_id = ?', [assignmentId]);
        await connection.query('DELETE FROM event_assignments WHERE assignment_id = ?', [assignmentId]);

        const [deleteResult] = await connection.query('DELETE FROM assignments WHERE assignment_id = ?', [assignmentId]);

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Завдання не знайдено для видалення (можливо, вже видалено).' });
        }

        if (eventAssignments.length > 0) {
            const eventIdsToDelete = eventAssignments.map(ea => ea.event_id);
            if (eventIdsToDelete.length > 0) {
                await connection.query('DELETE FROM event_groups WHERE event_id IN (?)', [eventIdsToDelete]);
                await connection.query('DELETE FROM events WHERE event_id IN (?)', [eventIdsToDelete]);
            }
        }

        await connection.commit();
        res.json({ success: true, message: 'Завдання та пов\'язана подія успішно видалені.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Помилка видалення завдання ID ${assignmentId} (DELETE /assignments/:id):`, error);
        res.status(500).json({ error: 'Помилка сервера при видаленні завдання.', details: error.message });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/assignments/:id/submissions', authenticateToken, async (req, res) => {
    const assignmentId = parseInt(req.params.id, 10);
    const userRole = req.user?.role;

    if (isNaN(assignmentId)) {
        return res.status(400).json({ error: 'Недійсний ID завдання' });
    }

    try {
        const [submissions] = await db.query(`
            SELECT
                s.submission_id,
                s.assignment_id,
                a.title as assignment_title,
                a.deadline as assignment_deadline,
                a.assignment_id as original_assignment_id,
                st.student_id,
                st.full_name as student_name,
                sg.group_name,
                s.upload_time,
                s.status as submission_status,
                s.grade,
                s.file_name
            FROM submissions s
            JOIN students st ON s.student_id = st.student_id
            JOIN assignments a ON s.assignment_id = a.assignment_id
            LEFT JOIN study_groups sg ON st.study_group_id = sg.study_group_id
            WHERE s.assignment_id = ?
            ORDER BY s.upload_time DESC
        `, [assignmentId]);

        if (submissions.length === 0 && userRole !== 'student') {
            const [assignmentDetails] = await db.query(
                'SELECT title as assignment_title, deadline as assignment_deadline, assignment_id as original_assignment_id FROM assignments WHERE assignment_id = ?',
                 [assignmentId]
            );
            if (assignmentDetails.length > 0) {
                 return res.json([{
                    ...assignmentDetails[0],
                    student_name: null,
                    group_name: null,
                    upload_time: null,
                    submission_status: null,
                    grade: null,
                    file_name: null,
                    submission_id: null
                }].filter(sub => sub.submission_id !== null));
            } else {
                 return res.status(404).json({ error: 'Завдання не знайдено, тому неможливо завантажити роботи' });
            }
        }
        res.json(submissions);
    } catch (error) {
        console.error('Помилка отримання робіт для завдання (GET /assignments/:id/submissions):', error);
        res.status(500).json({ error: 'Не вдалося отримати роботи для завдання', details: error.message });
    }
});

// Routes for individual submission details, versions, and comments

// GET details for a specific submission
router.get('/submissions/:id', authenticateToken, async (req, res) => {
    const submissionId = parseInt(req.params.id, 10);
    if (isNaN(submissionId)) {
        return res.status(400).json({ error: 'Недійсний ID роботи' });
    }

    try {
        const query = `
            SELECT
                s.submission_id,
                s.assignment_id,
                a.title AS assignment_title,
                st.student_id,
                st.full_name AS student_name,
                sg.group_name,
                s.upload_time,
                s.status,
                s.grade,
                s.file_name
            FROM submissions s
            JOIN assignments a ON s.assignment_id = a.assignment_id
            JOIN students st ON s.student_id = st.student_id
            LEFT JOIN study_groups sg ON st.study_group_id = sg.study_group_id
            WHERE s.submission_id = ?;
        `;
        const [submissionDetails] = await db.query(query, [submissionId]);

        if (submissionDetails.length === 0) {
            return res.status(404).json({ error: 'Роботу не знайдено' });
        }
        res.json(submissionDetails[0]);
    } catch (error) {
        console.error(`Помилка отримання деталей роботи ID ${submissionId} (GET /submissions/:id):`, error);
        res.status(500).json({ error: 'Не вдалося отримати деталі роботи', details: error.message });
    }
});


router.get('/submissions/:id/comments', authenticateToken, async (req, res) => {
    const submissionId = parseInt(req.params.id, 10);
    if (isNaN(submissionId)) {
        return res.status(400).json({ error: 'Недійсний ID роботи для коментарів' });
    }

    try {
        const query = `
            SELECT
                sc.comment_id,
                sc.comment_text,
                sc.comment_date,
                sc.submission_id,
                sc.account_id,
                acc.role as author_role,
                COALESCE(st.full_name, sup.full_name, acc.email) as author_name
            FROM submission_comments sc
            JOIN accounts acc ON sc.account_id = acc.account_id
            LEFT JOIN students st ON acc.student_id = st.student_id
            LEFT JOIN supervisors sup ON acc.supervisor_id = sup.supervisor_id
            WHERE sc.submission_id = ?
            ORDER BY sc.comment_date ASC;
        `;
        const [comments] = await db.query(query, [submissionId]);
        res.json(comments);
    } catch (error) {
        console.error(`Помилка отримання коментарів для роботи ID ${submissionId} (GET /submissions/:id/comments):`, error);
        res.status(500).json({ error: 'Не вдалося отримати коментарі до роботи', details: error.message });
    }
});

// PUT update submission review (grade, status, comment)
router.put('/submissions/:id/review', authenticateToken, async (req, res) => {
    const submissionId = parseInt(req.params.id, 10);
    const { grade, status, supervisor_comment } = req.body; // supervisor_comment is from frontend
    const reviewerAccountId = req.user.accountId; // ID of the account performing the review

    if (isNaN(submissionId)) {
        return res.status(400).json({ error: 'Недійсний ID роботи' });
    }

    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ заборонено. Тільки викладачі або адміністратори можуть оцінювати роботи.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const updateFields = [];
        const queryParamsSubmission = [];

        if (grade !== undefined && grade !== null) {
            updateFields.push('grade = ?');
            queryParamsSubmission.push(parseInt(grade,10));
        }
        if (status) {
            updateFields.push('status = ?');
            queryParamsSubmission.push(status);
        }
        
        if (updateFields.length > 0) {
            updateFields.push('grade_time = NOW()');
            queryParamsSubmission.push(submissionId);
            const updateSubmissionQuery = `UPDATE submissions SET ${updateFields.join(', ')} WHERE submission_id = ?`;
            const [updateResult] = await connection.query(updateSubmissionQuery, queryParamsSubmission);
            
            if (updateResult.affectedRows === 0) {
                await connection.rollback();
                connection.release();
                return res.status(404).json({ error: 'Роботу для оновлення не знайдено.' });
            }
        } else if (!supervisor_comment) {
             await connection.rollback();
             connection.release();
             return res.status(400).json({ error: 'Немає даних для оновлення або коментаря.' });
        }


        if (supervisor_comment && supervisor_comment.trim() !== '') {
            await connection.query(
                `INSERT INTO submission_comments (submission_id, account_id, comment_text, comment_date)
                 VALUES (?, ?, ?, NOW())`,
                [submissionId, reviewerAccountId, supervisor_comment.trim()]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Оцінку та статус роботи оновлено.' });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error(`Помилка оновлення оцінки для роботи ID ${submissionId} (PUT /submissions/:id/review):`, error);
        res.status(500).json({ error: 'Не вдалося оновити оцінку та статус роботи', details: error.message });
    } finally {
        if (connection) connection.release();
    }
});


module.exports = router;
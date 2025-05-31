// server/routes/chat.js
const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth'); // Ваш middleware аутентифікації HTTP

const router = express.Router();

// Застосовуємо authenticateToken до всіх маршрутів чату
router.use(authenticateToken);

// Отримання списку бесід для поточного користувача
router.get('/conversations', async (req, res) => {
    const currentUserAccountId = req.user.accountId;
    const currentUserRole = req.user.role;

    try {
        let conversations = [];
        if (currentUserRole === 'admin') {
            const query = `
                SELECT
                    sm.account_id,
                    acc.email AS userEmail,
                    COALESCE(s.full_name, sup.full_name, acc.email) AS userName,
                    (SELECT message_text FROM support_messages sm_last
                     WHERE sm_last.account_id = sm.account_id
                     ORDER BY sm_last.timestamp DESC LIMIT 1) AS lastMessage,
                    (SELECT timestamp FROM support_messages sm_ts
                     WHERE sm_ts.account_id = sm.account_id
                     ORDER BY sm_ts.timestamp DESC LIMIT 1) AS lastMessageTimestamp,
                     SUM(CASE WHEN sm.sender_type = 'user' AND sm.is_read = 0 THEN 1 ELSE 0 END) AS unreadCount
                FROM support_messages sm
                JOIN accounts acc ON sm.account_id = acc.account_id
                LEFT JOIN students s ON acc.student_id = s.student_id
                LEFT JOIN supervisors sup ON acc.supervisor_id = sup.supervisor_id
                GROUP BY sm.account_id, acc.email, userName
                ORDER BY lastMessageTimestamp DESC;
            `;
            // Для unreadCount, ми рахуємо повідомлення, де sender_type='user' (тобто від користувачів, не від адмінів)
            [conversations] = await db.query(query);
            conversations = conversations.map(convo => ({
                ...convo,
                unreadCount: parseInt(convo.unreadCount, 10) || 0,
                lastMessage: convo.lastMessage || ""
            }));
        } else { // Для звичайного користувача (student, supervisor)
            const query = `
                SELECT
                    ? AS account_id,
                    'Підтримка' AS userName,
                    (SELECT message_text FROM support_messages sm_last
                     WHERE sm_last.account_id = ?
                     ORDER BY sm_last.timestamp DESC LIMIT 1) AS lastMessage,
                    (SELECT timestamp FROM support_messages sm_ts
                     WHERE sm_ts.account_id = ?
                     ORDER BY sm_ts.timestamp DESC LIMIT 1) AS lastMessageTimestamp,
                     SUM(CASE WHEN sm.sender_type = 'admin' AND sm.receiver_id = ? AND sm.is_read = 0 THEN 1 ELSE 0 END) AS unreadCount
                FROM support_messages sm
                WHERE sm.account_id = ?
                GROUP BY account_id, userName;
            `;
            const [checkMessages] = await db.query("SELECT 1 FROM support_messages WHERE account_id = ? LIMIT 1", [currentUserAccountId]);

            if (checkMessages.length > 0) {
                [conversations] = await db.query(query, [currentUserAccountId, currentUserAccountId, currentUserAccountId, currentUserAccountId, currentUserAccountId]);
                 conversations = conversations.map(convo => ({
                    ...convo,
                    unreadCount: parseInt(convo.unreadCount, 10) || 0,
                    lastMessage: convo.lastMessage || "Немає повідомлень"
                }));
            } else {
                conversations = [{
                    account_id: currentUserAccountId,
                    userName: 'Підтримка',
                    lastMessage: "Немає повідомлень",
                    lastMessageTimestamp: null,
                    unreadCount: 0
                }];
            }
        }
        res.json({ success: true, conversations });
    } catch (error) {
        console.error("Помилка завантаження діалогів:", error);
        res.status(500).json({ success: false, error: 'Не вдалося завантажити діалоги' });
    }
});

// Отримання повідомлень для конкретної бесіди
router.get('/messages/:chatWithAccountId', async (req, res) => {
    const currentUserAccountId = req.user.accountId;
    const currentUserRole = req.user.role;
    const chatWithAccountIdParam = req.params.chatWithAccountId;

    // Якщо користувач не адмін, chatWithAccountId має бути його власним ID
    // Якщо адмін, то це ID користувача, з яким він спілкується
    const conversationAccountId = (currentUserRole === 'admin')
        ? parseInt(chatWithAccountIdParam, 10)
        : currentUserAccountId;

    if (isNaN(conversationAccountId)) {
        return res.status(400).json({ success: false, error: 'Некоректний ID співрозмовника.' });
    }
    // Додаткова перевірка для не-адмінів, щоб вони не могли запитати чужі чати
    if (currentUserRole !== 'admin' && parseInt(chatWithAccountIdParam, 10) !== currentUserAccountId) {
        return res.status(403).json({ success: false, error: 'Доступ заборонено.' });
    }


    try {
        if (currentUserRole === 'admin') {
            // Адмін читає повідомлення від користувача (sender_type = 'user')
            await db.query(
                "UPDATE support_messages SET is_read = 1 WHERE account_id = ? AND sender_type = 'user' AND is_read = 0",
                [conversationAccountId] // conversationAccountId тут - це ID користувача
            );
        } else {
            // Користувач читає повідомлення від адміна (sender_type = 'admin'), адресовані йому (receiver_id = currentUserAccountId)
             await db.query(
                "UPDATE support_messages SET is_read = 1 WHERE account_id = ? AND sender_type = 'admin' AND receiver_id = ? AND is_read = 0",
                [conversationAccountId, currentUserAccountId] // conversationAccountId тут - це ID самого користувача
            );
        }

        const [messages] = await db.query(
            "SELECT message_id, sender_type, sender_id, account_id, message_text, timestamp, is_read FROM support_messages WHERE account_id = ? ORDER BY timestamp ASC",
            [conversationAccountId]
        );

        if (req.wsBroadcaster) {
            if (currentUserRole === 'admin') {
                req.wsBroadcaster.notifyAdminsConversationUpdate(conversationAccountId);
            } else {
                 req.wsBroadcaster.notifyAdminsConversationUpdate(conversationAccountId); // Для оновлення списку у адмінів
            }
        }

        res.json({ success: true, messages: messages.map(m => ({...m, timestamp: new Date(m.timestamp).toISOString()})) });
    } catch (error) {
        console.error("Помилка завантаження повідомлень:", error);
        res.status(500).json({ success: false, error: 'Не вдалося завантажити повідомлення' });
    }
});


// РЕЗЕРВНИЙ HTTP ендпоінт для надсилання повідомлень.
router.post('/message', async (req, res) => {
    const { text, targetAccountId } = req.body;
    const senderAccountId = req.user.accountId;
    const originalSenderRole = req.user.role; // Отримуємо оригінальну роль

    if (!text || text.trim() === '') {
        return res.status(400).json({ success: false, error: 'Повідомлення не може бути порожнім.' });
    }
    if (originalSenderRole === 'admin' && !targetAccountId) {
        return res.status(400).json({ success: false, error: 'Для адміна необхідно вказати ID одержувача (targetAccountId).' });
    }

    // Мапування originalSenderRole
    let mappedSenderType;
    if (originalSenderRole === 'admin') {
        mappedSenderType = 'admin';
    } else {
        mappedSenderType = 'user';
    }

    const conversationAccountId = (originalSenderRole === 'admin' && targetAccountId)
        ? parseInt(targetAccountId, 10)
        : senderAccountId;
    const receiverId = (originalSenderRole === 'admin' && targetAccountId)
        ? parseInt(targetAccountId, 10)
        : null;

    if (isNaN(conversationAccountId) || (receiverId !== null && isNaN(receiverId))) {
        return res.status(400).json({ success: false, error: 'Некоректний ID одержувача.' });
    }

    try {
        // Використовуємо wsBroadcaster для обробки та розсилки, щоб логіка була в одному місці
        if (req.wsBroadcaster && req.wsBroadcaster.processAndRelayHttpMessage) {
            const messagePayloadFromHttp = {
                text: text.trim(),
                targetAccountId: (originalSenderRole === 'admin') ? conversationAccountId : undefined,
                senderAccountId: senderAccountId,
                senderRole: originalSenderRole // processAndRelayHttpMessage очікує оригінальну роль
            };
            const processedMessage = await req.wsBroadcaster.processAndRelayHttpMessage(messagePayloadFromHttp);
            res.status(201).json({
                success: true,
                message: 'Повідомлення успішно відправлено (через WS логіку).',
                data: processedMessage
            });
        } else {
            // Резервний варіант, якщо processAndRelayHttpMessage недоступний (маловірогідно)
            // Або якщо ви хочете залишити пряму вставку для HTTP ендпоінту
            console.warn("wsBroadcaster.processAndRelayHttpMessage не знайдено, виконується пряма вставка (HTTP /message)");
            const [result] = await db.query(
                "INSERT INTO support_messages (sender_type, sender_id, account_id, message_text, receiver_id, timestamp, is_read) VALUES (?, ?, ?, ?, ?, NOW(), 0)",
                [mappedSenderType, senderAccountId, conversationAccountId, text.trim(), receiverId]
            );
            if (result.insertId) {
                 const [rows] = await db.query("SELECT * FROM support_messages WHERE message_id = ?", [result.insertId]);
                 const newMessage = rows[0];
                 // Тут можна додати логіку сповіщення через WebSocket, якщо потрібно, але краще централізувати її
                 res.status(201).json({
                     success: true,
                     message: 'Повідомлення успішно відправлено (HTTP, пряма вставка).',
                     data: { ...newMessage, timestamp: new Date(newMessage.timestamp).toISOString() }
                 });
            } else {
                throw new Error('Не вдалося зберегти повідомлення через HTTP');
            }
        }
    } catch (error) {
        console.error('Помилка надсилання HTTP повідомлення:', error);
        res.status(500).json({ success: false, error: 'Не вдалося відправити повідомлення (HTTP)' });
    }
});

module.exports = router;
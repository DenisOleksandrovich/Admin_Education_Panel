const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

router.post('/message', authenticateToken, async (req, res) => {
    const { message } = req.body;
    const senderAccountId = req.user.accountId;
    const senderRole = req.user.role;

    if (!message || message.trim() === '') {
        return res.status(400).json({ success: false, error: 'Повідомлення не може бути порожнім.' });
    }

    if (senderRole !== 'student' && senderRole !== 'supervisor' && senderRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Ваша роль не має дозволу на відправку повідомлень підтримки.' });
    }

    try {
        const query = `
            INSERT INTO support_messages 
            (sender_type, sender_id, account_id, message_text, timestamp, is_read) 
            VALUES (?, ?, ?, ?, NOW(), ?)
        `;
        const [result] = await db.query(query, ['user', senderAccountId, senderAccountId, message.trim(), false]);

        if (result.insertId) {
            console.log(`Support message from Account ID ${senderAccountId} (Role: ${senderRole}) saved with ID: ${result.insertId}`);
            res.status(201).json({ 
                success: true, 
                message: 'Дякуємо! Ваше повідомлення отримано. Ми зв\'яжемося з вами найближчим часом.',
                messageId: result.insertId 
            });
        } else {
            throw new Error('Не вдалося зберегти повідомлення.');
        }

    } catch (error) {
        console.error('Server error saving support message:', error);
        res.status(500).json({ success: false, error: 'Помилка сервера при збереженні вашого повідомлення.' });
    }
});

router.get('/messages', authenticateToken, async (req, res) => {
    const userAccountId = req.user.accountId;

    try {
        const query = `
            SELECT message_id, sender_type, sender_id, message_text, timestamp, is_read 
            FROM support_messages 
            WHERE account_id = ? 
            ORDER BY timestamp ASC
        `;
        const [messages] = await db.query(query, [userAccountId]);

        res.json({ success: true, messages: messages });

    } catch (error) {
        console.error(`Error fetching support messages for account ${userAccountId}:`, error);
        res.status(500).json({ success: false, error: 'Помилка сервера при завантаженні повідомлень.' });
    }
});

module.exports = router;
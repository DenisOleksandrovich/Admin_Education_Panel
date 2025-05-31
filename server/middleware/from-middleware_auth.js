const jwt = require('jsonwebtoken');
const db = require('../db'); // Подключаем базу данных
const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secure_secret_key_here_replace_this!';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log('Auth middleware: No token provided');
        return res.status(401).json({ success: false, error: 'Доступ неавторизовано: Токен не надано' });
    }

    jwt.verify(token, JWT_SECRET, async (err, userPayload) => {
        if (err) {
            console.log('Auth middleware: Invalid token', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, error: 'Доступ неавторизовано: Термін дії токена закінчився', reason: 'token_expired' });
            }
            return res.status(403).json({ success: false, error: 'Доступ заборонено: Недійсний токен', reason: 'invalid_token' });
        }

        let connection;
        try {
            connection = await db.getConnection();
            const [accounts] = await connection.query(
                'SELECT is_active FROM accounts WHERE account_id = ? LIMIT 1',
                [userPayload.accountId] 
            );
            connection.release();

            if (accounts.length === 0) {
                console.warn(`Auth middleware: Account not found for ID: ${userPayload.accountId}`);
                return res.status(401).json({ success: false, error: 'Доступ неавторизовано: Акаунт не знайдено', reason: 'account_not_found' });
            }

            const account = accounts[0];
            if (!account.is_active) {
                // Аккаунт был деактивирован
                console.warn(`Auth middleware: Access denied for inactive account ID: ${userPayload.accountId}`);
                return res.status(403).json({ success: false, error: 'Доступ заборонено: Ваш обліковий запис деактивовано', reason: 'account_inactive' });
            }

            console.log('Decoded Token Payload in Middleware:', userPayload);
            req.user = userPayload; // Прикрепляем payload к запросу
            console.log('Auth middleware: Token verified for user:', req.user?.email, 'Role:', req.user?.role);
            next(); 

        } catch (dbError) {
            if (connection) connection.release();
            console.error('Auth middleware: Database error checking account status:', dbError);
            return res.status(500).json({ success: false, error: 'Помилка сервера під час перевірки статусу акаунта' });
        }
    });
};

module.exports = authenticateToken;

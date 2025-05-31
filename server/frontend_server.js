const express = require('express');
const path = require('path');
// const fs = require('fs'); // fs is not strictly needed for this simplified version

const app = express();
const PORT_FRONTEND = 8000;

const projectRoot = path.join(__dirname, '..');

// 1. Serve static files from the project root
app.use(express.static(projectRoot));

// 2. Custom 404 error handler for the frontend
app.use((req, res, next) => {
    console.log(`[FRONTEND SERVER] REACHED CUSTOM 404 HANDLER for path: ${req.originalUrl}`);
    const status = 404;
    const clientMessage = `Тестова 404: Сторінку '${req.originalUrl}' не знайдено на сервері 8000.`;

    // Спробуємо спочатку просто відправити файл, без redirect
    // Переконайтеся, що frontend_error.html знаходиться в projectRoot
    const errorPagePath = path.join(projectRoot, 'frontend_error.html');
    
    // Перевіримо, чи файл існує перед відправкою (для діагностики)
    require('fs').access(errorPagePath, require('fs').constants.F_OK, (err) => {
        if (err) {
            console.error(`[FRONTEND SERVER] ERROR: frontend_error.html not found at ${errorPagePath}`);
            // Якщо навіть сторінка помилки не знайдена, віддаємо простий текст
            return res.status(404).send('404 - Page Not Found (custom error page also missing)');
        }
        console.log(`[FRONTEND SERVER] Attempting to send ${errorPagePath}`);
        res.status(status).sendFile(errorPagePath);
    });
});

// 3. Custom generic error handler for the frontend server (5xx)
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const clientMessage = err.clientMessage || 'На сайті сталася внутрішня помилка. Спробуйте оновити сторінку.';
    console.error(`[FRONTEND SERVER ERROR ${status}] Path: ${req.originalUrl}, Message: ${err.message}, Stack: ${err.stack || 'N/A'}`);
    if (res.headersSent) {
        return next(err);
    }
    // Similar to 404, check if JSON response is more appropriate
    if (req.path.startsWith('/api/') || req.accepts(['html', 'json']) === 'json') {
        return res.status(status).json({
            error: err.name || 'Internal Server Error',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
    res.status(status).redirect(`/frontend_error.html?status=${status}&message=${encodeURIComponent(clientMessage)}`);
});

app.listen(PORT_FRONTEND, () => {
  console.log(`Frontend static server (порт 8000) успішно запущено на http://localhost:${PORT_FRONTEND}`);
});
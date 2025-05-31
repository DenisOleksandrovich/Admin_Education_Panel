// multerConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Путь к папке uploads относительно корня проекта (где находится server.js)
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

module.exports = upload; // Экспортируем настроенный экземпляр multer
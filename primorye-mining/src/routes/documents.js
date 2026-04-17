const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Op } = require('sequelize');
const { Document, Broadcast, Recipient, Company } = require('../models');
const { authenticate, isAdmin } = require('../middleware/auth');
const { generatePDFWithStamp } = require('../services/pdfService');
const { addBroadcastToQueue } = require('../services/queueService');

const router = Router();

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_PATH || './uploads';
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый формат файла'));
    }
  }
});

// Получение списка документов (с фильтрацией по вкладкам)
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    
    const whereClause = {};
    if (category && ['document', 'event', 'alert'].includes(category)) {
      whereClause.category = category;
    }
    
    const documents = await Document.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });
    
    res.json({
      documents: documents.rows,
      total: documents.count,
      page: parseInt(page),
      pages: Math.ceil(documents.count / parseInt(limit))
    });
    
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Ошибка получения документов' });
  }
});

// Получение конкретного документа
router.get('/:id', authenticate, async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Документ не найден' });
    }
    
    res.json(document);
    
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Ошибка получения документа' });
  }
});

// Создание документа (только админ)
router.post('/', authenticate, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const { title, content, importance = 'normal', category = 'document', sphereFilter } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Тема и текст обязательны' });
    }
    
    // Создаем документ
    const document = await Document.create({
      title,
      content,
      importance,
      category,
      file_path: req.file ? req.file.path : null,
      sender_email: req.user.email
    });
    
    // Генерируем PDF со штампом и QR-кодом
    if (req.file) {
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      const pdfPath = await generatePDFWithStamp(document, req.file.path, uploadDir);
      await document.update({ pdf_path: pdfPath });
    } else {
      // Если файла нет, генерируем PDF только с текстом
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      const pdfPath = await generatePDFWithStamp(document, null, uploadDir);
      await document.update({ pdf_path: pdfPath });
    }
    
    // Если это рассылка, создаем запись в broadcasts
    if (sphereFilter) {
      const spheres = typeof sphereFilter === 'string' 
        ? JSON.parse(sphereFilter) 
        : sphereFilter;
      
      const broadcast = await Broadcast.create({
        document_id: document.id,
        sphere_filter: spheres,
        status: 'pending'
      });
      
      // Добавляем в очередь на отправку
      await addBroadcastToQueue(broadcast.id);
      
      res.status(201).json({
        success: true,
        message: 'Документ создан и рассылка добавлена в очередь',
        document,
        broadcast
      });
    } else {
      res.status(201).json({
        success: true,
        message: 'Документ создан',
        document
      });
    }
    
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Ошибка создания документа' });
  }
});

// Превью рассылки (подсчет получателей)
router.post('/preview', authenticate, isAdmin, async (req, res) => {
  try {
    const { sphereFilter } = req.body;
    
    const spheres = typeof sphereFilter === 'string' 
      ? JSON.parse(sphereFilter) 
      : sphereFilter;
    
    // Формируем запрос для подсчета
    const whereClause = {
      company_id: {
        [Op.in]: sequelize.literal(`(
          SELECT id FROM companies 
          WHERE is_active = true
          ${spheres && spheres.length > 0 
            ? `AND sphere IN (${spheres.map(s => `'${s}'`).join(',')})`
            : ''
          }
        )`)
      }
    };
    
    const recipients = await Recipient.findAll({
      where: whereClause,
      include: [{
        model: Company,
        as: 'company',
        where: { is_active: true }
      }],
      attributes: ['id', 'email', 'company_id']
    });
    
    // Группируем по компаниям
    const companyIds = new Set(recipients.map(r => r.company_id));
    const includedCount = companyIds.size;
    const recipientCount = recipients.length;
    
    // Подсчет исключенных (если выбраны не все сферы)
    let excludedCount = 0;
    if (spheres && spheres.length > 0) {
      const allRecipients = await Recipient.count({
        include: [{
          model: Company,
          as: 'company',
          where: { is_active: true }
        }]
      });
      excludedCount = allRecipients - recipientCount;
    }
    
    res.json({
      willSend: includedCount,
      recipientCount,
      excluded: excludedCount,
      message: `Будет отправлено: ${includedCount} компаний, ${excludedCount} исключено`
    });
    
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: 'Ошибка подсчета получателей' });
  }
});

// Скачивание PDF версии документа
router.get('/:id/pdf', authenticate, async (req, res) => {
  try {
    const document = await Document.findByPk(req.params.id);
    
    if (!document || !document.pdf_path) {
      return res.status(404).json({ error: 'PDF версия не найдена' });
    }
    
    res.download(document.pdf_path, `${document.title}.pdf`);
    
  } catch (error) {
    console.error('Download PDF error:', error);
    res.status(500).json({ error: 'Ошибка скачивания PDF' });
  }
});

module.exports = router;

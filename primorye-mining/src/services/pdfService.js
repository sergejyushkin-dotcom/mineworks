const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');

// Генерация PDF с наложением штампа и QR-кода
const generatePDFWithStamp = async (document, originalFilePath, outputDir) => {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margins: { top: 50, bottom: 50, left: 50, right: 50 } 
  });
  
  const fileName = `doc_${document.id}_${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, fileName);
  
  // Создаем поток записи
  const stream = doc.pipe(fs.createWriteStream(outputPath));
  
  // Заголовок документа
  doc.fontSize(18).font('Helvetica-Bold').text(document.title, { align: 'center' });
  doc.moveDown(1);
  
  // Мета-информация
  doc.fontSize(10).font('Helvetica').text(`Категория: ${document.category}`, { align: 'left' });
  doc.text(`Важность: ${document.importance === 'urgent' ? 'СРОЧНО' : 'Обычная'}`, { align: 'left' });
  doc.text(`Дата создания: ${new Date(document.createdAt).toLocaleDateString('ru-RU')}`, { align: 'left' });
  doc.moveDown(1);
  
  // Разделительная линия
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);
  
  // Основной текст
  doc.fontSize(12).font('Helvetica').text(document.content, { align: 'justify' });
  doc.moveDown(2);
  
  // Если есть оригинальный файл, добавляем информацию о нем
  if (originalFilePath) {
    doc.fontSize(10).font('Helvetica-Oblique').text(`Прикрепленный файл: ${path.basename(originalFilePath)}`, { align: 'left' });
    doc.moveDown(1);
  }
  
  // Генерация QR-кода для проверки подлинности
  const verificationUrl = `${process.env.BASE_URL}/api/documents/verify/${document.id}`;
  const qrCodeDataUri = await QRCode.toDataURL(verificationUrl);
  
  // Позиция для QR-кода (внизу справа)
  const qrSize = 100;
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;
  
  // Добавляем изображение QR-кода
  doc.image(qrCodeDataUri, pageWidth - 150, pageHeight - 150, { width: qrSize, height: qrSize });
  
  // Штамп "Электронный документ. Приморский край"
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a3a52');
  doc.text('ЭЛЕКТРОННЫЙ ДОКУМЕНТ', pageWidth - 150, pageHeight - 100, { width: 100, align: 'center' });
  doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
  doc.text('ПРИМОРСКИЙ КРАЙ', pageWidth - 150, pageHeight - 85, { width: 100, align: 'center' });
  doc.fontSize(7).fillColor('#999');
  doc.text(`ID: ${document.id}`, pageWidth - 150, pageHeight - 70, { width: 100, align: 'center' });
  
  // Завершаем генерацию PDF
  doc.end();
  
  // Возвращаем промис, который разрешится после завершения записи
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
};

// Конвертация загруженного файла в PDF (если это не PDF)
const convertToPDF = async (inputPath, outputDir) => {
  const ext = path.extname(inputPath).toLowerCase();
  
  // Если файл уже PDF, просто копируем его
  if (ext === '.pdf') {
    const fileName = `attachment_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);
    await fs.copyFile(inputPath, outputPath);
    return outputPath;
  }
  
  // Для других форматов (DOC, DOCX) - заглушка
  // В продакшене здесь нужно использовать библиотеки типа mammoth или external сервис
  throw new Error(`Конвертация формата ${ext} требует дополнительного сервиса`);
};

module.exports = {
  generatePDFWithStamp,
  convertToPDF
};

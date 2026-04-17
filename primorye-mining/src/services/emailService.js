const nodemailer = require('nodemailer');

// Настройка почтового транспорта
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Отправка Magic Link
const sendMagicLink = async (email, token) => {
  const transporter = createTransporter();
  const verifyUrl = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Приморский Горный Вестник" <noreply@primvestnik.ru>',
    to: email,
    subject: 'Вход в систему Приморский Горный Вестник',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a3a52; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #d4a017; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px;
            font-weight: bold;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Приморский Горный Вестник</h1>
          </div>
          <div class="content">
            <p>Здравствуйте!</p>
            <p>Вы запросили вход в систему коммуникации предприятий горной промышленности Приморского края.</p>
            <p>Нажмите на кнопку ниже для входа:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" class="button">Войти в систему</a>
            </p>
            <p>Или скопируйте ссылку в браузер:</p>
            <p style="word-break: break-all; color: #1a3a52;">${verifyUrl}</p>
            <p><strong>Внимание:</strong> Ссылка действительна в течение 15 минут.</p>
            <p>Если вы не запрашивали вход, просто проигнорируйте это письмо.</p>
          </div>
          <div class="footer">
            <p>© 2024 Приморский Горный Вестник. Платформа для связи с горняками Приморья.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Отправка уведомления о новом документе
const sendDocumentNotification = async (recipientEmail, documentTitle, category) => {
  const transporter = createTransporter();
  const documentUrl = `${process.env.BASE_URL}/documents`;

  const categoryNames = {
    document: 'Входящие документы',
    event: 'Приглашения на мероприятия',
    alert: 'Важные оповещения'
  };

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Приморский Горный Вестник" <noreply@primvestnik.ru>',
    to: recipientEmail,
    subject: `Новое сообщение: ${documentTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a3a52; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; background: #f9f9f9; }
          .badge { 
            display: inline-block; 
            padding: 4px 12px; 
            background: #d4a017; 
            color: white; 
            border-radius: 4px;
            font-size: 12px;
          }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background: #1a3a52; 
            color: white; 
            text-decoration: none; 
            border-radius: 4px;
          }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Приморский Горный Вестник</h1>
          </div>
          <div class="content">
            <p>Здравствуйте!</p>
            <p>Вам поступило новое сообщение в категории 
               <span class="badge">${categoryNames[category] || category}</span>
            </p>
            <h3>${documentTitle}</h3>
            <p>Войдите в систему для просмотра документа.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${documentUrl}" class="button">Перейти к документам</a>
            </p>
          </div>
          <div class="footer">
            <p>© 2024 Приморский Горный Вестник.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendMagicLink,
  sendDocumentNotification
};

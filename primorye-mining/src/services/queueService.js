const { Queue, Worker } = require('bullmq');
const { Op } = require('sequelize');
const { Recipient, Company, Broadcast, Document } = require('../models');
const { sendDocumentNotification } = require('./emailService');

// Создание очереди рассылок
const broadcastQueue = new Queue('broadcast-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379
  }
});

// Обработчик задач рассылки
const createBroadcastWorker = () => {
  const worker = new Worker(
    'broadcast-queue',
    async (job) => {
      const { broadcastId } = job.data;
      
      console.log(`📬 Обработка рассылки #${broadcastId}`);
      
      // Получаем информацию о рассылке
      const broadcast = await Broadcast.findByPk(broadcastId, {
        include: [{ model: Document, as: 'document' }]
      });
      
      if (!broadcast) {
        throw new Error(`Рассылка #${broadcastId} не найдена`);
      }
      
      // Обновляем статус
      await broadcast.update({ status: 'sending' });
      
      // Формируем запрос для выборки получателей
      const whereClause = {
        company_id: {
          [Op.in]: sequelize.literal(`(
            SELECT id FROM companies 
            WHERE is_active = true
            ${broadcast.sphere_filter && broadcast.sphere_filter.length > 0 
              ? `AND sphere IN (${broadcast.sphere_filter.map(s => `'${s}'`).join(',')})`
              : ''
            }
          )`)
        }
      };
      
      // Получаем всех получателей по фильтру
      const recipients = await Recipient.findAll({
        where: whereClause,
        include: [{
          model: Company,
          as: 'company',
          where: { is_active: true }
        }]
      });
      
      console.log(`📧 Отправка ${recipients.length} получателям`);
      
      // Отправляем письма каждому получателю
      let successCount = 0;
      for (const recipient of recipients) {
        try {
          await sendDocumentNotification(
            recipient.email,
            broadcast.document.title,
            broadcast.document.category
          );
          successCount++;
          
          // Небольшая задержка чтобы не спамить
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Ошибка отправки ${recipient.email}:`, error.message);
        }
      }
      
      // Обновляем статус рассылки
      await broadcast.update({
        status: 'completed',
        recipient_count: successCount
      });
      
      console.log(`✅ Рассылка завершена. Успешно: ${successCount}/${recipients.length}`);
      
      return { success: true, sent: successCount, total: recipients.length };
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
      },
      concurrency: 2 // Параллельно обрабатываем 2 рассылки
    }
  );
  
  worker.on('completed', (job, result) => {
    console.log(`Задача #${job.id} выполнена:`, result);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Задача #${job?.id} провалена:`, err);
    
    // Обновляем статус рассылки на failed
    if (job?.data?.broadcastId) {
      Broadcast.update(
        { status: 'pending' }, // Возвращаем в pending для повторной попытки
        { where: { id: job.data.broadcastId } }
      );
    }
  });
  
  return worker;
};

// Добавление задачи в очередь
const addBroadcastToQueue = async (broadcastId) => {
  await broadcastQueue.add('send-broadcast', { broadcastId }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    }
  });
  
  console.log(`📮 Рассылка #${broadcastId} добавлена в очередь`);
};

// Получение статистики очереди
const getQueueStats = async () => {
  const waiting = await broadcastQueue.getWaitingCount();
  const active = await broadcastQueue.getActiveCount();
  const completed = await broadcastQueue.getCompletedCount();
  const failed = await broadcastQueue.getFailedCount();
  
  return { waiting, active, completed, failed };
};

module.exports = {
  broadcastQueue,
  createBroadcastWorker,
  addBroadcastToQueue,
  getQueueStats
};

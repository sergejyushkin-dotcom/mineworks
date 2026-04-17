/**
 * Скрипт инициализации базы данных
 * Создает тестовые компании и получателей для демонстрации
 */

const { sequelize, Company, Recipient } = require('../src/models');

const testCompanies = [
  {
    name: 'ООО "Приморский Уголь"',
    sphere: 'coal',
    official_domain: '@primcoal.ru',
    is_active: true
  },
  {
    name: 'АО "Дальнефтегаз"',
    sphere: 'oil_gas',
    official_domain: '@dalnegaz.ru',
    is_active: true
  },
  {
    name: 'ООО "Геосервис Приморье"',
    sphere: 'service',
    official_domain: '@geoservice.ru',
    is_active: true
  },
  {
    name: 'ЗАО "Угольная Компания Востока"',
    sphere: 'coal',
    official_domain: '@ukv.ru',
    is_active: true
  },
  {
    name: 'ООО "Нефть Приморья"',
    sphere: 'oil_gas',
    official_domain: '@neft-prim.ru',
    is_active: true
  }
];

const testRecipients = [
  {
    email: 'director@primcoal.ru',
    full_name: 'Иванов Петр Сергеевич',
    role: 'director'
  },
  {
    email: 'engineer@primcoal.ru',
    full_name: 'Сидоров Алексей Владимирович',
    role: 'engineer'
  },
  {
    email: 'director@dalnegaz.ru',
    full_name: 'Кузнецов Михаил Игоревич',
    role: 'director'
  },
  {
    email: 'ecologist@dalnegaz.ru',
    full_name: 'Петрова Анна Николаевна',
    role: 'ecologist'
  },
  {
    email: 'director@geoservice.ru',
    full_name: 'Смирнов Дмитрий Александрович',
    role: 'director'
  },
  {
    email: 'director@ukv.ru',
    full_name: 'Волков Сергей Петрович',
    role: 'director'
  },
  {
    email: 'engineer@ukv.ru',
    full_name: 'Морозова Елена Ивановна',
    role: 'engineer'
  },
  {
    email: 'director@neft-prim.ru',
    full_name: 'Новиков Андрей Павлович',
    role: 'director'
  }
];

async function initDatabase() {
  try {
    console.log('🔄 Инициализация базы данных...');
    
    // Синхронизация моделей
    await sequelize.sync({ alter: true });
    console.log('✓ Модели синхронизированы');
    
    // Очистка существующих данных (для демо)
    await Recipient.destroy({ where: {}, truncate: true, cascade: true });
    await Company.destroy({ where: {}, truncate: true, cascade: true });
    console.log('✓ Старые данные очищены');
    
    // Создание компаний
    const companies = [];
    for (const companyData of testCompanies) {
      const company = await Company.create(companyData);
      companies.push(company);
      console.log(`✓ Создана компания: ${company.name}`);
    }
    
    // Создание получателей
    for (let i = 0; i < testRecipients.length; i++) {
      const recipientData = testRecipients[i];
      const company = companies[i % companies.length];
      
      await Recipient.create({
        ...recipientData,
        company_id: company.id
      });
      
      console.log(`✓ Создан получатель: ${recipientData.email} (${company.name})`);
    }
    
    console.log('\n✅ База данных успешно инициализирована!');
    console.log('\nТестовые учетные записи:');
    console.log('─────────────────────────────────────');
    console.log('director@primcoal.ru - Угольная компания (Админ)');
    console.log('engineer@primcoal.ru - Угольная компания (Инженер)');
    console.log('director@dalnegaz.ru - Нефтегаз (Админ)');
    console.log('ecologist@dalnegaz.ru - Нефтегаз (Эколог)');
    console.log('director@geoservice.ru - Геосервис (Админ)');
    console.log('director@ukv.ru - Угольная компания 2 (Админ)');
    console.log('director@neft-prim.ru - Нефть Приморья (Админ)');
    console.log('─────────────────────────────────────');
    console.log('\nЗапустите сервер: npm start\n');
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Ошибка инициализации:', error);
    process.exit(1);
  }
}

initDatabase();

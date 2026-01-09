// ===== ДАННЫЕ О КОМПАНИЯХ =====
const companies = [
  {
    name: "Полюс",
    slug: "polyus",
    industry: ["gold"],
    regions: ["sakha", "kemerovo"],
    requirements: ["degree", "experience", "medbook", "no-experience-ok", "internship"],
    benefits: ["dms", "housing", "transport", "food", "relocation", "bonus"]
  },
  {
    name: "СУЭК",
    slug: "suek",
    industry: ["coal"],
    regions: ["kemerovo", "irkutsk", "sakhalin"],
    requirements: ["medbook", "shift", "no-experience-ok"],
    benefits: ["dms", "transport", "food", "bonus", "uniform"]
  },
  {
    name: "АЛРОСА",
    slug: "alrosa",
    industry: ["diamonds"],
    regions: ["sakha", "arkhangelsk"],
    requirements: ["degree", "experience", "medbook", "no-experience-ok", "internship"],
    benefits: ["dms", "housing", "transport", "relocation", "food", "childcare"]
  },
  {
    name: "Норникель",
    slug: "nornickel",
    industry: ["nickel", "copper", "platinum", "blasting"],
    regions: ["murmansk", "krasnoyarsk"],
    requirements: ["degree", "experience", "medbook", "shift", "english"],
    benefits: ["dms", "housing", "transport", "food", "relocation", "bonus", "northern"]
  },
  {
    name: "Мечел",
    slug: "mechel",
    industry: ["coal", "steel"],
    regions: ["kemerovo", "buryatia"],
    requirements: ["medbook", "shift", "no-experience-ok"],
    benefits: ["dms", "transport", "food", "uniform"]
  },
  {
    name: "УГМК",
    slug: "ugmk",
    industry: ["copper", "coal", "gold"],
    regions: ["sverdlovsk", "buryatia"],
    requirements: ["degree", "experience", "medbook", "no-experience-ok"],
    benefits: ["dms", "housing", "transport", "food", "relocation", "bonus"]
  },
  {
    name: "Колмар",
    slug: "kolmar",
    industry: ["coal"],
    regions: ["sakha"],
    requirements: ["medbook", "shift", "no-experience-ok", "driver"],
    benefits: ["dms", "housing", "transport", "food", "relocation"]
  },
  {
    name: "Еврохим — ВРК",
    slug: "eurochem-vrk",
    industry: ["blasting", "mining-services"],
    regions: ["belgorod", "kemerovo"],
    requirements: ["medbook", "shift", "driver", "no-experience-ok"],
    benefits: ["dms", "transport", "food", "uniform"]
  },
  {
    name: "ЯАК",
    slug: "yakutalmaz",
    industry: ["diamonds"],
    regions: ["sakha"],
    requirements: ["medbook", "shift", "no-experience-ok"],
    benefits: ["dms", "housing", "transport", "northern", "food"]
  },
  {
    name: "Славнефть",
    slug: "slavneft",
    industry: ["oil"],
    regions: ["khanty", "omsk"],
    requirements: ["degree", "experience", "medbook", "driver"],
    benefits: ["dms", "housing", "transport", "food", "bonus"]
  },
  {
    name: "Геодинамика",
    slug: "geodinamika",
    industry: ["blasting", "mining-services"],
    regions: ["moscow", "kemerovo", "sakha"],
    requirements: ["medbook", "shift", "driver", "no-experience-ok", "internship"],
    benefits: ["dms", "transport", "uniform", "training"]
  },
  {
    name: "Сибантрацит",
    slug: "sibanthracite",
    industry: ["coal"],
    regions: ["novosibirsk", "kemerovo"],
    requirements: ["medbook", "shift", "no-experience-ok"],
    benefits: ["dms", "transport", "food", "uniform"]
  }
];

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let activeIndustry = 'all';
let activeBenefits = new Set();
let activeRegions = new Set();
let activeRequirements = new Set();
let selectedCompanies = [];

// ===== ПОИСК ПО НАЗВАНИЮ =====
function searchCompany() {
  const query = document.getElementById('search')?.value.trim().toLowerCase();
  if (!query) {
    alert('Введите название компании');
    return;
  }

  const found = companies.find(c => c.name.toLowerCase().includes(query));
  if (found) {
    window.location.href = `company.html?name=${found.slug}`;
  } else {
    alert('Компания не найдена. Попробуйте: Полюс, СУЭК, АЛРОСА и др.');
  }
}

// ===== ОТРИСОВКА КОМПАНИЙ =====
function renderCompanies() {
  // Сброс выбора при обновлении списка (пункт 3)
  selectedCompanies = [];
  document.querySelectorAll('.compare-checkbox').forEach(cb => cb.checked = false);

  const container = document.getElementById('filtered-companies');
  if (!container) return;

  let filtered = companies;

  // Фильтр по отрасли
  if (activeIndustry !== 'all') {
    filtered = filtered.filter(c => c.industry.includes(activeIndustry));
  }

  // Фильтр по льготам
  if (activeBenefits.size > 0) {
    filtered = filtered.filter(c =>
      [...activeBenefits].every(b => c.benefits.includes(b))
    );
  }

  // Фильтр по регионам
  if (activeRegions.size > 0 && !activeRegions.has('all')) {
    filtered = filtered.filter(c =>
      [...activeRegions].some(r => c.regions.includes(r))
    );
  }

  // Фильтр по требованиям
  if (activeRequirements.size > 0) {
    filtered = filtered.filter(c =>
      [...activeRequirements].every(r => c.requirements.includes(r))
    );
  }

  // Отображение
  if (filtered.length === 0) {
    container.innerHTML = '<p class="no-results">Нет компаний, соответствующих фильтрам</p>';
  } else {
    container.innerHTML = filtered.map(c => `
      <div class="company-card-wrapper">
        <label class="company-card-label">
          <input type="checkbox" class="compare-checkbox" data-slug="${c.slug}">
          <span class="company-card-name">${c.name}</span>
        </label>
      </div>
    `).join('');

    // Новые обработчики чекбоксов
    document.querySelectorAll('.compare-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked && selectedCompanies.length >= 4) {
          alert('Можно выбрать максимум 4 компании для сравнения.');
          checkbox.checked = false;
          return;
        }

        const slug = checkbox.dataset.slug;
        const company = companies.find(c => c.slug === slug);
        if (checkbox.checked) {
          if (!selectedCompanies.some(c => c.slug === slug)) {
            selectedCompanies.push(company);
          }
        } else {
          selectedCompanies = selectedCompanies.filter(c => c.slug !== slug);
        }
      });
    });
  }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
  renderCompanies();
  setupIndustryFilters();
  setupBenefitFilters();
  setupRegionFilters();
  setupRequirementFilters();
  setupResetButton();
  setupCompareButton();
  initTooltips();
});

// ===== ФИЛЬТР: ОТРАСЛИ =====
function setupIndustryFilters() {
  document.querySelectorAll('#industry-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#industry-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeIndustry = btn.dataset.filter;
      renderCompanies();
    });
  });
}

// ===== ФИЛЬТР: ЛЬГОТЫ =====
function setupBenefitFilters() {
  document.querySelectorAll('#benefit-filters input').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const benefit = checkbox.dataset.benefit;
      if (checkbox.checked) {
        activeBenefits.add(benefit);
      } else {
        activeBenefits.delete(benefit);
      }
      renderCompanies();
    });
  });
}

// ===== ФИЛЬТР: РЕГИОНЫ =====
function setupRegionFilters() {
  document.querySelectorAll('#region-filters input').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const region = checkbox.dataset.region;

      if (region === 'all') {
        activeRegions.clear();
        if (checkbox.checked) {
          activeRegions.add('all');
          document.querySelectorAll('#region-filters input[data-region]:not([data-region="all"])').forEach(cb => {
            cb.checked = false;
          });
        }
      } else {
        const allCheckbox = document.querySelector('#region-filters input[data-region="all"]');
        if (allCheckbox) allCheckbox.checked = false;
        activeRegions.delete('all');

        if (checkbox.checked) {
          activeRegions.add(region);
        } else {
          activeRegions.delete(region);
        }
      }
      renderCompanies();
    });
  });
}

// ===== ФИЛЬТР: ТРЕБОВАНИЯ =====
function setupRequirementFilters() {
  document.querySelectorAll('#requirement-filters input').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const req = checkbox.dataset.req;
      if (checkbox.checked) {
        activeRequirements.add(req);
      } else {
        activeRequirements.delete(req);
      }
      renderCompanies();
    });
  });
}

// ===== КНОПКА: СБРОСИТЬ ВСЁ =====
function setupResetButton() {
  const resetBtn = document.getElementById('reset-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      activeIndustry = 'all';
      activeBenefits.clear();
      activeRegions.clear();
      activeRegions.add('all');
      activeRequirements.clear();

      // Сброс UI
      document.querySelectorAll('#industry-filters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'all');
      });
      document.querySelectorAll('#benefit-filters input').forEach(cb => cb.checked = false);
      document.querySelectorAll('#region-filters input').forEach(cb => {
        cb.checked = cb.dataset.region === 'all';
      });
      document.querySelectorAll('#requirement-filters input').forEach(cb => cb.checked = false);

      // Сброс выбора
      selectedCompanies = [];
      document.querySelectorAll('.compare-checkbox').forEach(cb => cb.checked = false);
    });
  }
}

// ===== КНОПКА: СРАВНЕНИЕ =====
function setupCompareButton() {
  const compareBtn = document.getElementById('compare-btn');
  if (compareBtn) {
    compareBtn.addEventListener('click', () => {
      if (selectedCompanies.length < 2) {
        alert('Выберите минимум 2 компании для сравнения.');
        return;
      }
      localStorage.setItem('companiesToCompare', JSON.stringify(selectedCompanies));
      window.location.href = 'compare.html';
    });
  }
}

// ===== ПОДСКАЗКИ (TOOLTIPS) =====
function initTooltips() {
  const tooltipData = {
    'medbook': 'Санитарная книжка для работы в условиях повышенных требований к здоровью',
    'shift': 'Готовность работать по вахтовому методу (например, 15/15 или 30/30)',
    'no-experience-ok': 'Компания рассматривает кандидатов без опыта — возможно обучение на месте',
    'internship': 'Доступны стажировки для студентов и выпускников',
    'northern': 'Надбавки за работу в районах Крайнего Севера и приравненных к ним местностях',
    'dms': 'Добровольное медицинское страхование (часто включает стоматологию и профосмотры)',
    'housing': 'Предоставление жилья или компенсация аренды (особенно для вахтовиков)'
  };

  Object.keys(tooltipData).forEach(key => {
    const elements = document.querySelectorAll(`[data-benefit="${key}"], [data-req="${key}"]`);
    elements.forEach(el => {
      const label = el.closest('label');
      if (label) {
        label.title = tooltipData[key];
        label.style.cursor = 'help';
      }
    });
  });
}

// ===== УПРАВЛЕНИЕ ВЫДВИЖНОЙ ПАНЕЛЬЮ =====
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const openBtn = document.getElementById('open-sidebar');
  const closeBtn = document.getElementById('close-sidebar');

  if (!sidebar || !overlay || !openBtn || !closeBtn) return;

  // Открыть
  openBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  // Закрыть (кнопка)
  closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  // Закрыть при клике на подложку
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });
});
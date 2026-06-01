// Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Data
let userData = {};
let currentRole = 'business';

// DOM Elements
const screens = document.querySelectorAll('.screen');
const bottomNav = document.querySelectorAll('.bottom-nav button');
const menuCards = document.querySelectorAll('.menu-card');

// ============================================
// NAVIGATION
// ============================================

function showScreen(screenId) {
    screens.forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    
    bottomNav.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === screenId);
    });
    
    window.scrollTo(0, 0);
}

// Bottom Nav
bottomNav.forEach(btn => {
    btn.addEventListener('click', () => {
        showScreen(btn.dataset.screen);
    });
});

// Menu Cards
menuCards.forEach(card => {
    card.addEventListener('click', () => {
        const targetScreen = card.dataset.screen;
        showScreen(targetScreen);
    });
});

// Back Buttons
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showScreen('homeScreen');
    });
});

// ============================================
// USER DATA
// ============================================

function loadUserData() {
    const user = tg.initDataUnsafe.user;
    
    if (user) {
        userData = {
            id: user.id,
            username: user.username || 'Не указан',
            name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
            level: 1,
            messages: 0,
            premium: false
        };
        
        // Update Profile
        document.getElementById('welcomeName').textContent = `Привет, ${user.first_name}! 👋`;
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileId').textContent = user.id;
        document.getElementById('profileUsername').textContent = userData.username;
        document.getElementById('avatarLetter').textContent = user.first_name[0].toUpperCase();
        
        // Load from users.json via bot
        fetch(`/api/user/${user.id}`)
            .then(r => r.json())
            .then(data => {
                if (data) {
                    userData = { ...userData, ...data };
                    updateProfileDisplay();
                }
            })
            .catch(() => {});
    }
}

function updateProfileDisplay() {
    document.getElementById('profileId').textContent = userData.id;
    document.getElementById('profileUsername').textContent = userData.username;
}

// ============================================
// AI CHAT
// ============================================

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const roleBtns = document.querySelectorAll('.role-btn');

// Role Selection
roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        roleBtns.forEach(b => b.classList.remove('active-role'));
        btn.classList.add('active-role');
        currentRole = btn.dataset.role;
    });
});

// Chat Templates
const chatResponses = {
    business: {
        'привет': '👋 Привет! Я твой бизнес-помощник. Чем могу помочь?',
        'идея': '💡 Вот идея: Создай SaaS для автоматизации рутинных задач малого бизнеса. Например, автоматическая генерация отчетов или управление задачами.',
        'стартап': '🚀 Для стартапа важно: 1) Найди проблему 2) Создай MVP 3) Протестируй 4) Масштабируй. Начни с малого!',
        'деньги': '💰 Способы монетизации: подписка, freemium, партнерки, реклама. Выбери что подходит твоей аудитории.',
        'default': '💼 Бизнес-совет: Фокусируйся на одной нише. Лучше быть лучшим в узкой области, чем средним во всем.'
    },
    marketing: {
        'привет': '👋 Привет! Я маркетолог COSMIRA. Готов помочь с продвижением!',
        'трафик': '📈 Источники трафика: Telegram, Instagram, TikTok, SEO, контекст. Тестируй разные каналы!',
        'контент': '✍️ Контент-план: 80% пользы, 20% продаж. Давай ценность — получишь доверие.',
        'default': '📊 Маркетинг — это тесты. A/B тестируй всё: заголовки, картинки, призывы к действию.'
    },
    developer: {
        'привет': '👋 Привет! Я программист. Какой стек используешь?',
        'python': '🐍 Python — отличный выбор! Aiogram для ботов, FastAPI для веба, Django для сложных проектов.',
        'javascript': '⚡ JS: Node.js для бэкенда, React/Vue для фронта. TypeScript добавит надежности.',
        'бот': '🤖 Для Telegram бота: Aiogram 3 (Python) или Telegraf (Node.js). Начни с простого!',
        'default': '💻 Совет разработчика: Пиши чистый код с первого дня. Рефакторинг потом будет дороже.'
    },
    startup: {
        'привет': '🚀 Привет! Строим стартап вместе. Какая у тебя идея?',
        'mvp': '🎯 MVP — это минимальный продукт. Сделай только core-функцию. Остальное потом.',
        'инвестор': '💵 Инвесторы смотрят: команда, рынок, продукт, traction. Покажи рост!',
        'default': '🌟 Стартап — это марафон. Будь готов к пивотам (смене направления). Главное — не сдавайся!'
    }
};

function addMessage(text, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = isUser ? '👤' : '🤖';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'chat-text';
    textDiv.textContent = text;
    
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(textDiv);
    chatBox.appendChild(msgDiv);
    
    chatBox.scrollTop = chatBox.scrollHeight;
}

function getResponse(text, role) {
    text = text.toLowerCase();
    const responses = chatResponses[role];
    
    for (let key in responses) {
        if (text.includes(key)) {
            return responses[key];
        }
    }
    
    return responses['default'];
}

function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    userInput.value = '';
    
    // Simulate AI thinking
    setTimeout(() => {
        const response = getResponse(text, currentRole);
        addMessage(response, false);
    }, 600);
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// ============================================
// HOROSCOPE
// ============================================

const zodiacSelect = document.getElementById('zodiacSelect');
const showHoroscopeBtn = document.getElementById('showHoroscope');
const horoscopeResult = document.getElementById('horoscopeResult');

const horoscopeData = {
    '♈ Овен': {
        general: 'Сегодня твой день! Действуй смело и решительно.',
        love: 'В любви возможна неожиданная встреча.',
        career: 'На работе ждёт успех в новых проектах.',
        energy: 'Энергия на высоте — используй её!'
    },
    '♉ Телец': {
        general: 'День стабильности и спокойствия.',
        love: 'Гармония в отношениях. Удели время близким.',
        career: 'Финансовая удача. Возможна премия.',
        energy: 'Средний уровень. Не переутомляйся.'
    },
    '♊ Близнецы': {
        general: 'День общения и новых знакомств.',
        love: 'Лёгкость в отношениях. Флирт и романтика.',
        career: 'Идеи льются рекой. Записывай!',
        energy: 'Высокая активность. Успей всё!'
    },
    '♋ Рак': {
        general: 'День интуиции и эмоций.',
        love: 'Глубокие чувства. Откровенный разговор.',
        career: 'Доверься интуиции в делах.',
        energy: 'Береги силы. Отдых важен.'
    },
    '♌ Лев': {
        general: 'Твой день сияния! Будь в центре внимания.',
        love: 'Страсть и романтика. Яркие эмоции.',
        career: 'Признание твоих заслуг. Гордись собой!',
        energy: 'Энергия бьёт ключом. Твори!'
    },
    '♍ Дева': {
        general: 'День порядка и системности.',
        love: 'Практичность в чувствах. Забота о партнёре.',
        career: 'Внимание к деталям принесёт результат.',
        energy: 'Стабильный уровень. Работай по плану.'
    },
    '♎ Весы': {
        general: 'День гармонии и баланса.',
        love: 'Романтика и нежность. Идеальный день для свидания.',
        career: 'Партнёрство выгодно. Ищи союзников.',
        energy: 'Спокойная энергия. Наслаждайся моментом.'
    },
    '♏ Скорпион': {
        general: 'День трансформации и глубины.',
        love: 'Интенсивные чувства. Страсть зашкаливает.',
        career: 'Разгадаешь тайну конкурентов.',
        energy: 'Мощная энергия. Используй мудро.'
    },
    '♐ Стрелец': {
        general: 'День приключений и открытий.',
        love: 'Лёгкость и оптимизм. Смех сближает.',
        career: 'Новые горизонты. Расширяй границы!',
        energy: 'Оптимизм даёт силы. Вперёд!'
    },
    '♑ Козерог': {
        general: 'День дисциплины и целей.',
        love: 'Надёжность и верность. Крепкие узы.',
        career: 'Упорство приведёт к вершине.',
        energy: 'Выносливость — твоя сила.'
    },
    '♒ Водолей': {
        general: 'День инноваций и идей.',
        love: 'Нестандартный подход удивит.',
        career: 'Технологии на твоей стороне.',
        energy: 'Нестабильная, но креативная.'
    },
    '♓ Рыбы': {
        general: 'День мечтаний и вдохновения.',
        love: 'Романтика и нежность. Поэзия чувств.',
        career: 'Интуиция подскажет путь.',
        energy: 'Тонкая энергия. Творчество.'
    }
};

showHoroscopeBtn.addEventListener('click', () => {
    const sign = zodiacSelect.value;
    const data = horoscopeData[sign];
    
    if (data) {
        horoscopeResult.innerHTML = `
            <div class="result-box">
                <strong>📅 Общий прогноз:</strong><br>
                ${data.general}<br><br>
                
                <strong>❤️ Любовь:</strong><br>
                ${data.love}<br><br>
                
                <strong>💼 Карьера:</strong><br>
                ${data.career}<br><br>
                
                <strong>⚡ Энергия:</strong><br>
                ${data.energy}
            </div>
        `;
    }
});

// ============================================
// COMPATIBILITY
// ============================================

const sign1 = document.getElementById('sign1');
const sign2 = document.getElementById('sign2');
const checkCompatBtn = document.getElementById('checkCompatibility');
const compatResult = document.getElementById('compatibilityResult');

const compatibilityMatrix = {
    'Овен': { 'Лев': 90, 'Стрелец': 85, 'Весы': 70, 'Близнецы': 75 },
    'Телец': { 'Дева': 90, 'Козерог': 85, 'Рак': 80, 'Рыбы': 70 },
    'Близнецы': { 'Весы': 90, 'Водолей': 85, 'Овен': 75, 'Лев': 70 },
    'Рак': { 'Скорпион': 90, 'Рыбы': 85, 'Телец': 80, 'Дева': 75 },
    'Лев': { 'Овен': 90, 'Стрелец': 85, 'Близнецы': 70, 'Весы': 75 },
    'Дева': { 'Телец': 90, 'Козерог': 85, 'Рак': 75, 'Скорпион': 70 },
    'Весы': { 'Близнецы': 90, 'Водолей': 85, 'Лев': 75, 'Стрелец': 70 },
    'Скорпион': { 'Рак': 90, 'Рыбы': 85, 'Дева': 70, 'Козерог': 75 },
    'Стрелец': { 'Овен': 85, 'Лев': 85, 'Весы': 70, 'Водолей': 75 },
    'Козерог': { 'Телец': 85, 'Дева': 85, 'Рыбы': 70, 'Скорпион': 75 },
    'Водолей': { 'Близнецы': 85, 'Весы': 85, 'Стрелец': 75, 'Овен': 70 },
    'Рыбы': { 'Рак': 85, 'Скорпион': 85, 'Телец': 70, 'Козерог': 70 }
};

checkCompatBtn.addEventListener('click', () => {
    const s1 = sign1.value;
    const s2 = sign2.value;
    
    if (s1 === s2) {
        compatResult.innerHTML = `
            <div class="compatibility-score">100%</div>
            <p>Идеальная совместимость с самим собой! 💫</p>
        `;
        return;
    }
    
    let score = compatibilityMatrix[s1]?.[s2] || compatibilityMatrix[s2]?.[s1] || 65;
    
    let message = '';
    if (score >= 85) message = '🔥 Отличная совместимость! Вы дополняете друг друга.';
    else if (score >= 75) message = '✨ Хорошая совместимость. Есть потенциал!';
    else if (score >= 65) message = '⚖️ Средняя совместимость. Нужна работа над отношениями.';
    else message = '🌊 Разные стихии, но возможно взаимопонимание.';
    
    compatResult.innerHTML = `
        <div class="compatibility-score">${score}%</div>
        <p>${message}</p>
        <div class="compatibility-bars">
            <div class="comp-bar">
                <div class="comp-bar-label">Любовь</div>
                <div class="comp-bar-fill">
                    <div class="comp-bar-value" style="width: ${score}%"></div>
                </div>
            </div>
            <div class="comp-bar">
                <div class="comp-bar-label">Дружба</div>
                <div class="comp-bar-fill">
                    <div class="comp-bar-value" style="width: ${score - 5}%"></div>
                </div>
            </div>
            <div class="comp-bar">
                <div class="comp-bar-label">Карьера</div>
                <div class="comp-bar-fill">
                    <div class="comp-bar-value" style="width: ${score - 10}%"></div>
                </div>
            </div>
        </div>
    `;
});

// ============================================
// BUSINESS IDEAS
// ============================================

const ideaResult = document.getElementById('ideaResult');
const generateIdeaBtn = document.getElementById('generateIdea');
const catBtns = document.querySelectorAll('.cat-btn');

let currentCategory = 'AI';

const businessIdeas = {
    'AI': [
        'AI-помощник для написания постов в соцсети',
        'Генератор логотипов на основе описания бизнеса',
        'AI-аналитик конкурентов для малого бизнеса',
        'Чат-бот для автоматической поддержки клиентов',
        'AI-редактор фотографий для e-commerce'
    ],
    'IT': [
        'SaaS для управления проектами удалённых команд',
        'Платформа для онлайн-курсов с геймификацией',
        'Сервис мониторинга сайтов и API',
        'CRM для фрилансеров с автоматизацией',
        'Облачное хранилище с AI-поиском'
    ],
    'SaaS': [
        'Подписка на шаблоны документов для бизнеса',
        'Сервис email-рассылок с AI-оптимизацией',
        'Платформа для проведения вебинаров',
        'Инструмент для создания лендингов без кода',
        'Сервис аналитики соцсетей в реальном времени'
    ],
    'Telegram': [
        'Бот для записи клиентов (салоны, врачи)',
        'Магазин цифровых товаров в Telegram',
        'Бот-напоминание о платежах и подписках',
        'Telegram-канал с платной подпиской',
        'Бот для проведения опросов и викторин'
    ]
};

catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        catBtns.forEach(b => b.style.background = 'rgba(255,255,255,0.05)');
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        currentCategory = btn.textContent;
    });
});

generateIdeaBtn.addEventListener('click', () => {
    const ideas = businessIdeas[currentCategory];
    const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
    
    ideaResult.innerHTML = `
        <div class="result-box">
            <strong>💡 Идея для ${currentCategory}:</strong><br><br>
            ${randomIdea}<br><br>
            <em>💭 Подумай: как это можно улучшить? Кто твоя целевая аудитория?</em>
        </div>
    `;
});

// ============================================
// PREMIUM
// ============================================

const premiumBtn = document.querySelector('.premium-btn');
premiumBtn.addEventListener('click', () => {
    tg.showAlert('💎 Premium скоро будет доступен!\n\nСледи за обновлениями.');
});

// ============================================
// SETTINGS
// ============================================

const settingsCheckboxes = document.querySelectorAll('.setting-row input[type="checkbox"]');

settingsCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        localStorage.setItem('cosmira_' + checkbox.parentElement.textContent.trim(), checkbox.checked);
    });
});

// Load settings
window.addEventListener('load', () => {
    loadUserData();
    
    // Welcome message in chat
    setTimeout(() => {
        if (chatBox.children.length === 0) {
            addMessage(`👋 Привет! Я COSMIRA AI.\n\nВыбери роль:\n💼 Бизнес\n📈 Маркетолог\n💻 Программист\n🚀 Стартап\n\nИ задай вопрос!`, false);
        }
    }, 500);
});

// ============================================
// API (for future backend integration)
// ============================================

async function updateUserStats(userId, messages) {
    try {
        await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, messages })
        });
    } catch (e) {
        console.log('API not available');
    }
}
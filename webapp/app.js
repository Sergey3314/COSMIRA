const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let userData = {};
let currentRole = 'business';

const screens = document.querySelectorAll('.screen');
const bottomNav = document.querySelectorAll('.bottom-nav button');
const menuCards = document.querySelectorAll('.menu-card');

function showScreen(id) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    bottomNav.forEach(b => b.classList.toggle('active', b.dataset.screen === id));
    window.scrollTo(0, 0);
}

bottomNav.forEach(btn => btn.addEventListener('click', () => showScreen(btn.dataset.screen)));
menuCards.forEach(card => card.addEventListener('click', () => showScreen(card.dataset.screen)));
document.querySelectorAll('.back-btn').forEach(btn => btn.addEventListener('click', () => showScreen('homeScreen')));

function loadUserData() {
    const user = tg.initDataUnsafe.user;
    if (user) {
        userData = { id: user.id, username: user.username || 'Не указан', name: user.first_name, level: 1, messages: 0, premium: false };
        document.getElementById('welcomeName').textContent = `Привет, ${user.first_name}! 👋`;
        document.getElementById('profileName').textContent = userData.name;
        document.getElementById('profileId').textContent = user.id;
        document.getElementById('profileUsername').textContent = userData.username;
        document.getElementById('avatarLetter').textContent = user.first_name[0].toUpperCase();
    }
}

const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const roleBtns = document.querySelectorAll('.role-btn');

roleBtns.forEach(btn => btn.addEventListener('click', () => {
    roleBtns.forEach(b => b.classList.remove('active-role'));
    btn.classList.add('active-role');
    currentRole = btn.dataset.role;
}));

const chatResponses = {
    business: { 'привет': '👋 Привет! Я бизнес-помощник. Чем помочь?', 'идея': '💡 Идея: Создай сервис автоматизации для малого бизнеса.', 'стартап': '🚀 Для стартапа: 1) Проблема 2) MVP 3) Тест 4) Масштаб.', 'деньги': '💰 Монетизация: подписка, freemium, партнерки.', 'default': '💼 Совет: Фокусируйся на одной нише.' },
    marketing: { 'привет': '👋 Привет! Я маркетолог. Готов помочь!', 'трафик': '📈 Трафик: Telegram, Instagram, TikTok, SEO. Тестируй!', 'контент': '✍️ Контент: 80% пользы, 20% продаж.', 'default': '📊 Маркетинг — это тесты. A/B тестируй всё.' },
    developer: { 'привет': '👋 Привет! Я программист. Какой стек?', 'python': '🐍 Python: Aiogram для ботов, FastAPI для веба.', 'javascript': '⚡ JS: Node.js + React/Vue. TypeScript — надёжнее.', 'бот': '🤖 Для бота: Aiogram 3 (Python) или Telegraf (Node.js).', 'default': '💻 Совет: Пиши чистый код с первого дня.' },
    startup: { 'привет': '🚀 Привет! Строим стартап. Какая идея?', 'mvp': '🎯 MVP — только core-функция. Остальное потом.', 'инвестор': '💵 Инвесторы: команда, рынок, продукт, рост.', 'default': '🌟 Стартап — марафон. Не сдавайся!' }
};

function addMessage(text, isUser) {
    const div = document.createElement('div');
    div.className = `chat-message ${isUser ? 'user' : 'bot'}`;
    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = isUser ? '👤' : '🤖';
    const textDiv = document.createElement('div');
    textDiv.className = 'chat-text';
    textDiv.textContent = text;
    div.appendChild(avatar);
    div.appendChild(textDiv);
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function getResponse(text, role) {
    text = text.toLowerCase();
    const responses = chatResponses[role];
    for (let key in responses) if (text.includes(key)) return responses[key];
    return responses['default'];
}

function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;
    addMessage(text, true);
    userInput.value = '';
    setTimeout(() => addMessage(getResponse(text, currentRole), false), 600);
}

sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });

// HOROSCOPE
const horoscopeData = {
    '♈ Овен': { general: 'День действий! Будь смелым.', love: 'Возможна новая встреча.', career: 'Успех в новых проектах.', energy: 'Энергия на высоте!' },
    '♉ Телец': { general: 'День стабильности.', love: 'Гармония в отношениях.', career: 'Финансовая удача.', energy: 'Средний уровень.' },
    '♊ Близнецы': { general: 'День общения.', love: 'Лёгкость и флирт.', career: 'Идеи льются рекой.', energy: 'Высокая активность.' },
    '♋ Рак': { general: 'День интуиции.', love: 'Глубокие чувства.', career: 'Доверься интуиции.', energy: 'Береги силы.' },
    '♌ Лев': { general: 'Твой день сияния!', love: 'Страсть и романтика.', career: 'Признание заслуг.', energy: 'Энергия бьёт ключом.' },
    '♍ Дева': { general: 'День порядка.', love: 'Практичность в чувствах.', career: 'Внимание к деталям.', energy: 'Стабильный уровень.' },
    '♎ Весы': { general: 'День гармонии.', love: 'Романтика и нежность.', career: 'Партнёрство выгодно.', energy: 'Спокойная энергия.' },
    '♏ Скорпион': { general: 'День трансформации.', love: 'Интенсивные чувства.', career: 'Разгадаешь тайны.', energy: 'Мощная энергия.' },
    '♐ Стрелец': { general: 'День приключений.', love: 'Лёгкость и оптимизм.', career: 'Новые горизонты.', energy: 'Оптимизм даёт силы.' },
    '♑ Козерог': { general: 'День дисциплины.', love: 'Надёжность и верность.', career: 'Упорство к успеху.', energy: 'Выносливость — сила.' },
    '♒ Водолей': { general: 'День инноваций.', love: 'Нестандартный подход.', career: 'Технологии на стороне.', energy: 'Креативная энергия.' },
    '♓ Рыбы': { general: 'День вдохновения.', love: 'Романтика и поэзия.', career: 'Интуиция подскажет.', energy: 'Тонкая творческая.' }
};

document.getElementById('showHoroscope').addEventListener('click', () => {
    const sign = document.getElementById('zodiacSelect').value;
    const d = horoscopeData[sign];
    if (d) document.getElementById('horoscopeResult').innerHTML = `<div class="result-box"><strong>📅 Общий:</strong><br>${d.general}<br><br><strong>❤️ Любовь:</strong><br>${d.love}<br><br><strong>💼 Карьера:</strong><br>${d.career}<br><br><strong>⚡ Энергия:</strong><br>${d.energy}</div>`;
});

// COMPATIBILITY
const compatMatrix = { 'Овен': { 'Лев': 90, 'Стрелец': 85 }, 'Телец': { 'Дева': 90, 'Козерог': 85 }, 'Близнецы': { 'Весы': 90, 'Водолей': 85 }, 'Рак': { 'Скорпион': 90, 'Рыбы': 85 }, 'Лев': { 'Овен': 90, 'Стрелец': 85 }, 'Дева': { 'Телец': 90, 'Козерог': 85 }, 'Весы': { 'Близнецы': 90, 'Водолей': 85 }, 'Скорпион': { 'Рак': 90, 'Рыбы': 85 }, 'Стрелец': { 'Овен': 85, 'Лев': 85 }, 'Козерог': { 'Телец': 85, 'Дева': 85 }, 'Водолей': { 'Близнецы': 85, 'Весы': 85 }, 'Рыбы': { 'Рак': 85, 'Скорпион': 85 } };

document.getElementById('checkCompatibility').addEventListener('click', () => {
    const s1 = document.getElementById('sign1').value, s2 = document.getElementById('sign2').value;
    if (s1 === s2) { document.getElementById('compatibilityResult').innerHTML = `<div class="compatibility-score">100%</div><p>Идеально с собой! 💫</p>`; return; }
    let score = compatMatrix[s1]?.[s2] || compatMatrix[s2]?.[s1] || 65;
    let msg = score >= 85 ? '🔥 Отличная совместимость!' : score >= 75 ? '✨ Хорошая совместимость.' : '⚖️ Нужна работа.';
    document.getElementById('compatibilityResult').innerHTML = `<div class="compatibility-score">${score}%</div><p>${msg}</p>`;
});

// IDEAS
const ideas = { 'AI': ['AI-помощник для постов', 'Генератор логотипов', 'Аналитик конкурентов'], 'IT': ['SaaS для команд', 'Платформа курсов', 'Мониторинг сайтов'], 'SaaS': ['Шаблоны документов', 'Email-рассылки с AI', 'Конструктор лендингов'], 'Telegram': ['Бот записи клиентов', 'Магазин в Telegram', 'Бот-напоминание'] };
let currentCat = 'AI';

document.querySelectorAll('.cat-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.style.background = 'rgba(255,255,255,0.05)');
    btn.style.background = 'linear-gradient(135deg,#667eea,#764ba2)';
    currentCat = btn.textContent;
}));

document.getElementById('generateIdea').addEventListener('click', () => {
    const list = ideas[currentCat];
    const idea = list[Math.floor(Math.random() * list.length)];
    document.getElementById('ideaResult').innerHTML = `<div class="result-box"><strong>💡 Идея для ${currentCat}:</strong><br><br>${idea}</div>`;
});

// PREMIUM & SETTINGS
document.querySelector('.premium-btn')?.addEventListener('click', () => tg.showAlert('💎 Premium скоро!'));
document.querySelectorAll('.setting-row input[type="checkbox"]').forEach(cb => cb.addEventListener('change', () => localStorage.setItem('cosmira_' + cb.parentElement.textContent.trim(), cb.checked)));

// INIT
window.addEventListener('load', () => {
    loadUserData();
    setTimeout(() => { if (!chatBox.children.length) addMessage('👋 Привет! Я COSMIRA AI.\nВыбери роль и задай вопрос!', false); }, 500);
});
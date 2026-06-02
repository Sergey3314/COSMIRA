const API_URL = window.location.origin;
let currentUser = null;
let selectedAvatar = '🔮';
let selectedSign = null;
let selectedPeriod = 'day';
let selectedCategory = 'general';
let compatS1 = null;
let compatS2 = null;

const ZODIAC_SIGNS = [
    { id: 'aries', name: 'Овен', emoji: '♈', icon: 'aries.png' },
    { id: 'taurus', name: 'Телец', emoji: '♉', icon: 'taurus.png' },
    { id: 'gemini', name: 'Близнецы', emoji: '♊', icon: 'gemini.png' },
    { id: 'cancer', name: 'Рак', emoji: '♋', icon: 'cancer.png' },
    { id: 'leo', name: 'Лев', emoji: '♌', icon: 'leo.png' },
    { id: 'virgo', name: 'Дева', emoji: '♍', icon: 'virgo.png' },
    { id: 'libra', name: 'Весы', emoji: '♎', icon: 'libra.png' },
    { id: 'scorpio', name: 'Скорпион', emoji: '♏', icon: 'scorpio.png' },
    { id: 'sagittarius', name: 'Стрелец', emoji: '♐', icon: 'sagittarius.png' },
    { id: 'capricorn', name: 'Козерог', emoji: '♑', icon: 'capricorn.png' },
    { id: 'aquarius', name: 'Водолей', emoji: '', icon: 'aquarius.png' },
    { id: 'pisces', name: 'Рыбы', emoji: '♓', icon: 'pisces.png' }
];

// Telegram WebApp init
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
    initApp();
});

async function initApp() {
    try {
        const tg = window.Telegram?.WebApp;
        const user = tg?.initDataUnsafe?.user;
        
        const res = await fetch(`${API_URL}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: user?.id || 123456789,
                username: user?.username || 'user',
                first_name: user?.first_name || 'User'
            })
        });
        
        const data = await res.json();
        currentUser = data;
        
        if (data.has_profile) {
            showScreen('screen-main');
            updateMainProfile();
        } else {
            showScreen('screen-register');
        }
    } catch (e) {
        console.error(e);
        showScreen('screen-register');
    }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    
    // Обновить нижнюю навигацию
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === id);
    });
}

// Навигация
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        showScreen(screen);
        
        if (screen === 'screen-horoscope') initZodiacScroll('horoscope-signs');
        if (screen === 'screen-compat') {
            initZodiacScroll('compat-s1');
            initZodiacScroll('compat-s2');
        }
    });
});

function goHome() { showScreen('screen-main'); }
function openHoroscope() { showScreen('screen-horoscope'); initZodiacScroll('horoscope-signs'); }
function openNatal() { showScreen('screen-natal'); loadNatalChart(); }
function openCompatibility() { showScreen('screen-compat'); initZodiacScroll('compat-s1'); initZodiacScroll('compat-s2'); }
function openHorary() { showScreen('screen-horary'); }
function openProfile() { showScreen('screen-profile'); updateProfileScreen(); }
function openPremium() { showScreen('screen-premium'); }

// Регистрация
function selectAvatar(emoji) {
    selectedAvatar = emoji;
    document.querySelectorAll('.avatar-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

async function saveProfile() {
    const name = document.getElementById('reg-name').value.trim();
    const date = document.getElementById('reg-date').value;
    const time = document.getElementById('reg-time').value;
    const city = document.getElementById('reg-city').value.trim();
    
    if (!name || !date || !time) {
        alert('Заполни обязательные поля!');
        return;
    }
    
    const tg = window.Telegram?.WebApp;
    await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            telegram_id: tg?.initDataUnsafe?.user?.id || 123456789,
            name, birth_date: date, birth_time: time, birth_city: city,
            avatar: selectedAvatar
        })
    });
    
    currentUser.has_profile = true;
    currentUser.name = name;
    currentUser.birth_date = date;
    currentUser.birth_time = time;
    currentUser.birth_city = city;
    
    showScreen('screen-main');
    updateMainProfile();
}

function updateMainProfile() {
    if (!currentUser) return;
    const zodiac = calculateZodiac(currentUser.birth_date);
    document.getElementById('user-greeting').textContent = `Привет, ${currentUser.name} ✦`;
    document.getElementById('user-zodiac').textContent = zodiac ? `${zodiac.emoji} ${zodiac.name}` : '—';
    document.getElementById('main-avatar').textContent = currentUser.avatar || '🔮';
}

function updateProfileScreen() {
    if (!currentUser) return;
    const zodiac = calculateZodiac(currentUser.birth_date);
    document.getElementById('profile-avatar').textContent = currentUser.avatar || '';
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-zodiac').textContent = zodiac ? `${zodiac.emoji} ${zodiac.name}` : '—';
    document.getElementById('profile-id').textContent = currentUser.telegram_id;
    document.getElementById('profile-birth-date').textContent = currentUser.birth_date || '—';
    document.getElementById('profile-birth-time').textContent = currentUser.birth_time || '—';
    document.getElementById('profile-birth-city').textContent = currentUser.birth_city || '—';
    document.getElementById('profile-premium').textContent = currentUser.is_premium ? 'Активен' : 'Нет';
    document.getElementById('profile-premium').classList.toggle('active', currentUser.is_premium);
}

// Знаки зодиака с иконками
function initZodiacScroll(containerId, onSelect) {
    const container = document.getElementById(containerId);
    if (!container || container.children.length > 0) return;
    
    ZODIAC_SIGNS.forEach(sign => {
        const el = document.createElement('div');
        el.className = 'zodiac-item';
        el.dataset.sign = sign.id;
        
        const iconHtml = sign.icon 
            ? `<img src="/webapp/icons/zodiac/${sign.icon}" class="zodiac-icon-img" alt="${sign.name}">` 
            : `<span style="font-size: 24px; color: #FFD700;">${sign.emoji}</span>`;
            
        el.innerHTML = `
            ${iconHtml}
            <span class="zodiac-name">${sign.name}</span>
        `;
        
        el.addEventListener('click', () => {
            container.querySelectorAll('.zodiac-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            if (containerId === 'horoscope-signs') selectedSign = sign;
            if (containerId === 'compat-s1') compatS1 = sign;
            if (containerId === 'compat-s2') compatS2 = sign;
            if (onSelect) onSelect(sign);
        });
        container.appendChild(el);
    });
}

// Гороскоп
document.querySelectorAll('.period-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedPeriod = tab.dataset.period;
    });
});

document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedCategory = tab.dataset.category;
    });
});

async function loadHoroscope() {
    if (!selectedSign) { alert('Выбери знак зодиака!'); return; }
    
    const resultBox = document.getElementById('horoscope-result');
    const textEl = document.getElementById('result-text');
    const signEl = document.getElementById('result-sign');
    const periodEl = document.getElementById('result-period');
    
    textEl.textContent = 'Загрузка...';
    resultBox.classList.remove('hidden');
    signEl.textContent = selectedSign.name;
    periodEl.textContent = `на ${selectedPeriod === 'day' ? 'сегодня' : selectedPeriod === 'month' ? 'месяц' : 'год'}`;
    
    try {
        const res = await fetch(`${API_URL}/api/horoscope`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sign: selectedSign.id,
                period: selectedPeriod,
                category: selectedCategory,
                user_data: currentUser
            })
        });
        const data = await res.json();
        textEl.textContent = data.text || 'Звёзды молчат...';
    } catch (e) {
        textEl.textContent = 'Ошибка связи с космосом';
    }
}

// Совместимость
async function checkCompatibility() {
    if (!compatS1 || !compatS2) { alert('Выбери оба знака!'); return; }
    
    const resultBox = document.getElementById('compat-result');
    const scoreEl = document.getElementById('compat-score');
    const textEl = document.getElementById('compat-text');
    
    resultBox.classList.remove('hidden');
    scoreEl.textContent = '0%';
    textEl.textContent = 'Рассчитываем...';
    
    try {
        const res = await fetch(`${API_URL}/api/compatibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sign1: compatS1.id, sign2: compatS2.id })
        });
        const data = await res.json();
        scoreEl.textContent = `${data.score || 0}%`;
        textEl.textContent = data.text || 'Анализ завершён';
    } catch (e) {
        textEl.textContent = 'Ошибка расчёта';
    }
}

// Натальная карта
async function loadNatalChart() {
    const container = document.getElementById('natal-container');
    container.innerHTML = '<div class="loader">🔮 Рассчитываем положение планет...</div>';
    
    if (!currentUser?.birth_date || !currentUser?.birth_time) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Заполни данные в профиле для расчёта карты</p>';
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/api/natal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                birth_date: currentUser.birth_date,
                birth_time: currentUser.birth_time,
                birth_city: currentUser.birth_city
            })
        });
        const data = await res.json();
        container.innerHTML = `
            <h3 style="text-align:center;color:var(--gold);margin-bottom:16px;">Твоя натальная карта</h3>
            <div style="font-size:14px;line-height:1.8;">
                ${data.planets?.map(p => `<p>☀️ ${p.name}: ${p.sign} ${p.degree}° • Дом ${p.house}</p>`).join('') || 'Данные недоступны'}
            </div>
            ${data.interpretation ? `<div class="result-box" style="margin-top:16px;"><p>${data.interpretation}</p></div>` : ''}
        `;
    } catch (e) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Ошибка расчёта</p>';
    }
}

// Хорар
async function askHorary() {
    const question = document.getElementById('horary-question').value.trim();
    if (!question) { alert('Задай вопрос!'); return; }
    
    const resultBox = document.getElementById('horary-result');
    const answerEl = document.getElementById('horary-answer');
    const timeEl = document.getElementById('horary-time');
    
    resultBox.classList.remove('hidden');
    answerEl.textContent = 'Звёзды думают...';
    timeEl.textContent = '';
    
    try {
        const res = await fetch(`${API_URL}/api/horary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, user_data: currentUser })
        });
        const data = await res.json();
        answerEl.textContent = data.answer || 'Ответ не получен';
        timeEl.textContent = new Date().toLocaleTimeString('ru-RU');
    } catch (e) {
        answerEl.textContent = 'Связь с космосом потеряна';
    }
}

function editProfile() { showScreen('screen-register'); }

function calculateZodiac(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    
    const signs = [
        { name: 'Козерог', emoji: '♑', start: [1,1], end: [1,19] },
        { name: 'Водолей', emoji: '♒', start: [1,20], end: [2,18] },
        { name: 'Рыбы', emoji: '♓', start: [2,19], end: [3,20] },
        { name: 'Овен', emoji: '♈', start: [3,21], end: [4,19] },
        { name: 'Телец', emoji: '', start: [4,20], end: [5,20] },
        { name: 'Близнецы', emoji: '♊', start: [5,21], end: [6,20] },
        { name: 'Рак', emoji: '♋', start: [6,21], end: [7,22] },
        { name: 'Лев', emoji: '♌', start: [7,23], end: [8,22] },
        { name: 'Дева', emoji: '♍', start: [8,23], end: [9,22] },
        { name: 'Весы', emoji: '♎', start: [9,23], end: [10,22] },
        { name: 'Скорпион', emoji: '♏', start: [10,23], end: [11,21] },
        { name: 'Стрелец', emoji: '♐', start: [11,22], end: [12,21] },
        { name: 'Козерог', emoji: '♑', start: [12,22], end: [12,31] }
    ];
    
    for (const s of signs) {
        const afterStart = month > s.start[0] || (month === s.start[0] && day >= s.start[1]);
        const beforeEnd = month < s.end[0] || (month === s.end[0] && day <= s.end[1]);
        if (afterStart && beforeEnd) return s;
    }
    return signs[0];
}
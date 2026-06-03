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
    { id: 'aquarius', name: 'Водолей', emoji: '♒', icon: 'aquarius.png' },
    { id: 'pisces', name: 'Рыбы', emoji: '♓', icon: 'pisces.png' }
];

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
    
    // Скрываем меню ТОЛЬКО на регистрации
    const nav = document.getElementById('bottom-nav');
    if (id === 'screen-register') {
        nav.style.display = 'none';
    } else {
        nav.style.display = 'flex';
    }
    
    // Подсветка активной кнопки
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === id);
    });
}

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const screen = btn.dataset.screen;
        showScreen(screen);
        
        if (screen === 'screen-horoscope') initZodiacScroll('horoscope-signs');
        if (screen === 'screen-compat') {
            initZodiacScroll('compat-s1');
            initZodiacScroll('compat-s2');
        }
        if (screen === 'screen-profile') updateProfileScreen();
        if (screen === 'screen-natal') loadNatalChart();
    });
});

function goHome() { showScreen('screen-main'); }
function openHoroscope() { showScreen('screen-horoscope'); initZodiacScroll('horoscope-signs'); }
function openNatal() { showScreen('screen-natal'); loadNatalChart(); }
function openCompatibility() { showScreen('screen-compat'); initZodiacScroll('compat-s1'); initZodiacScroll('compat-s2'); }
function openHorary() { showScreen('screen-horary'); }
function openProfile() { showScreen('screen-profile'); updateProfileScreen(); }
function openPremium() { showScreen('screen-premium'); }

function selectAvatar(emoji, el) {
    selectedAvatar = emoji;
    document.querySelectorAll('.avatar-item').forEach(e => e.classList.remove('active'));
    if (el) el.classList.add('active');
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
    try {
        const res = await fetch(`${API_URL}/api/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegram_id: tg?.initDataUnsafe?.user?.id || 123456789,
                username: tg?.initDataUnsafe?.user?.username || 'user',
                name: name,
                birth_date: date,
                birth_time: time,
                birth_city: city,
                avatar: selectedAvatar
            })
        });
        
        const data = await res.json();
        console.log('Profile saved:', data);
        currentUser = data;
    } catch (e) {
        console.error('Save error:', e);
    }
    
    showScreen('screen-main');
    updateMainProfile();
}

function updateMainProfile() {
    if (!currentUser) return;
    
    let zodiacText = '—';
    if (currentUser.zodiac && typeof currentUser.zodiac === 'object') {
        zodiacText = `${currentUser.zodiac.emoji} ${currentUser.zodiac.name}`;
    }
    
    document.getElementById('user-greeting').textContent = `Привет, ${currentUser.name || 'Странник'} ✦`;
    document.getElementById('user-zodiac').textContent = zodiacText;
    document.getElementById('main-avatar').textContent = currentUser.avatar || '🔮';
}

function updateProfileScreen() {
    if (!currentUser) return;
    
    let zodiacText = '—';
    if (currentUser.zodiac && typeof currentUser.zodiac === 'object') {
        zodiacText = `${currentUser.zodiac.emoji} ${currentUser.zodiac.name}`;
    }
    
    document.getElementById('profile-avatar').textContent = currentUser.avatar || '🔮';
    document.getElementById('profile-name').textContent = currentUser.name || '—';
    document.getElementById('profile-zodiac').textContent = zodiacText;
    document.getElementById('profile-id').textContent = currentUser.telegram_id || currentUser.user_id || '—';
    document.getElementById('profile-birth-date').textContent = currentUser.birth_date || '—';
    document.getElementById('profile-birth-time').textContent = currentUser.birth_time || '—';
    document.getElementById('profile-birth-city').textContent = currentUser.birth_city || '—';
    
    const premiumEl = document.getElementById('profile-premium');
    premiumEl.textContent = currentUser.is_premium ? 'Активен' : 'Нет';
    premiumEl.classList.toggle('active', currentUser.is_premium);
}

function initZodiacScroll(containerId) {
    const container = document.getElementById(containerId);
    if (!container || container.children.length > 0) return;
    
    ZODIAC_SIGNS.forEach(sign => {
        const el = document.createElement('div');
        el.className = 'zodiac-item';
        el.dataset.sign = sign.id;
        el.innerHTML = `
            <span style="font-size: 24px; color: #FFD700;">${sign.emoji}</span>
            <span class="zodiac-name">${sign.name}</span>
        `;
        
        el.addEventListener('click', () => {
            container.querySelectorAll('.zodiac-item').forEach(i => i.classList.remove('active'));
            el.classList.add('active');
            if (containerId === 'horoscope-signs') selectedSign = sign;
            if (containerId === 'compat-s1') compatS1 = sign;
            if (containerId === 'compat-s2') compatS2 = sign;
        });
        container.appendChild(el);
    });
}

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
    
    textEl.textContent = 'Слушаем звёзды...';
    resultBox.classList.remove('hidden');
    signEl.textContent = selectedSign.name;
    periodEl.textContent = `на ${selectedPeriod === 'day' ? 'сегодня' : selectedPeriod === 'month' ? 'месяц' : 'год'}`;
    
    try {
        const tg = window.Telegram?.WebApp;
        const userId = tg?.initDataUnsafe?.user?.id || 123456789;
        
        const res = await fetch(`${API_URL}/api/horoscope`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sign: selectedSign.id,
                period: selectedPeriod,
                category: selectedCategory,
                user_id: userId
            })
        });
        const data = await res.json();
        textEl.textContent = data.text || 'Звёзды хранят молчание...';
        textEl.style.whiteSpace = 'pre-line';
    } catch (e) {
        textEl.textContent = 'Связь с космосом потеряна';
    }
}

async function checkCompatibility() {
    if (!compatS1 || !compatS2) { alert('Выбери оба знака!'); return; }
    
    const resultBox = document.getElementById('compat-result');
    const scoreEl = document.getElementById('compat-score');
    const textEl = document.getElementById('compat-text');
    
    resultBox.classList.remove('hidden');
    scoreEl.textContent = '0%';
    textEl.textContent = 'Звёзды считают...';
    
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
            body: JSON.stringify({ question })
        });
        const data = await res.json();
        answerEl.textContent = data.answer || 'Ответ не получен';
        timeEl.textContent = new Date().toLocaleTimeString('ru-RU');
    } catch (e) {
        answerEl.textContent = 'Связь с космосом потеряна';
    }
}

function editProfile() { showScreen('screen-register'); }

// ===== ИСТОРИЯ ЧТЕНИЙ =====
function openHistory() {
    showScreen('screen-history');
    loadHistory();
}

async function loadHistory() {
    const container = document.getElementById('history-list');
    container.innerHTML = '<div class="loader">Загрузка истории...</div>';
    
    try {
        const tg = window.Telegram?.WebApp;
        const userId = tg?.initDataUnsafe?.user?.id || 123456789;
        
        const res = await fetch(`${API_URL}/api/history?uid=${userId}`);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const history = await res.json();
        
        // Проверяем что это массив
        if (!Array.isArray(history)) {
            throw new Error('History is not an array');
        }
        
        if (history.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">Пока нет сохранённых чтений</p>';
            return;
        }
        
        container.innerHTML = history.map(item => `
            <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid var(--glass-border);">
                <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                    <strong style="color:var(--gold);font-family:'Cinzel',serif;">${item.sign} • ${item.period}</strong>
                    <small style="color:var(--text-secondary);">${new Date(item.created_at).toLocaleDateString('ru-RU')}</small>
                </div>
                <div style="font-size:14px;line-height:1.6;color:var(--text);white-space:pre-line;">${item.result_text}</div>
                <button onclick='downloadPDF(${JSON.stringify(item)})' style="margin-top:10px;padding:8px 16px;background:linear-gradient(135deg,rgba(112,0,255,0.3),rgba(255,215,0,0.2));border:1px solid var(--gold);color:var(--gold);border-radius:12px;cursor:pointer;font-family:'Cinzel',serif;">
                    📥 Скачать PDF
                </button>
            </div>
        `).join('');
    } catch (e) {
        console.error('History load error:', e);
        container.innerHTML = `
            <div style="text-align:center;color:var(--text-secondary);padding:20px;">
                <p>Ошибка загрузки</p>
                <small style="display:block;margin-top:10px;opacity:0.7;">${e.message}</small>
                <button onclick="loadHistory()" style="margin-top:15px;padding:10px 20px;background:var(--glass);border:1px solid var(--gold-border);color:var(--gold);border-radius:12px;cursor:pointer;">
                    🔄 Повторить
                </button>
            </div>
        `;
    }
}
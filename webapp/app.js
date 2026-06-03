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
    if (!compatS1 || !compatS2) { 
        alert('Выбери оба знака!'); 
        return; 
    }
    
    const resultBox = document.getElementById('compat-result');
    const scoreEl = document.getElementById('compat-score');
    const textEl = document.getElementById('compat-text');
    
    resultBox.classList.remove('hidden');
    
    // Просто большие золотые цифры
    scoreEl.innerHTML = `
        <div style="text-align:center;padding:20px 0;">
            <div id="score-number" style="font-size:72px;font-family:'Cinzel',serif;color:#FFD700;font-weight:700;text-shadow:0 0 30px rgba(255,215,0,0.8),0 0 60px rgba(255,215,0,0.4);line-height:1;">0</div>
            <div style="font-size:28px;color:#FFD700;opacity:0.9;margin-top:-10px;">%</div>
            <div style="font-size:14px;color:var(--gold);letter-spacing:3px;text-transform:uppercase;margin-top:15px;font-family:'Cinzel',serif;">
                ✦ Энергия союза ✦
            </div>
        </div>
    `;
    
    try {
        const tg = window.Telegram?.WebApp;
        const userId = tg?.initDataUnsafe?.user?.id || 123456789;
        
        const res = await fetch(`${API_URL}/api/compatibility`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sign1: compatS1.id, 
                sign2: compatS2.id,
                user_id: userId
            })
        });
        const data = await res.json();
        
        const finalScore = data.score || 0;
        
        // Анимация чисел
        animateValue(document.getElementById('score-number'), 0, finalScore, 2000);
        
        textEl.textContent = data.text || 'Анализ завершён';
        textEl.style.whiteSpace = 'pre-line';
    } catch (e) {
        scoreEl.innerHTML = '<div style="color:var(--text-secondary);font-size:18px;text-align:center;">Ошибка расчёта</div>';
        textEl.textContent = 'Попробуй ещё раз';
    }
}

// Функция плавного счёта цифр
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(easeProgress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Функция плавного счёта цифр
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(easeProgress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Функция плавного счёта цифр (ОБЯЗАТЕЛЬНА!)
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // Плавная кривая для цифр
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(easeProgress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

async function loadNatalChart() {
    const container = document.getElementById('natal-container');
    container.innerHTML = `
        <div class="loader" style="flex-direction:column; gap:15px;">
            <div class="spinner"></div>
            <p>🔮 Рассчитываем положение планет...</p>
        </div>
    `;
    
    if (!currentUser?.birth_date || !currentUser?.birth_time) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">Заполни дату и время рождения в профиле, чтобы построить карту</p>';
        return;
    }
    
    try {
        const tg = window.Telegram?.WebApp;
        const userId = tg?.initDataUnsafe?.user?.id || 123456789;
        
        const res = await fetch(`${API_URL}/api/natal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                birth_date: currentUser.birth_date,
                birth_time: currentUser.birth_time,
                birth_city: currentUser.birth_city,
                user_id: userId
            })
        });
        const data = await res.json();
        
        if (data.error) {
            container.innerHTML = `<p style="color:var(--text-secondary);text-align:center;">${data.error}</p>`;
            return;
        }
        
        // Рисуем колесо
        const svgWheel = generateNatalWheel(data.planets, data.ascendant);
        
        // Генерируем список планет
        const planetsList = data.planets.map(p => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--glass-border);">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:20px;">${p.emoji}</span>
                    <span style="color:var(--gold);font-family:'Cinzel',serif;font-weight:600;">${p.name}</span>
                </div>
                <span style="color:var(--text-secondary);font-size:13px;">${p.sign} ${p.degree}°</span>
            </div>
        `).join('');
        
        // Генерируем список аспектов
        const aspectsList = generateAspectsList(data.planets);
        
        container.innerHTML = `
            <!-- ЖИВОЕ КОЛЕСО -->
            <div style="position:relative;max-width:380px;margin:0 auto 25px;animation:fadeIn 1s ease;">
                ${svgWheel}
                <div style="text-align:center;margin-top:15px;font-family:'Cinzel',serif;color:var(--gold);font-size:16px;letter-spacing:2px;">
                    ✦ Асцендент в ${data.ascendant.emoji} ${data.ascendant.sign} ${data.ascendant.degree}° ✦
                </div>
            </div>
            
            <!-- РАЗБОР ОТ AI -->
            <div style="background:linear-gradient(135deg,rgba(255,215,0,0.08),rgba(112,0,255,0.08));border:1px solid var(--gold-border);border-radius:16px;padding:20px;margin-bottom:20px;animation:slideUp 1.2s ease;">
                <h3 style="color:var(--gold);font-family:'Cinzel',serif;text-align:center;margin-bottom:15px;font-size:18px;">🔮 Послание Звёзд</h3>
                <div style="font-size:14px;line-height:1.9;color:var(--text);white-space:pre-line;">${data.interpretation}</div>
            </div>
            
            <!-- СПИСОК ПЛАНЕТ -->
            <div style="background:var(--glass);border:1px solid var(--glass-border);border-radius:16px;padding:15px;margin-bottom:15px;animation:slideUp 1.5s ease;">
                <h4 style="color:var(--gold);font-family:'Cinzel',serif;text-align:center;margin-bottom:12px;font-size:16px;">📍 Положение Планет</h4>
                ${planetsList}
            </div>
            
            <!-- АСПЕКТЫ -->
            <div style="background:var(--glass);border:1px solid var(--glass-border);border-radius:16px;padding:15px;margin-top:15px;animation:slideUp 1.8s ease;">
                <h4 style="color:var(--gold);font-family:'Cinzel',serif;text-align:center;margin-bottom:12px;font-size:16px;">🔗 Важные Аспекты</h4>
                ${aspectsList}
            </div>
            
            <button onclick='downloadPDF(${JSON.stringify({
                sign: 'Натальная Карта', 
                period: 'natal', 
                category: 'general', 
                result_text: data.interpretation,
                created_at: new Date().toISOString()
            })})' style="width:100%;margin-top:20px;padding:14px;background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(112,0,255,0.2));border:1px solid var(--gold);color:var(--gold);border-radius:14px;cursor:pointer;font-family:'Cinzel',serif;font-size:15px;font-weight:600;transition:0.3s;" onmouseover="this.style.background='linear-gradient(135deg,rgba(255,215,0,0.3),rgba(112,0,255,0.3))'" onmouseout="this.style.background='linear-gradient(135deg,rgba(255,215,0,0.2),rgba(112,0,255,0.2))'">
                📥 Сохранить разбор в PDF
            </button>
        `;
        
    } catch (e) {
        console.error('Natal error:', e);
        container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">Ошибка расчёта карты. Попробуй ещё раз.</p>';
    }
}

// Функция генерации списка аспектов
function generateAspectsList(planets) {
    const aspectNames = {
        'conjunction': { name: 'Соединение', color: '#FFD700', icon: '☌' },
        'opposition': { name: 'Оппозиция', color: '#ff4444', icon: '☍' },
        'trine': { name: 'Трин', color: '#00ff88', icon: '△' },
        'square': { name: 'Квадрат', color: '#ff6666', icon: '□' },
        'sextile': { name: 'Секстиль', color: '#44aaff', icon: '⚹' }
    };
    
    const aspects = findAspects(planets);
    
    if (aspects.length === 0) {
        return '<p style="color:var(--text-secondary);text-align:center;font-size:13px;padding:10px;">Нет мажорных аспектов</p>';
    }
    
    return aspects.map(a => {
        const aspect = aspectNames[a.type];
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-left:3px solid ${aspect.color};background:rgba(255,255,255,0.03);margin-bottom:8px;border-radius:8px;">
                <span style="color:var(--gold);font-size:13px;font-family:'Cinzel',serif;">
                    ${a.planet1.emoji} ${a.planet1.name} ${aspect.icon} ${a.planet2.name} ${a.planet2.emoji}
                </span>
                <span style="color:${aspect.color};font-size:12px;font-weight:600;white-space:nowrap;margin-left:10px;">
                    ${aspect.name} (${a.orb}°)
                </span>
            </div>
        `;
    }).join('');
}

// Функция генерации SVG колеса
function generateNatalWheel(planets, ascendant) {
    const size = 400;
    const center = size / 2;
    const outerR = 185;
    const middleR = 155;
    const innerR = 125;
    const planetR = 95;
    
    const signEmojis = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
    const signNames = ['Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'];
    const signColors = ['#ff4444', '#ff8844', '#ffcc44', '#44ff44', '#44ffff', '#4488ff', 
                        '#ff44ff', '#8844ff', '#cc44ff', '#444444', '#4444ff', '#448888'];
    
    // Находим аспекты между планетами
    const aspects = findAspects(planets);
    
    let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;filter:drop-shadow(0 0 30px rgba(255,215,0,0.4));">
        <defs>
            <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(26,26,46,0.9)"/>
                <stop offset="100%" stop-color="rgba(10,10,20,0.95)"/>
            </radialGradient>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#FFD700"/>
                <stop offset="100%" stop-color="#FFA500"/>
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        <!-- ВНЕШНИЙ КРУГ -->
        <circle cx="${center}" cy="${center}" r="${outerR}" fill="url(#wheel-bg)" stroke="url(#gold-gradient)" stroke-width="3" filter="url(#glow)"/>
        
        <!-- СРЕДНИЙ КРУГ -->
        <circle cx="${center}" cy="${center}" r="${middleR}" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.5"/>
        
        <!-- ВНУТРЕННИЙ КРУГ -->
        <circle cx="${center}" cy="${center}" r="${innerR}" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.3"/>`;
    
    // Рисуем 12 секторов зодиака
    for (let i = 0; i < 12; i++) {
        const startAngle = (i * 30 - 90) * Math.PI / 180;
        const endAngle = ((i + 1) * 30 - 90) * Math.PI / 180;
        const midAngle = (i * 30 + 15 - 90) * Math.PI / 180;
        
        const x1 = center + outerR * Math.cos(startAngle);
        const y1 = center + outerR * Math.sin(startAngle);
        const x2 = center + outerR * Math.cos(endAngle);
        const y2 = center + outerR * Math.sin(endAngle);
        
        const midX = center + (outerR - 20) * Math.cos(midAngle);
        const midY = center + (outerR - 20) * Math.sin(midAngle);
        
        // Линии секторов
        svg += `
            <line x1="${center + innerR * Math.cos(startAngle)}" y1="${center + innerR * Math.sin(startAngle)}" 
                  x2="${x1}" y2="${y1}" stroke="#FFD700" stroke-width="1.5" opacity="0.6"/>
            
            <!-- Символ знака -->
            <text x="${midX}" y="${midY}" fill="${signColors[i]}" font-size="20" text-anchor="middle" dominant-baseline="middle" style="font-weight:bold;filter:url(#glow);">
                ${signEmojis[i]}
            </text>
        `;
    }
    
    // Рисуем линии аспектов
    aspects.forEach((aspect, idx) => {
        const angle1 = (aspect.planet1.longitude - 90) * Math.PI / 180;
        const angle2 = (aspect.planet2.longitude - 90) * Math.PI / 180;
        
        const x1 = center + planetR * Math.cos(angle1);
        const y1 = center + planetR * Math.sin(angle1);
        const x2 = center + planetR * Math.cos(angle2);
        const y2 = center + planetR * Math.sin(angle2);
        
        const aspectColor = aspect.type === 'trine' ? '#00ff88' : 
                           aspect.type === 'opposition' ? '#ff4444' :
                           aspect.type === 'square' ? '#ff6666' :
                           aspect.type === 'sextile' ? '#44aaff' : '#FFD700';
        
        svg += `
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                  stroke="${aspectColor}" stroke-width="2" opacity="0.7" 
                  style="animation:aspectPulse ${2 + idx * 0.5}s ease-in-out infinite;transform-origin:center;">
            </line>
        `;
    });
    
    // Рисуем планеты
    planets.forEach((p, idx) => {
        const angle = (p.longitude - 90) * Math.PI / 180;
        const x = center + planetR * Math.cos(angle);
        const y = center + planetR * Math.sin(angle);
        
        // Подсветка для Солнца и Луны
        const isImportant = p.name === 'Солнце' || p.name === 'Луна';
        const glowEffect = isImportant ? 'filter="url(#glow)"' : '';
        
        svg += `
            <g style="animation:planetPop 0.6s ease ${idx * 0.1}s both;">
                <circle cx="${x}" cy="${y}" r="${isImportant ? '16' : '13'}" 
                        fill="${isImportant ? 'rgba(255,215,0,0.3)' : 'rgba(112,0,255,0.4)'}" 
                        stroke="${isImportant ? '#FFD700' : '#9d4edd'}" 
                        stroke-width="${isImportant ? '2.5' : '1.5'}" 
                        ${glowEffect}/>
                <text x="${x}" y="${y}" fill="#fff" font-size="${isImportant ? '14' : '12'}" 
                      text-anchor="middle" dominant-baseline="central" style="font-weight:bold;">
                    ${p.emoji}
                </text>
            </g>
        `;
    });
    
    // Центр с крестом
    svg += `
        <!-- ЦЕНТРАЛЬНЫЙ КРЕСТ -->
        <circle cx="${center}" cy="${center}" r="25" fill="#1a1a2e" stroke="url(#gold-gradient)" stroke-width="2.5" filter="url(#glow)"/>
        <line x1="${center-15}" y1="${center}" x2="${center+15}" y2="${center}" stroke="#FFD700" stroke-width="2"/>
        <line x1="${center}" y1="${center-15}" x2="${center}" y2="${center+15}" stroke="#FFD700" stroke-width="2"/>
        <circle cx="${center}" cy="${center}" r="5" fill="#FFD700"/>
    </svg>`;
    
    return svg;
}

// Функция поиска аспектов
function findAspects(planets) {
    const aspects = [];
    const aspectTypes = [
        { name: 'conjunction', angle: 0, orb: 8 },
        { name: 'opposition', angle: 180, orb: 8 },
        { name: 'trine', angle: 120, orb: 8 },
        { name: 'square', angle: 90, orb: 7 },
        { name: 'sextile', angle: 60, orb: 6 }
    ];
    
    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i];
            const p2 = planets[j];
            
            let diff = Math.abs(p1.longitude - p2.longitude);
            if (diff > 180) diff = 360 - diff;
            
            for (const aspect of aspectTypes) {
                let orbDiff = aspect.angle === 0 ? diff : Math.abs(diff - aspect.angle);
                if (orbDiff > 180) orbDiff = 360 - orbDiff;
                
                if (orbDiff <= aspect.orb) {
                    aspects.push({
                        planet1: p1,
                        planet2: p2,
                        type: aspect.name,
                        orb: orbDiff.toFixed(1)
                    });
                    break;
                }
            }
        }
    }
    
    return aspects;
}

async function askHorary() {
    const question = document.getElementById('horary-question').value.trim();
    if (!question) { 
        alert('Задай вопрос!'); 
        return; 
    }
    
    const resultBox = document.getElementById('horary-result');
    const answerEl = document.getElementById('horary-answer');
    const timeEl = document.getElementById('horary-time');
    
    resultBox.classList.remove('hidden');
    answerEl.textContent = ' Звёзды думают над твоим вопросом...';
    timeEl.textContent = '';
    
    try {
        const tg = window.Telegram?.WebApp;
        const userId = tg?.initDataUnsafe?.user?.id || 123456789;
        
        const res = await fetch(`${API_URL}/api/horary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question,
                user_id: userId
            })
        });
        const data = await res.json();
        
        answerEl.textContent = data.answer || 'Ответ не получен';
        answerEl.style.whiteSpace = 'pre-line';
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
        
        if (!Array.isArray(history)) {
            throw new Error('History is not an array');
        }
        
        if (history.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">📭 Пока нет сохранённых чтений</p>';
            return;
        }
        
        // Группировка по типам
        const grouped = {};
        history.forEach(item => {
            if (!grouped[item.type]) {
                grouped[item.type] = [];
            }
            grouped[item.type].push(item);
        });
        
        // Иконки и названия для типов
        const typeConfig = {
            'horoscope': { icon: '🔮', name: 'Гороскопы', color: '#FFD700' },
            'natal': { icon: '🌌', name: 'Натальные карты', color: '#9d4edd' },
            'compatibility': { icon: '💫', name: 'Совместимость', color: '#00d4aa' },
            'horary': { icon: '🔮', name: 'Хорарные вопросы', color: '#ff6b6b' }
        };
        
        let html = '';
        
        for (const [type, items] of Object.entries(grouped)) {
            const config = typeConfig[type] || { icon: '📜', name: type, color: '#FFD700' };
            const groupOpenId = `group-${type}`;
            
            html += `
                <div style="margin-bottom:24px;">
                    <!-- ЗАГОЛОВОК ГРУППЫ (раскрывающийся) -->
                    <div onclick="toggleGroup('${groupOpenId}', '${groupOpenId}-arrow')" 
                         style="display:flex;align-items:center;gap:10px;padding:14px 16px;
                         background:linear-gradient(135deg,rgba(255,215,0,0.12),rgba(112,0,255,0.12));
                         border:1px solid var(--glass-border);border-radius:14px;
                         cursor:pointer;transition:0.3s;margin-bottom:12px;">
                        <span style="font-size:24px;">${config.icon}</span>
                        <h3 style="color:${config.color};font-family:'Cinzel',serif;font-size:16px;margin:0;flex:1;">${config.name}</h3>
                        <span style="background:rgba(255,215,0,0.2);color:var(--gold);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${items.length}</span>
                        <svg id="${groupOpenId}-arrow" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" 
                             style="width:20px;height:20px;transition:transform 0.3s;transform:rotate(0deg);">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </div>
                    
                    <!-- КОНТЕНТ ГРУППЫ (скрыт по умолчанию) -->
                    <div id="${groupOpenId}" style="display:none;">
            `;
            
            // Группировка по датам
            const byDate = {};
            items.forEach(item => {
                const date = new Date(item.created_at).toLocaleDateString('ru-RU');
                if (!byDate[date]) {
                    byDate[date] = [];
                }
                byDate[date].push(item);
            });
            
            for (const [date, dateItems] of Object.entries(byDate)) {
                html += `<div style="margin-left:16px;margin-bottom:8px;">`;
                
                dateItems.forEach((item, index) => {
                    const blockId = `block-${type}-${index}`;
                    const periodLabel = item.period === 'day' ? 'день' : item.period === 'month' ? 'месяц' : item.period === 'year' ? 'год' : item.period;
                    const categoryLabel = item.category === 'general' ? 'общий' : item.category === 'love' ? 'любовь' : item.category === 'career' ? 'карьера' : item.category;
                    
                    html += `
                        <div style="background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;margin-bottom:8px;overflow:hidden;">
                            <!-- ЗАГОЛОВОК БЛОКА (раскрывающийся) -->
                            <div onclick="toggleHistoryBlock('${blockId}', '${blockId}-arrow')" 
                                 style="padding:12px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;transition:0.3s;"
                                 onmouseover="this.style.background='rgba(255,215,0,0.05)'" 
                                 onmouseout="this.style.background='transparent'">
                                <span style="font-size:16px;">📋</span>
                                <div style="flex:1;">
                                    <div style="color:var(--gold);font-family:'Cinzel',serif;font-size:14px;font-weight:600;">
                                        ${item.sign} • ${periodLabel}
                                    </div>
                                    <div style="color:var(--text-secondary);font-size:12px;margin-top:2px;">
                                        ${categoryLabel}
                                    </div>
                                </div>
                                <span style="color:var(--text-secondary);font-size:11px;">${date}</span>
                                <svg id="${blockId}-arrow" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" 
                                     style="width:18px;height:18px;transition:transform 0.3s;transform:rotate(0deg);">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </div>
                            
                            <!-- КОНТЕНТ БЛОКА (скрыт по умолчанию) -->
                            <div id="${blockId}" style="display:none;padding:14px;border-top:1px solid var(--glass-border);background:rgba(0,0,0,0.15);">
                                <div style="font-size:14px;line-height:1.8;color:var(--text);white-space:pre-line;margin-bottom:14px;">${item.result_text}</div>
                                <div style="display:flex;gap:10px;">
                                    <button onclick='downloadPDF(${JSON.stringify(item).replace(/'/g, "&apos;")})' 
                                            style="flex:1;padding:10px;background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(112,0,255,0.2));
                                            border:1px solid var(--gold);color:var(--gold);border-radius:12px;cursor:pointer;
                                            font-family:'Cinzel',serif;font-size:13px;">
                                        📥 Скачать PDF
                                    </button>
                                    <button onclick="toggleHistoryBlock('${blockId}', '${blockId}-arrow')" 
                                            style="padding:10px 16px;background:var(--glass);border:1px solid var(--glass-border);
                                            color:var(--text-secondary);border-radius:12px;cursor:pointer;font-size:13px;">
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
            }
            
            html += `</div></div>`;
        }
        
        container.innerHTML = html;
    } catch (e) {
        console.error('History load error:', e);
        container.innerHTML = `
            <div style="text-align:center;color:var(--text-secondary);padding:20px;">
                <p>Ошибка загрузки</p>
                <small style="display:block;margin-top:10px;opacity:0.7;">${e.message}</small>
                <button onclick="loadHistory()" style="margin-top:15px;padding:10px 20px;background:var(--glass);border:1px solid var(--gold);color:var(--gold);border-radius:12px;cursor:pointer;">
                    🔄 Повторить
                </button>
            </div>
        `;
    }
}

// Раскрыть/свернуть группу
function toggleGroup(blockId, arrowId) {
    const block = document.getElementById(blockId);
    const arrow = document.getElementById(arrowId);
    if (block.style.display === 'none') {
        block.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        block.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Раскрыть/свернуть блок внутри группы
function toggleHistoryBlock(blockId, arrowId) {
    const block = document.getElementById(blockId);
    const arrow = document.getElementById(arrowId);
    if (block.style.display === 'none') {
        block.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        block.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

function toggleHistoryBlock(blockId) {
    const block = document.getElementById(blockId);
    const arrow = document.getElementById(`arrow-${blockId}`);
    
    if (block.style.display === 'none') {
        block.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        block.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
}

// ===== PDF ВЫГРУЗКА =====
async function downloadPDF(item) {
    const periodLabel = item.period === 'day' ? 'Дневной прогноз' : item.period === 'month' ? 'Прогноз на месяц' : 'Прогноз на год';
    const categoryLabel = item.category === 'general' ? 'Общий' : item.category === 'love' ? 'Любовь' : 'Карьера';
    const dateStr = new Date(item.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>COSMIRA - ${item.sign}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body { 
                    font-family: 'Montserrat', sans-serif; 
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    min-height: 100vh;
                    padding: 0;
                    position: relative;
                    overflow-x: hidden;
                }
                
                /* Звёзды на фоне */
                body::before {
                    content: '';
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-image: 
                        radial-gradient(2px 2px at 20% 30%, #FFD700, transparent),
                        radial-gradient(2px 2px at 60% 70%, #FFD700, transparent),
                        radial-gradient(1px 1px at 50% 50%, #fff, transparent),
                        radial-gradient(1px 1px at 80% 10%, #FFD700, transparent),
                        radial-gradient(2px 2px at 90% 60%, #fff, transparent),
                        radial-gradient(1px 1px at 10% 80%, #FFD700, transparent),
                        radial-gradient(2px 2px at 30% 20%, #fff, transparent);
                    background-size: 550% 550%;
                    opacity: 0.3;
                    animation: stars 15s ease infinite;
                    z-index: 0;
                }
                
                @keyframes stars {
                    0%, 100% { background-position: 0% 0%; }
                    50% { background-position: 100% 100%; }
                }
                
                .container { 
                    position: relative;
                    z-index: 1;
                    max-width: 600px; 
                    margin: 0 auto; 
                    background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%); 
                    padding: 50px 40px; 
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    border: 2px solid rgba(255,215,0,0.3);
                    border-radius: 0;
                }
                
                .header {
                    text-align: center;
                    padding-bottom: 30px;
                    border-bottom: 3px solid #FFD700;
                    margin-bottom: 30px;
                    position: relative;
                }
                
                .header::after {
                    content: '✦';
                    position: absolute;
                    bottom: -10px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: #FFD700;
                    font-size: 20px;
                    background: white;
                    padding: 0 10px;
                }
                
                h1 { 
                    color: #1a1a2e; 
                    font-family: 'Cinzel', serif;
                    font-size: 42px;
                    font-weight: 700;
                    letter-spacing: 3px;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                }
                
                .subtitle {
                    color: #666;
                    font-size: 14px;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }
                
                .sign-block {
                    text-align: center;
                    margin: 30px 0;
                    padding: 25px;
                    background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(112,0,255,0.1) 100%);
                    border: 2px solid #FFD700;
                    border-radius: 15px;
                }
                
                .sign-name {
                    font-family: 'Cinzel', serif;
                    font-size: 36px;
                    color: #1a1a2e;
                    font-weight: 700;
                    margin-bottom: 10px;
                }
                
                .meta {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    flex-wrap: wrap;
                    margin-top: 15px;
                }
                
                .meta-item {
                    background: rgba(255,215,0,0.15);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 13px;
                    color: #1a1a2e;
                    font-weight: 600;
                    border: 1px solid rgba(255,215,0,0.3);
                }
                
                .content { 
                    line-height: 1.9; 
                    color: #333; 
                    margin: 30px 0; 
                    white-space: pre-line;
                    font-size: 15px;
                    font-weight: 400;
                }
                
                .content-section {
                    margin-bottom: 25px;
                    padding: 20px;
                    background: rgba(255,215,0,0.05);
                    border-left: 4px solid #FFD700;
                    border-radius: 8px;
                }
                
                .content-section strong {
                    color: #1a1a2e;
                    font-family: 'Cinzel', serif;
                    font-size: 16px;
                    display: block;
                    margin-bottom: 10px;
                }
                
                .footer { 
                    text-align: center; 
                    color: #999; 
                    font-size: 12px; 
                    margin-top: 40px;
                    padding-top: 25px;
                    border-top: 2px solid rgba(255,215,0,0.3);
                    font-style: italic;
                }
                
                .footer strong {
                    color: #FFD700;
                    display: block;
                    margin-bottom: 5px;
                    font-family: 'Cinzel', serif;
                }
                
                .download-btn {
                    display: block;
                    width: 100%;
                    max-width: 300px;
                    margin: 40px auto 0;
                    padding: 16px 30px;
                    background: linear-gradient(135deg, #FFD700 0%, #b8860b 100%);
                    border: none;
                    border-radius: 12px;
                    color: #1a1a2e;
                    font-family: 'Cinzel', serif;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    box-shadow: 0 8px 25px rgba(255,215,0,0.4);
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .download-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 35px rgba(255,215,0,0.5);
                }
                
                .download-btn:active {
                    transform: translateY(-1px);
                }
                
                @media print {
                    body { background: white; }
                    body::before { display: none; }
                    .container { 
                        box-shadow: none; 
                        border: none;
                        max-width: 100%;
                    }
                    .download-btn { display: none; }
                }
                
                @media (max-width: 600px) {
                    .container { padding: 30px 20px; }
                    h1 { font-size: 32px; }
                    .sign-name { font-size: 28px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✦ COSMIRA ✦</h1>
                    <div class="subtitle">Астрология, созданная для тебя</div>
                </div>
                
                <div class="sign-block">
                    <div class="sign-name">${item.sign}</div>
                    <div class="meta">
                        <span class="meta-item">📅 ${dateStr}</span>
                        <span class="meta-item">🔮 ${periodLabel}</span>
                        <span class="meta-item">💫 ${categoryLabel}</span>
                    </div>
                </div>
                
                <div class="content">${item.result_text}</div>
                
                <div class="footer">
                    <strong>С любовью, COSMIRA ✦</strong>
                    Твой персональный проводник в мир звёзд<br>
                    cosmosmira.com
                </div>
                
                <button class="download-btn" onclick="saveAsPDF()">
                    💫 Сохранить гороскоп
                </button>
            </div>
            
            <script>
                function saveAsPDF() {
                    // Для мобильных - просто открываем диалог печати
                    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                        window.print();
                    } else {
                        // Для десктопа
                        window.print();
                    }
                }
                
                // Автоматически предлагаем сохранить при открытии
                window.onload = function() {
                    setTimeout(() => {
                        // Не вызываем print автоматически, даём пользователю выбрать
                    }, 300);
                };
            <\/script>
        </body>
        </html>
    `;
    
    // Открываем в новом окне
    const newWindow = window.open('', '_blank', 'width=800,height=900');
    if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
    } else {
        alert('📥 Разрешите pop-up окна для скачивания гороскопа!');
    }
}

function generateAspectsList(planets) {
    const aspectNames = {
        'conjunction': { name: 'Соединение', color: '#FFD700', icon: '☌' },
        'opposition': { name: 'Оппозиция', color: '#ff4444', icon: '☍' },
        'trine': { name: 'Трин', color: '#00ff88', icon: '△' },
        'square': { name: 'Квадрат', color: '#ff6666', icon: '□' },
        'sextile': { name: 'Секстиль', color: '#44aaff', icon: '⚹' }
    };
    
    const aspects = findAspects(planets);
    
    if (aspects.length === 0) {
        return '<p style="color:var(--text-secondary);text-align:center;font-size:13px;">Нет мажорных аспектов</p>';
    }
    
    return aspects.map(a => {
        const aspect = aspectNames[a.type];
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-left:3px solid ${aspect.color};background:rgba(255,255,255,0.03);margin-bottom:6px;border-radius:6px;">
                <span style="color:var(--gold);font-size:13px;">
                    ${a.planet1.emoji} ${a.planet1.name} ${aspect.icon} ${a.planet2.name} ${a.planet2.emoji}
                </span>
                <span style="color:${aspect.color};font-size:12px;font-weight:600;">
                    ${aspect.name} (${a.orb}°)
                </span>
            </div>
        `;
    }).join('');
}
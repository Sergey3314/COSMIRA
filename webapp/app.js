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
            'natal': { icon: '', name: 'Натальные карты', color: '#9d4edd' },
            'compatibility': { icon: '💫', name: 'Совместимость', color: '#00d4aa' },
            'horary': { icon: '🔮', name: 'Хорарные вопросы', color: '#ff6b6b' }
        };
        
        let html = '';
        
        for (const [type, items] of Object.entries(grouped)) {
            const config = typeConfig[type] || { icon: '📜', name: type, color: '#FFD700' };
            
            html += `
                <div style="margin-bottom:24px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:12px;background:linear-gradient(135deg,rgba(255,215,0,0.1),rgba(112,0,255,0.1));border:1px solid var(--glass-border);border-radius:14px;">
                        <span style="font-size:24px;">${config.icon}</span>
                        <h3 style="color:${config.color};font-family:'Cinzel',serif;font-size:16px;margin:0;">${config.name}</h3>
                        <span style="margin-left:auto;background:rgba(255,215,0,0.2);color:var(--gold);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${items.length}</span>
                    </div>
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
                html += `<div style="margin-left:20px;margin-bottom:12px;">`;
                
                dateItems.forEach((item, index) => {
                    const blockId = `block-${type}-${index}`;
                    html += `
                        <div style="background:var(--glass);border:1px solid var(--glass-border);border-radius:14px;margin-bottom:8px;overflow:hidden;">
                            <div onclick="toggleHistoryBlock('${blockId}')" style="padding:14px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;transition:0.3s;" onmouseover="this.style.background='rgba(255,215,0,0.05)'" onmouseout="this.style.background='var(--glass)'">
                                <span style="font-size:18px;">📋</span>
                                <div style="flex:1;">
                                    <div style="color:var(--gold);font-family:'Cinzel',serif;font-size:14px;font-weight:600;">
                                        ${item.sign} • ${item.period === 'day' ? 'день' : item.period === 'month' ? 'месяц' : item.period === 'year' ? 'год' : item.period}
                                    </div>
                                    <div style="color:var(--text-secondary);font-size:12px;margin-top:2px;">
                                        ${item.category === 'general' ? 'общий' : item.category === 'love' ? 'любовь' : item.category === 'career' ? 'карьера' : item.category}
                                    </div>
                                </div>
                                <span style="color:var(--text-secondary);font-size:11px;">${date}</span>
                                <svg id="arrow-${blockId}" viewBox="0 0 24 24" fill="none" stroke="#FFD700" stroke-width="2" style="width:20px;height:20px;transition:0.3s;"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                            <div id="${blockId}" style="display:none;padding:16px;border-top:1px solid var(--glass-border);background:rgba(0,0,0,0.2);">
                                <div style="font-size:14px;line-height:1.8;color:var(--text);white-space:pre-line;margin-bottom:16px;">${item.result_text}</div>
                                <div style="display:flex;gap:10px;">
                                    <button onclick='downloadPDF(${JSON.stringify(item).replace(/'/g, "&apos;")})' style="flex:1;padding:10px;background:linear-gradient(135deg,rgba(255,215,0,0.2),rgba(112,0,255,0.2));border:1px solid var(--gold);color:var(--gold);border-radius:12px;cursor:pointer;font-family:'Cinzel',serif;font-size:13px;">
                                        📥 Скачать PDF
                                    </button>
                                    <button onclick="toggleHistoryBlock('${blockId}')" style="padding:10px 20px;background:var(--glass);border:1px solid var(--glass-border);color:var(--text-secondary);border-radius:12px;cursor:pointer;font-size:13px;">
                                        ✕ Закрыть
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `</div>`;
            }
            
            html += `</div>`;
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
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>COSMIRA - ${item.sign}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:wght@300;400;500&display=swap');
                body { 
                    font-family:'Montserrat',sans-serif; 
                    background:linear-gradient(135deg,#1a237e 0%,#4a148c 100%); 
                    padding:40px; 
                    margin:0;
                }
                .container { 
                    max-width:600px; 
                    margin:0 auto; 
                    background:white; 
                    padding:40px; 
                    border-radius:20px; 
                    box-shadow:0 10px 40px rgba(0,0,0,0.5); 
                }
                h1 { 
                    color:#FFD700; 
                    text-align:center; 
                    font-family:'Cinzel',serif;
                    font-size:36px;
                    margin:0 0 30px 0;
                    text-shadow:2px 2px 4px rgba(0,0,0,0.1);
                }
                h2 { 
                    color:#4a148c; 
                    border-bottom:2px solid #FFD700; 
                    padding-bottom:10px;
                    font-family:'Cinzel',serif;
                }
                .meta {
                    text-align:center;
                    color:#666;
                    margin-bottom:30px;
                    font-size:14px;
                }
                .content { 
                    line-height:1.8; 
                    color:#333; 
                    margin:20px 0; 
                    white-space:pre-line;
                    font-size:15px;
                }
                .footer { 
                    text-align:center; 
                    color:#999; 
                    font-size:12px; 
                    margin-top:40px;
                    padding-top:20px;
                    border-top:1px solid #eee;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>✦ COSMIRA ✦</h1>
                <h2 style="text-align:center;">${item.sign}</h2>
                <div class="meta">
                    <strong>${item.period === 'day' ? 'Дневной' : item.period === 'month' ? 'Месяц' : 'Год'} прогноз</strong><br>
                    ${item.category === 'general' ? 'Общий' : item.category === 'love' ? 'Любовь' : 'Карьера'} • ${new Date(item.created_at).toLocaleDateString('ru-RU')}
                </div>
                <div class="content">${item.result_text}</div>
                <div class="footer">С любовью, COSMIRA ✦<br>Астрология, созданная для тебя</div>
            </div>
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `COSMIRA-${item.sign}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
}
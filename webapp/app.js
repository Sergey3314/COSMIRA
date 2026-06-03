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
    
    // Круговой индикатор с правильным позиционированием
    scoreEl.innerHTML = `
        <div style="position:relative;width:200px;height:200px;margin:0 auto 20px;">
            <svg viewBox="0 0 100 100" style="transform:rotate(-90deg);width:100%;height:100%;position:absolute;top:0;left:0;">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,215,0,0.15)" stroke-width="6"/>
                <circle id="progress-ring" cx="50" cy="50" r="45" fill="none" 
                        stroke="#FFD700" stroke-width="6" 
                        stroke-dasharray="283" stroke-dashoffset="283"
                        stroke-linecap="round"
                        style="transition:stroke-dashoffset 2.5s ease-out;filter:drop-shadow(0 0 12px rgba(255,215,0,0.8));"/>
            </svg>
            <div style="position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;">
                <div id="score-number" style="font-size:48px;font-family:'Cinzel',serif;color:#FFD700;font-weight:700;text-shadow:0 0 20px rgba(255,215,0,0.8);line-height:1;">0</div>
                <div style="font-size:20px;color:#FFD700;opacity:0.8;margin-top:-5px;">%</div>
            </div>
        </div>
        <div style="text-align:center;font-size:13px;color:var(--gold);letter-spacing:3px;text-transform:uppercase;margin-top:5px;font-family:'Cinzel',serif;">
            ✦ Энергия союза ✦
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
        const circumference = 2 * Math.PI * 45;
        
        // Анимация круга
        setTimeout(() => {
            const offset = circumference - (finalScore / 100) * circumference;
            document.getElementById('progress-ring').style.strokeDashoffset = offset;
        }, 100);
        
        // Анимация чисел
        animateValue(document.getElementById('score-number'), 0, finalScore, 2500);
        
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
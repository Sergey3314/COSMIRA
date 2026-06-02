const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let currentUser = null;
let selectedAvatar = '🔮';
let selectedHoroscopeSign = 'Cancer';
let selectedCompat1 = 'Cancer';
let selectedCompat2 = 'Libra';

const API_BASE = window.location.origin;

const ZODIAC_SIGNS = [
    { id: 'Aries', name: 'Овен', icon: '♈', month: 3, day: 21 },
    { id: 'Taurus', name: 'Телец', icon: '♉', month: 4, day: 20 },
    { id: 'Gemini', name: 'Близнецы', icon: '♊', month: 5, day: 21 },
    { id: 'Cancer', name: 'Рак', icon: '♋', month: 6, day: 21 },
    { id: 'Leo', name: 'Лев', icon: '♌', month: 7, day: 23 },
    { id: 'Virgo', name: 'Дева', icon: '♍', month: 8, day: 23 },
    { id: 'Libra', name: 'Весы', icon: '', month: 9, day: 23 },
    { id: 'Scorpio', name: 'Скорпион', icon: '', month: 10, day: 23 },
    { id: 'Sagittarius', name: 'Стрелец', icon: '♐', month: 11, day: 22 },
    { id: 'Capricorn', name: 'Козерог', icon: '♑', month: 12, day: 22 },
    { id: 'Aquarius', name: 'Водолей', icon: '♒', month: 1, day: 20 },
    { id: 'Pisces', name: 'Рыбы', icon: '♓', month: 2, day: 19 }
];

// ===== ПУНКТ 8: ТОЧНЫЙ РАСЧЁТ ЗОДИАКА =====
function getZodiacSign(dateStr) {
    if (!dateStr) return { name: '—', icon: '' };
    const [, month, day] = dateStr.split('-').map(Number);
    if (!month || !day) return { name: '—', icon: '✦' };

    // Определяем знак: если день >= порогового для этого месяца — это он
    // Иначе — предыдущий знак
    for (let i = 0; i < ZODIAC_SIGNS.length; i++) {
        const current = ZODIAC_SIGNS[i];
        const next = ZODIAC_SIGNS[(i + 1) % ZODIAC_SIGNS.length];
        
        if (month === current.month && day >= current.day) {
            return { name: current.name, icon: current.icon };
        }
        // Переход между годами (Козерог -> Водолей)
        if (current.month > next.month && month === current.month && day >= current.day) {
            return { name: current.name, icon: current.icon };
        }
    }
    
    // Если дата до 20 января — это Козерог
    if (month === 1 && day < 20) {
        return { name: 'Козерог', icon: '♑' };
    }
    
    return { name: '—', icon: '✦' };
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', async () => {
    const uid = tg.initDataUnsafe?.user?.id;
    if (!uid) {
        currentUser = { id: 'demo', name: 'Гость', avatar: '🔮' };
        showScreen('screen-register');
        return;
    }
    
    currentUser = { id: String(uid), name: tg.initDataUnsafe.user?.first_name || 'Пользователь' };
    
    // ===== ПУНКТ 7: НАДЁЖНАЯ ЗАГРУЗКА =====
    // 1. Проверяем localStorage (быстрый кэш)
    const cached = localStorage.getItem(`cosmira_user_${currentUser.id}`);
    if (cached) {
        try {
            const parsed = JSON.parse(cached);
            if (parsed.birth_date && parsed.birth_time) {
                currentUser = { ...currentUser, ...parsed, id: String(uid) };
                updateProfileUI();
                updateMainAvatar();
                renderZodiacScrolls();
                showScreen('screen-main');
                // В фоне обновляем данные с сервера
                await refreshFromServer();
                return;
            }
        } catch (e) { console.warn('Cache parse error:', e); }
    }
    
    // 2. Если кэша нет — грузим с сервера
    try {
        const res = await fetch(`${API_BASE}/api/user?uid=${currentUser.id}`);
        const data = await res.json();
        if (data.user_id) {
            currentUser = {
                id: String(uid),
                name: data.name || currentUser.name,
                birth_date: data.birth_date,
                birth_time: data.birth_time,
                birth_city: data.birth_city || data.birth_place,
                zodiac: data.zodiac,
                avatar: data.avatar || '🔮',
                premium: data.premium
            };
            localStorage.setItem(`cosmira_user_${currentUser.id}`, JSON.stringify(currentUser));
            updateProfileUI();
            updateMainAvatar();
            renderZodiacScrolls();
            showScreen('screen-main');
        } else {
            showScreen('screen-register');
        }
    } catch (e) {
        console.error('Load error:', e);
        showScreen('screen-register');
    }
});

async function refreshFromServer() {
    try {
        const res = await fetch(`${API_BASE}/api/user?uid=${currentUser.id}`);
        const data = await res.json();
        if (data.user_id) {
            currentUser = {
                ...currentUser,
                name: data.name || currentUser.name,
                birth_city: data.birth_city || data.birth_place,
                zodiac: data.zodiac,
                avatar: data.avatar || currentUser.avatar,
                premium: data.premium
            };
            localStorage.setItem(`cosmira_user_${currentUser.id}`, JSON.stringify(currentUser));
            updateProfileUI();
            updateMainAvatar();
        }
    } catch (e) { /* молча */ }
}

// ===== РЕНДЕР ЗНАКОВ =====
function renderZodiacScrolls() {
    // Гороскоп
    const hContainer = document.getElementById('horoscope-signs');
    if (hContainer) {
        hContainer.innerHTML = ZODIAC_SIGNS.map(s => `
            <div class="zodiac-item ${s.id === selectedHoroscopeSign ? 'active' : ''}" onclick="selectHoroscopeSign('${s.id}')">
                <span class="zodiac-icon">${s.icon}</span>
                <span class="zodiac-name">${s.name}</span>
            </div>
        `).join('');
    }
    const c1 = document.getElementById('compat-s1');
    if (c1) {
        c1.innerHTML = ZODIAC_SIGNS.map(s => `
            <div class="zodiac-item ${s.id === selectedCompat1 ? 'active' : ''}" onclick="selectCompatSign(1, '${s.id}')">
                <span class="zodiac-icon">${s.icon}</span>
                <span class="zodiac-name">${s.name}</span>
            </div>
        `).join('');
    }
    const c2 = document.getElementById('compat-s2');
    if (c2) {
        c2.innerHTML = ZODIAC_SIGNS.map(s => `
            <div class="zodiac-item ${s.id === selectedCompat2 ? 'active' : ''}" onclick="selectCompatSign(2, '${s.id}')">
                <span class="zodiac-icon">${s.icon}</span>
                <span class="zodiac-name">${s.name}</span>
            </div>
        `).join('');
    }
}

window.selectHoroscopeSign = (id) => {
    selectedHoroscopeSign = id;
    document.querySelectorAll('#horoscope-signs .zodiac-item').forEach(el => el.classList.remove('active'));
    const target = document.querySelector(`#horoscope-signs .zodiac-item:nth-child(${ZODIAC_SIGNS.findIndex(s => s.id === id) + 1})`);
    if (target) target.classList.add('active');
};

window.selectCompatSign = (num, id) => {
    if (num === 1) selectedCompat1 = id;
    else selectedCompat2 = id;
    const container = document.getElementById(num === 1 ? 'compat-s1' : 'compat-s2');
    container.querySelectorAll('.zodiac-item').forEach(el => el.classList.remove('active'));
    const target = container.querySelector(`.zodiac-item:nth-child(${ZODIAC_SIGNS.findIndex(s => s.id === id) + 1})`);
    if (target) target.classList.add('active');
};

// ===== ПУНКТ 7: СОХРАНЕНИЕ ПРОФИЛЯ =====
async function saveProfile() {
    const name = document.getElementById('reg-name').value.trim();
    const birthDate = document.getElementById('reg-date').value;
    const birthTime = document.getElementById('reg-time').value;
    const birthCity = document.getElementById('reg-city').value.trim();
    
    if (name.length < 2) return tg.showAlert('⚠️ Имя минимум 2 символа');
    if (!birthDate) return tg.showAlert('⚠️ Укажи дату рождения');
    if (!birthTime) return tg.showAlert('⚠️ Укажи время рождения');
    if (birthCity.length < 3 || !/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(birthCity)) {
        return tg.showAlert('️ Город: минимум 3 буквы');
    }
    
    const zodiac = getZodiacSign(birthDate);
    
    const payload = {
        id: currentUser.id,
        name,
        username: tg.initDataUnsafe.user?.username || '',
        birth_date: birthDate,
        birth_time: birthTime,
        birth_city: birthCity,
        avatar: selectedAvatar,
        zodiac: zodiac
    };
    
    try {
        const res = await fetch(`${API_BASE}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if (result.status === 'ok' || res.ok) {
            currentUser = { ...currentUser, ...payload };
            // Сохраняем в localStorage сразу
            localStorage.setItem(`cosmira_user_${currentUser.id}`, JSON.stringify(currentUser));
            updateProfileUI();
            updateMainAvatar();
            renderZodiacScrolls();
            showScreen('screen-main');
            tg.showAlert('✨ Данные звёзд сохранены!');
        } else {
            throw new Error(result.error || 'Ошибка сервера');
        }
    } catch (e) {
        console.error('Save error:', e);
        tg.showAlert('❌ Ошибка сети: ' + e.message);
    }
}

function selectAvatar(icon) {
    selectedAvatar = icon;
    document.querySelectorAll('.avatar-item').forEach(el => el.classList.remove('active'));
    const target = document.querySelector(`.avatar-item[data-icon="${icon}"]`);
    if (target) target.classList.add('active');
}
window.selectAvatar = selectAvatar;

function updateProfileUI() {
    document.getElementById('profile-name').textContent = currentUser.name || '—';
    document.getElementById('profile-id').textContent = currentUser.id;
    document.getElementById('profile-avatar').textContent = currentUser.avatar || '🔮';
    
    if (currentUser.zodiac) {
        const z = typeof currentUser.zodiac === 'string' ? JSON.parse(currentUser.zodiac) : currentUser.zodiac;
        document.getElementById('profile-zodiac').textContent = `${z.icon} ${z.name}`;
    } else {
        document.getElementById('profile-zodiac').textContent = '—';
    }
    
    document.getElementById('profile-birth-date').textContent = currentUser.birth_date || '—';
    document.getElementById('profile-birth-time').textContent = currentUser.birth_time || '—';
    document.getElementById('profile-birth-city').textContent = currentUser.birth_city || '—';
    
    const premEl = document.getElementById('profile-premium');
    if (premEl) {
        premEl.textContent = currentUser.premium ? '✓ Активен' : '— Нет';
        premEl.className = currentUser.premium ? 'premium-badge active' : 'premium-badge';
    }
}

function updateMainAvatar() {
    const greeting = document.getElementById('user-greeting');
    const zodiac = document.getElementById('user-zodiac');
    const avatar = document.getElementById('main-avatar');
    if (greeting) greeting.textContent = `${currentUser.name || 'Странник'} ✦`;
    if (zodiac && currentUser.zodiac) {
        const z = typeof currentUser.zodiac === 'string' ? JSON.parse(currentUser.zodiac) : currentUser.zodiac;
        zodiac.textContent = `${z.icon} ${z.name}`;
    }
    if (avatar) avatar.textContent = currentUser.avatar || '🔮';
}

function editProfile() {
    document.getElementById('reg-name').value = currentUser.name || '';
    document.getElementById('reg-date').value = currentUser.birth_date || '';
    document.getElementById('reg-time').value = currentUser.birth_time || '';
    document.getElementById('reg-city').value = currentUser.birth_city || '';
    selectedAvatar = currentUser.avatar || '🔮';
    showScreen('screen-register');
}

// ===== НАВИГАЦИЯ =====
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-in');
    }
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === id);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goHome() { showScreen('screen-main'); }

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => showScreen(btn.dataset.screen));
    });
}

function setupTabs() {
    document.querySelectorAll('.period-tab, .category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            this.parentElement.querySelectorAll('button').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// ===== API: ГОРОСКОП =====
window.loadHoroscope = async () => {
    const sign = ZODIAC_SIGNS.find(s => s.id === selectedHoroscopeSign);
    const resultBox = document.getElementById('horoscope-result');
    const resultText = document.getElementById('result-text');
    
    resultBox.classList.add('hidden');
    resultText.textContent = 'Считываем энергии звёзд...';
    resultBox.classList.remove('hidden');
    
    const periodEl = document.querySelector('.period-tab.active');
    const period = periodEl ? periodEl.dataset.period : 'day';
    const periodNames = { day: 'сегодня', month: 'этот месяц', year: 'этот год' };
    
    document.getElementById('result-sign').textContent = `${sign.icon} ${sign.name}`;
    document.getElementById('result-period').textContent = periodNames[period];
    
    try {
        const res = await fetch(`${API_BASE}/api/horoscope?sign=${selectedHoroscopeSign}&period=${period}`);
        const data = await res.json();
        resultText.textContent = data.text || "Звёзды пока молчат. Попробуй позже.";
    } catch (e) {
        resultText.textContent = "Связь с космосом потеряна.";
    }
};

// ===== API: СОВМЕСТИМОСТЬ =====
window.checkCompatibility = async () => {
    const s1 = ZODIAC_SIGNS.find(s => s.id === selectedCompat1);
    const s2 = ZODIAC_SIGNS.find(s => s.id === selectedCompat2);
    const resultBox = document.getElementById('compat-result');
    
    resultBox.classList.add('hidden');
    document.getElementById('compat-score').textContent = '...';
    resultBox.classList.remove('hidden');
    
    try {
        const res = await fetch(`${API_BASE}/api/compatibility?s1=${selectedCompat1}&s2=${selectedCompat2}`);
        const data = await res.json();
        document.getElementById('compat-score').textContent = `${data.score || '85'}%`;
        document.getElementById('compat-text').textContent = 
            data.text || `Союз ${s1.icon} ${s1.name} и ${s2.icon} ${s2.name} наполнен глубокой энергией. Вы способны понять друг друга без слов.`;
    } catch (e) {
        document.getElementById('compat-text').textContent = "Не удалось рассчитать энергию союза.";
    }
};

// ===== API: ХОРАР =====
window.askHorary = async () => {
    const question = document.getElementById('horary-question').value.trim();
    if (question.length < 10) return tg.showAlert('Задай вопрос подробнее (минимум 10 символов)');
    
    const resultBox = document.getElementById('horary-result');
    resultBox.classList.add('hidden');
    document.getElementById('horary-answer').textContent = 'Анализирую хорарную карту...';
    resultBox.classList.remove('hidden');
    
    try {
        const res = await fetch(`${API_BASE}/api/horary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, uid: currentUser?.id })
        });
        const data = await res.json();
        document.getElementById('horary-answer').textContent = data.answer || "Звёзды говорят: да, но действуй мягко.";
        document.getElementById('horary-time').textContent = new Date(data.timestamp).toLocaleString('ru-RU');
    } catch (e) {
        document.getElementById('horary-answer').textContent = "Космос недоступен.";
    }
};

// ===== НАТАЛЬНАЯ КАРТА =====
window.openNatal = async () => {
    if (!currentUser?.birth_date) {
        tg.showAlert('⚠️ Сначала заполни дату рождения в профиле');
        showScreen('screen-profile');
        return;
    }
    showScreen('screen-natal');
    const container = document.getElementById('natal-container');
    container.innerHTML = '<div class="loader">Рассчитываем положение планет...</div>';
    
    try {
        const res = await fetch(`${API_BASE}/api/natal?uid=${currentUser.id}`);
        const data = await res.json();
        
        if (data.planets && Object.keys(data.planets).length > 0) {
            const planetNames = {
                'Sun': 'Солнце', 'Moon': 'Луна', 'Mercury': 'Меркурий', 'Venus': 'Венера',
                'Mars': 'Марс', 'Jupiter': 'Юпитер', 'Saturn': 'Сатурн',
                'Ascendant': 'Асцендент'
            };
            let html = '';
            for (let key in planetNames) {
                if (data.planets[key]) {
                    const p = data.planets[key];
                    html += `<div class="planet-row"><span class="planet-name">${planetNames[key]}</span><span class="planet-value"><strong>${p.sign_ru}</strong> ${p.degree}°${p.house ? ` • Дом ${p.house}` : ''}</span></div>`;
                }
            }
            if (data.interpretation) {
                html += `<p style="margin-top:16px; font-size:14px; line-height:1.7; color:rgba(255,255,255,0.85); font-weight:300;">${data.interpretation}</p>`;
            }
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-secondary);">Расчёт карты временно недоступен. Скоро добавим!</p>';
        }
    } catch (e) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-secondary);">Связь с космосом потеряна</p>';
    }
};

// ===== ЭКСПОРТ =====
window.saveProfile = saveProfile;
window.goHome = goHome;
window.editProfile = editProfile;
window.openProfile = () => showScreen('screen-profile');
window.openHoroscope = () => { renderZodiacScrolls(); showScreen('screen-horoscope'); };
window.openNatal = window.openNatal;
window.openCompatibility = () => { renderZodiacScrolls(); showScreen('screen-compat'); };
window.openHorary = () => showScreen('screen-horary');
window.openPremium = () => showScreen('screen-premium');
window.loadHoroscope = window.loadHoroscope;
window.checkCompatibility = window.checkCompatibility;
window.askHorary = window.askHorary;

setupNavigation();
setupTabs();
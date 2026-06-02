const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let currentUser = null;
let selectedAvatar = '🔮';
let selectedHoroscopeSign = 'Cancer'; // По умолчанию
let selectedCompat1 = 'Cancer';
let selectedCompat2 = 'Libra';

const API_BASE = window.location.origin;

const ZODIAC_SIGNS = [
    { id: 'Aries', name: 'Овен', icon: '♈' }, { id: 'Taurus', name: 'Телец', icon: '♉' },
    { id: 'Gemini', name: 'Близнецы', icon: '♊' }, { id: 'Cancer', name: 'Рак', icon: '♋' },
    { id: 'Leo', name: 'Лев', icon: '♌' }, { id: 'Virgo', name: 'Дева', icon: '♍' },
    { id: 'Libra', name: 'Весы', icon: '♎' }, { id: 'Scorpio', name: 'Скорпион', icon: '' },
    { id: 'Sagittarius', name: 'Стрелец', icon: '♐' }, { id: 'Capricorn', name: 'Козерог', icon: '♑' },
    { id: 'Aquarius', name: 'Водолей', icon: '' }, { id: 'Pisces', name: 'Рыбы', icon: '♓' }
];

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', async () => {
    const uid = tg.initDataUnsafe?.user?.id;
    if (!uid) {
        currentUser = { id: 'demo', name: 'Гость', avatar: '🔮' };
        showScreen('screen-register');
        return;
    }
    currentUser = { id: String(uid), name: tg.initDataUnsafe.user?.first_name || 'Пользователь' };
    
    try {
        const res = await fetch(`${API_BASE}/api/user?uid=${currentUser.id}`);
        const data = await res.json();
        if (data.user_id) {
            currentUser = { ...currentUser, ...data, id: String(uid), birth_city: data.birth_city || data.birth_place };
            updateProfileUI();
            showScreen('screen-main');
        } else {
            showScreen('screen-register');
        }
    } catch (e) {
        showScreen('screen-register');
    }
    
    renderZodiacScrolls();
    setupTabs();
    setupNavigation();
});

// --- РЕНДЕР ЗНАКОВ (Красивые карточки вместо select) ---
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

    // Совместимость 1
    const c1Container = document.getElementById('compat-s1');
    if (c1Container) {
        c1Container.innerHTML = ZODIAC_SIGNS.map(s => `
            <div class="zodiac-item ${s.id === selectedCompat1 ? 'active' : ''}" onclick="selectCompatSign(1, '${s.id}')">
                <span class="zodiac-icon">${s.icon}</span>
                <span class="zodiac-name">${s.name}</span>
            </div>
        `).join('');
    }

    // Совместимость 2
    const c2Container = document.getElementById('compat-s2');
    if (c2Container) {
        c2Container.innerHTML = ZODIAC_SIGNS.map(s => `
            <div class="zodiac-item ${s.id === selectedCompat2 ? 'active' : ''}" onclick="selectCompatSign(2, '${s.id}')">
                <span class="zodiac-icon">${s.icon}</span>
                <span class="zodiac-name">${s.name}</span>
            </div>
        `).join('');
    }
}

window.selectHoroscopeSign = (id) => {
    selectedHoroscopeSign = id;
    renderZodiacScrolls();
};
window.selectCompatSign = (num, id) => {
    if (num === 1) selectedCompat1 = id;
    else selectedCompat2 = id;
    renderZodiacScrolls();
};

// --- ВАЛИДАЦИЯ И СОХРАНЕНИЕ ---
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
    try {
        await fetch(`${API_BASE}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: currentUser.id, name, username: tg.initDataUnsafe.user?.username || '',
                birth_date: birthDate, birth_time: birthTime, birth_city: birthCity,
                avatar: selectedAvatar, zodiac: zodiac
            })
        });
        currentUser = { ...currentUser, name, birth_date: birthDate, birth_time: birthTime, birth_city: birthCity, zodiac, avatar: selectedAvatar };
        updateProfileUI();
        showScreen('screen-main');
        tg.showAlert('✨ Данные сохранены!');
    } catch (e) {
        tg.showAlert('❌ Ошибка сети');
    }
}

function getZodiacSign(dateStr) {
    const [, month, day] = dateStr.split('-').map(Number);
    const signs = [
        [1, 20, 'Водолей', '♒'], [2, 18, 'Водолей', '♒'], [2, 19, 'Рыбы', '♓'], [3, 20, 'Рыбы', '♓'],
        [3, 21, 'Овен', '♈'], [4, 19, 'Овен', '♈'], [4, 20, 'Телец', '♉'], [5, 20, 'Телец', '♉'],
        [5, 21, 'Близнецы', '♊'], [6, 20, 'Близнецы', '♊'], [6, 21, 'Рак', '♋'], [7, 22, 'Рак', '♋'],
        [7, 23, 'Лев', '♌'], [8, 22, 'Лев', '♌'], [8, 23, 'Дева', '♍'], [9, 22, 'Дева', '♍'],
        [9, 23, 'Весы', '♎'], [10, 22, 'Весы', '♎'], [10, 23, 'Скорпион', '♏'], [11, 21, 'Скорпион', '♏'],
        [11, 22, 'Стрелец', '♐'], [12, 21, 'Стрелец', '♐'], [12, 22, 'Козерог', '♑'], [1, 19, 'Козерог', '♑']
    ];
    for (let s of signs) {
        if (month === s[0] && day >= s[1]) return { name: s[2], icon: s[3] };
    }
    return { name: 'Козерог', icon: '♑' };
}

function selectAvatar(icon) {
    selectedAvatar = icon;
    document.querySelectorAll('.avatar-item').forEach(el => el.classList.remove('active'));
    const target = document.querySelector(`.avatar-item[data-icon="${icon}"]`);
    if (target) target.classList.add('active');
}
window.selectAvatar = selectAvatar;

function updateProfileUI() {
    document.getElementById('user-greeting').textContent = `Привет, ${currentUser.name} ✨`;
    document.getElementById('profile-name').textContent = currentUser.name;
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
        premEl.textContent = currentUser.premium ? '✅ Активен' : '❌ Нет';
        premEl.className = currentUser.premium ? 'premium-badge active' : 'premium-badge';
    }
}

function editProfile() {
    document.getElementById('reg-name').value = currentUser.name || '';
    document.getElementById('reg-date').value = currentUser.birth_date || '';
    document.getElementById('reg-time').value = currentUser.birth_time || '';
    document.getElementById('reg-city').value = currentUser.birth_city || '';
    showScreen('screen-register');
}

// --- НАВИГАЦИЯ И ЭКРАНЫ ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('animate-in'); // Добавляем анимацию появления
    }
    window.scrollTo(0, 0);
}
function goHome() { showScreen('screen-main'); }

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => showScreen(btn.dataset.screen));
    });
    // Экспорт для inline onclick
    window.openProfile = () => showScreen('screen-profile');
    window.openHoroscope = () => { renderZodiacScrolls(); showScreen('screen-horoscope'); };
    window.openNatal = () => showScreen('screen-natal');
    window.openCompatibility = () => { renderZodiacScrolls(); showScreen('screen-compat'); };
    window.openHorary = () => showScreen('screen-horary');
    window.openPremium = () => showScreen('screen-premium');
}

function setupTabs() {
    document.querySelectorAll('.period-tab, .category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            this.parentElement.querySelectorAll('button').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// --- API ЗАПРОСЫ (Заглушки с красивым UI) ---
window.loadHoroscope = async () => {
    const sign = ZODIAC_SIGNS.find(s => s.id === selectedHoroscopeSign);
    const resultBox = document.getElementById('horoscope-result');
    const resultText = document.getElementById('result-text');
    
    resultBox.classList.add('hidden');
    resultText.textContent = '✨ Считываем энергии звёзд...';
    resultBox.classList.remove('hidden');
    
    try {
        const res = await fetch(`${API_BASE}/api/horoscope?sign=${selectedHoroscopeSign}`);
        const data = await res.json();
        
        document.getElementById('result-sign').textContent = `${sign.icon} ${sign.name}`;
        const period = document.querySelector('.period-tab.active').textContent;
        document.getElementById('result-period').textContent = `на ${period.toLowerCase()}`;
        
        // Красивое форматирование текста
        resultText.textContent = data.text || "Звёзды пока молчат. Попробуй позже.";
        
    } catch (e) {
        resultText.textContent = "Связь с космосом потеряна. Проверь интернет.";
    }
};

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
        
        document.getElementById('compat-score').textContent = `${data.score || 85}%`;
        document.getElementById('compat-text').textContent = 
            data.text || `Энергия союза ${s1.name} ${s1.icon} и ${s2.name} ${s2.icon} наполнена глубокой гармонией. Вы способны понять друг друга без слов.`;
        
    } catch (e) {
        document.getElementById('compat-text').textContent = "Не удалось рассчитать энергию союза.";
    }
};

window.askHorary = async () => {
    const question = document.getElementById('horary-question').value.trim();
    if (question.length < 10) return tg.showAlert('❓ Задай вопрос подробнее (минимум 10 символов)');
    
    const resultBox = document.getElementById('horary-result');
    resultBox.classList.add('hidden');
    document.getElementById('horary-answer').textContent = '🔮 Анализирую хорарную карту...';
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

window.saveProfile = saveProfile;
window.goHome = goHome;
window.editProfile = editProfile;
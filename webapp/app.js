// COSMIRA WebApp - Main Logic
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let currentUser = null;
const API_BASE = ''; // Same origin

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Показываем лоадер
    showScreen('screen-loading');
    
    try {
        await loadUser();
    } catch (e) {
        console.error('Init error:', e);
        // Показываем регистрацию при ошибке
        showScreen('screen-register');
    }
    
    // Навигация
    setupNavigation();
    setupTabs();
});

// ============================================
// USER & AUTH
// ============================================

async function loadUser() {
    const uid = tg.initDataUnsafe?.user?.id;
    if (!uid) {
        // Демо-режим для браузера
        currentUser = { id: 'demo', name: 'Гость' };
        checkRegistration();
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/api/user?uid=${uid}`);
        const data = await res.json();
        
        if (data.id) {
            currentUser = data;
            checkRegistration();
        } else {
            // Новый пользователь
            currentUser = {
                id: uid,
                name: tg.initDataUnsafe.user?.first_name || 'Пользователь',
                username: tg.initDataUnsafe.user?.username
            };
            showScreen('screen-register');
        }
    } catch (e) {
        console.error('Load user error:', e);
        showScreen('screen-register');
    }
}

function checkRegistration() {
    if (!currentUser.birth_date || !currentUser.birth_time) {
        showScreen('screen-register');
    } else {
        updateProfileUI();
        showScreen('screen-main');
    }
}

async function saveProfile() {
    const name = document.getElementById('reg-name').value || currentUser.name;
    const birthDate = document.getElementById('reg-date').value;
    const birthTime = document.getElementById('reg-time').value;
    const birthCity = document.getElementById('reg-city').value;
    
    if (!birthDate || !birthTime) {
        tg.showAlert('⚠️ Укажи дату и время рождения для расчётов');
        return;
    }
    
    try {
        const payload = {
            id: currentUser.id,
            name,
            username: currentUser.username,
            birth_date: birthDate,
            birth_time: birthTime,
            birth_city: birthCity
        };
        
        const res = await fetch(`${API_BASE}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await res.json();
        
        if (result.status === 'ok') {
            currentUser = result.user;
            updateProfileUI();
            showScreen('screen-main');
            tg.showAlert('✅ Данные сохранены! Теперь можно строить карты.');
        } else {
            tg.showAlert('❌ Ошибка: ' + (result.error || 'Неизвестная'));
        }
    } catch (e) {
        console.error('Save error:', e);
        tg.showAlert('❌ Ошибка соединения');
    }
}

function updateProfileUI() {
    // Главная
    const name = currentUser.name || 'Звёздный Странник';
    document.getElementById('user-greeting').textContent = `Привет, ${name.split(' ')[0]} ✨`;
    
    // Профиль
    document.getElementById('profile-name').textContent = name;
    document.getElementById('profile-id').textContent = currentUser.id;
    document.getElementById('profile-avatar').textContent = name.charAt(0).toUpperCase();
    
    if (currentUser.birth_date) {
        document.getElementById('profile-birth-date').textContent = currentUser.birth_date;
        document.getElementById('profile-birth-time').textContent = currentUser.birth_time || '—';
        document.getElementById('profile-birth-city').textContent = currentUser.birth_city || '—';
    }
    
    const premBadge = document.getElementById('profile-premium');
    if (currentUser.premium) {
        premBadge.textContent = '✅ Активен';
        premBadge.className = 'premium-badge active';
    } else {
        premBadge.textContent = '❌ Нет';
        premBadge.className = 'premium-badge';
    }
}

function editProfile() {
    // Заполняем форму текущими данными
    document.getElementById('reg-name').value = currentUser.name || '';
    document.getElementById('reg-date').value = currentUser.birth_date || '';
    document.getElementById('reg-time').value = currentUser.birth_time || '';
    document.getElementById('reg-city').value = currentUser.birth_city || '';
    
    showScreen('screen-register');
}

function logout() {
    // Сброс для демо
    currentUser = null;
    showScreen('screen-register');
}

// ============================================
// NAVIGATION
// ============================================

function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    
    // Показываем нужный
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.remove('hidden');
        
        // Обновляем активную кнопку навбара
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenId);
        });
    }
    
    // Скролл наверх
    window.scrollTo(0, 0);
}

function goHome() {
    showScreen('screen-main');
}

function setupNavigation() {
    // Кнопки нижнего меню
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.screen;
            if (target) showScreen(target);
        });
    });
    
    // Иконки в хедере
    window.openProfile = () => showScreen('screen-profile');
}

// ============================================
// HOROSCOPE
// ============================================

let selectedPeriod = 'day';
let selectedCategory = 'general';

function setupTabs() {
    // Периоды
    document.querySelectorAll('.period-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectedPeriod = tab.dataset.period;
        });
    });
    
    // Категории
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            selectedCategory = tab.dataset.category;
        });
    });
}

async function loadHoroscope() {
    const sign = document.getElementById('horoscope-sign').value;
    const uid = currentUser?.id;
    
    const resultBox = document.getElementById('horoscope-result');
    const lockBox = document.getElementById('premium-lock');
    
    resultBox.classList.add('hidden');
    lockBox.classList.add('hidden');
    
    try {
        const url = `${API_BASE}/api/horoscope?sign=${sign}&period=${selectedPeriod}&category=${selectedCategory}${uid ? `&uid=${uid}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.locked) {
            lockBox.classList.remove('hidden');
            return;
        }
        
        // Отображаем результат
        const signNames = {
            'Aries':'♈ Овен', 'Taurus':'♉ Телец', 'Gemini':'♊ Близнецы', 'Cancer':'♋ Рак',
            'Leo':'♌ Лев', 'Virgo':'♍ Дева', 'Libra':'♎ Весы', 'Scorpio':'♏ Скорпион',
            'Sagittarius':'♐ Стрелец', 'Capricorn':'♑ Козерог', 'Aquarius':'♒ Водолей', 'Pisces':'♓ Рыбы'
        };
        
        const periodNames = { 'day': 'на сегодня', 'month': 'на месяц', 'year': 'на год' };
        
        document.getElementById('result-sign').textContent = signNames[sign] || sign;
        document.getElementById('result-period').textContent = periodNames[selectedPeriod];
        document.getElementById('result-text').textContent = data.text;
        
        resultBox.classList.remove('hidden');
        
    } catch (e) {
        console.error('Horoscope error:', e);
        tg.showAlert('❌ Не удалось загрузить прогноз');
    }
}

function openHoroscope() {
    showScreen('screen-horoscope');
    // Если у пользователя есть знак в профиле - выбираем его
    if (currentUser?.zodiac_sign) {
        document.getElementById('horoscope-sign').value = currentUser.zodiac_sign;
    }
}

// ============================================
// NATAL CHART
// ============================================

async function openNatal() {
    if (!currentUser?.birth_date) {
        tg.showAlert('⚠️ Сначала заполни дату и время рождения в профиле');
        showScreen('screen-profile');
        return;
    }
    
    showScreen('screen-natal');
    const container = document.getElementById('natal-container');
    container.innerHTML = '<div class="loader">🔮 Рассчитываем положение планет...</div>';
    
    try {
        const uid = currentUser.id;
        const res = await fetch(`${API_BASE}/api/natal?uid=${uid}`);
        const data = await res.json();
        
        if (data.error) {
            container.innerHTML = `<p class="error">⚠️ ${data.error}</p>`;
            return;
        }
        
        // Формируем красивый вывод
        let html = `<h3>Положение планет</h3>`;
        
        const planetNames = {
            'Sun': '☀️ Солнце',
            'Moon': '🌙 Луна', 
            'Mercury': '☿ Меркурий',
            'Ven': '♀ Венера',
            'Mars': '♂ Марс',
            'Jup': '♃ Юпитер',
            'Sat': '♄ Сатурн',
            'Ura': '♅ Уран',
            'Nep': '♆ Нептун',
            'Plu': '♇ Плутон',
            'Ascendant': '⬆️ Асцендент'
        };
        
        for (let key in planetNames) {
            if (data.planets[key]) {
                const p = data.planets[key];
                html += `
                    <div class="planet-row">
                        <span class="planet-name">${planetNames[key]}</span>
                        <span class="planet-value"><strong>${p.sign_ru}</strong> ${p.degree}° ${p.house ? `• Дом ${p.house}` : ''}</span>
                    </div>
                `;
            }
        }
        
        // Добавляем интерпретацию
        if (data.interpretation) {
            html += `<hr style="border:0; border-top:1px solid var(--glass-border); margin:16px 0">`;
            html += `<div style="font-size:14px; line-height:1.6; white-space:pre-wrap">${data.interpretation}</div>`;
        }
        
        container.innerHTML = html;
        
    } catch (e) {
        console.error('Natal error:', e);
        container.innerHTML = '<p class="error">❌ Ошибка расчёта</p>';
    }
}

// ============================================
// COMPATIBILITY
// ============================================

function openCompatibility() {
    showScreen('screen-compat');
}

async function checkCompatibility() {
    const s1 = document.getElementById('compat-s1').value;
    const s2 = document.getElementById('compat-s2').value;
    
    const resultBox = document.getElementById('compat-result');
    resultBox.classList.add('hidden');
    
    try {
        const res = await fetch(`${API_BASE}/api/compatibility?s1=${s1}&s2=${s2}`);
        const data = await res.json();
        
        // Отображаем
        document.getElementById('compat-score').textContent = `${data.score}%`;
        document.getElementById('compat-text').textContent = data.text;
        
        // Детали
        if (data.details) {
            let detailsHtml = '';
            const labels = { 'love':'💕 Любовь', 'friendship':'🤝 Дружба', 'career':'💼 Работа', 'emotions':'💭 Эмоции' };
            for (let key in data.details) {
                detailsHtml += `<div class="compat-detail"><strong>${labels[key]}</strong><br>${data.details[key]}%</div>`;
            }
            document.getElementById('compat-details').innerHTML = detailsHtml;
        }
        
        resultBox.classList.remove('hidden');
        
    } catch (e) {
        console.error('Compat error:', e);
        tg.showAlert('❌ Ошибка расчёта совместимости');
    }
}

// ============================================
// HORARY
// ============================================

function openHorary() {
    showScreen('screen-horary');
}

async function askHorary() {
    const question = document.getElementById('horary-question').value.trim();
    
    if (question.length < 10) {
        tg.showAlert('❓ Задай вопрос подробнее (минимум 10 символов)');
        return;
    }
    
    const resultBox = document.getElementById('horary-result');
    resultBox.classList.add('hidden');
    
    try {
        const res = await fetch(`${API_BASE}/api/horary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question,
                uid: currentUser?.id
            })
        });
        
        const data = await res.json();
        
        if (data.error) {
            tg.showAlert('❌ ' + data.error);
            return;
        }
        
        document.getElementById('horary-answer').textContent = data.answer;
        document.getElementById('horary-time').textContent = new Date(data.timestamp).toLocaleString('ru-RU');
        
        resultBox.classList.remove('hidden');
        
    } catch (e) {
        console.error('Horary error:', e);
        tg.showAlert('❌ Ошибка отправки вопроса');
    }
}

// ============================================
// PREMIUM & OTHER
// ============================================

function openPremium() {
    showScreen('screen-premium');
}

// Экспорт для HTML onclick
window.saveProfile = saveProfile;
window.goHome = goHome;
window.loadHoroscope = loadHoroscope;
window.openHoroscope = openHoroscope;
window.openNatal = openNatal;
window.openCompatibility = openCompatibility;
window.checkCompatibility = checkCompatibility;
window.openHorary = openHorary;
window.askHorary = askHorary;
window.openPremium = openPremium;
window.editProfile = editProfile;
window.openProfile = openProfile;
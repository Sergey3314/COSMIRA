const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

let currentUser = null;
let selectedAvatar = '🔮';
const API_BASE = window.location.origin;

// --- СТАРТ ---
document.addEventListener('DOMContentLoaded', async () => {
    const uid = tg.initDataUnsafe?.user?.id;
    if (!uid) {
        currentUser = { id: 'demo', name: 'Гость', avatar: '' };
        showScreen('screen-register');
        return;
    }
    
    currentUser = { id: String(uid), name: tg.initDataUnsafe.user?.first_name || 'Пользователь' };
    
    try {
        const res = await fetch(`${API_BASE}/api/user?uid=${currentUser.id}`);
        const data = await res.json();
        if (data.user_id) {
            // Маппинг полей из БД
            currentUser = {
                id: String(data.user_id),
                name: data.name || currentUser.name,
                birth_date: data.birth_date,
                birth_time: data.birth_time,
                birth_city: data.birth_city || data.birth_place,
                zodiac: data.zodiac,
                avatar: data.avatar || '🔮',
                premium: data.premium
            };
            updateProfileUI();
            showScreen('screen-main');
        } else {
            showScreen('screen-register');
        }
    } catch (e) {
        console.error('Load error:', e);
        showScreen('screen-register');
    }
});

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
                id: currentUser.id,
                name,
                username: tg.initDataUnsafe.user?.username || '',
                birth_date: birthDate,
                birth_time: birthTime,
                birth_city: birthCity,
                avatar: selectedAvatar,
                zodiac: zodiac  // Передаём объект {name, icon}
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

// --- РАСЧЁТ ЗОДИАКА ---
function getZodiacSign(dateStr) {
    const [, month, day] = dateStr.split('-').map(Number);
    
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) 
        return { name: 'Овен', icon: '♈' };
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) 
        return { name: 'Телец', icon: '♉' };
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) 
        return { name: 'Близнецы', icon: '♊' };
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) 
        return { name: 'Рак', icon: '♋' };
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) 
        return { name: 'Лев', icon: '♌' };
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) 
        return { name: 'Дева', icon: '♍' };
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) 
        return { name: 'Весы', icon: '♎' };
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) 
        return { name: 'Скорпион', icon: '♏' };
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) 
        return { name: 'Стрелец', icon: '♐' };
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) 
        return { name: 'Козерог', icon: '♑' };
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) 
        return { name: 'Водолей', icon: '♒' };
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) 
        return { name: 'Рыбы', icon: '♓' };
    
    return { name: 'Козерог', icon: '♑' };
}

// --- АВАТАР ---
function selectAvatar(icon) {
    selectedAvatar = icon;
    document.querySelectorAll('.avatar-item').forEach(el => el.classList.remove('active'));
    const target = document.querySelector(`.avatar-item[data-icon="${icon}"]`);
    if (target) target.classList.add('active');
}
window.selectAvatar = selectAvatar;

// --- ОБНОВЛЕНИЕ UI ПРОФИЛЯ ---
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

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    window.scrollTo(0, 0);
}
function goHome() { showScreen('screen-main'); }

// Экспорт
window.saveProfile = saveProfile;
window.goHome = goHome;
window.editProfile = editProfile;
window.openProfile = () => showScreen('screen-profile');
window.openHoroscope = () => showScreen('screen-horoscope');
window.openNatal = () => showScreen('screen-natal');
window.openCompatibility = () => showScreen('screen-compat');
window.openHorary = () => showScreen('screen-horary');
window.openPremium = () => showScreen('screen-premium');
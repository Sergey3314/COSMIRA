const tg = window.Telegram.WebApp;
tg.expand(); tg.ready();

let user = {};

// Определение экрана при загрузке
window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register") {
        showScreen("screen-register");
    } else {
        await loadUser();
    }
};

async function loadUser() {
    // Получаем ID из Telegram или генерируем (для теста в браузере)
    const uid = tg.initDataUnsafe?.user?.id || "test_user";
    
    try {
        const res = await fetch(`/api/user?uid=${uid}`);
        user = await res.json();
        
        if (!user.birth_date) {
            showScreen("screen-register");
        } else {
            document.getElementById("user-name-display").textContent = `Привет, ${user.name || "Странник"}`;
            showScreen("screen-main");
        }
    } catch (e) { console.error(e); }
}

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

async function saveProfile() {
    const name = document.getElementById("reg-name").value;
    const date = document.getElementById("reg-date").value;
    const time = document.getElementById("reg-time").value;
    const city = document.getElementById("reg-city").value;
    
    if (!date || !time) return alert("Заполни дату и время!");

    const uid = tg.initDataUnsafe?.user?.id || "test_user";
    
    await fetch("/api/user", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ id: uid, name, birth_date: date, birth_time: time, birth_city: city })
    });
    
    loadUser();
}

function goHome() { showScreen("screen-main"); }

// --- ФУНКЦИОНАЛ ---

async function openNatal() {
    showScreen("screen-natal");
    const box = document.getElementById("natal-content");
    box.innerHTML = '<div class="loader">🔮 Считаем положение планет...</div>';
    
    const uid = tg.initDataUnsafe?.user?.id || "test_user";
    const res = await fetch(`/api/natal?uid=${uid}`);
    const data = await res.json();
    
    if (data.error) {
        box.innerHTML = "Ошибка: " + data.error;
        return;
    }
    
    // Формируем красивый список планет
    let html = `<h3>Положение планет</h3>`;
    const names = {Sun:"☀️ Солнце", Moon:"🌙 Луна", Mercury:" Меркурий", Ven:"♀ Венера", Mars:"♂ Марс"};
    
    for (let p in names) {
        if (data[p]) {
            html += `<div class="planet-row"><span>${names[p]}</span><span>${data[p].sign} (${data[p].degree}°)</span></div>`;
        }
    }
    box.innerHTML = html;
}

function openHoroscope() { alert("Раздел в разработке (подключим API гороскопов)"); }
function openHorary() { alert("Хорар: Задай вопрос (функционал в разработке)"); }

function openCompatibility() { showScreen("screen-compat"); }

async function checkCompat() {
    const s1 = document.getElementById("s1").value;
    const s2 = document.getElementById("s2").value;
    const res = await fetch(`/api/compatibility?s1=${s1}&s2=${s2}`);
    const data = await res.json();
    
    document.getElementById("compat-result").innerHTML = `
        <b>${data.text}</b><br>
        Совместимость: <span style="color:#7000ff; font-size:20px">${data.score}%</span>
    `;
}
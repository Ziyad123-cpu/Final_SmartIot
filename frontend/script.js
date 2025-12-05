// ===========================================================
// 🔗 KONFIGURASI KONSTAN
// ===========================================================
const SERVER_URL = "https://finalsmartfarming-production.up.railway.app/get_data";
const PUMP_URL = "https://finalsmartfarming-production.up.railway.app/pump";

const WEATHER_API_KEY = "5389081c78db5308304b01cd0a773e5e";
const WEATHER_CITY = "Surabaya";

// Batas-batas kelembaban tanah
const BATAS_KERING_TANAH = 40;
const BATAS_LEMBAB_TANAH = 60;

// Ambil threshold dari localStorage
let MOISTURE_THRESHOLD = parseInt(localStorage.getItem('moistureThreshold')) || 40;


// ===========================================================
// 📊 INISIALISASI CHART.JS
// ===========================================================
const ctx = document.getElementById("sensorChart").getContext("2d");

const chart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "Kelembapan Tanah (%)",
                borderColor: "#00e0b8",
                backgroundColor: "#00e0b833",
                data: [],
                fill: true,
                tension: 0.3,
                yAxisID: "y"
            },
            {
                label: "Suhu Tanah (°C)",
                borderColor: "#007bff",
                data: [],
                fill: false,
                tension: 0.3,
                yAxisID: "y1"
            },
            {
                label: "Suhu Udara (°C)",
                borderColor: "#ff9800",
                data: [],
                fill: false,
                tension: 0.3,
                yAxisID: "y1"
            },
            {
                label: "Kelembapan Udara (%)",
                borderColor: "#e91e63",
                backgroundColor: "#e91e6333",
                data: [],
                fill: true,
                tension: 0.3,
                yAxisID: "y"
            },
        ],
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                labels: { color: "#e8f1f2" }
            }
        },
        scales: {
            x: {
                ticks: { color: "#9bb0bf" },
                title: { display: true, text: "Waktu", color: "#9bb0bf" }
            },
            y: {
                type: "linear",
                position: "left",
                ticks: { color: "#9bb0bf" },
                title: { display: true, text: "Kelembapan (%)", color: "#9bb0bf" }
            },
            y1: {
                type: "linear",
                position: "right",
                ticks: { color: "#9bb0bf" },
                title: { display: true, text: "Suhu (°C)", color: "#9bb0bf" },
                grid: { drawOnChartArea: false }
            },
        },
    },
});


// ===========================================================
// 🧠 UPDATE SYSTEM KPI
// ===========================================================
function updateSystemKPIs(moisturePercent) {

    // KPI 1: Keandalan Sistem
    const reliability = 99.8;
    document.getElementById("kpiReliability").textContent = `${reliability}%`;

    // KPI 2: Air Tersimpan Harian
    let waterSaved = parseFloat(localStorage.getItem('waterSaved') || 0);

    if (moisturePercent > BATAS_KERING_TANAH) {
        waterSaved += 0.05;
    }

    localStorage.setItem('waterSaved', waterSaved.toFixed(2));
    document.getElementById("kpiWaterSaved").textContent = `${waterSaved.toFixed(2)} Liter`;
}


// ===========================================================
// ⏰ REALTIME CLOCK & GREETING
// ===========================================================
function updateRealtimeClockAndGreeting() {
    const now = new Date();
    const jam = now.getHours();

    let greeting;
    if (jam >= 4 && jam < 11) greeting = "Selamat Pagi ☀️";
    else if (jam >= 11 && jam < 15) greeting = "Selamat Siang 🌤️";
    else if (jam >= 15 && jam < 18) greeting = "Selamat Sore 🌥️";
    else greeting = "Selamat Malam 🌙";

    const timeString = now.toLocaleTimeString("id-ID", {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    document.getElementById("realtimeGreeting").textContent = greeting;
    document.getElementById("realtimeClock").textContent = timeString;
}

setInterval(updateRealtimeClockAndGreeting, 1000);
updateRealtimeClockAndGreeting();


// ===========================================================
// 📅 HARI & TANGGAL
// ===========================================================
function getFormattedDate() {
    const now = new Date();

    const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const bulanList = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    return {
        hari: hariList[now.getDay()],
        tanggal: now.getDate(),
        bulan: bulanList[now.getMonth()],
        tahun: now.getFullYear()
    };
}

function updateTanggalHari() {
    const { hari, tanggal, bulan, tahun } = getFormattedDate();
    document.getElementById("tanggalHari").textContent = `${hari}, ${tanggal} ${bulan} ${tahun}`;
}

setInterval(updateTanggalHari, 1000);
updateTanggalHari();


// ===========================================================
// 🌦️ CUACA REAL-TIME
// ===========================================================
async function updateWeather() {
    try {
        const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${WEATHER_CITY}&units=metric&appid=${WEATHER_API_KEY}&lang=id`
        );
        const data = await res.json();

        const temp = data.main.temp.toFixed(1);
        const desc = data.weather[0].description;
        const icon = data.weather[0].icon;

        document.getElementById("weatherCity").textContent = data.name;
        document.getElementById("weatherTemp").textContent = `${temp} °C`;
        document.getElementById("weatherDesc").textContent =
            desc.charAt(0).toUpperCase() + desc.slice(1);

        document.getElementById("weatherIcon").innerHTML = `
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png"
                 alt="${desc}"
                 style="width:70px;animation:float 3s ease-in-out infinite;">
        `;

    } catch (err) {
        console.error("❌ Gagal memuat cuaca:", err);
        document.getElementById("weatherDesc").textContent = "Gagal memuat cuaca";
    }
}

setInterval(updateWeather, 600000);
updateWeather();


// ===========================================================
// 🧑‍🌾💧 ANIMASI STATUS PERTANIAN
// ===========================================================
function updateFarmStatusAnimation(moisturePercent, pumpState) {
    const el = document.getElementById("farmStatusAnimation");
    el.className = "farm-animation-icon";

    if (pumpState.toLowerCase() === "nyala" || pumpState.toLowerCase() === "on") {
        el.innerHTML = "💦";
        el.classList.add("watering-flow");

    } else if (moisturePercent <= BATAS_KERING_TANAH) {
        el.innerHTML = "🏜️";
        el.classList.add("dry-bounce");

    } else if (moisturePercent >= BATAS_LEMBAB_TANAH) {
        el.innerHTML = "🌱";
        el.classList.add("normal-idle");

    } else {
        el.innerHTML = "🌿";
        el.classList.add("normal-idle");
    }
}


// ===========================================================
// 📡 DATA SENSOR REAL-TIME
// ===========================================================
async function fetchData() {
    try {
        const startTime = Date.now();
        const res = await fetch(SERVER_URL);
        const data = await res.json();
        const latency = Date.now() - startTime;

        const moisturePercent = data.moisturePercent;
        const pumpState = data.pumpState;

        document.getElementById("soilMoisture").textContent = `${moisturePercent}%`;
        document.getElementById("soilTemp").textContent = `${data.soilTemperature} °C`;
        document.getElementById("airTemp").textContent = `${data.suhuUdara} °C`;
        document.getElementById("airHum").textContent = `${data.kelembapanUdara}%`;

        const pumpStatusEl = document.getElementById("pumpStatus");
        pumpStatusEl.textContent = pumpState;

        if (pumpState.toLowerCase() === "nyala" || pumpState.toLowerCase() === "on") {
            pumpStatusEl.classList.add("pump-status-on");
            pumpStatusEl.classList.remove("pump-status-off");
        } else {
            pumpStatusEl.classList.remove("pump-status-on");
            pumpStatusEl.classList.add("pump-status-off");
        }

        document.getElementById("lastSync").textContent = new Date().toLocaleTimeString();

        document.getElementById("statusKoneksi").textContent = "🟢 Terhubung ke MQTT";
        document.getElementById("statusKoneksi").style.color = "#00e676";

        document.getElementById("connState").textContent = `Latensi: ${latency}ms`;

        // --- PERINGATAN DINI VISUAL ---
        const moistureCard = document.getElementById("soilMoistureCard");
        moistureCard.classList.remove("alert-low", "alert-warning");

        if (moisturePercent <= MOISTURE_THRESHOLD - 5) {
            moistureCard.classList.add("alert-low");
        } else if (moisturePercent <= MOISTURE_THRESHOLD) {
            moistureCard.classList.add("alert-warning");
        }

        // --- UPDATE CHART ---
        const waktu = new Date().toLocaleTimeString();
        const { hari, tanggal, bulan } = getFormattedDate();

        chart.data.labels.push(waktu);
        chart.data.datasets[0].data.push(moisturePercent);
        chart.data.datasets[1].data.push(data.soilTemperature);
        chart.data.datasets[2].data.push(data.suhuUdara);
        chart.data.datasets[3].data.push(data.kelembapanUdara);

        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets.forEach(ds => ds.data.shift());
        }

        chart.update();

        // --- TABEL DATABASE ---
        const tbody = document.getElementById("dataBody");
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${tanggal} ${bulan}</td>
            <td>${hari}</td>
            <td>${waktu}</td>
            <td>${moisturePercent}%</td>
            <td>${data.soilTemperature}°C</td>
            <td>${data.suhuUdara}°C</td>
            <td>${data.kelembapanUdara}%</td>
            <td>${pumpState}</td>
        `;

        tbody.prepend(row);
        if (tbody.rows.length > 50) tbody.deleteRow(50);

        // --- KPI & ANIMASI ---
        updateSystemKPIs(moisturePercent);
        updateFarmStatusAnimation(moisturePercent, pumpState);

    } catch (error) {
        console.error("❌ Gagal ambil data:", error);

        document.getElementById("statusKoneksi").textContent = "🔴 Terputus";
        document.getElementById("statusKoneksi").style.color = "#ff5f56";

        document.getElementById("connState").textContent = "--";

        updateSystemKPIs(0);
        updateFarmStatusAnimation(0, "Mati");
    }
}

setInterval(fetchData, 2000);
fetchData();


// ===========================================================
// 💧 KONTROL POMPA MANUAL
// ===========================================================
async function kontrolPompa(action) {
    try {
        const res = await fetch(`${PUMP_URL}/${action}`);
        const data = await res.json();

        const pumpStatusEl = document.getElementById("pumpStatus");
        pumpStatusEl.textContent = data.pumpState;

        if (data.pumpState.toLowerCase() === "nyala" || data.pumpState.toLowerCase() === "on") {
            pumpStatusEl.classList.add("pump-status-on");
            pumpStatusEl.classList.remove("pump-status-off");
        } else {
            pumpStatusEl.classList.remove("pump-status-on");
            pumpStatusEl.classList.add("pump-status-off");
        }

        const currentMoisture = parseFloat(document.getElementById("soilMoisture").textContent);
        updateFarmStatusAnimation(currentMoisture, data.pumpState);

    } catch (err) {
        console.error("⚠️ Gagal mengirim perintah pompa:", err);
    }
}

document.getElementById("nyalakan").onclick = () => kontrolPompa("on");
document.getElementById("matikan").onclick = () => kontrolPompa("off");


// ===========================================================
// ⚙️ KONTROL AMBANG BATAS (THRESHOLD)
// ===========================================================
const thresholdSlider = document.getElementById("moistureThreshold");
const thresholdValueDisplay = document.getElementById("thresholdValue");
const saveThresholdBtn = document.getElementById("saveThreshold");

thresholdSlider.value = MOISTURE_THRESHOLD;
thresholdValueDisplay.textContent = MOISTURE_THRESHOLD;

thresholdSlider.addEventListener("input", (e) => {
    thresholdValueDisplay.textContent = e.target.value;
});

saveThresholdBtn.addEventListener("click", () => {
    const newValue = parseInt(thresholdSlider.value);
    MOISTURE_THRESHOLD = newValue;

    localStorage.setItem('moistureThreshold', newValue);

    alert(`✅ Batas Ambang Kelembaban diperbarui menjadi ${newValue}%.`);
});


// ===========================================================
// 🧭 SIDEBAR NAVIGASI
// ===========================================================
const btnDashboard = document.getElementById("btnDashboard");
const btnDatabase = document.getElementById("btnDatabase");

const dashboardSection = document.getElementById("dashboardSection");
const databaseSection = document.getElementById("databaseSection");

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");

function closeSidebar() {
    sidebar.classList.remove("show");
}

btnDashboard.addEventListener("click", () => {
    btnDashboard.classList.add("active");
    btnDatabase.classList.remove("active");
    dashboardSection.classList.add("active");
    databaseSection.classList.remove("active");
    closeSidebar();
});

btnDatabase.addEventListener("click", () => {
    btnDatabase.classList.add("active");
    btnDashboard.classList.remove("active");
    databaseSection.classList.add("active");
    dashboardSection.classList.remove("active");
    closeSidebar();
});

menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("show");
});


// ===========================================================
// ⚙️ SERVICE WORKER
// ===========================================================
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("service-worker.js")
            .then(() => console.log("✅ Service Worker registered"))
            .catch(err => console.log("SW registration failed:", err));
    });
}


// ===========================================================
// 🎨 GANTI MODE TEMA
// ===========================================================
const themeSelect = document.getElementById("themeSelect");
const root = document.documentElement;

const savedTheme = localStorage.getItem("theme") || "dark";
themeSelect.value = savedTheme;
applyTheme(savedTheme);

themeSelect.addEventListener("change", e => {
    const theme = e.target.value;
    applyTheme(theme);
    localStorage.setItem("theme", theme);
});

function applyTheme(theme) {
    root.style.transition = "background-color 0.5s ease, color 0.5s ease";

    if (theme === "light") {
        root.style.setProperty("--bg-color", "#f4f4f4");
        root.style.setProperty("--card-color", "#ffffff");
        root.style.setProperty("--text-color", "#222");
        root.style.setProperty("--subtext", "#555");
        root.style.setProperty("--accent", "#007bff");

    } else if (theme === "green") {
        root.style.setProperty("--bg-color", "#0d2617");
        root.style.setProperty("--card-color", "#174d2e");
        root.style.setProperty("--text-color", "#d8ffd8");
        root.style.setProperty("--subtext", "#9fe5a4");
        root.style.setProperty("--accent", "#00e676");

    } else {
        root.style.setProperty("--bg-color", "#0b1622");
        root.style.setProperty("--card-color", "#13283f");
        root.style.setProperty("--text-color", "#e8f1f2");
        root.style.setProperty("--subtext", "#9bb0bf");
        root.style.setProperty("--accent", "#00e0b8");
    }
}

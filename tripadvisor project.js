/* MindTrail 2.0 — Frontend Logic */

let currentStep = 1;
let userLoc = { lat: 12.9716, lon: 77.5946 }; // Default: Bangalore

document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    // Default location check
    if ("geolocation" in navigator) {
        document.getElementById('locStatus').textContent = "Ready to fetch location...";
    }
});

let travelTiming = 'any';
let selectedMood = '';

// ── Mood Selection ──
function selectMood(btn) {
    selectedMood = btn.dataset.mood;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// ── Navigation & Steps ──
function nextStep(step) {
    if (step === 2 && !selectedMood) {
        return alert("Pick a mood first, Wanderer!");
    }

    document.querySelectorAll('.step-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`step${step}`).classList.remove('hidden');

    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`s${step}`).classList.add('active');

    currentStep = step;
}

function setTiming(type) {
    travelTiming = type;
    document.querySelectorAll('.t-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(type));
    });
}

function scrollToForm() {
    document.getElementById('formArea').scrollIntoView({ behavior: 'smooth' });
}

// ── Location ──
function getLocation() {
    const status = document.getElementById('locStatus');
    const city = document.getElementById('cityName');
    status.textContent = "📡 Syncing Satellite Data...";

    navigator.geolocation.getCurrentPosition(
        pos => {
            userLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            status.textContent = `✅ GPS LOCKED: ${userLoc.lat.toFixed(3)}, ${userLoc.lon.toFixed(3)}`;
            status.style.color = "var(--accent-gold)";

            // Basic context based on range (In a real app, use a Geocoding API)
            if (userLoc.lat > 12 && userLoc.lat < 14) city.textContent = "Greater Bangalore Area";
            else city.textContent = "Current Coordinate Zone";
        },
        err => {
            status.textContent = "⚠️ GPS Offline. Using Default (Bangalore).";
            city.textContent = "Bengaluru City Base";
            console.error(err);
        }
    );
}

// ── Analysis ──
async function performAnalysis() {
    const btn = document.querySelector('.btn-analyze');
    const resultsSec = document.getElementById('results');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.textContent = "Synthesizing Mindset...";

    const payload = {
        mood: selectedMood,
        lat: userLoc.lat,
        lon: userLoc.lon,
        timing: travelTiming
    };

    try {
        const resp = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await resp.json();

        if (data.success) {
            renderResults(data);
            resultsSec.classList.remove('hidden');
            resultsSec.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (err) {
        console.error('Analysis failed:', err);
        alert("The AI connection was interrupted. Please try again.");
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

function renderResults(data) {
    const mindsetHeader = document.getElementById('mindsetResult');
    const mindsetDetail = document.getElementById('mindsetDetail');
    const localEl = document.getElementById('currentLocation');
    const grid = document.getElementById('trailsGrid');

    localEl.textContent = `📍 ${data.weather.temp}°C  ·  ${data.season}  ·  ${userLoc.lat.toFixed(2)}°N ${userLoc.lon.toFixed(2)}°E`;
    mindsetHeader.textContent = `${data.mood.charAt(0).toUpperCase() + data.mood.slice(1)} — ${data.moodProfile.types.join(' & ')} trails`;
    mindsetDetail.textContent = `Synchronized with current environmental data. Showing the top trails for your vibe.`;

    grid.innerHTML = data.recommendations.map(p => `
        <div class="trail-card glass reveal">
            <img src="${p.imageUrl}" alt="${p.name}" class="tc-img">
            <div class="tc-overlay">
                <div class="tc-meta">
                    <span class="tc-tag">${p.type}</span>
                    <span class="tc-dist">${p.dist} km away</span>
                </div>
                <h3 class="tc-name">${p.name}</h3>
                <p class="tc-timing">🕒 ${p.bestTiming}</p>
                <p class="tc-desc">${p.description}</p>
                <div class="tc-actions">
                    <button class="btn-detail" onclick="viewTrail(${p.id})">Details →</button>
                    <button class="btn-fav" onclick="toggleFav(${p.id})">❤️</button>
                </div>
            </div>
        </div>
    `).join('');

    // Animate revealed cards
    setTimeout(() => {
        document.querySelectorAll('.trail-card').forEach(c => c.style.opacity = '1');
    }, 100);
}

// ── Chatbot Logic ──
function toggleChat() {
    const container = document.getElementById('botContainer');
    const toggle = document.getElementById('botToggle');

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        toggle.style.opacity = '0';
        toggle.style.pointerEvents = 'none';
        document.getElementById('botInput').focus();
    } else {
        container.classList.add('hidden');
        toggle.style.opacity = '1';
        toggle.style.pointerEvents = 'all';
    }
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('botInput');
    const message = input.value.trim();
    if (!message) return;

    appendMsg('user', message);
    input.value = '';

    try {
        const resp = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await resp.json();
        if (data.success) {
            setTimeout(() => appendMsg('ai', data.reply), 400);
        }
    } catch (err) {
        console.error('Chat error:', err);
        appendMsg('ai', "I'm having trouble connecting to the wilderness right now.");
    }
}

function appendMsg(sender, text) {
    const list = document.getElementById('botMessages');
    const div = document.createElement('div');
    div.className = `msg ${sender}`;
    div.textContent = text;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
}

// ── Reveal Logic ──
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal, .hero-text, .hero-cta').forEach(el => observer.observe(el));
}

// ── Trail Detail Viewing ──
async function viewTrail(id) {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('hidden');
    document.body.classList.add('no-scroll');

    const list = ['modalCafe', 'modalFuel', 'modalHotel', 'modalSpot'];
    list.forEach(id => document.getElementById(id).textContent = "Loading...");

    try {
        const resp = await fetch(`/api/place/${id}`);
        const data = await resp.json();
        if (data.success) {
            const p = data.place;
            document.getElementById('modalImg').src = p.imageUrl;
            document.getElementById('modalName').textContent = p.name;
            document.getElementById('modalRegion').textContent = `${p.region}, ${p.country}`;
            document.getElementById('modalDesc').textContent = p.description;
            document.getElementById('modalTip').textContent = p.tip || "Enjoy the journey!";

            document.getElementById('modalCafe').textContent = p.nearbyCafe || "Local tea spots on trail";
            document.getElementById('modalFuel').textContent = p.nearbyFuel || "Fuel available at base town";
            document.getElementById('modalHotel').textContent = p.nearbyHotel || "Eco-lodges and forest stays";
            document.getElementById('modalSpot').textContent = p.famousSpot || "Ancient scenic viewpoints";

            const featuresList = document.getElementById('modalFeatures');
            featuresList.innerHTML = (p.features || []).map(f => `<li>${f}</li>`).join('');
        }
    } catch (e) {
        console.error('Failed to load trail details:', e);
    }
}

function closeModal() {
    document.getElementById('detailModal').classList.add('hidden');
    document.body.classList.remove('no-scroll');
}

// ── Favorites ──
let favorites = [];
function toggleFav(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(fid => fid !== id);
    } else {
        favorites.push(id);
    }
    document.getElementById('favCount').textContent = favorites.length;
}

function toggleFavDrawer() {
    document.getElementById('favDrawer').classList.toggle('hidden');
}

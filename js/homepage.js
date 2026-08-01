const BASE_URL = window.ApexAnalyzer.baseUrl;

async function loadFeaturedWeapon() {
    const container = document.getElementById("featured-weapon-content");

    if (!container) return;

    try {
        const response = await fetch(`${BASE_URL}/api/featured-weapon`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const weapon = await response.json();
        const bodyDamage = Number(weapon.damage?.body) || 0;
        const rpm = Number(weapon.rpm) || 0;
        const dps = Math.round((bodyDamage * rpm) / 60);

        container.innerHTML = `
    <div class="featured-title">
        FEATURED WEAPON
    </div>

    <div class="featured-subtitle">
        TODAY'S META PICK
    </div>

    <div class="featured-name">
        ${weapon.name}
    </div>

    <div class="featured-class">
        ${weapon.class}
    </div>

    <div class="featured-stars">
        ${weapon.metaScore.stars}
    </div>

    <div class="featured-tier">
        ${weapon.metaScore.tier} TIER
    </div>

    <div class="featured-divider"></div>

    <div class="featured-stat">
        <span>DPS</span>
        <strong>${dps}</strong>
    </div>

    <div class="featured-stat">
        <span>BODY DAMAGE</span>
        <strong>${bodyDamage}</strong>
    </div>

    <div class="featured-stat">
        <span>RPM</span>
        <strong>${weapon.rpm}</strong>
    </div>

    <div class="featured-stat">
        <span>META SCORE</span>
        <strong>${weapon.metaScore.score}/10</strong>
    </div>
`;

    } catch (error) {
        console.error("Featured weapon error:", error);

        container.innerHTML = `
            <p class="featured-weapon-error">
                Featured weapon unavailable.
            </p>
        `;
    }
}

function getHomepageMode() {

    const launchDate = new Date(2026, 7, 4, 19, 0, 0);

    if (new Date() < launchDate) {
        return "countdown";
    }

    return "season";
}

function initCountdown() {

    const mode = getHomepageMode();

    if (mode === "season") {
        renderSeasonLaunchCard();
        return;
    }

    const targetDate = new Date(2026, 7, 4, 19, 0, 0).getTime();

    const updateTimer = () => {
        const now = new Date().getTime();
        const diff = targetDate - now;

        const daysElem = document.getElementById("cd-days");
        const hoursElem = document.getElementById("cd-hours");
        const minsElem = document.getElementById("cd-mins");
        const secsElem = document.getElementById("cd-secs");

        if (!daysElem || !hoursElem || !minsElem || !secsElem) return;

        if (diff <= 0) {
            daysElem.innerText = "00";
            hoursElem.innerText = "00";
            minsElem.innerText = "00";
            secsElem.innerText = "00";
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        daysElem.innerText = String(d).padStart(2, "0");
        hoursElem.innerText = String(h).padStart(2, "0");
        minsElem.innerText = String(m).padStart(2, "0");
        secsElem.innerText = String(s).padStart(2, "0");
    };

    updateTimer();
    setInterval(updateTimer, 1000);
}

function renderSeasonLaunchCard() {

    const countdownCard = document.querySelector(".countdown-card");

    if (!countdownCard) return;

    countdownCard.innerHTML = `
        <h2 style="color:#ffbc0d; font-family:'Orbitron';">
            SEASON 30 IS LIVE
        </h2>

        <p style="
            margin:20px 0;
            color:white;
            font-size:0.95rem;
        ">
            Welcome to the newest Apex Legends season.
        </p>

        <button
            class="supplybin-button"
            onclick="window.open('https://www.ea.com/games/apex-legends/news','_blank')">

            READ PATCH NOTES

        </button>
    `;
}

let mapTimerInterval = null;
async function fetchMapRotation() {
    const mapContainer = document.getElementById("map-info");
    if (!mapContainer) return;

    try {
        const response = await fetch(`${BASE_URL}/api/maprotation`);
        if (!response.ok) throw new Error("Map API response not OK");
        
        const data = await response.json();

        if (data && data.battle_royale && data.ranked) {
            const br = data.battle_royale;
            const ranked = data.ranked;

            let brSecs = br.current.remainingSecs || 0;
            if (!brSecs && br.current.remainingTimer) {
                const parts = br.current.remainingTimer.split(':').map(Number);
                if (parts.length === 3) brSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) brSecs = parts[0] * 60 + parts[1];
            }

            let rankedSecs = ranked.current.remainingSecs || 0;
            if (!rankedSecs && ranked.current.remainingTimer) {
                const parts = ranked.current.remainingTimer.split(':').map(Number);
                if (parts.length === 3) rankedSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) rankedSecs = parts[0] * 60 + parts[1];
            }

            mapContainer.innerHTML = `
                <div style="border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px; margin-bottom: 8px;">
                    <span style="font-size: 0.7rem; color: #ffbc0d; letter-spacing: 1px;">PUB / BATTLE ROYALE</span>
                    <h4 style="color: #fff; font-size: 1.1rem; margin: 2px 0;">${br.current.map}</h4>
                    <p style="font-size: 0.85rem; margin: 2px 0;">
                        Remaining: <strong id="br-live-timer" style="color: #da291c; font-family: 'Orbitron', sans-serif;">${br.current.remainingTimer || '--:--'}</strong>
                    </p>
                    <small style="opacity: 0.6; font-size: 0.7rem;">NEXT: ${br.next ? br.next.map : 'Unknown'}</small>
                </div>
                <div>
                    <span style="font-size: 0.7rem; color: #ffbc0d; letter-spacing: 1px;">RANKED ROTATION</span>
                    <h4 style="color: #fff; font-size: 1.1rem; margin: 2px 0;">${ranked.current.map}</h4>
                    <p style="font-size: 0.85rem; margin: 2px 0;">
                        Remaining: <strong id="ranked-live-timer" style="color: #da291c; font-family: 'Orbitron', sans-serif;">${ranked.current.remainingTimer || '--:--'}</strong>
                    </p>
                    <small style="opacity: 0.6; font-size: 0.7rem;">NEXT: ${ranked.next ? ranked.next.map : 'Unknown'}</small>
                </div>
            `;

            const formatSeconds = (totalSecs) => {
                if (totalSecs <= 0) return "ROTATING...";
                const h = Math.floor(totalSecs / 3600);
                const m = Math.floor((totalSecs % 3600) / 60);
                const s = totalSecs % 60;
                return h > 0 
                    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            };

            if (mapTimerInterval) clearInterval(mapTimerInterval);

            if (brSecs > 0 || rankedSecs > 0) {
                mapTimerInterval = setInterval(() => {
                    const brElem = document.getElementById("br-live-timer");
                    const rankedElem = document.getElementById("ranked-live-timer");

                    if (brElem && brSecs > 0) { brElem.innerText = formatSeconds(brSecs); brSecs--; }
                    if (rankedElem && rankedSecs > 0) { rankedElem.innerText = formatSeconds(rankedSecs); rankedSecs--; }

                    if (brSecs <= 0 || rankedSecs <= 0) {
                        clearInterval(mapTimerInterval);
                        setTimeout(fetchMapRotation, 4000);
                    }
                }, 1000);
            }
        }
    } catch (err) {
        console.error("Map rotation fetch error:", err);
        mapContainer.innerHTML = "<p style='color: #da291c; font-size: 0.8rem;'>Live map data currently unavailable</p>";
    }
}

async function loadLiveBannerData() {
    try {
    const res = await fetch(`${BASE_URL}/api/server-status`, {
        cache: "no-store"
    });

    const data = await res.json();

    const statusText = document.getElementById("server-status-text");
    const dot = document.getElementById("server-dot");

    if (statusText && dot) {
        const status = String(data.status || "UNKNOWN").toUpperCase();

       statusText.innerText =
         data.latency
        ? `${status} (${data.latency} ms)`
        : status;

        if (status === "ONLINE" || status === "OPERATIONAL") {
            dot.className = "status-indicator dot-green";
        } else if (status === "UNKNOWN") {
            dot.className = "status-indicator dot-gray";
        } else {
            dot.className = "status-indicator dot-red";
        }
    }

    if (!res.ok) {
        console.warn(
            "Server status unavailable:",
            data.message || `HTTP ${res.status}`
        );
    }
} catch (error) {
    console.warn("Server status request failed:", error.message);

    const statusText = document.getElementById("server-status-text");
    const dot = document.getElementById("server-dot");

    if (statusText) {
        statusText.innerText = "UNKNOWN";
    }

    if (dot) {
        dot.className = "status-indicator dot-gray";
    }
}

    try {
        const res = await fetch(`${BASE_URL}/api/algs-event`);
        if (res.ok) {
            const data = await res.json();
            const algsText = document.getElementById("algs-event-text");
            const algsLink = document.getElementById("algs-event-link");
            
            if (algsText) algsText.innerText = `${data.eventName} — ${data.date}`;
            if (algsLink && data.link) algsLink.href = data.link;
        }
    } catch (e) {
        console.warn("ALGS fallback active");
    }

    try {
        const res = await fetch(`${BASE_URL}/api/latest-news`);
        if (res.ok) {
            const data = await res.json();
            const newsText = document.getElementById("latest-news-text");
            const newsLink = document.getElementById("latest-news-link");

            if (newsText && data.title) {
                newsText.innerText = data.title.length > 35 ? data.title.substring(0, 35) + "..." : data.title;
            }
            if (newsLink && data.link) {
                newsLink.href = data.link;
            }
        }
    } catch (e) {
        console.warn("News fallback active");
    }
}

function loadRandomApexTip() {
    const tipContainer = document.getElementById("apex-pro-tip");
    if (!tipContainer) return;

    const tips = [
        "Headshot multiplier varies: Snipers deal 2.0x damage, while SMGs deal 1.25x.",
        "Armor swapping from deathboxes instantly restores shield without using cells.",
        "Hipfire accuracy is significantly higher when crouching while shooting.",
        "Use the Weapon Comparison tab on the Dashboard to optimize your loadout DPS.",
        "Wall-bouncing resets your momentum and makes you a much harder target to hit."
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    tipContainer.innerText = randomTip;
}

document.addEventListener("DOMContentLoaded", () => {
    initCountdown();
    fetchMapRotation();
    loadFeaturedWeapon();
    loadLiveBannerData();
    loadRandomApexTip();
});


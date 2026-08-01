const BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:3000" 
    : "https://apex-legends-analyzer-1.onrender.com";

async function populateWeaponSelect() {
    const weaponSelect = document.getElementById("weapon-select");
    const compareSelect1 = document.getElementById("compare-weapon-1");
    const compareSelect2 = document.getElementById("compare-weapon-2");

    if (!weaponSelect && !compareSelect1 && !compareSelect2) return;

    try {
        const response = await fetch(`${BASE_URL}/api/weapons`);
        if (!response.ok) throw new Error("Failed to fetch weapons from database");

        const weapons = await response.json();

        if (weaponSelect) weaponSelect.innerHTML = '<option value="">Select a weapon...</option>';
        if (compareSelect1) compareSelect1.innerHTML = '<option value="">Select Weapon 1...</option>';
        if (compareSelect2) compareSelect2.innerHTML = '<option value="">Select Weapon 2...</option>';

        weapons.forEach(weapon => {
            const option1 = document.createElement("option");
            option1.value = weapon.id;
            option1.textContent = `${weapon.name} (${weapon.class})`;

            const option2 = option1.cloneNode(true);
            const option3 = option1.cloneNode(true);

            if (weaponSelect) weaponSelect.appendChild(option1);
            if (compareSelect1) compareSelect1.appendChild(option2);
            if (compareSelect2) compareSelect2.appendChild(option3);
        });

    } catch (error) {
        console.error("Error loading weapons:", error);
    }
}

async function searchWeapon() {
    const w1Id = document.getElementById("compare-weapon-1")?.value;
    const w2Id = document.getElementById("compare-weapon-2")?.value;
    const resultDiv = document.getElementById("comparison-result");

    if (!resultDiv) return;
    if (!w1Id || !w2Id) {
        resultDiv.innerHTML = `
            <div class="warning-message">
                ⚠️ SELECT TWO WEAPONS TO COMPARE!
            </div>
        `;
        return;
    }

    if (w1Id === w2Id) {
        resultDiv.innerHTML = `
            <div class="warning-message">
                ⚠️ PLEASE CHOOSE TWO DIFFERENT WEAPONS!
            </div>
        `;
        return;
    }

    try {
        const [res1, res2] = await Promise.all([
            fetch(`${BASE_URL}/api/weapons/${w1Id}`),
            fetch(`${BASE_URL}/api/weapons/${w2Id}`)
        ]);

        if (!res1.ok || !res2.ok) throw new Error("Fetch failed");

        const w1 = await res1.json();
        const w2 = await res2.json();

        const w1Dmg = w1.damage ? (w1.damage.body || 0) : 0;
        const w2Dmg = w2.damage ? (w2.damage.body || 0) : 0;

        const w1Rpm = w1.rpm || 0;
        const w2Rpm = w2.rpm || 0;

        const w1Dps = w1Rpm > 0 ? Math.round((w1Dmg * w1Rpm) / 60) : 0;
        const w2Dps = w2Rpm > 0 ? Math.round((w2Dmg * w2Rpm) / 60) : 0;

        let w1DpsClass = "", w2DpsClass = "";
        let w1DmgClass = "", w2DmgClass = "";

        if (w1Dps > w2Dps) { w1DpsClass = "winner-stat"; w2DpsClass = "loser-stat"; }
        else if (w2Dps > w1Dps) { w2DpsClass = "winner-stat"; w1DpsClass = "loser-stat"; }

        if (w1Dmg > w2Dmg) { w1DmgClass = "winner-stat"; w2DmgClass = "loser-stat"; }
        else if (w2Dmg > w1Dmg) { w2DmgClass = "winner-stat"; w1DmgClass = "loser-stat"; }

        resultDiv.innerHTML = `
            <div class="compare-grid" style="margin-top: 15px; width: 100%;">
                <div class="compare-column">
                    <div class="compare-weapon-title" style="color: #ff2a2a; font-family: 'Orbitron'; margin-bottom: 8px;">${w1.name}</div>
                    <div class="compare-stat-box ${w1DpsClass}"><small>DPS</small><strong>${w1Dps}</strong></div>
                    <div class="compare-stat-box ${w1DmgClass}"><small>DAMAGE</small><strong>${w1Dmg}</strong></div>
                    <div class="compare-stat-box"><small>RPM</small><strong>${w1Rpm}</strong></div>
                </div>

                <div class="vs-divider" style="font-family: 'Orbitron'; color: #ff4d4d; font-weight: bold; align-self: center; padding: 0 5px;">VS</div>

                <div class="compare-column">
                    <div class="compare-weapon-title" style="color: #ffbc0d; font-family: 'Orbitron'; margin-bottom: 8px;">${w2.name}</div>
                    <div class="compare-stat-box ${w2DpsClass}"><small>DPS</small><strong>${w2Dps}</strong></div>
                    <div class="compare-stat-box ${w2DmgClass}"><small>DAMAGE</small><strong>${w2Dmg}</strong></div>
                    <div class="compare-stat-box"><small>RPM</small><strong>${w2Rpm}</strong></div>
                </div>
            </div>
        `;
    } catch (err) {
        console.error("Comparison error:", err);
        resultDiv.innerHTML = `<div class="warning-message">ERROR LOADING WEAPON DATA</div>`;
    }
}

async function searchTriggered() {
    const weaponId = document.getElementById("weapon-select")?.value;
    const hitZone = document.getElementById("hit-zone")?.value || "body";
    const resultDiv = document.getElementById("calculator-result");

    if (!weaponId) {
        alert("Please select a weapon first!");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/weapons/${weaponId}`);
        const weapon = await response.json();
        let damage = 0;
        if (weapon.damage) {
            damage = weapon.damage[hitZone] || weapon.damage.body || 0;
        }

        const rpm = weapon.rpm || 0;
        const dps = rpm > 0 ? Math.round((damage * rpm) / 60) : 0;

        resultDiv.innerHTML = `
            <h4 style="color: #ffbc0d;">${weapon.name}</h4>
            <p>Calculated DPS (${hitZone.toUpperCase()}): <span style="font-size: 1.4rem; font-weight: bold; color: #da291c;">${dps}</span></p>
            <p>Damage per shot: <strong>${damage}</strong> | RPM: <strong>${rpm}</strong></p>
        `;
    } catch (err) {
        console.error("DPS Calculation error:", err);
    }
}

async function loadGlobalStats() {
    const container = document.getElementById("top-predators-list");
    if (!container) return;

    try {
        const topRes = await fetch(`${BASE_URL}/api/top-players`);
        
        if (!topRes.ok) {
            container.innerHTML = "<p style='color: #da291c; font-size: 0.75rem; text-align: center; margin: 0;'>Apex API rate-limited.</p>";
            return;
        }

        const topData = await topRes.json();

        if (Array.isArray(topData) && topData.length > 0) {
            container.innerHTML = topData.map((player, index) => `
                <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span style="color: ${index === 0 ? '#ffbc0d' : '#fff'}">#${index + 1} ${player.name}</span>
                    <span style="color: #88888e">${player.score}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = "<p style='color: #888; font-size: 0.75rem; text-align: center; margin: 0;'>Live data unavailable</p>";
        }
    } catch (err) {
        console.warn("Error loading global stats:", err);
        container.innerHTML = "<p style='color: #888; font-size: 0.75rem; text-align: center; margin: 0;'>Live data offline</p>";
    }
}

async function searchPlayer() {
    const playerNameInput = document.getElementById("playerNameInput");
    const platformSelect = document.getElementById("platformSelect");
    const playerStatsDisplay = document.getElementById("playerStatsDisplay");

    if (!playerNameInput || !platformSelect || !playerStatsDisplay) return;

    const playerName = playerNameInput.value.trim();
    const platform = platformSelect.value;

    if (!playerName) {
        alert("Please enter a player name.");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/api/player?player=${encodeURIComponent(playerName)}&platform=${platform}`);

        if (!response.ok) {
            alert("Player not found or Apex API rate limited.");
            return;
        }

        const data = await response.json();

        const globalData = data.global || {};
        const rankData = data.rank || {};
        const legendData = data.legend || {};

        document.getElementById("resPlayerName").textContent = globalData.name || playerName;
        document.getElementById("resPlayerLevel").textContent = globalData.level !== undefined ? globalData.level : "N/A";
        
        if (rankData.rankName) {
            const rankDiv = rankData.rankDiv !== undefined ? rankData.rankDiv : "";
            document.getElementById("resPlayerRank").textContent = `${rankData.rankName} ${rankDiv}`.trim();
        } else {
            document.getElementById("resPlayerRank").textContent = "Unranked";
        }

        if (legendData.LegendName) {
            document.getElementById("resPlayerLegend").textContent = legendData.LegendName;
        }

        const trackersContainer = document.getElementById("bannerTrackersContainer");
        if (trackersContainer) {
            if (data.trackers && data.trackers.length > 0) {
                trackersContainer.innerHTML = data.trackers.map(t => `
                    <p class="stat-text" style="margin: 4px 0;">
                        <span style="color: #aaa;">${t.name}:</span> 
                        <span class="highlight-yellow" style="color: #ffbc0d; font-weight: bold; font-family: 'Orbitron', sans-serif;">${t.value}</span>
                    </p>
                `).join('');
            } else {
                trackersContainer.innerHTML = `<p style="color: #888; font-size: 0.85rem;">No Active Banner Trackers</p>`;
            }
        }

        const rankImg = document.getElementById("resRankImg");
        if (rankImg && rankData.rankImg) {
            rankImg.src = rankData.rankImg;
            rankImg.style.display = "inline-block";
        }

        const legendImg = document.getElementById("resLegendImg");
        if (legendImg) {
            const imgUrl = legendData.ImgAssets?.icon || legendData.ImgAssets?.banner;
            if (imgUrl) {
                legendImg.src = imgUrl;
                legendImg.style.display = "inline-block";
            } else {
                legendImg.style.display = "none";
            }
        }

        playerStatsDisplay.style.display = "block";

    } catch (error) {
        console.error("Error fetching player data:", error);
        alert("Error fetching player data. Check Node server status.");
    }
}

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
            <div class="featured-weapon-name">
                ${weapon.name}
            </div>

            <div class="featured-weapon-class">
                ${weapon.class}
            </div>

            <div class="meta-section">
                <div class="meta-stars">
                    ${weapon.stars || "☆☆☆☆☆"}
                </div>

                <div class="meta-score-label">
                    META SCORE
                </div>

                <div class="meta-score-value">
                    ${weapon.metaScore ?? "N/A"} / 10
                </div>

                <div class="meta-tier">
                    ${weapon.tier || "N/A"} TIER
                </div>
            </div>

            <div class="featured-stats">
                <div class="weapon-stat">
                    <span>DPS</span>
                    <strong class="weapon-value">${dps}</strong>
                </div>

                <div class="weapon-stat">
                    <span>BODY DAMAGE</span>
                    <strong class="weapon-value">${bodyDamage}</strong>
                </div>

                <div class="weapon-stat">
                    <span>RPM</span>
                    <strong class="weapon-value">${rpm}</strong>
                </div>
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

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("cd-days")) initCountdown();
    if (document.getElementById("map-info")) fetchMapRotation();
    if (document.getElementById("weapon-select")) populateWeaponSelect();

    loadFeaturedWeapon();
    loadLiveBannerData();
    loadRandomApexTip();
});

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

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("cd-days")) initCountdown();
    if (document.getElementById("map-info")) fetchMapRotation();
    if (document.getElementById("weapon-select")) populateWeaponSelect();
    
    loadLiveBannerData();

    if (document.getElementById("top-predators-list")) {
        loadGlobalStats();
        setInterval(loadGlobalStats, 300000); 
    }
});

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
    loadRandomApexTip();
});
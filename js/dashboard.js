const BASE_URL = window.ApexAnalyzer.baseUrl;

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

document.addEventListener("DOMContentLoaded", () => {
    populateWeaponSelect();
});


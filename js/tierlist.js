const BASE_URL = window.ApexAnalyzer.baseUrl;

const TIER_ORDER = ["S", "A", "B", "C"];

async function loadTierList() {
    const container = document.getElementById("tier-list-container");

    if (!container) return;

    try {
        const response = await fetch(
            `${BASE_URL}/api/weapons/top-meta?limit=25`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const weapons = Array.isArray(data.weapons)
            ? data.weapons
            : [];

        if (weapons.length === 0) {
            container.innerHTML = `
                <p class="tier-list-error">
                    No weapon data is currently available.
                </p>
            `;
            return;
        }

        const groupedWeapons = groupWeaponsByTier(weapons);

        container.innerHTML = TIER_ORDER
            .map((tier) => renderTierSection(
                tier,
                groupedWeapons[tier] || []
            ))
            .join("");

    } catch (error) {
        console.error("Tier list error:", error);

        container.innerHTML = `
            <p class="tier-list-error">
                Weapon rankings are currently unavailable.
            </p>
        `;
    }
}

function groupWeaponsByTier(weapons) {
    return weapons.reduce((groups, weapon) => {
        const tier = weapon.tier || "C";

        if (!groups[tier]) {
            groups[tier] = [];
        }

        groups[tier].push(weapon);

        return groups;
    }, {});
}

function renderTierSection(tier, weapons) {
    return `
        <section class="tier-section tier-${tier.toLowerCase()}">

            <div class="tier-label">
                <span class="tier-letter">${tier}</span>

                <div>
                    <h2>${tier} TIER</h2>
                    <p>${getTierDescription(tier)}</p>
                </div>
            </div>

            <div class="tier-weapons">
                ${
                    weapons.length > 0
                        ? weapons.map(renderWeaponCard).join("")
                        : `
                            <p class="empty-tier">
                            No weapons currently meet the requirements for this tier.
                            </p>
                        `
                }
            </div>

        </section>
    `;
}

function renderWeaponCard(weapon) {
    return `
        <article class="tier-weapon-card">

            <div>
                <h3>${weapon.name}</h3>
                <p>${weapon.class}</p>
            </div>

            <div class="tier-weapon-rating">
                <span class="tier-stars">
                    ${weapon.stars || "☆☆☆☆☆"}
                </span>

                <strong>
                    ${weapon.metaScore ?? "N/A"} / 10
                </strong>
            </div>

            <div class="tier-weapon-stats">
                <span>DPS: ${weapon.dps ?? 0}</span>
                <span>RPM: ${weapon.rpm ?? 0}</span>
            </div>

        </article>
    `;
}

function getTierDescription(tier) {
    const descriptions = {
        S: "Highest statistical performance",
        A: "Strong overall performance",
        B: "Balanced or situational performance",
        C: "Lower score under the current model"
    };

    return descriptions[tier] || "";
}

document.addEventListener("DOMContentLoaded", loadTierList);

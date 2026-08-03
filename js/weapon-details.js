const BASE_URL = window.ApexAnalyzer?.baseUrl
    || (
        window.location.hostname === "localhost"
        || window.location.hostname === "127.0.0.1"
            ? "http://localhost:3000"
            : "https://apex-legends-analyzer-1.onrender.com"
    );

const loadingElement = document.getElementById("weapon-details-loading");
const errorElement = document.getElementById("weapon-details-error");
const contentElement = document.getElementById("weapon-details-content");

async function loadWeaponDetails() {
    const weaponId = getWeaponIdFromUrl();

    if (!weaponId) {
        showError("Missing weapon identifier.");
        return;
    }

    try {
        const response = await fetch(
            `${BASE_URL}/api/weapons/${encodeURIComponent(weaponId)}`
        );

        if (response.status === 404) {
            throw new Error("Weapon not found.");
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const weapon = await response.json();

        renderWeaponDetails(weapon);

    } catch (error) {
        console.error("Weapon details error:", error);
        showError(error.message || "Weapon details are unavailable.");
    }
}

function getWeaponIdFromUrl() {
    const parameters = new URLSearchParams(window.location.search);

    return parameters.get("id");
}

function renderWeaponDetails(weapon) {
    const damage = weapon.damage || {};
    const magazines = weapon.mag_sizes || {};

    const headDamage = Number(damage.head) || 0;
    const bodyDamage = Number(damage.body) || 0;
    const legDamage = Number(damage.leg) || 0;

    const rpm = Number(weapon.rpm) || 0;

    const dps = Number.isFinite(Number(weapon.dps))
        ? Number(weapon.dps)
        : Math.round((bodyDamage * rpm) / 60);

    const metaScore = Number(weapon.metaScore) || 0;
    const tier = String(weapon.tier || "C").toUpperCase();
    const stars = weapon.stars || "☆☆☆☆☆";

    const headshotMultiplier = bodyDamage > 0
        ? (headDamage / bodyDamage).toFixed(2)
        : "0.00";

    setText("weapon-detail-name", weapon.name || "Unknown Weapon");
    setText("weapon-detail-class", weapon.class || "Unknown Class");

    setText("weapon-detail-tier", `${tier} TIER`);
    setText("weapon-detail-stars", stars);
    setText("weapon-detail-meta-score", `${metaScore} / 10`);

    const tierElement = document.getElementById("weapon-detail-tier");

    if (tierElement) {
        tierElement.dataset.tier = tier;
    }

    setText("weapon-detail-dps", dps);
    setText("weapon-detail-rpm", rpm);
    setText("weapon-detail-body", bodyDamage);
    setText("weapon-detail-head", headDamage);
    setText("weapon-detail-leg", legDamage);
    setText(
        "weapon-detail-head-multiplier",
        `${headshotMultiplier}×`
    );

    setText("weapon-mag-base", getMagazineValue(magazines.base));
    setText("weapon-mag-level1", getMagazineValue(magazines.level1));
    setText("weapon-mag-level2", getMagazineValue(magazines.level2));
    setText("weapon-mag-level3", getMagazineValue(magazines.level3));

    const combatProfile =
    createWeaponCombatProfile({

        weapon,
        bodyDamage,
        rpm,
        dps,
        metaScore

    });

renderCombatList(

    "weapon-strengths",

    combatProfile.strengths,

    "strength"

);

renderCombatList(

    "weapon-weaknesses",

    combatProfile.weaknesses,

    "weakness"

);

setText(

    "weapon-playstyle",

    combatProfile.playstyle

);

    const analysisElement = document.getElementById("weapon-analysis-text");

    if (analysisElement) {
    analysisElement.innerHTML = generateWeaponAnalysis({
        weapon,
        bodyDamage,
        rpm,
        dps,
        metaScore,
        tier
    });
}

    document.title =
        `${weapon.name || "Weapon"} | Apex//Analyzer`;

    hideLoading();
    showContent();
}

function generateWeaponAnalysis({
    weapon,
    bodyDamage,
    rpm,
    dps,
    metaScore,
    tier
}) {
    const weaponName = weapon.name || "This weapon";
    const weaponClass = weapon.class || "weapon";

    let damageDescription;

    if (bodyDamage >= 35) {
        damageDescription = "high per-shot damage";
    } else if (bodyDamage >= 18) {
        damageDescription = "solid per-shot damage";
    } else {
        damageDescription = "lower per-shot damage";
    }

    let fireRateDescription;

    if (rpm >= 700) {
        fireRateDescription = "a very high fire rate";
    } else if (rpm >= 450) {
        fireRateDescription = "a balanced fire rate";
    } else {
        fireRateDescription = "a slower fire rate";
    }

    let tierDescription;

    switch (tier) {
        case "S":
            tierDescription =
                "The current Analyzer model classifies it as a top-performing option.";
            break;

        case "A":
            tierDescription =
                "The current Analyzer model classifies it as a strong overall option.";
            break;

        case "B":
            tierDescription =
                "The current Analyzer model classifies it as a balanced or situational option.";
            break;

        default:
            tierDescription =
                "The current Analyzer model gives it a lower statistical rating, although real effectiveness still depends on accuracy, positioning and play style.";
    }

    return `
        ${weaponName} is classified as a ${weaponClass}.
        It combines ${damageDescription} with ${fireRateDescription},
        producing a theoretical body-shot DPS of ${dps}.
        Its current Analyzer Meta Score is ${metaScore}/10.
        ${tierDescription}
    `;
}

function createWeaponCombatProfile({
    weapon,
    bodyDamage,
    rpm,
    dps,
    metaScore
}) {
    const strengths = [];
    const weaknesses = [];

    const magazines = weapon.mag_sizes || {};
    const levelThreeMagazine = Number(magazines.level3) || 0;
    const weaponClass = String(weapon.class || "").trim();

    if (bodyDamage >= 35) {
        strengths.push("High damage per successful body hit.");
    } else if (bodyDamage >= 18) {
        strengths.push("Solid per-shot body damage.");
    } else {
        weaknesses.push("Low damage per individual shot.");
    }

    if (rpm >= 700) {
        strengths.push("Very high fire rate for sustained close-range pressure.");
    } else if (rpm >= 450) {
        strengths.push("Balanced fire rate for continuous engagements.");
    } else if (rpm <= 150) {
        weaknesses.push("Slow fire rate makes missed shots more punishing.");
    }

    if (dps >= 190) {
        strengths.push("Excellent theoretical body-shot DPS.");
    } else if (dps >= 150) {
        strengths.push("Competitive theoretical damage output.");
    } else if (dps < 100) {
        weaknesses.push("Limited sustained damage output.");
    }

    if (levelThreeMagazine >= 28) {
        strengths.push("Large Level III magazine capacity.");
    } else if (levelThreeMagazine > 0 && levelThreeMagazine <= 8) {
        weaknesses.push("Small magazine requires accurate shot placement.");
    }

    if (metaScore >= 8) {
        strengths.push("Strong result in the current Analyzer model.");
    } else if (metaScore <= 4) {
        weaknesses.push(
            "Lower statistical rating in the current Analyzer model."
        );
    }

    let playstyle;

    switch (weaponClass) {
        case "Assault Rifle":
            playstyle =
                "Best suited for adaptable medium-range engagements. Use controlled bursts and cover to maintain consistent pressure.";
            break;

        case "SMG":
            playstyle =
                "Recommended for aggressive close-range play. Use movement and fast target tracking to exploit its fire rate.";
            break;

        case "Shotgun":
            playstyle =
                "Designed for close-quarters combat. Fight around doors, corners and cover where burst damage is most effective.";
            break;

        case "Sniper":
            playstyle =
                "Recommended for long-range precision. Prioritize positioning, clear sight lines and accurate opening shots.";
            break;

        case "Marksman":
            playstyle =
                "Effective at medium and long range. Maintain distance and apply controlled pressure with accurate follow-up shots.";
            break;

        case "LMG":
            playstyle =
                "Best used for sustained fire and area control. Use the magazine capacity to pressure enemies and deny movement.";
            break;

        case "Pistol":
            playstyle =
                "Most effective as a flexible secondary weapon for quick swaps, finishing damaged opponents or conserving primary ammunition.";
            break;

        default:
            playstyle =
                "Adapt positioning and engagement distance to the weapon's damage, fire rate and magazine capacity.";
    }

    if (strengths.length === 0) {
        strengths.push(
            "Provides situational value when used within its intended role."
        );
    }

    if (weaknesses.length === 0) {
        weaknesses.push(
            "Performance still depends on accuracy, positioning and player execution."
        );
    }

    return {
        strengths,
        weaknesses,
        playstyle
    };
}

function getMagazineValue(value) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue)
        ? numericValue
        : "N/A";
}

function renderCombatList(elementId, items, type) {

    const element = document.getElementById(elementId);

    if (!element) return;

    const symbol = type === "strength"
        ? "✔"
        : "✖";

    element.innerHTML = items
        .map(item => `
            <li class="weapon-combat-item ${type}">
                <span>${symbol}</span>
                <p>${item}</p>
            </li>
        `)
        .join("");

}

function setText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = value;
    }
}

function hideLoading() {
    if (loadingElement) {
        loadingElement.hidden = true;
    }
}

function showContent() {
    if (contentElement) {
        contentElement.hidden = false;
    }
}

function showError(message) {
    hideLoading();

    if (contentElement) {
        contentElement.hidden = true;
    }

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.hidden = false;
    }
}

document.addEventListener("DOMContentLoaded", loadWeaponDetails);

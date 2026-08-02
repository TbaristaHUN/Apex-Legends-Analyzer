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

    setText(
        "weapon-analysis-text",
        generateWeaponAnalysis({
            weapon,
            bodyDamage,
            rpm,
            dps,
            metaScore,
            tier
        })
    );

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

    if (bodyDamage >= 50) {
        damageDescription = "very high single-shot damage";
    } else if (bodyDamage >= 25) {
        damageDescription = "strong single-shot damage";
    } else if (bodyDamage >= 15) {
        damageDescription = "moderate single-shot damage";
    } else {
        damageDescription = "lower single-shot damage";
    }

    let fireRateDescription;

    if (rpm >= 750) {
        fireRateDescription = "a very high fire rate";
    } else if (rpm >= 500) {
        fireRateDescription = "a high fire rate";
    } else if (rpm >= 250) {
        fireRateDescription = "a moderate fire rate";
    } else {
        fireRateDescription = "a slower fire rate";
    }

    let performanceDescription;

    if (tier === "S") {
        performanceDescription =
            "The current statistical model classifies it as a top-performing option.";
    } else if (tier === "A") {
        performanceDescription =
            "The current statistical model classifies it as a strong overall option.";
    } else if (tier === "B") {
        performanceDescription =
            "The current statistical model classifies it as a balanced or situational option.";
    } else {
        performanceDescription =
            "The current statistical model gives it a lower score, although its effectiveness may depend heavily on range, accuracy and play style.";
    }

    return `${weaponName} is classified as a ${weaponClass}. `
        + `It combines ${damageDescription} with ${fireRateDescription}, `
        + `resulting in a theoretical body-shot DPS of ${dps}. `
        + `Its current Analyzer Meta Score is ${metaScore}/10. `
        + performanceDescription;
}

function getMagazineValue(value) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue)
        ? numericValue
        : "N/A";
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
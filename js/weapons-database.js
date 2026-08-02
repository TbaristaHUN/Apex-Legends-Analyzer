const BASE_URL = window.ApexAnalyzer?.baseUrl
    || (
        window.location.hostname === "localhost"
        || window.location.hostname === "127.0.0.1"
            ? "http://localhost:3000"
            : "https://apex-legends-analyzer-1.onrender.com"
    );

let allWeapons = [];

const weaponGrid = document.getElementById("weapon-grid");
const searchInput = document.getElementById("weapon-search");
const classFilter = document.getElementById("weapon-class-filter");
const sortSelect = document.getElementById("weapon-sort");
const resetButton = document.getElementById("reset-weapon-filters");
const visibleCount = document.getElementById("visible-weapon-count");
const totalCount = document.getElementById("total-weapon-count");

async function loadWeaponDatabase() {
    if (!weaponGrid) return;

    try {
        const response = await fetch(
            `${BASE_URL}/api/weapons/top-meta?limit=50`
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        allWeapons = Array.isArray(data.weapons)
            ? data.weapons
            : [];

        if (totalCount) {
            totalCount.textContent = allWeapons.length;
        }

        applyFiltersAndSort();

    } catch (error) {
        console.error("Weapon database error:", error);

        weaponGrid.innerHTML = `
            <p class="weapon-database-error">
                Failed to load weapon database.
            </p>
        `;

        updateVisibleCount(0);
    }
}

function applyFiltersAndSort() {
    const searchTerm = searchInput?.value
        .trim()
        .toLowerCase() || "";

    const selectedClass = classFilter?.value || "all";
    const selectedSort = sortSelect?.value || "name-asc";

    let filteredWeapons = allWeapons.filter((weapon) => {
        const weaponName = String(weapon.name || "").toLowerCase();
        const weaponClass = String(weapon.class || "");

        const matchesSearch =
            weaponName.includes(searchTerm);

        const matchesClass =
            selectedClass === "all"
            || weaponClass === selectedClass;

        return matchesSearch && matchesClass;
    });

    filteredWeapons = sortWeapons(
        filteredWeapons,
        selectedSort
    );

    renderWeapons(filteredWeapons);
}

function sortWeapons(weapons, sortMode) {
    const sortedWeapons = [...weapons];

    switch (sortMode) {
        case "name-desc":
            return sortedWeapons.sort((a, b) =>
                String(b.name || "").localeCompare(
                    String(a.name || "")
                )
            );

        case "meta-desc":
            return sortedWeapons.sort((a, b) =>
                getMetaScore(b) - getMetaScore(a)
            );

        case "dps-desc":
            return sortedWeapons.sort((a, b) =>
                getDps(b) - getDps(a)
            );

        case "damage-desc":
            return sortedWeapons.sort((a, b) =>
                getBodyDamage(b) - getBodyDamage(a)
            );

        case "rpm-desc":
            return sortedWeapons.sort((a, b) =>
                getRpm(b) - getRpm(a)
            );

        case "name-asc":
        default:
            return sortedWeapons.sort((a, b) =>
                String(a.name || "").localeCompare(
                    String(b.name || "")
                )
            );
    }
}

function renderWeapons(weapons) {
    if (!weaponGrid) return;

    updateVisibleCount(weapons.length);

    if (weapons.length === 0) {
        weaponGrid.innerHTML = `
            <p class="weapon-database-empty">
                No weapons match the selected filters.
            </p>
        `;
        return;
    }

    weaponGrid.innerHTML = weapons
        .map(renderWeaponCard)
        .join("");
}

function renderWeaponCard(weapon) {
    const bodyDamage = getBodyDamage(weapon);
    const rpm = getRpm(weapon);
    const dps = getDps(weapon);
    const metaScore = getMetaScore(weapon);
    const tier = weapon.tier || "C";
    const stars = weapon.stars || "☆☆☆☆☆";

    return `
        <article
            class="weapon-database-card"
            data-tier="${escapeHtml(tier)}"
        >
            <div class="weapon-card-header">
                <div>
                    <h2>
                        ${escapeHtml(weapon.name || "Unknown Weapon")}
                    </h2>

                    <p class="weapon-card-class">
                        ${escapeHtml(weapon.class || "Unknown Class")}
                    </p>
                </div>

                <span
                    class="weapon-tier-badge"
                    data-tier="${escapeHtml(tier)}"
                >
                    ${escapeHtml(tier)} Tier
                </span>
            </div>

            <div class="weapon-meta-row">
                <span class="weapon-meta-stars">
                    ${escapeHtml(stars)}
                </span>

                <span class="weapon-meta-score">
                    ${metaScore}/10
                </span>
            </div>

            <div class="weapon-card-stats">
                <div class="weapon-card-stat">
                    <span>DPS</span>
                    <strong>${dps}</strong>
                </div>

                <div class="weapon-card-stat">
                    <span>RPM</span>
                    <strong>${rpm}</strong>
                </div>

                <div class="weapon-card-stat">
                    <span>Body Damage</span>
                    <strong>${bodyDamage}</strong>
                </div>

                <div class="weapon-card-stat">
                    <span>Class</span>
                    <strong>
                        ${escapeHtml(weapon.class || "N/A")}
                    </strong>
                </div>
            </div>

            <a
                href="weapon.html?id=${encodeURIComponent(weapon.id)}"
                class="weapon-details-link"
            >
                View Details
            </a>
        </article>
    `;
}

function getBodyDamage(weapon) {
    return Number(weapon.damage?.body) || 0;
}

function getRpm(weapon) {
    return Number(weapon.rpm) || 0;
}

function getDps(weapon) {
    if (Number.isFinite(Number(weapon.dps))) {
        return Number(weapon.dps);
    }

    return Math.round(
        (getBodyDamage(weapon) * getRpm(weapon)) / 60
    );
}

function getMetaScore(weapon) {
    return Number(weapon.metaScore) || 0;
}

function updateVisibleCount(count) {
    if (visibleCount) {
        visibleCount.textContent = count;
    }
}

function resetFilters() {
    if (searchInput) {
        searchInput.value = "";
    }

    if (classFilter) {
        classFilter.value = "all";
    }

    if (sortSelect) {
        sortSelect.value = "name-asc";
    }

    applyFiltersAndSort();
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    searchInput?.addEventListener(
        "input",
        applyFiltersAndSort
    );

    classFilter?.addEventListener(
        "change",
        applyFiltersAndSort
    );

    sortSelect?.addEventListener(
        "change",
        applyFiltersAndSort
    );

    resetButton?.addEventListener(
        "click",
        resetFilters
    );

    loadWeaponDatabase();
});
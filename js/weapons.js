/* Apex//Analyzer - Weapon Database */

const BASE_URL = window.ApexAnalyzer?.baseUrl
    || (
        window.location.hostname === "localhost"
        || window.location.hostname === "127.0.0.1"
            ? "http://localhost:3000"
            : "https://apex-legends-analyzer-1.onrender.com"
    );

let allWeapons = [];
let filteredWeapons = [];

const weaponGrid = document.getElementById("weapon-grid");

const searchInput = document.getElementById("weapon-search");
const classFilter = document.getElementById("weapon-class-filter");
const sortSelect = document.getElementById("weapon-sort");

const visibleCount = document.getElementById("visible-weapon-count");
const totalCount = document.getElementById("total-weapon-count");

const resetButton = document.getElementById("reset-weapon-filters");

document.addEventListener("DOMContentLoaded", () => {
    loadWeapons();

    searchInput.addEventListener("input", applyFilters);
    classFilter.addEventListener("change", applyFilters);
    sortSelect.addEventListener("change", applyFilters);
    resetButton.addEventListener("click", resetFilters);
});

async function loadWeapons() {

    try {

        weaponGrid.innerHTML = `
            <p class="weapon-database-loading">
                Loading weapon database...
            </p>
        `;

        const response = await fetch(`${BASE_URL}/api/weapons`);

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        allWeapons = await response.json();
        filteredWeapons = [...allWeapons];
        totalCount.textContent = allWeapons.length;

        populateClassFilter();
        applyFilters();
    } catch (error) {

        console.error(error);

        weaponGrid.innerHTML = `
            <p class="weapon-database-error">
                Failed to load weapon database.
            </p>
        `;

    }
}

function applyFilters() {

    const searchText = searchInput.value.trim().toLowerCase();
    const selectedClass = classFilter.value;
    const selectedSort = sortSelect.value;

    filteredWeapons = allWeapons.filter((weapon) => {

        const matchesSearch =
            weapon.name.toLowerCase().includes(searchText);

        const matchesClass =
            selectedClass === "all" ||
            weapon.class === selectedClass;

        return matchesSearch && matchesClass;

    });

    switch (selectedSort) {

        case "name-asc":
            filteredWeapons.sort((a, b) =>
                a.name.localeCompare(b.name));
            break;

        case "name-desc":
            filteredWeapons.sort((a, b) =>
                b.name.localeCompare(a.name));
            break;

        case "meta-desc":
            filteredWeapons.sort((a, b) =>
                b.metaScore - a.metaScore);
            break;

        case "dps-desc":
            filteredWeapons.sort((a, b) =>
                b.dps - a.dps);
            break;

        case "damage-desc":
            filteredWeapons.sort((a, b) =>
                b.damage.body - a.damage.body);
            break;

        case "rpm-desc":
            filteredWeapons.sort((a, b) =>
                b.rpm - a.rpm);
            break;
    }

    renderWeapons(filteredWeapons);

}

function resetFilters() {
    searchInput.value = "";

    classFilter.value = "all";

    sortSelect.value = "name-asc";

    applyFilters();
}

function renderWeapons(weapons) {

    visibleCount.textContent = weapons.length;

    if (weapons.length === 0) {

        weaponGrid.innerHTML = `
            <div class="weapon-empty-state">
                <h3>No weapons found</h3>
                <p>Try changing the search or filter options.</p>
            </div>
        `;

        return;
    }

    weaponGrid.innerHTML = weapons.map((weapon) => `
            <article
                class="weapon-database-card"
                data-tier="${weapon.tier}"
            >

                <div class="weapon-card-header">

                    <h3>${weapon.name}</h3>

                    <span class="weapon-class-badge">
                        ${weapon.class}
                    </span>

                </div>

                <div class="weapon-meta">

                    <div class="weapon-stars">
                        ${weapon.stars}
                    </div>

                    <div class="weapon-tier">
                        ${weapon.tier} Tier
                    </div>

                </div>

                <div class="weapon-stats">

                    <div class="weapon-stat">
                        <span>DPS</span>
                        <strong>${weapon.dps}</strong>
                    </div>

                    <div class="weapon-stat">
                        <span>Damage</span>
                        <strong>${weapon.damage.body}</strong>
                    </div>

                    <div class="weapon-stat">
                        <span>RPM</span>
                        <strong>${weapon.rpm}</strong>
                    </div>

                    <div class="weapon-stat">
                        <span>Meta Score</span>
                        <strong>${weapon.metaScore}/10</strong>
                    </div>

                </div>

                <a
                    href="weapon.html?id=${weapon.id}"
                    class="weapon-details-button"
                >
                    VIEW DETAILS →
                </a>

            </article>
        `).join("");

}

function populateClassFilter() {

    const classes = [...new Set(allWeapons.map(weapon => weapon.class))]
        .sort();

    classFilter.innerHTML = `
        <option value="all">All Classes</option>
    `;

    classes.forEach((weaponClass) => {

        classFilter.innerHTML += `
            <option value="${weaponClass}">
                ${weaponClass}
            </option>
        `;

    });
}

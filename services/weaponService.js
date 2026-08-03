async function getAllWeapons(pool) {
    const result = await pool.query(`
        SELECT
            id,
            name,
            class,
            rpm,
            damage,
            mag_sizes
        FROM weapons
        ORDER BY name
    `);

    return result.rows;
}

async function getWeaponById(pool, weaponId) {
    const result = await pool.query(
        `
        SELECT *
        FROM weapons
        WHERE id = $1
        `,
        [weaponId]
    );

    return result.rows[0] || null;
}

async function getTopMetaWeapons(
    pool,
    calculateMetaScore,
    limit = 10
) {
    const result = await pool.query(`
        SELECT *
        FROM weapons
        ORDER BY id ASC
    `);

    const rankedWeapons = result.rows
        .map((weapon) => {
            const meta = calculateMetaScore(weapon);

            const bodyDamage = Number(weapon.damage?.body) || 0;
            const rpm = Number(weapon.rpm) || 0;
            const dps = Math.round((bodyDamage * rpm) / 60);

            return {
                id: weapon.id,
                name: weapon.name,
                class: weapon.class,
                damage: weapon.damage,
                rpm,
                dps,
                metaScore: meta.score,
                tier: meta.tier,
                stars: meta.stars
            };
        })
        .sort((weaponA, weaponB) => {
            if (weaponB.metaScore !== weaponA.metaScore) {
                return weaponB.metaScore - weaponA.metaScore;
            }

            return weaponB.dps - weaponA.dps;
        });

    return rankedWeapons.slice(0, limit);
}

module.exports = {
    getAllWeapons,
    getWeaponById,
    getTopMetaWeapons
};
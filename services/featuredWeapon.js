async function getFeaturedWeapon(pool, calculateMetaScore) {

    const result = await pool.query(`
        SELECT *
        FROM weapons
        ORDER BY id ASC
    `);

    const weapons = result.rows;

    if (weapons.length === 0) {
        return null;
    }

    const today = new Date();

    const dayNumber = Math.floor(
        today.getTime() / (1000 * 60 * 60 * 24)
    );

    const weapon = weapons[dayNumber % weapons.length];

    const meta = calculateMetaScore(weapon);

    return {

        id: weapon.id,
        name: weapon.name,
        class: weapon.class,
        rpm: weapon.rpm,
        damage: weapon.damage,
        mag_sizes: weapon.mag_sizes,

        metaScore: meta.score,
        tier: meta.tier,
        stars: meta.stars

    };

}

module.exports = getFeaturedWeapon;
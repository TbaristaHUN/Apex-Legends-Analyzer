const express = require("express");

function createWeaponRouter({
    pool,
    calculateMetaScore,
    getFeaturedWeapon,
    weaponService
}) {
    const router = express.Router();
    const {
        getAllWeapons,
        getWeaponById,
        getTopMetaWeapons
    } = weaponService;

    router.get("/weapons", async (req, res) => {
    try {
        const weapons = await getAllWeapons(pool);

        const enrichedWeapons = weapons.map((weapon) => {
            console.log(weapon);
            const meta = calculateMetaScore(weapon);
            const bodyDamage = Number(weapon.damage?.body) || 0;
            const rpm = Number(weapon.rpm) || 0;

            return {
                id: weapon.id,
                name: weapon.name,
                class: weapon.class,
                rpm,
                damage: weapon.damage,
                mag_sizes: weapon.mag_sizes,

                dps: Math.round((bodyDamage * rpm) / 60),

                metaScore: meta.score,
                tier: meta.tier,
                stars: meta.stars
            };
        });

        return res.json(enrichedWeapons);

    } catch (error) {
        console.error("Failed to fetch weapons:", error.message);

        return res.status(500).json({
            error: "Failed to fetch weapons from database."
        });
    }
});

    router.get("/weapons/top-meta", async (req, res) => {
        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const limit = Number.isInteger(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), 50)
            : 10;

        try {
            const weapons = await getTopMetaWeapons(
                pool,
                calculateMetaScore,
                limit
            );

            return res.json({
                count: weapons.length,
                generatedAt: new Date().toISOString(),
                weapons
            });
        } catch (error) {
            console.error("Top meta weapons error:", error.message);
            return res.status(500).json({
                error: "Failed to calculate top meta weapons."
            });
        }
    });

    router.get("/weapons/:id", async (req, res) => {
        console.log('New weapon details route running..."');
    const weaponId = req.params.id;

    try {
        const weapon = await weaponService.getWeaponById(
            pool,
            weaponId
        );

        if (!weapon) {
            return res.status(404).json({
                error: "Weapon not found."
            });
        }

        const meta = calculateMetaScore(weapon);

        const bodyDamage = Number(weapon.damage?.body) || 0;
        const rpm = Number(weapon.rpm) || 0;
        const dps = Math.round((bodyDamage * rpm) / 60);

        return res.json({
            id: weapon.id,
            name: weapon.name,
            class: weapon.class,
            rpm,
            dps,
            damage: weapon.damage,
            mag_sizes: weapon.mag_sizes,
            metaScore: meta.score,
            tier: meta.tier,
            stars: meta.stars
        });

    } catch (error) {
        console.error(
            `Failed to fetch weapon details for ID ${weaponId}:`,
            error.message
        );

        return res.status(500).json({
            error: "Failed to fetch weapon details."
        });
    }
});


    router.get("/featured-weapon", async (req, res) => {
        try {
            const weapon = await getFeaturedWeapon(
                pool,
                calculateMetaScore
            );

            if (!weapon) {
                return res.status(404).json({
                    message: "No weapons found."
                });
            }

            return res.json(weapon);
        } catch (error) {
            console.error("Featured weapon error:", error.message);
            return res.status(500).json({
                message: "Failed to load featured weapon."
            });
        }
    });

    return router;
}

module.exports = createWeaponRouter;


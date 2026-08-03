const path = require("path");

const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");

dotenv.config();

const { pool, verifyDatabaseConnection } = require("./config/database");
const createApexRouter = require("./routes/apexRoutes");
const createInfoRouter = require("./routes/infoRoutes");
const createWeaponRouter = require("./routes/weaponRoutes");
const getFeaturedWeapon = require("./services/featuredWeapon");
const calculateMetaScore = require("./services/metaScore");
const weaponService = require("./services/weaponService");

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.APEX_API_KEY;

if (!apiKey) {
    throw new Error("Missing APEX_API_KEY in environment variables.");
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use("/api", createApexRouter({ axios, apiKey }));
app.use("/api", createInfoRouter({ axios, apiKey }));
app.use(
    "/api",
    createWeaponRouter({
        pool,
        calculateMetaScore,
        getFeaturedWeapon,
        weaponService
    })
);

if (require.main === module) {
    verifyDatabaseConnection();

    app.listen(port, () => {
        console.log(
            `Apex//Analyzer backend proxy server running at http://localhost:${port}`
        );
    });
}

module.exports = app;

app.get("/api/tier-stats", async (req, res) => {

    try {

        const weaponCountResult = await pool.query(`
            SELECT COUNT(*) AS count
            FROM weapons;
        `);

        const averageDpsResult = await pool.query(`
            SELECT ROUND(AVG(dps)) AS average
            FROM weapons;
        `);

        const topWeaponResult = await pool.query(`
            SELECT name
            FROM weapons
            ORDER BY metascore DESC
            LIMIT 1;
        `);

        const classCountResult = await pool.query(`
            SELECT COUNT(DISTINCT class) AS count
            FROM weapons;
        `);

        res.json({

            weaponCount:
                Number(weaponCountResult.rows[0].count),

            averageDps:
                Number(averageDpsResult.rows[0].average),

            topWeapon:
                topWeaponResult.rows[0].name,

            weaponClasses:
                Number(classCountResult.rows[0].count)

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            error: "Failed to load tier statistics."

        });

    }

});
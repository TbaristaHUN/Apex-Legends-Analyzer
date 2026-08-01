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


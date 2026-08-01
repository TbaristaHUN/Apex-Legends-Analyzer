const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const { Pool } = require('pg');

const calculateMetaScore = require("./services/metaScore");
const getFeaturedWeapon = require("./services/featuredWeapon");

const {
    getAllWeapons,
    getWeaponById,
    getTopMetaWeapons
} = require("./services/weaponService");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const API_KEY = process.env.APEX_API_KEY;

if (!API_KEY) {
  throw new Error("Missing APEX_API_KEY in environment variables.");
}

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } 
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
      }
);

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Connected to PostgreSQL database! (apex_analyzer)');
  release();
});

let serverStatusCache = {
    data: null,
    lastFetch: 0
};

const SERVER_STATUS_CACHE_TIME = 60 * 1000;

app.get("/api/maprotation", async (req, res) => {
  try {
    const response = await axios.get("https://api.apexlegendsstatus.com/maprotation", {
      params: { auth: API_KEY, version: "1" }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Hiba a map rotation lekérésekor:", error.message);
    res.status(500).json({ error: "Failed to fetch map rotation." });
  }
});

app.get("/api/player", async (req, res) => {
  const { player, platform } = req.query;

  if (!player || !platform) {
    return res.status(400).json({ error: "Missing parameters." });
  }

  try {
    const response = await axios.get("https://api.apexlegendsstatus.com/bridge", {
      params: { auth: API_KEY, player, platform }
    });

    const data = response.data;
    if (data.Error) return res.status(404).json({ error: data.Error });

    const globalData = data.global || {};
    const rankData = globalData.rank || {};
    const selectedLegend = data.legends?.selected || {};
    
    let bannerTrackers = [];


    const rawTrackers = selectedLegend.data || selectedLegend.gameInfo;

    if (Array.isArray(rawTrackers)) {
      bannerTrackers = rawTrackers.map(t => ({
        name: t.name || t.key || "Tracker",
        value: t.value !== undefined ? Number(t.value).toLocaleString() : "N/A"
      }));
    } else if (rawTrackers && typeof rawTrackers === 'object') {
      bannerTrackers = Object.values(rawTrackers).map(t => ({
        name: t.name || t.key || "Tracker",
        value: t.value !== undefined ? Number(t.value).toLocaleString() : "N/A"
      }));
    }

    if (bannerTrackers.length === 0 && data.total?.kills?.value !== undefined) {
      bannerTrackers.push({
        name: "Total Kills",
        value: Number(data.total.kills.value).toLocaleString()
      });
    }

    res.json({
      global: globalData,
      rank: rankData,
      legend: selectedLegend,
      trackers: bannerTrackers
    });

  } catch (error) {
    console.error("Player fetch error:", error.message);
    res.status(500).json({ error: "API error" });
  }
});


app.get("/api/weapons", async (req, res) => {
    try {
        const weapons = await getAllWeapons(pool);

        return res.json(weapons);

    } catch (error) {
        console.error(
            "Failed to fetch weapons:",
            error.message
        );

        return res.status(500).json({
            error: "Failed to fetch weapons from database."
        });
    }
});


app.get("/api/weapons/top-meta", async (req, res) => {
    const requestedLimit = Number.parseInt(
        req.query.limit,
        10
    );

    const limit = Number.isInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 25)
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
        console.error(
            "Top meta weapons error:",
            error.message
        );

        return res.status(500).json({
            error: "Failed to calculate top meta weapons."
        });
    }
});


app.get("/api/weapons/:id", async (req, res) => {
    const weaponId = req.params.id;

    try {
        const weapon = await getWeaponById(
            pool,
            weaponId
        );

        if (!weapon) {
            return res.status(404).json({
                error: "Weapon not found."
            });
        }

        return res.json(weapon);

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


app.get("/api/featured-weapon", async (req, res) => {
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
        console.error(
            "Featured weapon error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to load featured weapon."
        });
    }
});

app.get("/api/server-status", async (req, res) => {
    const checkedAt = new Date().toISOString();
    const now = Date.now();

    if (
        serverStatusCache.data &&
        now - serverStatusCache.lastFetch < SERVER_STATUS_CACHE_TIME
    ) {
        console.log("🟡 Returning cached server status.");
        return res.json(serverStatusCache.data);
    }

    try {
        console.log("🟢 Fetching fresh server status from Apex API...");

        const response = await axios.get(
            "https://api.apexlegendsstatus.com/servers",
            {
                params: {
                    auth: API_KEY
                },
                timeout: 5000
            }
        );

        const euServer = response.data?.Origin_login?.["EU-West"];

        const euStatus = euServer?.Status;
        const responseTime = euServer?.ResponseTime;

        if (!euStatus) {
            return res.status(502).json({
                status: "UNKNOWN",
                region: "EU West",
                checkedAt,
                sourceAvailable: false,
                message: "No valid server status returned by API."
            });
        }

        let displayStatus = "UNKNOWN";

        switch (euStatus) {
            case "UP":
                displayStatus = "ONLINE";
                break;

            case "SLOW":
                displayStatus = "DEGRADED";
                break;

            case "DOWN":
                displayStatus = "OFFLINE";
                break;

            default:
                displayStatus = "UNKNOWN";
        }

        const result = {
            status: displayStatus,
            region: "EU West",
            latency: responseTime,
            checkedAt,
            sourceAvailable: true
        };

        serverStatusCache.data = result;
        serverStatusCache.lastFetch = now;

        return res.json(result);

    } catch (error) {

        console.error("🔴 Server status error:", error.message);

        return res.status(503).json({
            status: "UNKNOWN",
            region: "EU West",
            checkedAt,
            sourceAvailable: false,
            message: "External API unavailable."
        });
    }
});

app.get('/api/latest-news', async (req, res) => {
    try {
        const response = await axios.get(`https://api.apexlegendsstatus.com/news?auth=${API_KEY}`);
        if (response.data && response.data.length > 0) {
            res.json({ title: response.data[0].title, link: response.data[0].link });
        } else {
            throw new Error("No news found");
        }
    } catch (err) {
        res.json({
            title: "Latest News and Patch Notes",
            link: "https://www.ea.com/games/apex-legends/news"
        });
    }
});

app.get('/api/algs-event', async (req, res) => {
    res.json({
        eventName: "ALGS Global Series",
        status: "SCHEDULE",
        date: "See Live Schedule",
        link: "https://algs.ea.com/"
    });
});

app.listen(PORT, () => {
  console.log(`Az Apex//Analyzer backend proxy szerver running at http://localhost:${PORT}`);
});


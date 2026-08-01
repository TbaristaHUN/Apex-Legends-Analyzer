const express = require("express");

const SERVER_STATUS_CACHE_TIME = 60 * 1000;

function createApexRouter({ axios, apiKey }) {
    const router = express.Router();
    const serverStatusCache = {
        data: null,
        lastFetch: 0
    };

    router.get("/maprotation", async (req, res) => {
        try {
            const response = await axios.get(
                "https://api.apexlegendsstatus.com/maprotation",
                { params: { auth: apiKey, version: "1" } }
            );

            return res.json(response.data);
        } catch (error) {
            console.error("Map rotation fetch error:", error.message);
            return res.status(500).json({
                error: "Failed to fetch map rotation."
            });
        }
    });

    router.get("/player", async (req, res) => {
        const { player, platform } = req.query;

        if (!player || !platform) {
            return res.status(400).json({ error: "Missing parameters." });
        }

        try {
            const response = await axios.get(
                "https://api.apexlegendsstatus.com/bridge",
                { params: { auth: apiKey, player, platform } }
            );

            const data = response.data;

            if (data.Error) {
                return res.status(404).json({ error: data.Error });
            }

            const globalData = data.global || {};
            const rankData = globalData.rank || {};
            const selectedLegend = data.legends?.selected || {};
            const rawTrackers = selectedLegend.data || selectedLegend.gameInfo;
            let bannerTrackers = [];

            if (Array.isArray(rawTrackers)) {
                bannerTrackers = rawTrackers.map(formatTracker);
            } else if (rawTrackers && typeof rawTrackers === "object") {
                bannerTrackers = Object.values(rawTrackers).map(formatTracker);
            }

            if (
                bannerTrackers.length === 0 &&
                data.total?.kills?.value !== undefined
            ) {
                bannerTrackers.push({
                    name: "Total Kills",
                    value: Number(data.total.kills.value).toLocaleString()
                });
            }

            return res.json({
                global: globalData,
                rank: rankData,
                legend: selectedLegend,
                trackers: bannerTrackers
            });
        } catch (error) {
            console.error("Player fetch error:", error.message);
            return res.status(500).json({ error: "API error" });
        }
    });

    router.get("/server-status", async (req, res) => {
        const checkedAt = new Date().toISOString();
        const now = Date.now();

        if (
            serverStatusCache.data &&
            now - serverStatusCache.lastFetch < SERVER_STATUS_CACHE_TIME
        ) {
            return res.json(serverStatusCache.data);
        }

        try {
            const response = await axios.get(
                "https://api.apexlegendsstatus.com/servers",
                {
                    params: { auth: apiKey },
                    timeout: 5000
                }
            );

            const euServer = response.data?.Origin_login?.["EU-West"];
            const euStatus = euServer?.Status;

            if (!euStatus) {
                return res.status(502).json({
                    status: "UNKNOWN",
                    region: "EU West",
                    checkedAt,
                    sourceAvailable: false,
                    message: "No valid server status returned by API."
                });
            }

            const result = {
                status: formatServerStatus(euStatus),
                region: "EU West",
                latency: euServer.ResponseTime,
                checkedAt,
                sourceAvailable: true
            };

            serverStatusCache.data = result;
            serverStatusCache.lastFetch = now;

            return res.json(result);
        } catch (error) {
            console.error("Server status error:", error.message);

            return res.status(503).json({
                status: "UNKNOWN",
                region: "EU West",
                checkedAt,
                sourceAvailable: false,
                message: "External API unavailable."
            });
        }
    });

    return router;
}

function formatTracker(tracker) {
    return {
        name: tracker.name || tracker.key || "Tracker",
        value:
            tracker.value !== undefined
                ? Number(tracker.value).toLocaleString()
                : "N/A"
    };
}

function formatServerStatus(status) {
    const statuses = {
        UP: "ONLINE",
        SLOW: "DEGRADED",
        DOWN: "OFFLINE"
    };

    return statuses[status] || "UNKNOWN";
}

module.exports = createApexRouter;


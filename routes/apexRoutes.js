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
    const player = String(req.query.player || "").trim();
    const requestedPlatform = String(req.query.platform || "").trim();

    if (!player) {
        return res.status(400).json({
            error: "Missing player name."
        });
    }

    const supportedPlatforms = ["PC", "PS4", "X1"];

    const platformsToSearch = requestedPlatform
        ? [requestedPlatform]
        : supportedPlatforms;

    let playerData = null;
    let detectedPlatform = null;

    try {
        for (const platform of platformsToSearch) {
            try {
                const response = await axios.get(
                    "https://api.apexlegendsstatus.com/bridge",
                    {
                        params: {
                            auth: apiKey,
                            player,
                            platform
                        },
                        timeout: 8000
                    }
                );

                const data = response.data;

                if (data?.Error) {
                    continue;
                }

                if (!data?.global?.name) {
                    continue;
                }

                playerData = data;
                detectedPlatform = platform;
                break;

            } catch (platformError) {
                const status = platformError.response?.status;

                if (status === 404) {
                    continue;
                }

                if (status === 429) {
                    return res.status(429).json({
                        error: "The external Apex API rate limit has been reached."
                    });
                }

                throw platformError;
            }
        }

        if (!playerData) {
            return res.status(404).json({
                error: "Player data unavailable.",
                message:
                    "The player could not be found on PC, PlayStation or Xbox. The EA ID may differ from the visible in-game name, or the external API may not contain the profile.",
                searchedPlatforms: platformsToSearch
            });
        }

        const globalData = playerData.global || {};
        const rankData = globalData.rank || {};
        const selectedLegend = playerData.legends?.selected || {};

        const rawTrackers =
            selectedLegend.data ||
            selectedLegend.gameInfo;

        let bannerTrackers = [];

        if (Array.isArray(rawTrackers)) {
            bannerTrackers = rawTrackers.map(formatTracker);
        } else if (
            rawTrackers &&
            typeof rawTrackers === "object"
        ) {
            bannerTrackers = Object.values(rawTrackers)
                .map(formatTracker);
        }

        if (
            bannerTrackers.length === 0 &&
            playerData.total?.kills?.value !== undefined
        ) {
            bannerTrackers.push({
                name: "Total Kills",
                value: Number(
                    playerData.total.kills.value
                ).toLocaleString()
            });
        }

        return res.json({
            platform: detectedPlatform,
            global: globalData,
            rank: rankData,
            legend: selectedLegend,
            trackers: bannerTrackers
        });

    } catch (error) {
        console.error(
            "Player fetch error:",
            error.response?.data || error.message
        );

        return res.status(502).json({
            error: "External player service unavailable."
        });
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


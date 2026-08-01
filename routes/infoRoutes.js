const express = require("express");

function createInfoRouter({ axios, apiKey }) {
    const router = express.Router();

    router.get("/latest-news", async (req, res) => {
        try {
            const response = await axios.get(
                "https://api.apexlegendsstatus.com/news",
                { params: { auth: apiKey } }
            );

            if (!Array.isArray(response.data) || response.data.length === 0) {
                throw new Error("No news found");
            }

            return res.json({
                title: response.data[0].title,
                link: response.data[0].link
            });
        } catch (error) {
            return res.json({
                title: "Latest News and Patch Notes",
                link: "https://www.ea.com/games/apex-legends/news"
            });
        }
    });

    router.get("/algs-event", (req, res) => {
        return res.json({
            eventName: "ALGS Global Series",
            status: "SCHEDULE",
            date: "See Live Schedule",
            link: "https://algs.ea.com/"
        });
    });

    return router;
}

module.exports = createInfoRouter;


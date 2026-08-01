const { Pool } = require("pg");

const connectionOptions = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_DATABASE,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT
    };

const pool = new Pool(connectionOptions);

function verifyDatabaseConnection() {
    pool.connect((error, client, release) => {
        if (error) {
            console.error("Error acquiring database client:", error.stack);
            return;
        }

        console.log("Connected to PostgreSQL database! (apex_analyzer)");
        release();
    });
}

module.exports = {
    pool,
    verifyDatabaseConnection
};


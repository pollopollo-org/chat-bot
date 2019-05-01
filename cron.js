const mariadb = require("mariadb");
const dbData = require("./dbData");


const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});

/**
 * Cron that is responsible for resetting all applicaitons that have been in the
 * "Locked" state for more than an hour since we at that point assume that the
 * donation has failed.
 */
async function init() {
    let conn;

    try {
        let resettedApplications = 0;
        conn = await pool.getConnection();
        const now = new Date();

        // Start by retrieving all locked applicaitons
        const rows = await conn.query("SELECT * FROM Applications WHERE Status = 1");

        // And then go through all applications and determine whether or not
        // they've went stale.
        rows.forEach(application => {
            const lastModified = new Date(application.TimeStamp);
            const isStale = Date.now() + 1000 * 60 * 60 > lastModified;

            if (isStale) {
                resettedApplications++;
                await = conn.query("UPDATE Applications SET Status = 0, LastModified = NOW() WHERE Id = ?", [application.Id]);
            }
        });

    } catch (err) {
        throw err;
    } finally {
        if (conn) {
            conn.end();
        }

        process.exit(0);
    }
}

init();
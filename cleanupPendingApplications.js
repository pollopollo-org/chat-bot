const mariadb = require("mariadb");
const dbData = require("./dbData");

const sqlite3 = require("sqlite3").verbose();

const pool = mariadb.createPool({
    host: dbData.host,
    user: dbData.user,
    password: dbData.password,
    database: dbData.database,
    connectionLimit: 5
});
const obyte = new sqlite3.Database("../.config/chat-bot/byteball.sqlite", sqlite3.OPEN_READONLY, (err) => {
	if (err) {
		console.log("Got error connecting to Obyte DAG: " + err.message);
	}
});

/*
 * Get the balance of a wallet address
 */
async function getbalance(sharedWallet) {
	return new Promise(function(resolve, reject) {
		obyte.get("select sum(amount) as amount from outputs where is_spent=0 and asset is null and address = ?", sharedWallet, (err, row) => {
			if (err) reject(err.message);
			else resolve(row.amount);
		});
	});
}

/*
 * Update Contract and Application to reflect the change
 */

async function updateApplication (applicationId) {
	// Update the contract to reflect that Bytes has been withdrawn
	await conn.query("UPDATE Contracts set Bytes = 0 where ApplicationId = ?", applicationId);
	// Update the Application to status 5 meaning WITHDRAWN
	await conn.query("UPDATE Applications set Status = 5 where ApplicationId = ?", applicationId);
}

/*
 * Main 
 */
async function init() {
    	
	let conn = await pool.getConnection();

	// First - Find all pending applications
	const rows = await conn.query("SELECT a.Id, c.SharedAddress, ua.email as recipientemail, up.email as produceremail FROM Applications a left join Contracts c on a.Id = c.ApplicationId left join Users ua on a.UserId = ua.Id left join Products p on a.ProductId = p.Id left join Users up on p.UserId = up.Id WHERE a.Status=2;");

	for (let i = 0; i < rows.length; i++) {
		let walletbalance = await getbalance([rows[i].SharedAddress]); // Get wallet balance
		if (walletbalance == 0) { // If the balance is zero on a pending application, the donor must have withdrawn the donated funds	
			console.log([rows[i].Id] + " Updating status to 5 and Bytes count to 0.");
			await updateApplication([rows[i].Id]);
		} else {
			console.log([rows[i].Id] + " still has Bytes on it. Will leave it");
		}
	};
	if (conn) {
	    conn.end();
	}
	if (obyte) {
		obyte.close((err) => {
			if (err) {
				console.log("Error while closing db handle");
			}
		});
	}
	process.exit(0);
}


// Bootstrap cron-job!
init();

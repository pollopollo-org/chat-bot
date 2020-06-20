const sqlite3 = require("sqlite3").verbose();

function init() {
	let obyte = new sqlite3.Database("../.config/chat-bot/byteball.sqlite", sqlite3.OPEN_READONLY, (err) => {
		if (err) {
			console.log("Got error: " + err.message);
	    	}
		obyte.get("select sum(amount) as amount from outputs where is_spent=0 and asset is null and address = ?", "4V3KGGDUMWUYE6EINJVWYJAFOF6DFHQV", (err, row) => {
			let balance = [row.amount];
			return balance ? console.log(balance) : console.log("That obviously didn't work");
		});
	});
	if (obyte) {
		obyte.close((err) => {});
	}
}

// Bootstrap cron-job!
init();

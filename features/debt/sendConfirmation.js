const fs = require("fs");

module.exports = async function sendConfirmation() {
	const config = JSON.parse(fs.readFileSync("./configs/config.json", "utf8"));
	if (!config.debtThreadID) {
		// Create new thread
		// Save thread id to config
		// Write new config file
	}
	// Create new embed with the admins name and image of who added the debt
	// confirmation content and a timestamp
};

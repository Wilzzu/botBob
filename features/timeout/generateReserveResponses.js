const getAIResponse = require("../../utils/getAIResponse");
const {
	lang,
	features: { timeout },
} = require("../../configs/config.json");
const fs = require("fs");
const str = require("../../configs/languages.json");

let generatingAIResponse = false;

// Generate needed amount of responses and add them to the database
module.exports = async function generateReserveResponses() {
	let aiResponses = JSON.parse(fs.readFileSync("./databases/aiResponses.json", "utf-8"));
	let amountNeeded = timeout.reserveAIResponses - aiResponses?.length;

	// If there are enough responses in the database or already generating, don't generate more
	if (generatingAIResponse || !amountNeeded) return;

	generatingAIResponse = true;

	for (i = 0; i < amountNeeded; i++) {
		// Generate response
		const response = await getAIResponse(str[lang].ai.timeout);
		if (!response) break;

		// Get the latest responses and push the new response to it
		let latest = JSON.parse(fs.readFileSync("./databases/aiResponses.json", "utf-8"));
		latest.push(response);

		// Write the new responses to the database
		fs.writeFileSync("./databases/aiResponses.json", JSON.stringify(latest), (err) => {
			if (err) return console.log(err);
		});

		// Update the amount of needed responses
		amountNeeded = timeout.reserveAIResponses - latest.length;
		i -= 1;
	}

	generatingAIResponse = false;
};

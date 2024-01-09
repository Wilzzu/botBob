const { wordsBotWillRespondTo, botResponses } = require("../configs/config.json");

// Respond to mentions if they contain a specific word
module.exports = function (msg) {
	if (!msg.mentions.has(msg.client.user)) return false;

	// Check if the message contains a word the bot should respond to
	const words = msg.content.toLowerCase().split(" ");
	for (const word of words) {
		if (wordsBotWillRespondTo.includes(word))
			return msg.reply(botResponses[Math.floor(Math.random() * botResponses.length)]);
	}

	return false;
};

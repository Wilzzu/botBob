const { respondWords } = require("../configs/config.json");

// Respond to a message with the same message, if the message is part of respondWords
module.exports = function (message) {
	if (respondWords.includes(message.content.toLowerCase())) return message.reply(message.content);
	return false;
};

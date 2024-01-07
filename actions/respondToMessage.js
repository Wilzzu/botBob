const { respondWords } = require("../configs/config.json");

// Respond to a message with the same message, if the message is part of respondWords
module.exports = function (msg) {
	if (respondWords.includes(msg.content.toLowerCase())) return msg.reply(msg.content);
	return false;
};

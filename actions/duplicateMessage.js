const { duplicateMessages } = require("../configs/config.json");

// Respond to a message with the same message, if the message is part of duplicateMessages
module.exports = function (msg) {
	if (duplicateMessages.includes(msg.content.toLowerCase())) return msg.reply(msg.content);
	return false;
};

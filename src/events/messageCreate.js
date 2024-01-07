const { Events } = require("discord.js");
const respondToMessage = require("../actions/respondToMessage");

module.exports = {
	name: Events.MessageCreate,
	execute(msg) {
		if (msg.author.bot) return;
		// If message is something the bot should respond to, respond to it
		if (respondToMessage(msg)) return;
	},
};

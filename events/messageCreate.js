const { Events } = require("discord.js");
const respondToMessage = require("../actions/respondToMessage");
const strings = require("../configs/languages.json");
const sendCustomResponse = require("../actions/sendCustomResponse");
const executeChatCommand = require("../actions/executeChatCommand");

module.exports = {
	name: Events.MessageCreate,
	execute(msg) {
		if (msg.author.bot) return;

		// Respond to specific messages with the same message
		if (respondToMessage(msg)) return;

		// If message starts with prefix, execute the command
		if (executeChatCommand(msg)) return;

		// Send a customized message to a specific user randomly
		sendCustomResponse(msg);
	},
};

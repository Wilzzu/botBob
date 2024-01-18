const { Events } = require("discord.js");
const executeChatCommand = require("../utils/executeChatCommand");
const duplicateMessage = require("../features/duplicateMessage");
const respondToSpecificWord = require("../features/respondToSpecificWord");
const sendCustomResponse = require("../features/sendCustomResponse");

module.exports = {
	name: Events.MessageCreate,
	execute(msg) {
		if (msg.author.bot) return;

		// Respond to specific messages with the same message
		if (duplicateMessage(msg)) return;

		// If message starts with prefix, execute the command
		if (executeChatCommand(msg)) return;

		// If message mentions the bot and contains a specific word, respond to it
		if (respondToSpecificWord(msg)) return;

		// Randomly send a customized message to a specific user
		sendCustomResponse(msg);
	},
};

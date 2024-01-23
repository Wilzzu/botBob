const { Events } = require("discord.js");
const executeChatCommand = require("../utils/executeChatCommand");
const duplicateMessage = require("../features/duplicateMessage");
const respondToSpecificWord = require("../features/respondToSpecificWord");
const customResponses = require("../features/customResponses");
const { debtChannelID } = require("../configs/config.json");
const rareMessages = require("../features/rareMessages");

module.exports = {
	name: Events.MessageCreate,
	execute(msg) {
		if (msg.author.bot) return;

		// Delete new messages in debt channel
		if (msg.channelId === debtChannelID && !msg.author.bot) return msg.delete();

		// Respond to specific messages with the same message
		if (duplicateMessage(msg)) return;

		// If message starts with prefix, execute the command
		if (executeChatCommand(msg)) return;

		// If message mentions the bot and contains a specific word, respond to it
		if (respondToSpecificWord(msg)) return;

		// Randomly send a customized message to a specific user
		customResponses(msg);

		// Randomly send a rare message
		rareMessages(msg);
	},
};

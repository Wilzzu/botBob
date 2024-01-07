const { AttachmentBuilder } = require("discord.js");
const { customResponses } = require("../configs/config.json");

// Send a customized message to a specific user randomly
module.exports = function (msg) {
	const user = customResponses.find((user) => user.id === msg.author.id);
	if (!user) return;

	// Only send the message if the chance is lower than a randomized number
	if (Math.random() > user.chance) return;

	// Create new reply
	const reply = { content: user?.message };
	if (user?.file) reply.files = [new AttachmentBuilder(user.file)];
	msg.reply(reply);
};

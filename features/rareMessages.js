const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { rareMessages } = require("../configs/config.json");

function calculateChance(chance) {
	let calcChance = Math.ceil(1 / chance);
	// Add thousands separator, credit: Elias Zamaria @ https://stackoverflow.com/a/2901298
	return calcChance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const createReply = (rareMsg) => {
	// Show chance
	const chance = `\`1/${calculateChance(rareMsg.chance)}\`\n`;

	// Combine chance and message
	const reply = { content: chance + (rareMsg?.content ? rareMsg.content : "") };

	// Add file if there should be one
	if (rareMsg?.file) reply.files = [new AttachmentBuilder(rareMsg.file)];
	return reply;
};

module.exports = function (msg) {
	// Only send the message if the chance is lower than a randomized number
	for (const rareMsg of rareMessages) {
		if (Math.random() > rareMsg.chance) continue;
		return msg.reply(createReply(rareMsg));
	}
};

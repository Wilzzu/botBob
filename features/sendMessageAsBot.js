const { channelMention, MessageFlags } = require("discord.js");
const { lang } = require("../configs/config.json");
const str = require("../configs/languages.json");

module.exports = async function sendMessageAsBot(interaction, message, channel) {
	try {
		await channel.send(message);
		interaction.reply({
			content: `${str[lang].commands.say.messageSentTo} ${channelMention(channel.id)}`,
			flags: MessageFlags.Ephemeral,
		});
	} catch (error) {
		interaction.reply({
			content: str[lang].commands.say.errors.errSendingMsg,
			flags: MessageFlags.Ephemeral,
		});
	}
};

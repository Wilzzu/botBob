const { MessageFlags } = require("discord.js");
const { lang } = require("../configs/config.json");
const str = require("../configs/languages.json");

module.exports = async function deleteBotMessage(interaction, messageId, textChannel) {
	try {
		const channel = textChannel || interaction.channel;
		const msg = await channel.messages.fetch(messageId);

		// Error if message author is not the bot
		if (msg.author.id !== interaction.applicationId) {
			return interaction.reply({
				content: str[lang].commands.deleteMessage.errors.notBotMessage,
				flags: MessageFlags.Ephemeral,
			});
		}

		await msg.delete();
		await interaction.reply({
			content: str[lang].commands.deleteMessage.messageDeleted,
			flags: MessageFlags.Ephemeral,
		});
		setTimeout(() => interaction.deleteReply(), 5000);
	} catch (error) {
		interaction.reply({
			content: str[lang].commands.deleteMessage.errors.errDeletingMsg,
			flags: MessageFlags.Ephemeral,
		});
	}
};

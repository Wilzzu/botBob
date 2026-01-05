const { MessageFlags, messageLink } = require("discord.js");
const { lang } = require("../configs/config.json");
const str = require("../configs/languages.json");

module.exports = async function editBotMessage(interaction, content, messageId, textChannel) {
	try {
		const channel = textChannel || interaction.channel;
		const msg = await channel.messages.fetch(messageId);

		// Error if message author is not the bot
		if (msg.author.id !== interaction.applicationId) {
			return interaction.reply({
				content: str[lang].commands.editMessage.errors.notBotMessage,
				flags: MessageFlags.Ephemeral,
			});
		}
		await msg.edit(content);
		await interaction.reply({
			content: str[lang].commands.editMessage.messageEdited.replace(
				"${messageLink}",
				messageLink(channel.id, msg.id)
			),
			flags: MessageFlags.Ephemeral,
		});
	} catch (error) {
		interaction.reply({
			content: str[lang].commands.editMessage.errors.errEditingMsg,
			flags: MessageFlags.Ephemeral,
		});
	}
};

const { MessageFlags, codeBlock } = require("discord.js");
const { lang } = require("../configs/config.json");
const str = require("../configs/languages.json");

module.exports = async function getNessageContent(interaction, messageId, textChannel) {
	try {
		const channel = textChannel || interaction.channel;
		const msg = await channel.messages.fetch(messageId);
		if (!msg) {
			return interaction.reply({
				content: str[lang].commands.messageContent.errors.notFound,
				flags: MessageFlags.Ephemeral,
			});
		}

		const attachments = msg.attachments.map((e) => e.url).join("\n");
		if (attachments.length > 0) msg.content += `\n\nAttachments:\n${attachments}`;

		await interaction.reply({
			content: codeBlock(msg.content),
			flags: MessageFlags.Ephemeral,
		});
	} catch (error) {
		interaction.reply({
			content: str[lang].commands.messageContent.errors.errFetchingMsg,
			flags: MessageFlags.Ephemeral,
		});
	}
};

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { lang, mainAdmin } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const getMessageContent = require("../../features/getMessageContent");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.messageContent.name)
		.setDescription(str[lang].commands.messageContent.description)
		.addStringOption((option) =>
			option
				.setName(str[lang].commands.messageContent.message)
				.setDescription(str[lang].commands.messageContent.messageDesc)
				.setRequired(true)
		)
		.addChannelOption((option) =>
			option
				.setName(str[lang].commands.messageContent.channel)
				.setDescription(str[lang].commands.messageContent.channelDesc)
				.setRequired(false)
		),

	async execute(interaction) {
		// Only allow slash commands
		if (!interaction.type) {
			return interaction.reply({
				content: str[lang].commands.messageContent.errors.notSlash.replace(
					"${command}",
					str[lang].commands.messageContent.name
				),
				flags: MessageFlags.Ephemeral,
			});
		}

		// Get values
		const messageId = interaction.options.getString(str[lang].commands.messageContent.message);
		const channel = interaction.options.getChannel(str[lang].commands.messageContent.channel);

		// Check if params are valid
		if (!messageId) {
			return await interaction.reply({
				content: str[lang].commands.messageContent.errors.missingParams,
				flags: MessageFlags.Ephemeral,
			});
		}

		getMessageContent(interaction, messageId, channel);
	},
};

const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { lang, mainAdmin } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const deleteBotMessage = require("../../features/deleteBotMessage");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.deleteMessage.name)
		.setDescription(str[lang].commands.deleteMessage.description)
		.addStringOption((option) =>
			option
				.setName(str[lang].commands.deleteMessage.message)
				.setDescription(str[lang].commands.deleteMessage.messageDesc)
				.setRequired(true)
		)
		.addChannelOption((option) =>
			option
				.setName(str[lang].commands.deleteMessage.channel)
				.setDescription(str[lang].commands.deleteMessage.channelDesc)
				.setRequired(false)
		),

	async execute(interaction) {
		// Only allow slash commands
		if (!interaction.type) {
			return interaction.reply({
				content: str[lang].commands.deleteMessage.errors.notSlash.replace(
					"${command}",
					str[lang].commands.deleteMessage.name
				),
				flags: MessageFlags.Ephemeral,
			});
		}

		// Only allow main admin to use the command
		if (interaction.user.id !== mainAdmin) {
			return interaction.reply({
				content: str[lang].commands.deleteMessage.errors.notMainAdmin,
				flags: MessageFlags.Ephemeral,
			});
		}

		// Get values
		const messageId = interaction.options.getString(str[lang].commands.deleteMessage.message);
		const channel = interaction.options.getChannel(str[lang].commands.deleteMessage.channel);

		// Check if params are valid
		if (!messageId) {
			return await interaction.reply({
				content: str[lang].commands.deleteMessage.errors.missingParams,
				flags: MessageFlags.Ephemeral,
			});
		}

		deleteBotMessage(interaction, messageId, channel);
	},
};

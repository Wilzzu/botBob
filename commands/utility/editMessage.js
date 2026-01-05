const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { lang, mainAdmin } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const editBotMessage = require("../../features/editBotMessage");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.editMessage.name)
		.setDescription(str[lang].commands.editMessage.description)
		.addStringOption((option) =>
			option
				.setName(str[lang].commands.editMessage.newContent)
				.setDescription(str[lang].commands.editMessage.newContentDesc)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName(str[lang].commands.editMessage.message)
				.setDescription(str[lang].commands.editMessage.messageDesc)
				.setRequired(true)
		)
		.addChannelOption((option) =>
			option
				.setName(str[lang].commands.editMessage.channel)
				.setDescription(str[lang].commands.editMessage.channelDesc)
				.setRequired(false)
		),

	async execute(interaction) {
		// Only allow slash commands
		if (!interaction.type) {
			return interaction.reply({
				content: str[lang].commands.editMessage.errors.notSlash.replace(
					"${command}",
					str[lang].commands.editMessage.name
				),
				flags: MessageFlags.Ephemeral,
			});
		}

		// Only allow main admin to use the command
		if (interaction.user.id !== mainAdmin) {
			return interaction.reply({
				content: str[lang].commands.editMessage.errors.notMainAdmin,
				flags: MessageFlags.Ephemeral,
			});
		}

		// Get values
		const content = interaction.options.getString(str[lang].commands.editMessage.newContent);
		const messageId = interaction.options.getString(str[lang].commands.editMessage.message);
		const channel = interaction.options.getChannel(str[lang].commands.editMessage.channel);

		// Check if params are valid
		if (!messageId) {
			return await interaction.reply({
				content: str[lang].commands.editMessage.errors.missingParams,
				flags: MessageFlags.Ephemeral,
			});
		}

		editBotMessage(interaction, content, messageId, channel);
	},
};

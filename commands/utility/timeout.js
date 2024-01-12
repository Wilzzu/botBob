const { SlashCommandBuilder } = require("discord.js");
const { language } = require("../../configs/config.json");
const strings = require("../../configs/languages.json");
const handleTimeout = require("../../features/timeout/handleTimeout");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(strings[language].commands.timeout.name)
		.setDescription(strings[language].commands.timeout.description)
		.addUserOption((option) =>
			option
				.setName(strings[language].commands.timeout.user)
				.setDescription(strings[language].commands.timeout.userDesc)
				.setRequired(true)
		),

	async execute(interaction) {
		// Select user depending if the interaction was a slash command or a chat message
		let user = interaction.type
			? interaction.options.getUser(strings[language].commands.timeout.user)
			: interaction.mentions.users.first();

		// Check if user is valid
		if (!user)
			return await interaction.reply({
				content: strings[language].commands.timeout.errors.noUser,
				ephemeral: true,
			});
		if (user.bot)
			return await interaction.reply({
				content: strings[language].commands.timeout.errors.botUser,
				ephemeral: true,
			});

		handleTimeout(interaction, user);
	},
};

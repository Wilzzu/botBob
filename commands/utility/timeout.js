const { SlashCommandBuilder } = require("discord.js");
const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const { handleTimeout } = require("../../features/timeout/handleTimeout");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.timeout.name)
		.setDescription(str[lang].commands.timeout.description)
		.addUserOption((option) =>
			option
				.setName(str[lang].commands.timeout.user)
				.setDescription(str[lang].commands.timeout.userDesc)
				.setRequired(true)
		),

	async execute(interaction) {
		// Select user depending if the interaction was a slash command or a chat message
		let user = interaction.type
			? interaction.options.getUser(str[lang].commands.timeout.user)
			: interaction.mentions.users.first();

		// Check if user is valid
		if (!user)
			return await interaction.reply({
				content: str[lang].commands.timeout.errors.noUser,
				ephemeral: true,
			});
		if (user.bot)
			return await interaction.reply({
				content: str[lang].commands.timeout.errors.botUser,
				ephemeral: true,
			});

		handleTimeout(interaction, user);
	},
};

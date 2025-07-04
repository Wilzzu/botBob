const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const { handleTimeout } = require("../../features/timeout/handleTimeout");
const fs = require("fs");

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
				flags: MessageFlags.Ephemeral,
			});
		if (user.bot)
			return await interaction.reply({
				content: str[lang].commands.timeout.errors.botUser,
				flags: MessageFlags.Ephemeral,
			});

		// Check if channels exist
		const config = JSON.parse(fs.readFileSync("./configs/config.json", "utf8"));
		if (!config.mainChannelID)
			return await interaction.reply({
				content: str[lang].commands.timeout.errors.noMainChannel.replace(
					"${command}",
					str[lang].commands.setup.name
				),
				flags: MessageFlags.Ephemeral,
			});
		if (!config.timeoutChannelID)
			return await interaction.reply({
				content: str[lang].commands.timeout.errors.noTimeoutChannel.replace(
					"${command}",
					str[lang].commands.setup.name
				),
				flags: MessageFlags.Ephemeral,
			});

		// Start timeout vote
		handleTimeout(interaction, user, config.mainChannelID, config.timeoutChannelID);
	},
};

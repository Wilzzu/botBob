const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { lang, mainAdmin } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const sendMessageAsBot = require("../../features/sendMessageAsBot");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.say.name)
		.setDescription(str[lang].commands.say.description)
		.addChannelOption((option) =>
			option
				.setName(str[lang].commands.say.channel)
				.setDescription(str[lang].commands.say.channelDesc)
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName(str[lang].commands.say.message)
				.setDescription(str[lang].commands.say.messageDesc)
				.setRequired(true)
		),

	async execute(interaction) {
		// Only allow slash commands
		if (!interaction.type) {
			return interaction.reply({
				content: str[lang].commands.say.errors.notSlash.replace(
					"${command}",
					str[lang].commands.say.name
				),
				flags: MessageFlags.Ephemeral,
			});
		}

		// Only allow main admin to use the command
		if (interaction.user.id !== mainAdmin) {
			return interaction.reply({
				content: str[lang].commands.say.errors.notMainAdmin,
				flags: MessageFlags.Ephemeral,
			});
		}

		// Get values
		const channel = interaction.options.getChannel(str[lang].commands.say.channel);
		const message = interaction.options.getString(str[lang].commands.say.message);

		// Check if params are valid
		if (!channel || !message) {
			return await interaction.reply({
				content: str[lang].commands.say.errors.missingParams,
				flags: MessageFlags.Ephemeral,
			});
		}

		sendMessageAsBot(interaction, message, channel);
	},
};

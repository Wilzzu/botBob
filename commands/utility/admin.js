const { SlashCommandBuilder, userMention, MessageFlags } = require("discord.js");
const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const fs = require("fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.admin.name)
		.setDescription(str[lang].commands.admin.description)
		.addUserOption((option) =>
			option
				.setName(str[lang].commands.admin.user)
				.setDescription(str[lang].commands.admin.userDesc)
				.setRequired(true)
		),
	async execute(interaction) {
		// Only allow slash commands
		if (!interaction.type) {
			return await interaction.reply({
				content: str[lang].commands.admin.errors.notSlash.replace(
					"${command}",
					str[lang].commands.admin.name
				),
			});
		}

		// Get user
		const user = interaction.options.getUser(str[lang].commands.admin.user);

		// Check if user is valid
		if (!user) {
			return await interaction.reply({
				content: str[lang].commands.admin.errors.invalidUser,
				flags: MessageFlags.Ephemeral,
			});
		}
		if (user.bot) {
			return await interaction.reply({
				content: str[lang].commands.admin.errors.botUser,
				flags: MessageFlags.Ephemeral,
			});
		}
		const config = JSON.parse(fs.readFileSync("./configs/config.json", "utf-8"));
		if (config.admins.includes(user.id)) {
			return await interaction.reply({
				content: str[lang].commands.admin.errors.alreadyAdmin,
				flags: MessageFlags.Ephemeral,
			});
		}

		// Check if command user is main admin
		if (config.mainAdmin !== interaction.user.id) {
			return await interaction.reply({
				content: str[lang].commands.admin.errors.notMainAdmin,
				flags: MessageFlags.Ephemeral,
			});
		}

		// Add user to admins
		config.admins.push(user.id);
		fs.writeFileSync("./configs/config.json", JSON.stringify(config, null, 4), (err) => {
			if (err) return console.error(err);
		});

		// Send confirmation
		await interaction.reply({
			content: str[lang].commands.admin.success.replace("${username}", userMention(user.id)),
			flags: MessageFlags.Ephemeral,
		});
	},
};

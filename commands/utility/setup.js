const { SlashCommandBuilder } = require("discord.js");
const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const setup = require("../../features/setup");
const fs = require("fs");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.setup.name)
		.setDescription(str[lang].commands.setup.description),
	async execute(interaction) {
		// Only main admin can use this command
		const cfg = JSON.parse(fs.readFileSync("./configs/config.json", "utf8"));
		if (interaction.user.id !== cfg.mainAdmin)
			return interaction.reply({
				content: str[lang].setup.notAuthorized,
				ephemeral: true,
			});

		// Start setup
		setup(interaction.guild, interaction.client, interaction);
	},
};

const { SlashCommandBuilder } = require("discord.js");
const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const setup = require("../../features/setup");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.setup.name)
		.setDescription(str[lang].commands.setup.description),
	async execute(interaction) {
		setup(interaction.guild, interaction.client, interaction);
	},
};

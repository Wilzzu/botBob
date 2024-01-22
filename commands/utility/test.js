const { SlashCommandBuilder } = require("discord.js");
const { createDebtEmbed } = require("../../features/debt/modifyDebtEmbed");
const { guildID, debtChannelID } = require("../../configs/config.json");

// Temporary command for testing purposes
module.exports = {
	data: new SlashCommandBuilder().setName("test").setDescription("test"),
	async execute(interaction) {
		const guild = interaction.client.guilds.cache.get(guildID);
		createDebtEmbed(guild, debtChannelID);
		interaction.deferUpdate();
	},
};

const { Events } = require("discord.js");
const { language } = require("../../configs/config.json");
const strings = require("../../configs/languages.json");

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp({
					content: strings[language].error.commandExec,
					ephemeral: true,
				});
			} else {
				await interaction.reply({
					content: strings[language].error.commandExec,
					ephemeral: true,
				});
			}
		}
	},
};

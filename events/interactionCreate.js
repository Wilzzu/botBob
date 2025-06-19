const { Events, MessageFlags } = require("discord.js");
const { lang } = require("../configs/config.json");
const str = require("../configs/languages.json");

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
					content: str[lang].error.commandExec,
					flags: MessageFlags.Ephemeral,
				});
			} else {
				await interaction.reply({
					content: str[lang].error.commandExec,
					flags: MessageFlags.Ephemeral,
				});
			}
		}
	},
};

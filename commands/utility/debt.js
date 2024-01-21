const { SlashCommandBuilder } = require("discord.js");
const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const handleDebt = require("../../features/debt/handleDebt");

module.exports = {
	data: new SlashCommandBuilder()
		.setName(str[lang].commands.debt.name)
		.setDescription(str[lang].commands.debt.description)
		.addUserOption((option) =>
			option
				.setName(str[lang].commands.debt.from)
				.setDescription(str[lang].commands.debt.fromDesc)
				.setRequired(true)
		)
		.addUserOption((option) =>
			option
				.setName(str[lang].commands.debt.to)
				.setDescription(str[lang].commands.debt.toDesc)
				.setRequired(true)
		)
		.addNumberOption((option) =>
			option
				.setName(str[lang].commands.debt.amount)
				.setDescription(str[lang].commands.debt.amountDesc)
				.setRequired(true)
		),

	async execute(interaction) {
		// Only allow slash commands
		if (!interaction.type) {
			const reply = await interaction.reply({
				content: str[lang].commands.debt.errors.notSlash.replace(
					"${command}",
					str[lang].commands.debt.name
				),
			});
			setTimeout(async () => {
				await reply.delete();
				await interaction.delete();
			}, 5000);
			return;
		}

		// Get values
		let from = interaction.options.getUser(str[lang].commands.debt.from);
		let to = interaction.options.getUser(str[lang].commands.debt.to);
		let amount = interaction.options.getNumber(str[lang].commands.debt.amount);

		// Check if fields are valid
		if (from.bot || to.bot) {
			return await interaction.reply({
				content: str[lang].commands.debt.errors.botUser,
				ephemeral: true,
			});
		}
		if (from.id === to.id) {
			return await interaction.reply({
				content: str[lang].commands.debt.errors.sameUser,
				ephemeral: true,
			});
		}
		if (amount <= 0) {
			return await interaction.reply({
				content: str[lang].commands.debt.errors.invalidAmount,
				ephemeral: true,
			});
		}

		handleDebt(interaction, from, to, amount);
	},
};
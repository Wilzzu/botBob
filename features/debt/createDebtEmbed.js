const { EmbedBuilder } = require("discord.js");
const str = require("../../configs/languages.json");
const {
	lang,
	debtChannelID,
	features: { debt },
} = require("../../configs/config.json");
const database = require("../../databases/debtsDb.json");

// Use emojis for the top 10 placements
const placements = {
	1: "🥇",
	2: "🥈",
	3: "🥉",
	4: "4️⃣",
	5: "5️⃣",
	6: "6️⃣",
	7: "7️⃣",
	8: "8️⃣",
	9: "9️⃣",
	10: "🔟",
};

module.exports = async function createDebtEmbed(guild) {
	// Fetch all members so everyones name is available
	await guild.members.fetch();
	let description = str[lang].debt.description + "```asciidoc\n";

	// Sort database and go through each user
	database.sort((a, b) => b.amount - a.amount);
	database.forEach((user, i) => {
		// Create title for each user
		const userData = guild.members.cache.get(user.id);
		const username =
			userData?.user?.globalName || userData?.user?.username || str[lang].debt.noUserFound;
		const title = `${placements[i + 1] || i + 1 + "."} ${username} ${str[lang].debt.emoji}${
			user.amount
		}`;

		// Create list of debts for each user
		let debtValues = "";
		user.debts.sort((a, b) => b.amount - a.amount);
		user.debts.forEach((debt) => {
			const receiver = guild.members.cache.get(debt.id);
			const name =
				receiver?.user?.globalName || receiver?.user?.username || str[lang].debt.noUserFound;
			debtValues += `    🔸 ${name} [${debt.amount}]\n`;
		});

		// Lastly add the user to the embed
		description += `= ${title} =\n${debtValues}\n`;
	});

	// Create embed with the debt info
	const embed = new EmbedBuilder()
		.setColor("#FFCC00")
		.setTitle(str[lang].debt.title.replace("${emoji}", str[lang].debt.emoji))
		.setDescription(description + "```")
		.setImage(debt.image);

	return await guild.channels.cache.get(debtChannelID).send({ embeds: [embed] });
};

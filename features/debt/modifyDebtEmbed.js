const { EmbedBuilder } = require("discord.js");
const str = require("../../configs/languages.json");
const {
	lang,
	features: { debt },
} = require("../../configs/config.json");
const database = require("../../databases/debtsDb.json");
const fs = require("fs");

// Use emojis for the top 3 placements
const placements = {
	1: "🥇",
	2: "🥈",
	3: "🥉",
};

const updateDebtsInEmbed = async (db, guild) => {
	// Fetch all members so everyones name is available
	await guild.members.fetch();
	let description = str[lang].debt.description + "```prolog\n";

	if (!db.length) return description + str[lang].debt.noDebts + "```";

	// Sort database and go through each user
	db.sort((a, b) => b.amount - a.amount);
	db.forEach((user, i) => {
		// Create title for each user
		const userData = guild.members.cache.get(user.id);
		const username = userData?.user?.globalName || userData?.user?.username || user.name;
		const title = `''   ${placements[i + 1] || i + 1 + "."} ${username.toUpperCase()} - ${
			str[lang].debt.emoji
		}${user.amount}`;

		// Create list of debts for each user
		let debtValues = "";
		user.debts.sort((a, b) => b.amount - a.amount);
		user.debts.forEach((debt, index) => {
			const receiver = guild.members.cache.get(debt.id);
			const name = receiver?.user?.globalName || receiver?.user?.username || debt.name;
			debtValues += `'${index ? "" : " "}      🔸 [${debt.amount}] ${name}\n'`;
		});

		// Lastly add the user to the embed
		description += `${title}\n${debtValues}\n`;
	});
	return description + "```";
};

// Update embed with new debt info
const updateDebtEmbed = async (db, guild) => {
	// Get debt embed message
	const config = JSON.parse(fs.readFileSync("./configs/config.json", "utf-8"));
	const embedMsg = await guild.channels.cache
		.get(config.debtChannelID)
		.messages.fetch(config.debtEmbedID);
	if (!embedMsg) return console.error("Couldn't find debt embed message");

	// Create new embed with updated info and update the message with it
	const updatedEmbed = EmbedBuilder.from(embedMsg.embeds[0]).setDescription(
		await updateDebtsInEmbed(db, guild)
	);
	embedMsg.edit({ embeds: [updatedEmbed] });
};

const createDebtEmbed = async (guild) => {
	// Create embed with the debt info
	return new EmbedBuilder()
		.setColor("#FFCC00")
		.setTitle(str[lang].debt.title.replace("${emoji}", str[lang].debt.emoji))
		.setDescription(await updateDebtsInEmbed(database, guild))
		.setImage(debt.image);
};

module.exports = {
	createDebtEmbed,
	updateDebtEmbed,
};

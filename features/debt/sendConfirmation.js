const fs = require("fs");
const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const { EmbedBuilder } = require("discord.js");

module.exports = async function sendConfirmation(i, desc) {
	const config = JSON.parse(fs.readFileSync("./configs/config.json", "utf8"));
	const channel = await i.guild.channels.cache.get(config.debtChannelID);

	let thread = null;
	// Create new thread if one doesn't exist
	if (!config.debtThreadID) {
		thread = await channel.threads.create({
			name: str[lang].debt.threadName,
			autoArchiveDuration: 60,
			reason: str[lang].debt.threadReason,
		});

		// Update config with new thread ID
		config.debtThreadID = thread.id;
		fs.writeFileSync("./configs/config.json", JSON.stringify(config, null, 4), (err) => {
			if (err) return console.error(err);
		});
	}

	// If we don't have access to the thread yet, get it from cache
	if (!thread) thread = await channel.threads.cache.get(config.debtThreadID);

	// Create confirmation embed
	const embed = new EmbedBuilder()
		.setAuthor({
			name: i.user?.globalName || i.user?.username,
			iconURL: i.user.displayAvatarURL(),
		})
		.setDescription(desc)
		.setTimestamp();

	// Send confirmation embed to the thread
	if (thread) await thread.send({ embeds: [embed] });
};

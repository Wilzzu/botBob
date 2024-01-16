const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const fs = require("fs");

// Return false if vote is not valid
const getVoiceStates = (interaction, user) => {
	// If target is not in a voice channel, automatically make the vote valid
	let target = interaction.guild.members.cache.get(user.id).voice.channelId;
	if (!target) return true;

	// Check if both users are in the same voice channel
	let initiator = interaction.member.voice.channelId;
	if (initiator === target) return true;

	return false;
};

module.exports = function validateVoteStart(interaction, user, usersBeingTimedOut) {
	let validation = { valid: false, reason: "", ephemeral: true };

	// If a vote is already in progress for the user
	if (usersBeingTimedOut.includes(user?.id))
		return { ...validation, reason: str[lang].timeout.voteAlreadyStarted };

	const timeoutDb = JSON.parse(fs.readFileSync("./databases/timeoutDb.json", "utf-8"));

	// If user is already timed out
	if (timeoutDb[user.id]) return { ...validation, reason: str[lang].timeout.alreadyOnTimeout };

	// If vote initiator is timed out
	if (timeoutDb[interaction.type ? interaction.user.id : interaction.author.id])
		return { ...validation, reason: str[lang].timeout.voterIsTimedOut, ephemeral: false };

	// If vote initiator and target are not on the same voice channel
	if (!getVoiceStates(interaction, user))
		return { ...validation, reason: str[lang].timeout.userOnDifferentChannel };

	// If user has higher role than bot
	if (!interaction.guild.members.cache.get(user.id).bannable)
		return { ...validation, reason: str[lang].timeout.userHasHigherRoleThanBot };

	return {
		valid: true,
		voiceChannelID: interaction.guild.members.cache.get(user.id).voice.channelId,
	};
};

const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");

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

module.exports = function validateVoteStart(interaction, user, usersBeingTimedOut, timeoutDB) {
	let validation = { valid: false, reason: "", ephemeral: true };

	// If a vote is already in progress for the user
	if (usersBeingTimedOut.includes(user?.id))
		return { ...validation, reason: str[lang].timeout.voteAlreadyStarted };

	// If user is already timed out
	if (timeoutDB.some((e) => e.id === user.id))
		return { ...validation, reason: str[lang].timeout.alreadyOnTimeout };

	// If vote initiator is timed out
	if (
		timeoutDB.some((e) => (e.id === interaction.type ? interaction.user.id : interaction.author.id))
	)
		return { ...validation, reason: str[lang].timeout.voterIsTimedOut, ephemeral: false };

	// If vote initiator and target are not on the same voice channel
	if (!getVoiceStates(interaction, user))
		return { ...validation, reason: str[lang].timeout.userOnDifferentChannel };

	return {
		valid: true,
		voiceChannelID: interaction.guild.members.cache.get(user.id).voice.channelId,
	};
};

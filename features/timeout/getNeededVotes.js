module.exports = function getNeededVotes(interaction, voiceChannelID) {
	if (!voiceChannelID) return null;

	let voiceSize = interaction.guild.channels.cache
		.get(voiceChannelID)
		.members.filter((member) => !member.user.bot).size;
	if (voiceSize % 1 == 0) voiceSize++;
	return voiceSize > 2 ? Math.ceil(voiceSize / 2) : 2;
};

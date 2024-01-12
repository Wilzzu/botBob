const { EmbedBuilder } = require("discord.js");
const {
	features: { timeout },
	lang,
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const endVote = require("./endVote");

module.exports = function updateVote(message) {
	let timeLeft = timeout.voteDuration - 2;
	const interval = setInterval(() => {
		// Get needed votes
		// let votesNeeded = calculateVotesNeeded(voiceChannelID);

		// Create new embed with updated time and votes
		const updatedVoteEmbed = EmbedBuilder.from(message.embeds[0])
			.setDescription(str[lang].timeout.embedDesc.replace("${timeLeft}", timeLeft))
			.setFields(
				{
					name: `${str[lang].timeout.yesVotes}: 0 / votesNeeded`,
					value: "Yes voters",
					inline: true,
				},
				{
					name: `${str[lang].timeout.noVotes}: 0 / votesNeeded`,
					value: "No voters",
					inline: true,
				}
			);

		// Edit message with updated embed
		message.edit({ embeds: [updatedVoteEmbed] });

		// Stop the vote when time is over
		timeLeft -= 2;

		// TODO: Maybe move this before subtracting timeLeft, depending on how fast endVote will update the embed
		if (timeLeft <= 0) {
			clearInterval(interval);
			endVote(message);
		}
	}, 2000);
};

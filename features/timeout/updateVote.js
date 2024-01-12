const { EmbedBuilder } = require("discord.js");
const {
	features: { timeout },
	lang,
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const endVote = require("./endVote");
const getNeededVotes = require("./getNeededVotes");

module.exports = function updateVote(
	interaction,
	message,
	voteCollector,
	user,
	voiceChannelID,
	usersBeingTimedOut
) {
	let timeLeft = timeout.voteDuration - 2;
	const votes = { voteYes: [], voteNo: [] };

	voteCollector.on("collect", async (i) => {
		// Check if user already voted
		if (
			votes.voteYes.find((e) => e.id === i.user.id) ||
			votes.voteNo.find((e) => e.id === i.user.id)
		)
			return await i.reply({ content: str[lang].timeout.alreadyVoted, ephemeral: true });

		// Check if user is trying to vote no on themselves
		if (i.customId === "voteNo" && i.user.id === user.id)
			return await i.reply({ content: str[lang].timeout.cantVoteNoOnYourself, ephemeral: true });

		// Add user to votes
		votes[i.customId].push({ id: i.user.id, username: i.user?.globalName || i.user?.username });
		await i.deferUpdate();
	});

	const interval = setInterval(() => {
		// Get needed votes
		let votesNeeded = getNeededVotes(interaction, voiceChannelID);

		// Create new embed with updated time and votes
		const updatedVoteEmbed = EmbedBuilder.from(message.embeds[0])
			.setDescription(str[lang].timeout.embedDesc.replace("${timeLeft}", timeLeft))
			.setFields(
				{
					// Vote amount
					name: `${str[lang].timeout.yesVotes}: ${votes.voteYes.length}${
						votesNeeded ? "/" + votesNeeded : ""
					}`,
					// Users who have voted
					value: votes.voteYes.length ? votes.voteYes.map((e) => e.username).join("\n") : "\u200B",
					inline: true,
				},
				{
					name: `${str[lang].timeout.noVotes}: ${votes.voteNo.length}${
						votesNeeded ? "/" + votesNeeded : ""
					}`,
					value: votes.voteNo.length ? votes.voteNo.map((e) => e.username).join("\n") : "\u200B",
					inline: true,
				}
			);

		// Edit message with updated embed
		message.edit({ embeds: [updatedVoteEmbed] });

		// Stop the vote when time is over
		if (
			timeLeft <= 0 ||
			votes.voteYes.length >= votesNeeded ||
			votes.voteNo.length >= votesNeeded
		) {
			clearInterval(interval);
			voteCollector.stop();
			endVote(message, votes, user, voiceChannelID, usersBeingTimedOut);
		}

		timeLeft -= 2;
	}, 2000);
};

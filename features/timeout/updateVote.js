const { EmbedBuilder, ComponentType } = require("discord.js");
const {
	features: { timeout },
	lang,
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const endVote = require("./endVote");
const getNeededVotes = require("./getNeededVotes");

const findUserById = (id, votes) => {
	for (const key in votes) {
		if (votes.hasOwnProperty(key)) {
			const user = votes[key].find((user) => user.id === id);
			if (user) return user;
		}
	}
	return null;
};

// Create embed with updated vote count and time left
const createEmbed = (message, votes, votesNeeded, timeLeft) => {
	return EmbedBuilder.from(message.embeds[0])
		.setDescription(str[lang].timeout.embedDesc.replace("${timeLeft}", timeLeft))
		.setFields(
			{
				// Vote amount
				name: `✅ ${str[lang].timeout.yesVotes}: ${votes.voteYes.length}${
					votesNeeded ? "/" + votesNeeded : ""
				}`,
				// Users who have voted
				value: votes.voteYes.length ? votes.voteYes.map((e) => e.username).join("\n") : "\u200B",
				inline: true,
			},
			{
				name: `❌ ${str[lang].timeout.noVotes}: ${votes.voteNo.length}${
					votesNeeded ? "/" + votesNeeded : ""
				}`,
				value: votes.voteNo.length ? votes.voteNo.map((e) => e.username).join("\n") : "\u200B",
				inline: true,
			}
		);
};

module.exports = function updateVote(
	interaction,
	message,
	user,
	voiceChannelID,
	usersBeingTimedOut
) {
	let timeLeft = timeout.voteDuration;
	let votesNeeded = getNeededVotes(interaction, voiceChannelID);
	const votes = { voteYes: [], voteNo: [] };

	const voteCollector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
	});

	voteCollector.on("collect", async (i) => {
		// Check if user already voted
		if (findUserById(i.user.id, votes))
			return await i.reply({ content: str[lang].timeout.alreadyVoted, ephemeral: true });

		// Check if user is trying to vote no on themselves
		if (i.customId === "voteNo" && i.user.id === user.id)
			return await i.reply({ content: str[lang].timeout.cantVoteNoOnYourself, ephemeral: true });

		// Add user to votes and update embed
		votes[i.customId].push({ id: i.user.id, username: i.user?.globalName || i.user?.username });
		await i.update({ embeds: [createEmbed(message, votes, votesNeeded, timeLeft)] });
	});

	const interval = setInterval(() => {
		timeLeft -= 2;

		// Get needed votes
		votesNeeded = getNeededVotes(interaction, voiceChannelID);

		// Stop the vote when time is over
		if (
			timeLeft <= 0 ||
			(votesNeeded && votes.voteYes.length >= votesNeeded) ||
			(votesNeeded && votes.voteNo.length >= votesNeeded)
		) {
			clearInterval(interval);
			voteCollector.stop();
			endVote(message, votes, user, voiceChannelID, usersBeingTimedOut);
		} else {
			// Edit message with updated embed
			message.edit({ embeds: [createEmbed(message, votes, votesNeeded, timeLeft)] });
		}
	}, 2000);
};

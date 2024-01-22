const { EmbedBuilder, ComponentType, channelLink } = require("discord.js");
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

const validateVotes = (votes, invalidVotes, interaction, voiceChannelID) => {
	if (!voiceChannelID) return;
	// Invalidate user's vote if they left the voice channel
	for (const key in votes) {
		if (votes.hasOwnProperty(key)) {
			votes[key].forEach((user) => {
				if (interaction.guild.members.cache.get(user.id).voice.channelId !== voiceChannelID) {
					invalidVotes[key].push(user);
					votes[key].splice(votes[key].indexOf(user), 1);
				}
			});
		}
	}

	// Add user's vote back if they rejoined the voice channel
	for (const key in invalidVotes) {
		if (invalidVotes.hasOwnProperty(key)) {
			invalidVotes[key].forEach((user) => {
				if (interaction.guild.members.cache.get(user.id).voice.channelId === voiceChannelID) {
					votes[key].push(user);
					invalidVotes[key].splice(invalidVotes[key].indexOf(user), 1);
				}
			});
		}
	}
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
	usersBeingTimedOut,
	timeoutChannelID,
	mainChannelID
) {
	let timeLeft = timeout.voteDuration;
	let votesNeeded = getNeededVotes(interaction, voiceChannelID);
	const votes = { voteYes: [], voteNo: [] };
	const invalidVotes = { voteYes: [], voteNo: [] };

	const voteCollector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
	});

	voteCollector.on("collect", async (i) => {
		// Check if user already voted
		if (findUserById(i.user.id, votes) || findUserById(i.user.id, invalidVotes))
			return await i.reply({ content: str[lang].timeout.alreadyVoted, ephemeral: true });

		// Check if user is trying to vote no on themselves
		if (i.customId === "voteNo" && i.user.id === user.id)
			return await i.reply({ content: str[lang].timeout.cantVoteNoOnYourself, ephemeral: true });

		// Check if user is not in the same voice channel
		if (
			voiceChannelID &&
			interaction.guild.members.cache.get(i.user.id).voice.channelId !== voiceChannelID
		)
			return await i.reply({
				content: str[lang].timeout.notInVoiceChannel.replace(
					"${voiceChannel}",
					channelLink(voiceChannelID)
				),
				ephemeral: true,
			});

		// Add user to votes and update embed
		votes[i.customId].push({ id: i.user.id, username: i.user?.globalName || i.user?.username });
		validateVotes(votes, invalidVotes, interaction, voiceChannelID);
		await i.update({
			embeds: [createEmbed(message, votes, getNeededVotes(interaction, voiceChannelID), timeLeft)],
		});
	});

	const interval = setInterval(() => {
		timeLeft -= 2;

		// Validate votes
		validateVotes(votes, invalidVotes, interaction, voiceChannelID);

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
			endVote(
				message,
				votes,
				votesNeeded,
				user,
				voiceChannelID,
				timeoutChannelID,
				mainChannelID,
				usersBeingTimedOut
			);
		} else {
			// Edit message with updated embed
			message.edit({ embeds: [createEmbed(message, votes, votesNeeded, timeLeft)] });
		}
	}, 2000);
};

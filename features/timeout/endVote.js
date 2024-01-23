const { EmbedBuilder } = require("discord.js");
const {
	features: { timeout },
	lang,
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const tiebreaker = require("./tiebreaker");
const fs = require("fs");
const handleTimeoutDatabase = require("./handleTimeoutDatabase");

// Create embed with final result
const createEmbed = (message, result, votes, votesNeeded, user) => {
	return EmbedBuilder.from(message.embeds[0])
		.setColor("#808080")
		.setDescription(
			str[lang].timeout.embedDescEnd +
				result.replace("${username}", user?.globalName || user?.username)
		)
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

// Calculate vote's result
const calculateVotes = (votes, voiceChannelID) => {
	if (!votes.voteYes.length) return { passed: false, desc: str[lang].timeout.notEnoughVotes };
	if (votes.voteYes.length > votes.voteNo.length) {
		if (votes.voteYes.length < (voiceChannelID ? 2 : 3))
			return { passed: false, desc: str[lang].timeout.notEnoughVotes };
		return {
			passed: true,
			desc: voiceChannelID ? str[lang].timeout.votePassed : str[lang].timeout.votePassedNotInVc,
		};
	}

	if (votes.voteYes.length === votes.voteNo.length) {
		if (votes.voteYes.length < 2 && votes.voteNo.length < 2)
			return { passed: false, desc: str[lang].timeout.notEnoughVotes };
		return { desc: str[lang].timeout.tie, tie: true };
	}

	return { passed: false, desc: str[lang].timeout.voteFailed };
};

const addToDatabase = (user, voiceChannelID, timeoutChannelID, mainChannelID, message, embed) => {
	// Get member's roles
	const member = message.guild.members.cache.get(user.id);
	const roles = member.roles.cache.map((e) => e.id);

	// Calculate timeout end time
	const endTime =
		Date.now() + (voiceChannelID ? timeout.timeoutDuration : timeout.timeoutDurationNotInVc);

	// Add user to timeoutDb
	let timeoutDb = JSON.parse(fs.readFileSync("./databases/timeoutDb.json", "utf-8"));
	timeoutDb[user.id] = {
		username: user?.globalName || user?.username,
		roles,
		lastVoiceChannelId: voiceChannelID,
		endTime,
	};
	fs.writeFileSync("./databases/timeoutDb.json", JSON.stringify(timeoutDb, null, 4), (err) => {
		if (err) return console.log(err);
	});

	// Move user to timeout channel if possible
	if (voiceChannelID && member.voice.channelId) {
		try {
			member.voice.setChannel(
				message.guild.channels.cache.get(timeoutChannelID),
				str[lang].timeout.movedUserToTimeout
			);
		} catch (error) {
			console.error("Couldn't remove user's roles");
		}
	}

	// Remove all user's roles if possible
	if (member.bannable) {
		try {
			member.roles.remove(roles, str[lang].timeout.rolesRemoved);
		} catch (error) {
			console.error("Couldn't remove user's roles");
		}
	}

	// Update embed every 10 seconds
	handleTimeoutDatabase(user, message, embed, endTime, mainChannelID);
};

module.exports = function endVote(
	message,
	votes,
	votesNeeded,
	user,
	voiceChannelID,
	timeoutChannelID,
	mainChannelID,
	usersBeingTimedOut
) {
	let description = str[lang].timeout.embedDescEnd;
	let vote = calculateVotes(votes, voiceChannelID);

	if (vote?.tie)
		tiebreaker(
			message,
			user,
			description + vote.desc,
			votes,
			usersBeingTimedOut,
			addToDatabase,
			voiceChannelID,
			timeoutChannelID,
			mainChannelID
		);
	else {
		// Update embed with final result
		const embed = createEmbed(message, vote.desc, votes, votesNeeded, user);

		// Add user to timeoutDb if vote passed, else remove buttons and update embed
		if (vote.passed)
			addToDatabase(user, voiceChannelID, timeoutChannelID, mainChannelID, message, embed);
		else message.edit({ embeds: [embed], components: [] });

		// Remove user from usersBeingTimedOut
		usersBeingTimedOut.splice(usersBeingTimedOut.indexOf(user.id), 1);
	}

	// Maybe add fun modifiers that have a chance to trigger,
	// like 1% chance to timeout if not enough votes, or 10% chance to timeout the initiator if vote fails
};

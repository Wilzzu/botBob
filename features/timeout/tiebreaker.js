const {
	ActionRowBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	MessageFlags,
} = require("discord.js");
const {
	features: { timeout },
	lang,
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");

const createTieButtons = () => {
	const rockBtn = new ButtonBuilder()
		.setCustomId("rock")
		.setLabel(str[lang].timeout.rock)
		.setStyle(ButtonStyle.Secondary)
		.setEmoji("🗿");

	const paperBtn = new ButtonBuilder()
		.setCustomId("paper")
		.setLabel(str[lang].timeout.paper)
		.setStyle(ButtonStyle.Secondary)
		.setEmoji("📜");

	const scissorsBtn = new ButtonBuilder()
		.setCustomId("scissors")
		.setLabel(str[lang].timeout.scissors)
		.setStyle(ButtonStyle.Secondary)
		.setEmoji("✂");

	return new ActionRowBuilder().addComponents(rockBtn, paperBtn, scissorsBtn);
};

const createTieEmbed = (message, desc, votes, timeleft) => {
	return EmbedBuilder.from(message.embeds[0])
		.setColor("#0080FE")
		.setDescription(desc)
		.setFields(
			{
				name: `✅ ${str[lang].timeout.teamName} ${str[lang].timeout.yesVotes.toUpperCase()}`,
				value: votes.voteYes
					.map(
						(e) => `${e.rps ? "**:ballot_box_with_check:" : "❔"} ${e.username}${e.rps ? "**" : ""}`
					)
					.join("\n"),
				inline: true,
			},
			{
				name: `❌ ${str[lang].timeout.teamName} ${str[lang].timeout.noVotes.toUpperCase()}`,
				value: votes.voteNo
					.map(
						(e) => `${e.rps ? "**:ballot_box_with_check:" : "❔"} ${e.username}${e.rps ? "**" : ""}`
					)
					.join("\n"),
				inline: true,
			},
			{
				name: "\u200B",
				value: str[lang].timeout.rpsDesc.replace("${timeLeft}", timeleft),
			}
		);
};

const createFinalEmbed = (message, desc, user, votes, results) => {
	// Replace choices with emojis
	let replaceMap = {
		rock: "🗿",
		paper: "📜",
		scissors: ":scissors:",
	};

	if (results?.choices) {
		for (const key in results.choices) {
			if (results.choices.hasOwnProperty(key)) {
				results.choices[key] = replaceMap[results.choices[key]];
			}
		}
	}

	// Create string to show what the teams chose and who won
	let teamChoices = results?.choices
		? str[lang].timeout.rpsTeamChoices
				.replace("${teamYes}", results.choices.yesTeam)
				.replace("${teamNo}", results.choices.noTeam)
		: results.res === 1
		? str[lang].timeout.rpsNeitherTeamVoted
		: str[lang].timeout.rpsOtherTeamDidntVote;

	let resultString =
		results.res === 1
			? str[lang].timeout.rpsResultsTie
			: str[lang].timeout.rpsResults.replace(
					"${winner}",
					results.res === 2
						? `${str[lang].timeout.teamName} ${str[lang].timeout.yesVotes}`.toUpperCase()
						: `${str[lang].timeout.teamName} ${str[lang].timeout.noVotes}`.toUpperCase()
			  );

	// Determine action taken string
	let actionTaken = str[lang].timeout.voteFailed;
	if (results.res === 2) actionTaken = str[lang].timeout.votePassed;

	// Add 🏆 to winner team, show team choices, show player choices, show winner
	return EmbedBuilder.from(message.embeds[0])
		.setColor("#808080")
		.setDescription(desc)
		.setFields(
			{
				name: `${results?.choices ? results.choices.yesTeam : ""} ${
					str[lang].timeout.teamName
				} ${str[lang].timeout.yesVotes.toUpperCase()} ${results.res === 2 ? "🏆" : ""}`,
				value: votes.voteYes
					.map((e) => `${e.rps ? "**" + e.rps.emoji : "~~❔"} ${e.username}${e.rps ? "**" : "~~"}`)
					.join("\n"),
				inline: true,
			},
			{
				name: `${results?.choices ? results.choices.noTeam : ""} ${
					str[lang].timeout.teamName
				} ${str[lang].timeout.noVotes.toUpperCase()} ${results.res === 3 ? "🏆" : ""}`,
				value: votes.voteNo
					.map((e) => `${e.rps ? "**" + e.rps.emoji : "~~❔"} ${e.username}${e.rps ? "**" : "~~"}`)
					.join("\n"),
				inline: true,
			},
			{
				name: "\u200B",
				value: `${teamChoices} = ${resultString}\n${actionTaken.replace(
					"${username}",
					user?.globalName || user?.username
				)}`,
			}
		);
};

const findUserById = (id, votes) => {
	for (const key in votes) {
		if (votes.hasOwnProperty(key)) {
			const user = votes[key].find((user) => user.id === id);
			if (user) return user;
		}
	}
	return null;
};

// Determine winner, 1 = tie, 2 = yes, 3 = no
const calculateWinner = (votes) => {
	// Get all the choices and put them in array, filter out null values
	const yesChoices = votes.voteYes.map((user) => user.rps?.choice).filter((e) => e);
	const noChoices = votes.voteNo.map((user) => user.rps?.choice).filter((e) => e);

	// If there are no choices, it's a tie
	if (!yesChoices.length && !noChoices.length) return { res: 1 };

	// If there are no choices on one side, the other side wins
	if (!noChoices.length) return { res: 2 };
	if (!yesChoices.length) return { res: 3 };

	// Count the amount of each choice
	const yesChoice = yesChoices.reduce((acc, curr) => {
		acc[curr] = (acc[curr] || 0) + 1;
		return acc;
	}, {});
	const noChoice = noChoices.reduce((acc, curr) => {
		acc[curr] = (acc[curr] || 0) + 1;
		return acc;
	}, {});

	// Get the most chosen choice
	const yesMostChosen = Object.keys(yesChoice).reduce((a, b) =>
		yesChoice[a] > yesChoice[b] ? a : b
	);
	const noMostChosen = Object.keys(noChoice).reduce((a, b) => (noChoice[a] > noChoice[b] ? a : b));

	// Determine winner
	if (yesMostChosen === noMostChosen)
		return { res: 1, choices: { yesTeam: yesMostChosen, noTeam: noMostChosen } };
	if (
		(yesMostChosen === "rock" && noMostChosen === "scissors") ||
		(yesMostChosen === "paper" && noMostChosen === "rock") ||
		(yesMostChosen === "scissors" && noMostChosen === "paper")
	)
		return { res: 2, choices: { yesTeam: yesMostChosen, noTeam: noMostChosen } };
	return { res: 3, choices: { yesTeam: yesMostChosen, noTeam: noMostChosen } };
};

module.exports = function tiebreaker(
	message,
	user,
	desc,
	votes,
	usersBeingTimedOut,
	addToDatabase,
	voiceChannelID,
	timeoutChannelID,
	mainChannelID
) {
	let timeleft = timeout.rpsDuration;

	// Update embed with tiebreaker info
	message.edit({
		embeds: [createTieEmbed(message, desc, votes, timeleft)],
		components: [createTieButtons()],
	});

	const rpsCollector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
	});

	rpsCollector.on("collect", async (i) => {
		// Check if user voted earlier, those who didn't aren't eligible to play
		if (findUserById(i.user.id, votes) === null)
			return await i.reply({
				content: str[lang].timeout.rpsNotEligible,
				flags: MessageFlags.Ephemeral,
			});

		// Check if user has already chosen
		if (findUserById(i.user.id, votes).rps)
			return await i.reply({
				content: str[lang].timeout.rpsAlreadyChosen.replace(
					"${choice}",
					findUserById(i.user.id, votes).rps.emoji
				),
				flags: MessageFlags.Ephemeral,
			});

		// Update user's choice
		switch (i.customId) {
			case "rock":
				findUserById(i.user.id, votes).rps = { choice: "rock", emoji: "🗿" };
				break;
			case "paper":
				findUserById(i.user.id, votes).rps = { choice: "paper", emoji: "📜" };
				break;
			case "scissors":
				findUserById(i.user.id, votes).rps = { choice: "scissors", emoji: ":scissors:" };
				break;
			default:
				break;
		}

		// Update embed with user's choice
		await i.update({ embeds: [createTieEmbed(message, desc, votes, timeleft)] });
	});

	const interval = setInterval(() => {
		timeleft -= 2;

		// Check if all users have chosen, or if time is up
		if (
			(votes.voteYes.every((user) => user.rps) && votes.voteNo.every((user) => user.rps)) ||
			timeleft <= 0
		) {
			clearInterval(interval);
			rpsCollector.stop();

			// Calculate winner and update embed with final result
			const results = calculateWinner(votes);
			const embed = createFinalEmbed(message, desc, user, votes, results);

			message.edit({ embeds: [embed], components: [] });

			// Add user to timeoutDb if vote passed after delay
			if (results.res === 2) {
				setTimeout(() => {
					addToDatabase(user, voiceChannelID, timeoutChannelID, mainChannelID, message, embed);
				}, timeout.rpsDelayBeforeTimingOut);
			}

			// Remove user from usersBeingTimedOut
			usersBeingTimedOut.splice(usersBeingTimedOut.indexOf(user.id), 1);
		} else {
			// Update embed with new time and votes
			message.edit({
				embeds: [createTieEmbed(message, desc, votes, timeleft)],
			});
		}
	}, 2000);
};

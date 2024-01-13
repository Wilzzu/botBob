const {
	ActionRowBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
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
		.setDescription(desc)
		.setFields(
			{
				name: `✅ ${str[lang].timeout.teamName} ${str[lang].timeout.yesVotes}`,
				value: votes.voteYes
					.map((e) => `${e.rps ? "**🟢" : "⚪"} ${e.username}${e.rps ? "**" : ""}`)
					.join("\n"),
				inline: true,
			},
			{
				name: `❌ ${str[lang].timeout.teamName} ${str[lang].timeout.noVotes}`,
				value: votes.voteNo
					.map((e) => `${e.rps ? "**🟢" : "⚪"} ${e.username}${e.rps ? "**" : ""}`)
					.join("\n"),
				inline: true,
			},
			{
				name: "\u200B",
				value: str[lang].timeout.rpsDesc.replace("${timeLeft}", timeleft),
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

const calculateWinner = (votes) => {
	// Get all the choices and put them in array, filter out null values
	const yesChoices = votes.voteYes.map((user) => user.rps?.choice).filter((e) => e);
	const noChoices = votes.voteNo.map((user) => user.rps?.choice).filter((e) => e);

	// If there are no choices, it's a tie
	if (!yesChoices.length && !noChoices.length) return "tie";

	// If there are no choices on one side, the other side wins
	if (!yesChoices.length) return "no";
	if (!noChoices.length) return "yes";

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
	if (yesMostChosen === noMostChosen) return "tie";
	if (
		(yesMostChosen === "rock" && noMostChosen === "scissors") ||
		(yesMostChosen === "paper" && noMostChosen === "rock") ||
		(yesMostChosen === "scissors" && noMostChosen === "paper")
	)
		return "yes";
	return "no";
};

module.exports = function tiebreaker(message, user, desc, votes) {
	let timeleft = timeout.rpsDuration - 2;

	// Update embed with tiebreaker info
	message.edit({
		embeds: [createTieEmbed(message, desc, votes, timeleft + 2)],
		components: [createTieButtons()],
	});

	const rpsCollector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
	});

	rpsCollector.on("collect", async (i) => {
		// Check if user voted earlier, those who didn't aren't eligible to play
		if (findUserById(i.user.id, votes) === null)
			return await i.reply({ content: str[lang].timeout.rpsNotEligible, ephemeral: true });

		// Check if user has already chosen
		if (findUserById(i.user.id, votes).rps)
			return await i.reply({
				content: str[lang].timeout.rpsAlreadyChosen.replace(
					"${choice}",
					findUserById(i.user.id, votes).rps.emoji
				),
				ephemeral: true,
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

		await i.deferUpdate();
	});

	const interval = setInterval(() => {
		// Update embed with new time and votes
		message.edit({
			embeds: [createTieEmbed(message, desc, votes, timeleft)],
		});

		// Check if all users have chosen, or if time is up
		if (
			(votes.voteYes.every((user) => user.rps) && votes.voteNo.every((user) => user.rps)) ||
			timeleft <= 0
		) {
			clearInterval(interval);
			rpsCollector.stop();
			console.log(calculateWinner(votes));
			// TODO: Send final embed with winner team having a 🏆 next to their name
			// and the player choices are shown instead of the circle
			// also add the teams choise
		}

		timeleft -= 2;
	}, 2000);
};

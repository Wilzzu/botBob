const getAIResponse = require("../../utils/getAIResponse");
const {
	guildID,
	mainChannelID,
	lang,
	features: { timeout },
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const {
	EmbedBuilder,
	userMention,
	ButtonBuilder,
	ActionRowBuilder,
	ButtonStyle,
} = require("discord.js");
const validateVoteStart = require("./validateVoteStart");
const updateVote = require("./updateVote");
const getNeededVotes = require("./getNeededVotes");

// Globals
let usersBeingTimedOut = [];
let aiResponses = [];

const createButtons = () => {
	const voteYesButton = new ButtonBuilder()
		.setCustomId("voteYes")
		.setLabel(str[lang].timeout.yesVotes)
		.setStyle(ButtonStyle.Success);

	const voteNoButton = new ButtonBuilder()
		.setCustomId("voteNo")
		.setLabel(str[lang].timeout.noVotes)
		.setStyle(ButtonStyle.Danger);

	return new ActionRowBuilder().addComponents(voteYesButton, voteNoButton);
};

const createEmbed = (user, votesNeeded) => {
	return new EmbedBuilder()
		.setColor("#FF0000")
		.setTitle(
			str[lang].timeout.embedTitle
				.replace("${username}", user?.globalName || user?.username)
				.toUpperCase()
		)
		.setDescription(str[lang].timeout.embedDesc.replace("${timeLeft}", timeout.voteDuration))
		.addFields(
			{
				name: `✅ ${str[lang].timeout.yesVotes}: 0${votesNeeded ? "/" + votesNeeded : ""}`,
				value: "\u200B",
				inline: true,
			},
			{
				name: `❌ ${str[lang].timeout.noVotes}: 0${votesNeeded ? "/" + votesNeeded : ""}`,
				value: "\u200B",
				inline: true,
			}
		)
		.setThumbnail(user.displayAvatarURL());
};

const handleTimeout = async (interaction, user) => {
	// Check if vote should be started
	let validation = validateVoteStart(interaction, user, usersBeingTimedOut);
	if (!validation.valid)
		return await interaction.reply({
			content: validation.reason.replace("${username}", userMention(user.id)),
			ephemeral: validation.ephemeral,
		});

	// Add user to usersBeingTimedOut
	usersBeingTimedOut.push(user?.id);

	// Get the amount of votes needed to instantly end the vote
	let votesNeeded = null;
	if (validation.voiceChannelID)
		votesNeeded = getNeededVotes(interaction, validation.voiceChannelID);

	// Generate new response with AI if needed
	// if (aiResponses.length < usersBeingTimedOut.length)
	// 	aiResponses = await getAIResponse(str[lang].ai.timeout, user.id);

	// Send vote embed
	let message = null;
	if (interaction.channelId === mainChannelID) {
		message = await interaction.reply({
			embeds: [createEmbed(user, votesNeeded)],
			components: [createButtons()],
		});
		if (interaction.type) message = await interaction.fetchReply();
	}
	// If vote wasn't created on the main channel
	else if (interaction.channelId !== mainChannelID) {
		// Create vote embed and send it to main channel
		message = await interaction.client.channels.cache.get(mainChannelID).send({
			content: str[lang].timeout.whoStarted.replace(
				"${username}",
				userMention(interaction.type ? interaction.user.id : interaction.author.id)
			),
			embeds: [createEmbed(user, votesNeeded)],
			components: [createButtons()],
		});

		// Send confirmation message
		await interaction.reply({
			content: str[lang].timeout.startConfirmDiffChannel.replace(
				"${channel}",
				`https://discord.com/channels/${guildID}/${mainChannelID}`
			),
			ephemeral: true,
		});
	}

	// Start collecting votes
	updateVote(interaction, message, user, validation.voiceChannelID, usersBeingTimedOut);
};

module.exports = {
	handleTimeout,
};

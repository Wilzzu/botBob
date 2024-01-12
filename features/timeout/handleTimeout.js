const getAIResponse = require("../../utils/getAIResponse");
const {
	guildID,
	mainChannelID,
	lang,
	features: { timeout },
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const { EmbedBuilder, userMention } = require("discord.js");
const validateVoteStart = require("./validateVoteStart");
const updateVote = require("./updateVote");

// Globals
let usersBeingTimedOut = [];
let timeoutDB = [];
let aiResponses = [];

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
				name: `${str[lang].timeout.yesVotes}: 0${votesNeeded ? "/" + votesNeeded : ""}`,
				value: "\u200B",
				inline: true,
			},
			{
				name: `${str[lang].timeout.noVotes}: 0${votesNeeded ? "/" + votesNeeded : ""}`,
				value: "\u200B",
				inline: true,
			}
		)
		.setThumbnail(user.displayAvatarURL());
};

const handleTimeout = async (interaction, user) => {
	// Check if vote should be started
	let validation = validateVoteStart(interaction, user, usersBeingTimedOut, timeoutDB);
	if (!validation.valid)
		return await interaction.reply({
			content: validation.reason.replace("${username}", userMention(user.id)),
			ephemeral: validation.ephemeral,
		});

	// Add user to usersBeingTimedOut
	usersBeingTimedOut.push(user?.id);

	// Get the amount of votes needed to instantly end the vote
	// TODO: Move this to it's own function file and call it in updateVote using original voiceChannel ID
	let votesNeeded = null;
	if (validation.voiceChannelID) {
		let voiceSize = interaction.guild.channels.cache
			.get(validation.voiceChannelID)
			.members.filter((member) => !member.user.bot).size;
		if (voiceSize % 1 == 0) voiceSize++;
		votesNeeded = voiceSize >= 2 ? Math.ceil(voiceSize / 2) : 2;
	}

	// Generate new response with AI if needed
	// if (aiResponses.length < usersBeingTimedOut.length)
	// 	aiResponses = await getAIResponse(str[lang].ai.timeout, user.id);

	// Send confirmation message
	if (interaction.channelId === mainChannelID && interaction.type)
		await interaction.reply({
			content: str[lang].timeout.startConfirm,
			ephemeral: true,
		});
	else if (interaction.channelId !== mainChannelID)
		await interaction.reply({
			content: str[lang].timeout.startConfirmDiffChannel.replace(
				"${channel}",
				`https://discord.com/channels/${guildID}/${mainChannelID}`
			),
			ephemeral: true,
		});

	// Create vote embed and send it to main channel
	let message = await interaction.client.channels.cache
		.get(mainChannelID)
		.send({ embeds: [createEmbed(user, votesNeeded)] });

	// TODO: Pass identifiers to this
	updateVote(message);
};

module.exports = {
	handleTimeout,
	usersBeingTimedOut,
	timeoutDB,
	aiResponses,
};

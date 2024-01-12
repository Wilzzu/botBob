const getAIResponse = require("../../utils/getAIResponse");
const { guildID, mainChannelID, language } = require("../../configs/config.json");
const strings = require("../../configs/languages.json");
const { EmbedBuilder, userMention } = require("discord.js");
const validateVoteStart = require("./validateVoteStart");

// Globals
let usersBeingTimedOut = [];
let timeoutDB = [];
let aiResponse = null;

const createEmbed = (user) => {
	return new EmbedBuilder()
		.setColor("#FF0000")
		.setTitle(
			strings[language].timeout.embedTitle
				.replace("${username}", user?.globalName || user?.username)
				.toUpperCase()
		)
		.setDescription(strings[language].timeout.embedDesc)
		.setThumbnail(user.displayAvatarURL());
};

module.exports = async function handleTimeout(interaction, user) {
	// Check if vote should be started
	let validation = validateVoteStart(interaction, user, usersBeingTimedOut, timeoutDB);
	if (!validation.valid)
		return await interaction.reply({
			content: validation.reason.replace("${username}", userMention(user.id)),
			ephemeral: validation.ephemeral,
		});

	usersBeingTimedOut.push(user?.id);

	// if (!aiResponse)
	// 	aiResponse = await getAIResponse(
	// 		strings[language].ai.timeout,
	// 		user.id
	// 	);
	// console.log(aiResponse);

	// Send confirmation message
	if (interaction.channelId === mainChannelID && interaction.type)
		await interaction.reply({
			content: strings[language].timeout.startConfirm,
			ephemeral: true,
		});
	else if (interaction.channelId !== mainChannelID)
		await interaction.reply({
			content: strings[language].timeout.startConfirmDiffChannel.replace(
				"${channel}",
				`https://discord.com/channels/${guildID}/${mainChannelID}`
			),
			ephemeral: true,
		});

	// Send vote embed to main channel
	interaction.client.channels.cache.get(mainChannelID).send({ embeds: [createEmbed(user)] });

	// interaction.channel.send({ embeds: [embed] });
};

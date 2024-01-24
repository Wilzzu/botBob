const {
	ButtonStyle,
	ActionRowBuilder,
	ButtonBuilder,
	EmbedBuilder,
	ComponentType,
	ChannelSelectMenuBuilder,
	channelLink,
} = require("discord.js");
const config = require("../configs/config.json");
const str = require("../configs/languages.json");
const fs = require("fs");
const { createDebtEmbed } = require("./debt/modifyDebtEmbed");

// Update config values with new ones
const updateConfigFile = (key, value) => {
	config[key] = value;
	fs.writeFile("./configs/config.json", JSON.stringify(config, null, 4), (err) => {
		if (err) console.log(err);
	});
};

const checkForDebtEmbed = async (guild, channel) => {
	// Check if debt embed already exist on the channel
	if (
		config.embedID &&
		guild.channels.cache.get(channel.id).messages.cache.get(config.debt.embedID)
	)
		return;

	// Create new debt embed
	const newEmbed = await channel.send({ embeds: [await createDebtEmbed(guild)] });
	updateConfigFile("debtEmbedID", newEmbed.id);
};

// Create channel select menu
const channelSelect = (id, helpText) => {
	const channelSelect = new ChannelSelectMenuBuilder()
		.setCustomId(id)
		.setChannelTypes(id === "timeoutChannel" ? "GuildVoice" : "GuildText")
		.setPlaceholder(helpText);
	return new ActionRowBuilder().addComponents(channelSelect);
};

// Create channel setup buttons
const createButton = () => {
	const mainBtn = new ButtonBuilder()
		.setCustomId("mainChannel")
		.setLabel(
			str[config.lang].setup.buttonText.replace("${channel}", str[config.lang].setup.mainChannel)
		)
		.setStyle(config.mainChannelID ? ButtonStyle.Success : ButtonStyle.Secondary)
		.setEmoji("💬");

	const debtBtn = new ButtonBuilder()
		.setCustomId("debtChannel")
		.setLabel(
			str[config.lang].setup.buttonText.replace("${channel}", str[config.lang].setup.debtChannel)
		)
		.setStyle(config.debtChannelID ? ButtonStyle.Success : ButtonStyle.Secondary)
		.setEmoji("💸");

	const timeoutBtn = new ButtonBuilder()
		.setCustomId("timeoutChannel")
		.setLabel(
			str[config.lang].setup.buttonText.replace("${channel}", str[config.lang].setup.timeoutChannel)
		)
		.setStyle(config.timeoutChannelID ? ButtonStyle.Success : ButtonStyle.Secondary)
		.setEmoji("⌛");

	return new ActionRowBuilder().addComponents(mainBtn, debtBtn, timeoutBtn);
};

// Create setup embed
const createEmbed = (client) => {
	// Channel texts
	let main = config.mainChannelID
		? `\n**💬 ${str[config.lang].setup.mainChannel}:** ${channelLink(config.mainChannelID)}`
		: "";
	let debt = config.debtChannelID
		? `\n**💸 ${str[config.lang].setup.debtChannel}:** ${channelLink(config.debtChannelID)}`
		: "";
	let timeout = config.timeoutChannelID
		? `\n**⌛ ${str[config.lang].setup.timeoutChannel}:** ${channelLink(config.timeoutChannelID)}`
		: "";

	// Create embed
	return new EmbedBuilder()
		.setColor("#26FF5B")
		.setTitle(str[config.lang].setup.embedTitle.replace("${username}", client.user.username))
		.setDescription(
			`${str[config.lang].setup.embedDesc.replace(
				"${command}",
				str[config.lang].commands.setup.name
			)}\n${main}${debt}${timeout}`
		)
		.setThumbnail(client.user.displayAvatarURL());
};

module.exports = async function setup(guild, client, command) {
	if (!guild) return console.error("Couldn't get server info");

	// Update guildID in config only when bot joins the server
	if (!command) updateConfigFile("guildID", guild.id);

	// If debt channel is already set and the embed doesn't exist, send a new one
	if (config.debtChannelID && !config.debtEmbedID && !command) {
		const debtChannel = guild.channels.cache.get(config.debtChannelID);
		if (!debtChannel) return console.error("Couldn't find the debt channel!");

		const newEmbed = await debtChannel.send({ embeds: [await createDebtEmbed(client)] });
		updateConfigFile("debtEmbedID", newEmbed.id);
	}

	// Get user who invited the bot
	if (!config.mainAdmin) {
		const fetchedLogs = await guild.fetchAuditLogs();
		const inviter = fetchedLogs.entries.find(
			(entry) => entry.actionType === "Create" && entry.targetId === client.user.id
		)?.executor;
		if (inviter) updateConfigFile("mainAdmin", inviter.id);
	}

	// Send setup message
	let message;
	if (command)
		message = await command.reply({
			embeds: [createEmbed(client)],
			components: [createButton()],
		});
	else {
		// Find the first channel where bot can send messages
		let channel = guild.channels.cache.find(
			(c) => c.type === 0 && c.permissionsFor(guild.members.me).has("SendMessages")
		);
		if (!channel) {
			return console.error("Couldn't find a channel to send the initial setup message to!");
		}
		message = await channel.send({
			embeds: [createEmbed(client)],
			components: [createButton()],
		});
	}

	// Create button collector
	const buttonCollector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
	});

	// Handle button clicks
	buttonCollector.on("collect", async (i) => {
		// Check if user is the one who invited the bot
		if (i.user.id !== config.mainAdmin)
			return await i.reply({ content: str[config.lang].setup.notAuthorized, ephemeral: true });

		// Create channel select menu for the selected button's channel
		const helpText = str[config.lang].setup.channelSelectHelp.replace(
			"${channel}",
			str[config.lang].setup[i.customId]
		);
		const response = await i.update({
			components: [channelSelect(i.customId, helpText)],
		});

		// Handle channel select menu
		const collectorFilter = (c) => c.user.id === i.user.id;
		try {
			const selection = await response.awaitMessageComponent({
				filter: collectorFilter,
				time: 120_000,
			});
			// Update config file with selected channel's ID
			updateConfigFile(i.customId + "ID", selection.channels.first().id);

			// Create new debt embed if there isn't one on the channel already
			if (i.customId === "debtChannel") checkForDebtEmbed(guild, selection.channels.first());

			// Update setup emved with new values and add the buttons back
			await selection.update({
				embeds: [createEmbed(client)],
				components: [createButton()],
			});
		} catch (e) {
			// If user doesn't select a channel in 2 minutes, add the buttons back
			await i.message.edit({
				embeds: [createEmbed(client)],
				components: [createButton()],
			});
		}
	});
};

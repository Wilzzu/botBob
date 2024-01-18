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

const updateConfigFile = (key, value) => {
	config[key] = value;
	fs.writeFile("./configs/config.json", JSON.stringify(config, null, 4), (err) => {
		if (err) console.log(err);
	});
};

const channelSelect = (id, helpText) => {
	const channelSelect = new ChannelSelectMenuBuilder()
		.setCustomId(id)
		.setChannelTypes(id === "timeoutChannel" ? "GuildVoice" : "GuildText")
		.setPlaceholder(helpText);
	return new ActionRowBuilder().addComponents(channelSelect);
};

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
	if (!command) updateConfigFile("guildID", guild.id);

	const fetchedLogs = await guild.fetchAuditLogs();
	const inviter = fetchedLogs.entries.find(
		(entry) => entry.actionType === "Create" && entry.targetId === client.user.id
	).executor;

	let message;
	if (command)
		message = await command.reply({
			embeds: [createEmbed(client)],
			components: [createButton()],
		});
	else {
		let channel = guild.channels.cache.find(
			(c) => c.type === 0 && c.permissionsFor(guild.members.me).has("SendMessages")
		);
		message = await channel.send({
			embeds: [createEmbed(client)],
			components: [createButton()],
		});
	}

	const buttonCollector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
	});

	buttonCollector.on("collect", async (i) => {
		if (i.user.id !== inviter.id)
			return await i.reply({ content: str[config.lang].setup.notAuthorized, ephemeral: true });

		const helpText = str[config.lang].setup.channelSelectHelp.replace(
			"${channel}",
			str[config.lang].setup[i.customId]
		);
		const response = await i.update({
			components: [channelSelect(i.customId, helpText)],
		});

		const collectorFilter = (c) => c.user.id === i.user.id;
		try {
			const selection = await response.awaitMessageComponent({
				filter: collectorFilter,
				time: 120_000,
			});
			updateConfigFile(i.customId + "ID", selection.channels.first().id);
			await selection.update({
				embeds: [createEmbed(client)],
				components: [createButton()],
			});
		} catch (e) {
			await i.message.edit({
				embeds: [createEmbed(client)],
				components: [createButton()],
			});
		}
	});
};

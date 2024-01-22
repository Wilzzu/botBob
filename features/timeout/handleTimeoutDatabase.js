const { EmbedBuilder, userMention } = require("discord.js");
const {
	lang,
	useMongoDB,
	features: { timeout },
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const fs = require("fs");
const { addTimeoutToMongoDB } = require("../../utils/mongoose");
const generateReserveResponses = require("./generateReserveResponses");

// Create new embed for AI response
const createAIEmbed = (message, user, response) => {
	return new EmbedBuilder()
		.setColor("#2B2D31")
		.setAuthor({
			name: message.client.user.username,
			iconURL: message.client.user.displayAvatarURL(),
		})
		.setDescription(
			`**${response
				.replace(/\[username\]/g, userMention(user.id))
				.replace(/\[käyttäjänimi\]/g, userMention(user.id))}**`
		);
};

const sendAIResponse = async (message, user, mainChannelID) => {
	// Read current responses
	let aiResponses = JSON.parse(fs.readFileSync("./databases/aiResponses.json", "utf-8"));

	// Get first response and remove it from the array
	if (!aiResponses?.length) return console.log("No AI responses found");
	const response = aiResponses.shift();

	// Write remaining responses to database
	fs.writeFileSync("./databases/aiResponses.json", JSON.stringify(aiResponses), (err) => {
		if (err) return console.log(err);
	});

	// Send AI response with a little delay
	const mainChannel = message.client.channels.cache.get(mainChannelID);
	mainChannel.sendTyping();
	setTimeout(
		async () => await mainChannel.send({ embeds: [createAIEmbed(message, user, response)] }),
		1500
	);

	// Generate new responses if needed
	generateReserveResponses();
};

const handleTimeoutEnd = (user, message) => {
	let timeoutDb = JSON.parse(fs.readFileSync("./databases/timeoutDb.json", "utf-8"));

	// Give user their roles back
	const member = message.guild.members.cache.get(user.id);
	try {
		member.roles.add(timeoutDb[user.id].roles, str[lang].timeout.rolesAddedBack);
	} catch (error) {
		console.log("Couldn't add user's roles back");
	}

	// Move user back to their previous voice channel
	if (timeoutDb[user.id].lastVoiceChannelId && member.voice.channelId) {
		try {
			member.voice.setChannel(
				message.guild.channels.cache.get(timeoutDb[user.id].lastVoiceChannelId),
				str[lang].timeout.movedUserBackToVc
			);
		} catch (error) {
			console.log("Couldn't move user back to their previous voice channel");
		}
	}

	// Remove user from timeoutDb
	delete timeoutDb[user.id];
	fs.writeFileSync("./databases/timeoutDb.json", JSON.stringify(timeoutDb, null, 4), (err) => {
		if (err) return console.log(err);
	});
};

const updateEmbed = (message, embed, endTime, footer, user) => {
	// Calulate remaining time
	const timeLeft = new Date(endTime + 1000 - Date.now());
	const timeLeftString = `${timeLeft.getMinutes() ? timeLeft.getMinutes() + "m" : ""} ${
		timeLeft.getSeconds() ? timeLeft.getSeconds() + "s" : "0s"
	}`;

	// Create embed with updated time left
	const embedWithFooter = EmbedBuilder.from(embed).setFooter({
		text: footer.replace("${timeLeft}", timeLeftString),
		iconURL: user.displayAvatarURL(),
	});

	// Update embed
	message.edit({ embeds: [embedWithFooter], components: [] });
};

module.exports = function handleTimeoutDatabase(user, message, embed, endTime, mainChannelID) {
	// Update embed
	updateEmbed(message, embed, endTime, str[lang].timeout.timeoutLeft, user);

	// Add user to mongoDB
	if (useMongoDB) {
		let username = user?.globalName || user?.username;
		addTimeoutToMongoDB({
			id: user.id,
			name: username.toUpperCase(),
			avatar: user.displayAvatarURL(),
		});
	}

	// Send AI response
	if (timeout.aiResponses) sendAIResponse(message, user, mainChannelID);

	// Update embed time left every 10 seconds
	const interval = setInterval(() => {
		if (endTime - Date.now() <= 0) clearInterval(interval);
		else updateEmbed(message, embed, endTime, str[lang].timeout.timeoutLeft, user);
	}, 10000);

	setTimeout(() => {
		// Remove user from timeoutDb
		handleTimeoutEnd(user, message);

		// Update embed for the final time
		updateEmbed(message, embed, endTime, str[lang].timeout.timeoutEnded, user);
	}, endTime - Date.now());
};

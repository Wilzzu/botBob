const config = require("./config.json");
const mapsConfig = require("../config.json");
const fs = require("fs");
const db = require("../database/data.json");
const moment = require("moment-timezone");
const {
	Client,
	GatewayIntentBits,
	EmbedBuilder,
	InteractionCollector,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require("discord.js");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
	],
});

client.once("ready", () => {
	console.log("Discord bot ready!");
	client.user.setPresence({ activities: [{ name: "🥪🥪🥪" }] });
});

let usersCreating = [];

const noAction = (type, user) => {
	const noActionEmbed = new EmbedBuilder()
		.setColor("#ff2929")
		.setTitle(`❌ Et ${type} 10 minuutin sisällä!`)
		.setDescription("Lähetä **/ruoka** jos haluat koittaa uudestaan.");

	user.send({ embeds: [noActionEmbed] });
	usersCreating = usersCreating.filter((e) => e != user.id);
};

const commandListener = async (interaction) => {
	const { commandName } = interaction;
	if (commandName == "ruoka") startFood(interaction);
};

const startFood = async (interaction) => {
	const coordsEmbed = new EmbedBuilder()
		.setColor("#c45c1b")
		.setTitle("(1/4) Anna koordinaatit")
		.setDescription(
			'**1.** Liikuta merkki sijaintiisi nettisivulla\n\n**2.** Paina **"Kopio sijainti leikepöydälle"** nappia ja palaa takaisin tähän chättiin.\n\n**3. Liitä kopioitu sijainti chättiin ja lähetä se.**\n_(Esimerkki koordinaatit: 60.1627248|24.9467623)_\n\n**⬇ Hae koordinaattisi painamalla alla olevaa nappia**'
		);

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setURL("https://wilzzu.tech/location.html")
			.setLabel("HAE KOORDINAATIT")
			.setStyle(ButtonStyle.Link)
			.setEmoji("🗺")
	);

	const stopPost = new EmbedBuilder()
		.setColor("#ff2929")
		.setTitle("❌ Oot jo tekemässä postausta?")
		.setDescription(
			"Tee edellinen postaus loppuun, voit peruuttaa postauksen viimeisessä vaiheessa."
		);

	// jos on jo tekemässä
	if (usersCreating.includes(interaction.user.id)) {
		await interaction.reply({ embeds: [stopPost], ephemeral: true });
	} else {
		// jos lähetettii guildi sisältä
		if (interaction.guildId) {
			const dm = await interaction.user.send({
				embeds: [coordsEmbed],
				components: [row],
			});
			const dmChannel = client.channels.cache.get(dm.channelId);
			await interaction.reply({ content: "Checkaa dm ruoan lähettämiseen", ephemeral: true });
			askCoords(interaction.user, dmChannel);
		} else {
			const dmChannel = await interaction.user.createDM();
			await interaction.reply({ embeds: [coordsEmbed], components: [row] });
			askCoords(interaction.user, dmChannel);
		}
	}
};

const askCoords = async (user, dmChannel) => {
	usersCreating.push(user.id);

	const wrongCoordsEmbed = new EmbedBuilder()
		.setColor("#ff2929")
		.setTitle("❌ Koordinaatit ovat väärässä muodossa, yritä uudelleen")
		.setDescription("Koordinaatit tulee olla muodossa: 12.34567**|**123.45678");

	const wrongRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setURL("https://wilzzu.tech/location.html")
			.setLabel("HAE KOORDINAATIT")
			.setStyle(ButtonStyle.Link)
			.setEmoji("🗺")
	);

	let regex = /^-?[0-9]{1,2}[.][0-9]+[|]-?[0-9]{1,3}[.][0-9]+$/g;
	const filter = (m) => m.content.match(regex);
	const collector = dmChannel.createMessageCollector({ filter, time: config.time });

	collector.on("collect", (m) => {
		let lat = m.content.split("|")[0];
		let long = m.content.split("|")[1];
		collector.stop("Found coordinates");
		confirmCoords(user, dmChannel, lat, long);
	});

	collector.on("ignore", (e) => {
		if (!e.author.bot) user.send({ embeds: [wrongCoordsEmbed], components: [wrongRow] });
	});

	collector.on("end", (collected) => {
		if (collected.size == 0) {
			noAction("antanut oikeita koordinaatteja", user);
		}
	});
};

const confirmCoords = async (user, dmChannel, lat, long) => {
	let mapImg = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${long}&zoom=14&size=440x280&markers=icon:https://i.imgur.com/YetYhkI.png%7C${lat},${long}&key=${mapsConfig.apiKey}`;

	const coordsEmbed = new EmbedBuilder()
		.setColor("#c45c1b")
		.setTitle("Onko sijainti oikein?")
		.setImage(mapImg);

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("correctCoords")
			.setLabel("Kyllä")
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder().setCustomId("wrongCoords").setLabel("Ei").setStyle(ButtonStyle.Danger)
	);

	const filter = (i) => true;
	const collector = dmChannel.createMessageComponentCollector({ filter, time: config.time });
	collector.on("collect", async (i) => {
		if (i.customId == "correctCoords") {
			await i.update({ components: [] });
			collector.stop("Correct coords");
			askImg(user, dmChannel, lat, long);
		} else if (i.customId == "wrongCoords") {
			collector.stop("Restart");
			usersCreating = usersCreating.filter((e) => e != user.id);
			startFood(i);
		}
	});

	collector.on("end", (collected) => {
		if (collected.size == 0) {
			noAction("varmistanut sijaintia", user);
		}
	});

	user.send({ embeds: [coordsEmbed], components: [row] });
};

const askImg = (user, dmChannel, lat, long) => {
	const imgEmbed = new EmbedBuilder()
		.setColor("#c45c1b")
		.setTitle("(2/4) Lisää kuva")
		.setDescription("Liitä kuva chättiin ja lähetä se ⬇");

	user.send({ embeds: [imgEmbed] });

	const wrongImg = new EmbedBuilder()
		.setColor("#ff2929")
		.setTitle("❌ Kuvan tiedostomuoto on väärä!")
		.setDescription(
			"Kuvan tulee olla **.JPEG**, **.JPG** tai **.PNG** muodossa.\nYritä lisätä kuva uudelleen ⬇"
		);

	const oneImg = new EmbedBuilder()
		.setColor("#ff2929")
		.setTitle("❌ Lisää vain yksi kuva!")
		.setDescription("Yritä lisätä kuva uudelleen ⬇");

	const noImg = new EmbedBuilder()
		.setColor("#ff2929")
		.setTitle("❌ Et lisännyt kuvaa viestiisi!")
		.setDescription("Yritä lisätä kuva uudelleen ⬇");

	const filter = (m) => m.attachments.size == 1;
	const collector = dmChannel.createMessageCollector({ filter, time: config.time });

	collector.on("collect", (m) => {
		if (!m.author.bot) {
			let pic = m.attachments.entries().next().value[1];
			if (pic.contentType == "image/png" || pic.contentType == "image/jpeg") {
				collector.stop("Found picture");
				askRating(user, dmChannel, lat, long, pic.url);
			} else {
				user.send({ embeds: [wrongImg] });
			}
		}
	});

	collector.on("ignore", (e) => {
		if (!e.author.bot) {
			if (e.attachments.size > 1) {
				user.send({ embeds: [oneImg] });
			} else {
				user.send({ embeds: [noImg] });
			}
		}
	});

	collector.on("end", (collected) => {
		if (collected.size == 0) {
			noAction("lisännyt kuvaa", user);
		}
	});
};

const askRating = (user, dmChannel, lat, long, img) => {
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId("stars0").setLabel("0/5").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("stars1").setLabel("1/5").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("stars2").setLabel("2/5").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("stars3").setLabel("3/5").setStyle(ButtonStyle.Primary),
		new ButtonBuilder().setCustomId("stars4").setLabel("4/5").setStyle(ButtonStyle.Primary)
	);
	const row2 = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId("stars5").setLabel("5/5").setStyle(ButtonStyle.Primary)
	);

	const embed = new EmbedBuilder().setColor("#c45c1b").setTitle("(3/4) Lisää arvostelu");

	const filter = (i) => true;
	const collector = dmChannel.createMessageComponentCollector({ filter, time: config.time });
	collector.on("collect", async (i) => {
		let btnNum = 5;
		switch (i.customId) {
			case "stars0":
				btnNum = 0;
				break;
			case "stars1":
				btnNum = 1;
				break;
			case "stars2":
				btnNum = 2;
				break;
			case "stars3":
				btnNum = 3;
				break;
			case "stars4":
				btnNum = 4;
				break;
		}

		if (btnNum < 5) row.components[btnNum].setStyle(ButtonStyle.Success);
		else row2.components[0].setStyle(ButtonStyle.Success);
		row.components[0].setDisabled(true);
		row.components[1].setDisabled(true);
		row.components[2].setDisabled(true);
		row.components[3].setDisabled(true);
		row.components[4].setDisabled(true);
		row2.components[0].setDisabled(true);

		await i.update({ components: [row, row2] });
		collector.stop("Found rating");
		askConfirm(user, dmChannel, lat, long, img, btnNum);
	});

	collector.on("end", (collected) => {
		if (collected.size == 0) {
			noAction("lisännyt arvostelua", user);
		}
	});

	user.send({ embeds: [embed], components: [row, row2] });
};

const askConfirm = (user, dmChannel, lat, long, img, rating) => {
	const embed = new EmbedBuilder()
		.setColor("#c45c1b")
		.setTitle("(4/4) Postauksen esikatselu:")
		.addFields(
			{ name: "🗺 Sijainti", value: `> Lat: ${lat}, Long: ${long}` },
			{ name: "⭐ Arvostelu", value: `> ${rating}/5` },
			{ name: "\u200B", value: "🖼 **Kuva:**" }
		)
		.setImage(img);

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId("send").setLabel("Lähetä").setStyle(ButtonStyle.Success),
		new ButtonBuilder().setCustomId("stop").setLabel("Peruuta").setStyle(ButtonStyle.Danger)
	);

	// Post send/not send embeds
	const sendEmbed = new EmbedBuilder().setColor("#2bfc35").setTitle("Postaus lähetetty ✅");
	const cancelEmbed = new EmbedBuilder().setColor("#ff2929").setTitle("Postaus peruutettu ❌");

	const filter = (i) => true;
	const collector = dmChannel.createMessageComponentCollector({ filter, time: config.time });
	collector.on("collect", async (i) => {
		if (i.customId == "send") {
			await i.update({ components: [] });
			collector.stop("Added post");
			user.send({ embeds: [sendEmbed] });
			usersCreating = usersCreating.filter((e) => e != user.id);
			sendPost(user, lat, long, img, rating);
		} else {
			await i.update({ components: [] });
			collector.stop("Cancelled post");
			user.send({ embeds: [cancelEmbed] });
			usersCreating = usersCreating.filter((e) => e != user.id);
		}
	});

	collector.on("end", (collected) => {
		if (collected.size == 0) {
			noAction("vahvistanut postausta", user);
		}
	});

	user.send({ embeds: [embed], components: [row] });
};

const sendPost = async (user, lat, long, img, rating) => {
	let curDate = new Date();
	let date = moment(curDate, "DD.MM.YYYY").tz("Europe/Helsinki").format("DD.MM.YYYY");
	let time = moment(curDate, "H:mm").tz("Europe/Helsinki").format("H:mm");

	let stars = "0/5 🥪";
	if (rating > 0) stars = rating + "/5 " + "⭐".repeat(rating);

	const postEmbed = new EmbedBuilder()
		.setColor("#c45c1b")
		.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
		.setTitle(user.username + " lisäsi uuden ruoan! 🔔")
		.setDescription("**" + stars + "**")
		.setImage(img);

	let mapImg = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${long}&zoom=14&size=440x280&markers=icon:https://i.imgur.com/sHAsifS.png%7C${lat},${long}&key=${mapsConfig.apiKey}`;

	const locationEmbed = new EmbedBuilder().setColor("#c45c1b").setImage(mapImg);

	const statsEmbed = new EmbedBuilder().setColor("#c45c1b").setTitle("0 ♥");

	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId("like")
			.setLabel("Tykkää")
			.setStyle(ButtonStyle.Danger)
			.setEmoji("🤍"),
		new ButtonBuilder()
			.setCustomId("comment")
			.setLabel("💬 Kommentoi")
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setLabel("Kartta")
			.setStyle(ButtonStyle.Link)
			.setURL("https://wilzzu.tech/")
			.setEmoji("🗺")
	);

	let msg = await client.channels.cache.get(config.realChannel).send({
		content: "🥪 **UUSI RUOKA** 🥪",
		embeds: [postEmbed, locationEmbed, statsEmbed],
		components: [row],
	});

	addToDB(user, date, time, lat, long, img, stars, msg.id);
};

const addToDB = (user, date, time, lat, long, img, rating, postId) => {
	let index = db.findIndex((e) => e.id == postId);
	if (index == -1) {
		let newPostObject = {
			id: postId,
			content: {
				name: user.username,
				profilePic: user.displayAvatarURL({ dynamic: true }),
				date: date,
				time: time,
				lat: lat,
				long: long,
				pic: img,
				rating: rating,
			},
			likes: {
				amount: 0,
				who: [],
			},
			comments: [],
		};
		db.push(newPostObject);
		fs.writeFileSync("../database/data.json", JSON.stringify(db, null, 2));
	}
};

const likeButtonListener = async (i) => {
	let index = db.findIndex((e) => e.id == i.message.id);
	let likes = db[index].likes;
	// jos on jo tykääny, unlikee
	if (likes.who.includes(i.user.id)) {
		likes.who = likes.who.filter((e) => e !== i.user.id);
		likes.amount--;
		await i.update("🥪 **UUSI RUOKA** 🥪");
	} else {
		likes.amount++;
		likes.who.push(i.user.id);
		await i.update("🥪 **UUSI RUOKA** 🥪");
	}
	fs.writeFileSync("../database/data.json", JSON.stringify(db, null, 2));

	const likeEmbed = EmbedBuilder.from(i.message.embeds[2]);
	likeEmbed.setTitle(likes.amount + " ♥");
	i.message.edit({ embeds: [i.message.embeds[0], i.message.embeds[1], likeEmbed] });
};

const commentButtonListener = async (interaction) => {
	const modal = new ModalBuilder().setCustomId("commentModal").setTitle("Kommentin lisääminen");

	// Create the text input components
	const commentInput = new TextInputBuilder()
		.setCustomId("commentInput")
		.setLabel("Kirjoita kommenttisi:")
		.setStyle(TextInputStyle.Short);

	const commentRow = new ActionRowBuilder().addComponents(commentInput);
	modal.addComponents(commentRow);

	await interaction.showModal(modal);
};

const modalListener = async (interaction) => {
	const modalComment = interaction.fields.getTextInputValue("commentInput");

	let regex = /^(?!.*>)[a-zA-Z0-9äöåÄÖÅ!-?\s]*$/g;
	if (modalComment.match(regex)) {
		await interaction.update("🥪 **UUSI RUOKA** 🥪");
		addComment(interaction.user, modalComment, interaction.message);
	} else
		await interaction.reply({
			content:
				"Kommenttia ei voitu lisätä ❌ Emojit ja osa erikoismerkeistä eivät toimi kommenteissa",
			ephemeral: true,
		});
};

const addComment = (user, comment, message) => {
	const addCommentEmbed = EmbedBuilder.from(message.embeds[2]);
	if (!message.embeds[2].data.description) addCommentEmbed.setDescription("**Kommentit:**");

	addCommentEmbed.addFields({
		name: user.username,
		value: "> " + comment,
	});

	let index = db.findIndex((e) => e.id == message.id);
	let commentObject = {
		name: user.username,
		img: user.displayAvatarURL({ dynamic: true }),
		comment: comment,
	};
	db[index].comments.push(commentObject);
	fs.writeFileSync("../database/data.json", JSON.stringify(db, null, 2));

	message.edit({ embeds: [message.embeds[0], message.embeds[1], addCommentEmbed] });
};

// Interaction listeners
client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand()) commandListener(interaction);
	if (interaction.customId == "like") likeButtonListener(interaction);
	if (interaction.customId == "comment") commentButtonListener(interaction);
	if (interaction.isModalSubmit()) modalListener(interaction);
});

// Delete messages on channel
client.on("messageCreate", async (message) => {
	if (message.channelId == config.realChannel && !message.author.bot) message.delete();
});

client.login(config.realToken);

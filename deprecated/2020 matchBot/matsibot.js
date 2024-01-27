const Discord = require("discord.js");
const config = require("./config.json");
const client = require("./index.js");
const { HLTV } = require("hltv");
const Canvas = require("canvas");
// const getMatchesJSON = require("./getMatches.json");
// const getMatchJSON = require("./getMatchBo3.json");
// const getMatchJSON2 = require("./getMatchBo3Ready.json");
// const getTeamJSON = require("./getTeam2.json");

const { MessageActionRow, MessageButton, MessageAttachment } = require("discord.js");

const getTeamMatches = (teamID, allMatches) => {
	let games = allMatches.filter(
		(e) => (e.team1 && e.team1.id == teamID) || (e.team2 && e.team2.id == teamID)
	);
	if (games.length) allTeamMatches.push({ teamID, games });
};

const getMatch = async (match) => {
	let info = HLTV.getMatch({ id: match.id }).then((res) => {
		return res;
	});
	return info;
	//return getMatchJSON;
};

// const getMatchTest = async (match) => {
// 	return getMatchJSON2;
// };

const getTeam = async (team) => {
	let teamInfo = HLTV.getTeam({ id: team }).then((res) => {
		return res;
	});
	return teamInfo;
	//return getTeamJSON;
};

//let allMatches = getMatchesJSON; // vaan testaamiseen
let allTeamMatches = [];
let liveBuffer = [];
let liveMatches = [];

let matchEmbed = new Discord.MessageEmbed().setColor("#FFF").setTitle("CS:GO MATSIT 🕹");

const getLiveMatches = (matches) => {
	// Nollataan viimeks haetut livet
	let getLive = [];

	// Etitään live matsit ja pistetää arrayhin
	matches.forEach((e) => {
		let foundLive = e.games.filter((game) => game.live);
		if (foundLive.length > 0) getLive.push(foundLive[0]);
	});

	// varmistetaan että matsi on lives
	// jos matsi esiintyy 2 perättäisellä päivityksellä se on lives
	getLive.forEach((e) => {
		if (liveMatches.filter((f) => f.id == e.id).length > 0) return; //jos on jo varmistettu live matsi samalla idllä ei tehä mitää
		if (liveBuffer.filter((f) => f.id == e.id).length > 0) newLive(e); //jos matsi löytyy bufferista
		else liveBuffer.push(e); // jos ei vielä oo varmistusta liveks pistetään venaan toista varmistusta bufferiin
	});

	// Poistetaan kaikki ylimääräset matsit bufferista joita ei löytyny viime haulla
	liveBuffer.filter((e) => e.id == getLive.id);

	console.log("LÖYDETYT LIVET", getLive);
	console.log("BUFFERI", liveBuffer);
	console.log("LIVE MATSIT", liveMatches);

	// etitään tulevat matsit
	// sellaset jotka ei oo livessä
	// ja jaotellaan tiimeittäin
};

const newLive = async (match) => {
	// poistetaan varmistettu matsi bufferista
	liveBuffer = liveBuffer.filter((e) => e.id !== match.id);

	// lisätään se live matsiks
	liveMatches.push(match);

	let info = await getMatch(match);
	let team1Info = await getTeam(match.team1.id);
	let team2Info = await getTeam(match.team2.id);
	let attachment = await createImg(team1Info, team2Info); //image

	let matchURL = getMatchLink(info);

	let matchNoti = new Discord.MessageEmbed()
		.setColor("#FFD700")
		.setTitle(`${match.team1.name} vs ${match.team2.name}`)
		.setURL(matchURL)
		.setAuthor({
			name: "🔔 MATSI ALKAA",
		})
		.setDescription("🏆‎ ‎ ‎ " + match.event.name)
		.setImage("attachment://notification.png");
	// matchNoti.addField("\u200B", "\u200B");
	let maps = getMaps(info);
	matchNoti.addField("🕹‎ ‎ ‎ Best of " + match.format.slice(-1), maps, false);

	let streamLink = null;
	let pelaajatcom = false;
	info.streams.forEach((e) => {
		if (e.name == "HLTV Live") streamLink = e.link;
		if (e.name.toLowerCase() == "pelaajat") pelaajatcom = true;
	});

	const buttons = new MessageActionRow();
	if (streamLink)
		buttons.addComponents(
			new MessageButton()
				.setLabel("Striimi")
				.setURL(`https://www.hltv.org${streamLink}`)
				.setStyle("LINK")
				.setEmoji("📺")
		);
	if (pelaajatcom)
		buttons.addComponents(
			new MessageButton()
				.setLabel("Pelaajatcom striimi")
				.setURL("https://www.twitch.tv/pelaajatcom")
				.setStyle("LINK")
				.setEmoji("🅿")
		);
	buttons.addComponents(
		new MessageButton().setLabel("HLTV").setURL(matchURL).setStyle("LINK").setEmoji("📃")
	);

	let msgID = null;
	// lähetetään ilmotus
	await client.channels.cache
		.get(config.matchChannel)
		.send({ embeds: [matchNoti], components: [buttons], files: [attachment] })
		.then((e) => {
			msgID = e.id;
		});
	updateMaps(info, matchNoti, maps, msgID, 0);
};

const getMatchLink = (match) => {
	let linkRaw = match.team1.name + "-vs-" + match.team2.name + "-" + match.event.name;
	return `https://www.hltv.org/matches/${match.id}/${linkRaw.replace(/\s/g, "-")}`;
};

const createImg = async (team1, team2) => {
	const canvas = Canvas.createCanvas(700, 250);
	const context = canvas.getContext("2d");

	//bg image
	const background = await Canvas.loadImage("./nukebg.png");
	context.drawImage(background, 0, 0, canvas.width, canvas.height);

	// tiimien logot
	let team1Logo = undefined;
	let team2Logo = undefined;
	let defaultImg = "https://www.hltv.org/img/static/team/placeholder.png";

	if (team1.logo) team1Logo = await Canvas.loadImage(team1.logo);
	else team1Logo = await Canvas.loadImage(defaultImg);

	if (team2.logo) team2Logo = await Canvas.loadImage(team2.logo);
	else team2Logo = await Canvas.loadImage(defaultImg);

	// jos g2 nii vaihetaa sen logo parempaa
	if (team1.id == 5995) team1Logo = await Canvas.loadImage("./g2.png");
	if (team2.id == 5995) team2Logo = await Canvas.loadImage("./g2.png");

	// VS teksti
	context.shadowColor = "rgba(0, 0, 0, .5)";
	context.shadowOffsetX = 4;
	context.shadowOffsetY = 6;
	context.shadowBlur = 2;

	context.font = "bold 100px Arial";
	context.textAlign = "center";
	context.fillStyle = "#ffffff";
	context.fillText("vs", canvas.width / 2, canvas.height / 2 + 20);

	// logot
	context.shadowColor = "rgba(0, 0, 0, .7)";
	context.shadowBlur = 7;
	fitImg(canvas, context, team1Logo, 100, 25);
	fitImg(canvas, context, team2Logo, 490, 25);

	// tiimi nimet
	context.shadowColor = "rgba(0, 0, 0, 1)";
	context.shadowBlur = 7;
	context.font = fontSize(canvas, team1.name);
	context.fillText(team1.name, 150, 210);

	context.font = fontSize(canvas, team2.name);
	context.fillText(team2.name, 550, 210);

	// valmis
	const attachment = new MessageAttachment(canvas.toBuffer(), "notification.png");
	return attachment;
};

// kuvien koon muuttaminen
const fitImg = (canvas, context, img, x, y) => {
	var wrh = img.width / img.height;
	var newWidth = canvas.width - 550;
	var newHeight = newWidth / wrh;
	if (newHeight > canvas.height - 125) {
		newHeight = canvas.height - 125;
		newWidth = newHeight * wrh;
	}
	context.drawImage(img, x, y, newWidth, newHeight);
};

// tekstin koon muuttaminen
const fontSize = (canvas, text) => {
	const context = canvas.getContext("2d");
	let size = 50;

	do context.font = `bold ${(size -= 10)}px Arial`;
	while (context.measureText(text).width > canvas.width / 2 - 100);
	return context.font;
};

const getMaps = (match) => {
	let mapsArr = [];
	match.maps.forEach((e, index) => {
		if (e.name == "tba") mapsArr.push("***TBA***");
		else
			mapsArr.push(
				`${index + 1}. **${e.name.slice(3).charAt(0).toUpperCase() + e.name.slice(3).slice(1)}**`
			);
	});
	return "🗺‎ ‎ ‎ " + mapsArr.join(" / ");
};

const updateMaps = async (match, embed, maps, msgID, updateCount) => {
	let mapsArr = [];
	match.maps.forEach((e, index) => {
		if (e.name == "tba") mapsArr.push("***TBA***");
		else
			mapsArr.push(
				`${index + 1}. **${e.name.slice(3).charAt(0).toUpperCase() + e.name.slice(3).slice(1)}**`
			);
	});
	let final = "🗺‎ ‎ ‎ " + mapsArr.join(" / ");

	let newEmbed;
	if (final !== maps) {
		embed.fields[0].value = final;
		let msg = await client.channels.cache.get(config.matchChannel).messages.fetch(msgID);
		msg.edit({
			embeds: [embed],
		});
	} else {
		newEmbed = embed;
	}
	console.log(updateCount);
	if (final.includes("***TBA***") && updateCount <= 30) {
		setTimeout(async () => {
			let updatedMatch = await getMatch(match.id);
			updateMaps(updatedMatch, newEmbed, final, msgID, updateCount + 1);
		}, 1000 * config.updateFreq);
	}
};

// haetaan kaikki matsit
const getAllMatches = () => {
	HLTV.getMatches().then((res) => {
		// nollataan matsit
		allTeamMatches = [];

		//etitään tiimien matsit päivitetystä jsonista
		config.teams.forEach((e) => getTeamMatches(e.id, res));
		console.log(allTeamMatches);

		// etitää live matsit
		getLiveMatches(allTeamMatches);

		// kato onks matsi loppunu

		// getUpcomingMatches()
	});
};
/*
//testejä varten

allTeamMatches = [];

//etitään tiimien matsit päivitetystä jsonista
config.teams.forEach((e) => getTeamMatches(e.id, getMatchesJSON));
console.log(allTeamMatches);

setTimeout(() => {
	getLiveMatches(allTeamMatches);
}, 2000);
setTimeout(() => {
	getLiveMatches(allTeamMatches);
}, 2000);

setTimeout(() => {
	getLiveMatches(allTeamMatches);
}, 1000 * 5);
*/
const createEmbed = (embed, upcoming, live) => {
	if (live.length > 0) {
		embed.addField("KÄYNNISSÄ OLEVAT MATSIT 🔴", "```asciidoc\n```", false);
	}
	if (upcoming.length > 0) {
		embed.addField("\u200B", "TULEVAT MATSIT 🕒", false);
	}
};

client.on("ready", () => {
	console.log("Matsit ready");
	getAllMatches();
	setInterval(() => {
		getAllMatches();
	}, 1000 * config.updateFreq);
});

client.on("messageCreate", async (message) => {
	//Commandit käytettävissä vaa Testing kanavalla
	if (message.content.startsWith(config.prefix) && message.channelId == 965721512810400326) {
		let args = message.content.toLowerCase().substring(config.prefix.length).split(" ");
		switch (args[0]) {
			case "sendMatch":
				client.channels.cache.get(config.matchChannel).send({ embeds: [matchEmbed] });
				break;

			case "update":
				getAllMatches();
				client.channels.cache
					.get(config.matchChannel)
					.messages.fetch(config.matchTestMsg)
					.then((msg) => msg.edit({ embeds: [updatedMatchEmbed] }))
					.catch((error) => {
						console.log("Something went wrong when fetching the message: ", error);
					});
				break;
		}
	}
	//Poista muiden viestit
	//else if (message.channelId == config.matchChannel && !message.author.bot) {
	//	setTimeout(() => {
	//		message.delete();
	//	}, 150);
	//}
});

client.login(config.token);

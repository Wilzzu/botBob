const Discord = require("discord.js");
const config = require("./config.json");
const client = require("./index.js");
const { MessageAttachment } = require("discord.js");
let cron = require("node-cron");

const swim = require("./tjfiles/swim.json");
const digimon = require("./tjfiles/digimonit.json");
const pokemon = require("./tjfiles/pokemonit.json");
const stats = require("./tjfiles/stats.json");
const Canvas = require("canvas");
const axios = require("axios");
const fs = require("fs");

//let getProfilePic = async () => {
//	let wergiID = await client.users.fetch("258957239077830656");
//	return wergiID.displayAvatarURL();
//};

client.on("ready", () => {
	console.log("TJ ready");
	// Send TJ embed every day at 6 AM
	cron.schedule(stats.crontab, () => {
		let atm = new Date().getTime();
		let endDate = new Date(stats.endDate).getTime();
		let timeleft = endDate - atm;
		let days = Math.floor(timeleft / (1000 * 60 * 60 * 24));
		console.log("DAYS: " + days);
		stats.daysLeft = days;
		newDay();
	});
});

const newDay = () => {
	stats.daysGone++;
	console.log("DAYS GONE: " + stats.daysGone);

	// Calculate salary
	if (stats.daysGone == 1) {
		stats.moneyMade = 0;
	} else if (stats.daysGone < stats.firstRaise) {
		stats.moneyMade += stats.firstSalary;
	} else if (stats.daysGone > stats.firstRaise && stats.daysGone < stats.secondRaise) {
		stats.moneyMade += stats.secondSalary;
	} else {
		stats.moneyMade += stats.thirdSalary;
	}
	stats.moneyMade = Math.round(stats.moneyMade * 10) / 10;

	// Save stats and create new embed
	fs.writeFileSync("./tjfiles/stats.json", JSON.stringify(stats, null, 2));
	if (stats.daysLeft !== 0) {
		newEmbed();
	} else {
		tjZero();
	}
};

const newEmbed = async () => {
	// Create title and image
	let title = "TJ: ";
	if (stats.daysGone !== 1) {
		let wergi = await getName();
		title = stats.rank + " " + wergi + " TJ: ";
	} else {
		title = "AAMUJA MONNILLE :D:DD TJ: ";
	}
	let pd = undefined;
	let tj = await tjImg();

	// Create base embed
	const tjEmbed = new Discord.MessageEmbed()
		.setColor("#9CB933")
		.setTitle(title + stats.daysLeft)
		.setThumbnail("attachment://tj.png")
		.addFields(
			{ name: "Päivän sää:", value: await getWeather() },
			{ name: "Päivärahaa tienattu:", value: "💵 " + stats.moneyMade + "€" },
			{
				name: "Päivän uinti ennätys `#" + stats.daysLeft + "`:",
				value: getSwim(),
			}
		);

	// Create todays pokemon/digimon based on days left
	if (stats.daysLeft > 150) {
		pd = await digimonImg();
		tjEmbed.addField(
			"Päivän Digimon:",
			"`#" + stats.daysLeft + "` " + digimon.all[stats.daysLeft - 1].name
		);
		tjEmbed.setImage("attachment://pd.png");
	} else {
		pd = await pokemonImg();
		tjEmbed.addFields(
			{
				name: "Päivän Pokémon:",
				value: "`#" + stats.daysLeft + "` " + pokemon.all[stats.daysLeft - 1].name,
				inline: true,
			},
			{ name: "\u200B", value: "\u200B", inline: true },
			{
				name: "Päivän Digimon:",
				value: "`#" + stats.daysLeft + "` " + digimon.all[stats.daysLeft - 1].name,
				inline: true,
			}
		);
		tjEmbed.setImage("attachment://pd.png");
	}

	// Send embed
	await client.channels.cache.get(config.tjCh).send({ embeds: [tjEmbed], files: [tj, pd] });
};

const getName = async () => {
	let guild = client.guilds.cache.get(config.tjGuild);
	let member = guild.members.cache.get(config.tjMember);
	let nickname = member ? member.displayName.toUpperCase() + "N" : "WÖÖNÖIN";
	return nickname;
};

// Create time left image
const tjImg = async () => {
	const canvas = Canvas.createCanvas(250, 250);
	const context = canvas.getContext("2d");

	const background = await Canvas.loadImage("./tjfiles/wergiblur.png");
	context.drawImage(background, 0, 0, canvas.width, canvas.height);

	context.shadowColor = "rgba(0, 0, 0, .5)";
	context.shadowOffsetX = 4;
	context.shadowOffsetY = 6;
	context.shadowBlur = 2;

	context.font = "bold 140px Arial";
	context.textAlign = "center";
	context.fillStyle = "#ffffff";
	context.fillText(stats.daysLeft, canvas.width / 2, canvas.height / 2 + 50);

	const attachment = new MessageAttachment(canvas.toBuffer(), "tj.png");
	return attachment;
};

// Resize image to fit canvas
const fitImg = (canvas, context, img, x, y) => {
	var wrh = img.width / img.height;
	var newWidth = canvas.width;
	var newHeight = newWidth / wrh;
	if (newHeight > canvas.height) {
		newHeight = canvas.height;
		newWidth = newHeight * wrh;
	}
	context.drawImage(img, x, y, newWidth, newHeight);
};

// Create digimon image
const digimonImg = async () => {
	const canvas = Canvas.createCanvas(450, 120);
	const context = canvas.getContext("2d");

	context.fillStyle = "#36393F";
	context.fillRect(0, 0, 120, 120);
	let getDig = digimon.all[stats.daysLeft - 1].img;
	const digimonImg = await Canvas.loadImage(getDig);

	fitImg(canvas, context, digimonImg, 0, 0);

	const attachment = new MessageAttachment(canvas.toBuffer(), "pd.png");
	return attachment;
};

// Create pokemon image
const pokemonImg = async () => {
	const canvas = Canvas.createCanvas(450, 120);
	const context = canvas.getContext("2d");

	context.fillStyle = "#36393F";
	context.fillRect(0, 0, 120, 120);
	let getPok = pokemon.all[stats.daysLeft - 1].img;
	const pokemonImg = await Canvas.loadImage(getPok);

	context.fillRect(200, 0, 120, 120);
	let getDig = digimon.all[stats.daysLeft - 1].img;
	const digimonImg = await Canvas.loadImage(getDig);

	fitImg(canvas, context, pokemonImg, 0, 0);
	fitImg(canvas, context, digimonImg, 200, 0);

	const attachment = new MessageAttachment(canvas.toBuffer(), "pd.png");
	return attachment;
};

const getWeather = async () => {
	let today = new Date();
	let wDay = today.toISOString().split("T")[0];
	console.log(wDay);
	return axios
		.get(
			`https://api.weatherapi.com/v1/forecast.json?key=${stats.apiKey}&q=${stats.coords}&days=1&dt=${wDay}`
		)
		.then((response) => {
			let forecast = response.data.forecast.forecastday[0];
			let code = forecast.day.condition.code;
			let desc = "Ei löytyny säätietoja :(";
			let emoji = "";

			// Parse weather codes to description and emoji
			switch (code) {
				case 1000:
					desc = "Aurinkoista";
					emoji = "🌞";
					break;

				case 1003:
					desc = "Puolipilvistä";
					emoji = "🌤";
					break;

				case 1006:
					desc = "Pilvistä";
					emoji = "☁";
					break;

				case 1009:
					desc = "Pilvistä";
					emoji = "☁";
					break;

				case 1030:
					desc = "Sumuista";
					emoji = "🌫";
					break;

				case 1063:
					desc = "Hajanaista sadetta";
					emoji = "🌧";
					break;

				case 1066:
					desc = "Hajanaista lumisadetta";
					emoji = "🌨";
					break;

				case 1069:
					desc = "Hajanaista räntäsadetta";
					emoji = "🌨";
					break;

				case 1072:
					desc = "Hajanaista jäätävä tihkusadetta";
					emoji = "🥶🌧";
					break;

				case 1087:
					desc = "Hajanaista ukkosta";
					emoji = "🌩";
					break;

				case 1114:
					desc = "Todella rankkaa lumisadetta";
					emoji = "🌨🌨🌨";
					break;

				case 1117:
					desc = "Lumimyrsky";
					emoji = "❄🌪";
					break;

				case 1135:
					desc = "Sumuista";
					emoji = "🌫";
					break;

				case 1147:
					desc = "Jäätävää sumua";
					emoji = "🥶🌫";
					break;

				case 1150:
					desc = "Hajanaisia sadekuuroja";
					emoji = "☔";
					break;

				case 1153:
					desc = "Tihkusadetta";
					emoji = "🌧";
					break;

				case 1168:
					desc = "Jäätävää tihkusadetta";
					emoji = "🥶🌧";
					break;

				case 1171:
					desc = "Jäätävää sadetta";
					emoji = "🥶🌧";
					break;
				case 1180:
					desc = "Sadekuuroja";
					emoji = "🌧";
					break;
				case 1183:
					desc = "Kevyttä sadetta";
					emoji = "🌧";
					break;
				case 1186:
					desc = "Sadekuuroja";
					emoji = "🌧";
					break;
				case 1189:
					desc = "Sadetta";
					emoji = "🌧";
					break;
				case 1192:
					desc = "Rankkasadetta ajoittain";
					emoji = "🌧🌧";
					break;
				case 1195:
					desc = "Rankkasadetta";
					emoji = "🌧🌧";
					break;
				case 1198:
					desc = "Jäätävää sadetta";
					emoji = "🥶🌧";
					break;
				case 1201:
					desc = "Jäätävää sadetta";
					emoji = "🥶🌧";
					break;
				case 1204:
					desc = "Kevyttä räntäsadetta";
					emoji = "🌧";
					break;
				case 1207:
					desc = "Räntäsadetta";
					emoji = "🌧";
					break;
				case 1210:
					desc = "Hajanaista lumisadetta";
					emoji = "🌨";
					break;
				case 1213:
					desc = "Kevyttä lumisadetta";
					emoji = "🌨";
					break;
				case 1216:
					desc = "Hajanaista lumisadetta";
					emoji = "🌨";
					break;
				case 1219:
					desc = "Lumisadetta";
					emoji = "🌨";
					break;
				case 1222:
					desc = "Hajanaista lumisadetta";
					emoji = "🌨";
					break;
				case 1225:
					desc = "Todella paljon lunta";
					emoji = "🌨🌨";
					break;
				case 1237:
					desc = "Jäätävää sadetta";
					emoji = "🥶🌧";
					break;
				case 1240:
					desc = "Kevyitä sadekuuroja";
					emoji = "🌧";
					break;
				case 1243:
					desc = "Sadekuuroja";
					emoji = "🌧";
					break;
				case 1246:
					desc = "Rankkasadetta";
					emoji = "🌧🌧";
					break;
				case 1249:
					desc = "Räntäsadekuuroja";
					emoji = "🌧";
					break;
				case 1252:
					desc = "Räntäsadekuuroja";
					emoji = "🌧";
					break;
				case 1255:
					desc = "Kevyitä lumisadekuuroja";
					emoji = "🌨";
					break;
				case 1258:
					desc = "lumisadekuuroja";
					emoji = "🌨";
					break;
				case 1261:
					desc = "Jäätävää sadetta";
					emoji = "🥶🌧";
					break;
				case 1264:
					desc = "Jäätävää sadetta";
					emoji = "🥶🌧";
					break;
				case 1273:
					desc = "Ukkoskuuroja";
					emoji = "⛈";
					break;
				case 1276:
					desc = "Rankkoja ukkoskuuroja";
					emoji = "⛈⛈";
					break;
				case 1279:
					desc = "Ukkoskuuroja w/ lumi";
					emoji = "⛈❄";
					break;
				case 1282:
					desc = "Rankkoja ukkoskuuroja w/ lumi";
					emoji = "⛈❄⛈";
					break;
			}

			let temps = [];
			for (i = 10; i < 21; i++) {
				temps.push(forecast.hour[i].temp_c);
			}
			let average = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) + "°C";
			console.log(desc);
			console.log(average);
			return emoji + " " + average + ", " + desc;
		})
		.catch((error) => {
			console.log(error);
			return "Ei löytyny säätietoja :(";
		});
};

// Get swim record
const getSwim = () => {
	let rec = swim.all[stats.daysLeft];
	let text = `🙋‍♂️**${rec.swimmer}** 🏊‍♂️${rec.type}\n🕒**${rec.time}** 📆${rec.date} 🏆${rec.tournament}`;
	return text;
};

// Send celebratory embed when TJ is 0
const tjZero = async () => {
	let title = "HERRA WERGIN TJ: 0 🥳";
	let wergi = await getName();
	title = "🥳🥳 " + stats.rank + " " + wergi + " TJ: 0!!!! 🥳🥳";

	let tj = await tjImg();

	const tjZeroEmbed = new Discord.MessageEmbed()
		.setColor("#9CB933")
		.setTitle(title)
		.setThumbnail("attachment://tj.png")
		.addFields(
			{ name: "Päivän sää:", value: await getWeather() },
			{ name: "Päivärahaa tienattu:", value: "💵 " + stats.moneyMade + "€" }
		)
		.setImage(
			"https://www.shutterstock.com/image-vector/party-popper-emoji-icon-confetti-600nw-1934009609.jpg"
		);

	await client.channels.cache.get(config.tjCh).send({ embeds: [tjZeroEmbed], files: [tj] });
};

client.login(config.token);

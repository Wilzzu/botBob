const { ActivityType } = require("discord.js");
const {
	lang,
	features: { activity },
} = require("../configs/config.json");
const str = require("../configs/languages.json");

const mapTypes = {
	Playing: ActivityType.Playing,
	Watching: ActivityType.Watching,
	Listening: ActivityType.Listening,
	Competing: ActivityType.Competing,
};

const setNewActivity = (client) => {
	const availableTypes = Object.keys(str[lang].activities);
	const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
	const selected = str[lang].activities[type];

	client.user.setActivity(selected[Math.floor(Math.random() * selected.length)], {
		type: mapTypes[type],
	});
};

module.exports = function (client) {
	setNewActivity(client);

	setInterval(() => {
		setNewActivity(client);
	}, activity.interval);
};

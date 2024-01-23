const { ActivityType } = require("discord.js");
const {
	features: { activity },
} = require("../configs/config.json");

const mapTypes = {
	Playing: ActivityType.Playing,
	Watching: ActivityType.Watching,
	Listening: ActivityType.Listening,
	Competing: ActivityType.Competing,
};

const setNewActivity = (client) => {
	const types = Object.keys(activity.activities);
	const selectedType = types[Math.floor(Math.random() * types.length)];
	const activities = activity.activities[selectedType];

	client.user.setActivity(activities[Math.floor(Math.random() * activities.length)], {
		type: mapTypes[selectedType],
	});
};

module.exports = function (client) {
	setNewActivity(client);

	setInterval(() => {
		setNewActivity(client);
	}, activity.interval);
};

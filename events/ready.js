const { Events } = require("discord.js");
const {
	useMongoDB,
	features: { timeout },
} = require("../configs/config.json");
const { connectMongoose } = require("../utils/mongoose");
const generateReserveResponses = require("../features/timeout/generateReserveResponses");
const setActivity = require("../features/setActivity");
const startWeather = require("../features/weather/weather");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		if (useMongoDB) connectMongoose();
		if (timeout.aiResponses) generateReserveResponses();
		setActivity(client);
		startWeather(client);
	},
};

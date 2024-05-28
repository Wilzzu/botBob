const { Events } = require("discord.js");
const {
	useMongoDB,
	features: { timeout, weather },
} = require("../configs/config.json");
const { connectMongoose } = require("../utils/mongoose");
const generateReserveResponses = require("../features/timeout/generateReserveResponses");
const startWeatherNews = require("../features/weather/weatherNews");
const startWeatherWarnings = require("../features/weather/weatherWarnings");
const setActivity = require("../features/setActivity");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		if (useMongoDB) connectMongoose();
		if (timeout.aiResponses) generateReserveResponses();
		if (weather.enableNews) startWeatherNews(client);
		if (weather.enableWarnings) startWeatherWarnings(client);
		setActivity(client);
	},
};

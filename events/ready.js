const { Events } = require("discord.js");
const {
	useMongoDB,
	features: { timeout, weather, clips },
} = require("../configs/config.json");
const { connectMongoose } = require("../utils/mongoose");
const generateReserveResponses = require("../features/timeout/generateReserveResponses");
const startWeatherNews = require("../features/weather/weatherNews");
const startWeatherWarnings = require("../features/weather/weatherWarnings");
const startClips = require("../features/clips/clips");
const setActivity = require("../features/setActivity");
const addOldClipsToForum = require("../utils/addOldClipsToForum");

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		if (useMongoDB) connectMongoose();
		if (timeout.aiResponses) generateReserveResponses();
		if (weather.enableNews) startWeatherNews(client);
		if (weather.enableWarnings) startWeatherWarnings(client);
		if (clips.enableClips) startClips(client);
		if (clips.addOldClips) addOldClipsToForum(client);
		setActivity(client);
	},
};

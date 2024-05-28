const axios = require("axios");
const moment = require("moment-timezone");
const { lang, mainChannelID, weather } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const { EmbedBuilder, roleMention } = require("discord.js");

const weatherGroup = {
	thunder: [200, 201, 202, 210, 211, 212, 221, 230, 231, 232],
	rain: [500, 501, 502, 503, 504, 511, 520, 521, 522, 531],
};
let lastWeatherGroup = null;
let clearTimer = null;

const getRoundedUTCTime = () => {
	let date = new Date();
	let minutes = date.getUTCMinutes();
	minutes = minutes <= 3 ? 55 : minutes - 3; // Subtract 3 minutes to give time for the image to update

	// Calculate rounded down minutes
	let roundedMinutes = Math.floor(minutes / 5) * 5;
	date.setUTCMinutes(roundedMinutes);
	return moment.utc(date).format("YYYYMMDDHHmm");
};

const getObservationImage = () => {
	const time = getRoundedUTCTime();
	return `https://cdn.fmi.fi/weather-observations/products/radar-tiles/station_${weather.observationStationID}/fi/${time}_${weather.observationStationID}.png`;
};

const sendNotification = async (clearTime) => {
	const isThunder = lastWeatherGroup === "thunder";

	// Create embed
	const embed = new EmbedBuilder()
		.setColor(isThunder ? "#DA3633" : "#EA9D04")
		.setDescription(
			isThunder
				? str[lang].weather.warningTitleThunder + "\n" + str[lang].weather.warningDescThunder
				: str[lang].weather.warningTitleRain + "\n" + str[lang].weather.warningDescRain
		)
		.setImage(getObservationImage())
		.setThumbnail(
			isThunder
				? "https://cdn-icons-png.freepik.com/512/4413/4413343.png"
				: "https://cdn-icons-png.freepik.com/512/3262/3262915.png"
		)
		.setTimestamp();

	// Send embed
	const mainChannel = client.channels.cache.get(mainChannelID);
	await mainChannel.send({ content: roleMention(weather.weatherRoleID), embeds: [embed] });

	// Clear the notification after the clear time
	if (clearTimer) clearTimeout(clearTimer);
	clearTimer = setTimeout(() => {
		lastWeatherGroup = null;
		console.log("Cleared notification!");
	}, clearTime - Date.now());
};

const validateWeather = (weather) => {
	// If the bad weather is not in the next 30 minutes
	if (!weather || Date.now() + 1800000 < weather.timestamp) return false;

	// Find what group the bad weather belongs to
	const badWeatherGroup = Object.keys(weatherGroup).find((e) =>
		weatherGroup[e].includes(weather.weather)
	);
	if (!badWeatherGroup) return false;

	// If the bad weather is the same as the last one
	if (lastWeatherGroup === badWeatherGroup) return false;

	// If the bad weather is rain after thunder
	if (lastWeatherGroup === "thunder" && badWeatherGroup === "rain") return false;

	// The weather is valid
	// Set the last bad weather group
	lastWeatherGroup = badWeatherGroup;
	return true;
};

async function fetchWeather() {
	// Fetch weather data
	const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${weather.lat}&lon=${weather.lon}&exclude=minutely,daily,current,alerts&units=${weather.units}&lang=fi&appid=${process.env.OPEN_WEATHER_API_KEY}`;
	const data = await axios
		.get(url)
		.then((response) => {
			return response.data;
		})
		.catch((error) => {
			console.error(error);
			return null;
		});

	if (!data) return;

	// Simplify the data
	const simpleData = data.hourly.map((e) => {
		return {
			timestamp: e.dt * 1000,
			weather: e.weather[0].id,
		};
	});

	// Find the next bad weather
	const foundBadWeather = simpleData?.find((e) => e.weather < 700 && e.timestamp > Date.now());

	// Return if no bad weather found or it's invalid
	if (!validateWeather(foundBadWeather)) {
		console.log(foundBadWeather);
		console.log("No bad weather found or it's invalid");
		return;
	}

	// Find the next time when the weather is not bad
	const nextGoodWeather = simpleData.find(
		(e) => e.weather >= 800 && e.timestamp > foundBadWeather.timestamp
	);

	let clearTime = nextGoodWeather?.timestamp || Date.now() + 36000000; // Always clear at least after 10 hours
	sendNotification(clearTime);
}

const startWeatherWarning = (bot) => {
	console.log("Weather Warning online!");
	client = bot;
	fetchWeather();
	setInterval(() => fetchWeather(), 1000 * 60 * 5);
};

module.exports = startWeatherWarning;

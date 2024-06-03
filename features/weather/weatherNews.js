const axios = require("axios");
const cheerio = require("cheerio");
const { default: OpenAI } = require("openai");
const {
	lang,
	mainChannelID,
	openAI: openAISettings,
	features: { weather },
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");

const openai = new OpenAI();
let currentId = weather.lastNewsId;
let client = null;

const sendMessage = async (content, link) => {
	const mainChannel = client.channels.cache.get(mainChannelID);
	await mainChannel.send(`${content} ${link}`);
};

const generateSummary = async (content, link) => {
	const completion = await openai.chat.completions.create({
		messages: [
			{
				role: "system",
				content:
					"You are a helpful assistant designed to create a chat message and output it as a JSON.",
			},
			{ role: "user", content: `${str[lang].ai.weather} ${content.substring(0, 1400)}` },
		],
		model: openAISettings.model,
		response_format: { type: "json_object" },
		max_tokens: 3000,
	});
	if (!completion?.choices[0]?.message?.content) return console.log("No content");
	const summary = JSON.parse(completion.choices[0].message.content);
	sendMessage(summary[Object.keys(summary)[0]], link);
};

const getContent = async (id) => {
	const link = `https://www.iltalehti.fi/saauutiset/a/${id}`;
	await axios
		.get(link)
		.then((response) => {
			const $ = cheerio.load(response.data);
			const content = $(".article-body").clone();
			content
				.find(".related-article, .aside-container, .caption-text, .media-source, a:last-child")
				.remove();
			parsedContent = content.text().replace(/\.+/g, ".");
			generateSummary(parsedContent, link);
		})
		.catch((error) => {
			console.error(`Error fetching weather data: ${error}`);
		});
};

const getArticles = async () => {
	await axios
		.get("https://api.il.fi/v1/articles/iltalehti/lists/latest?limit=1&categories%5B%5D=saauutiset")
		.then((response) => {
			const newId = response.data.response[0].article_id;
			if (newId === currentId) return;
			console.log("New article: ", newId);
			getContent(newId);
			currentId = newId;
		})
		.catch((error) => {
			console.error(`Error fetching weather data: ${error}`);
		});
};

const startWeatherNews = (bot) => {
	console.log("Weather News online!");
	client = bot;
	getArticles();
	setInterval(() => getArticles(), 1000 * 60);
};

module.exports = startWeatherNews;

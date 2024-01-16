const axios = require("axios");
const { rapidAPI } = require("../configs/config.json");
const { userMention } = require("discord.js");

module.exports = async function getAIResponse(prompt, id) {
	const options = {
		method: "POST",
		url: rapidAPI.url,
		headers: {
			"content-type": "application/json",
			"X-RapidAPI-Key": process.env.RAPID_API_KEY,
			"X-RapidAPI-Host": rapidAPI.host,
		},
		data: { query: prompt },
	};

	try {
		const response = await axios.request(options);
		let message = response.data.response;
		console.log(message);
		// Replace [username] with mention of user
		message = message.replace(/\[username\]/g, userMention(id));
		// Remove "AI: " and quotes from message
		// message = message.replace(/^AI: /, "");
		message = message.replace(/^"|"$/g, "");

		return message;
	} catch (error) {
		console.error(error);
		return false;
	}
};

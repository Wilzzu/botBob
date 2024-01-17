const axios = require("axios");
const { rapidAPI } = require("../configs/config.json");

// Get AI response from RapidAPI and return it as a string
module.exports = async function getAIResponse(prompt) {
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
		return message.replace(/^"|"$/g, "");
	} catch (error) {
		console.error(error);
		return false;
	}
};

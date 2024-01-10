const getAIResponse = require("../utils/getAIResponse");
const { language } = require("../configs/config.json");
const strings = require("../configs/languages.json");

let aiResponse = null;

const createEmbed = () => {
	// TODO: Create embed
};

module.exports = async function handleTimeout(interaction, user) {
	// if (!aiResponse)
	// 	aiResponse = await getAIResponse(
	// 		strings[language].ai.timeout,
	// 		user?.globalName || user?.username
	// 	);
	// console.log(aiResponse);

	let embed = createEmbed();
	// interaction.channel.send({ embeds: [embed] });
};

// Deprecated 2023

const Discord = require("discord.js");
const config = require("./config.json");
const client = require("./index.js");
const axios = require("axios");

let lastId = "42a00db0-8878-4bc4-a736-fd7de9a0a9a5";
let lastMTV =
	"/artikkeli/talta-nayttaa-viikonlopun-saa-tuskaan-voi-laittaa-mustaa-jatesakkia-paalle/8729374";

client.on("ready", () => {
	console.log("SääBot ready");
	getILWeather();
	getMTVWeather();
	const checkWeather = setInterval(() => {
		getILWeather();
		getMTVWeather();
	}, 60000);

	const timeCheck = setInterval(() => {
		let date = new Date();
		if (date.getTime() > 1688158810000) {
			clearInterval(checkWeather);
			clearInterval(timeCheck);
			sendFarewell();
		}
	}, 1000);
});

const getILWeather = async () => {
	axios
		.get("https://api.il.fi/v1/articles/iltalehti/lists/latest?limit=1&categories[]=saauutiset")
		.then((res) => {
			const id = res.data.response[0].article_id;
			if (id === lastId) return;
			console.log("New weather news ID: ", id);
			lastId = id;

			client.channels.cache
				.get(config.weatherId)
				.send("https://www.iltalehti.fi/saauutiset/a/" + res.data.response[0].article_id);
		});
};

const getMTVWeather = async () => {
	axios
		.get(
			"https://www.mtvuutiset.fi/api/fragment/html/8559922?offset=0&layout=long_tile_list_with_load_more&topicTaxonomyID=7048932"
		)
		.then((res) => {
			// Check for specific tags and attributes in the response
			// Get the href value and check if it's new
			// Send the weather news link to the discord channel
			const h3StartIndex = res.data.indexOf("<h3");
			if (h3StartIndex !== -1) {
				const aStartIndex = res.data.lastIndexOf("<a", h3StartIndex);

				if (aStartIndex !== -1) {
					const hrefStartIndex = res.data.indexOf('href="', aStartIndex);

					if (hrefStartIndex !== -1) {
						const hrefEndIndex = res.data.indexOf('"', hrefStartIndex + 6);

						if (hrefEndIndex !== -1) {
							// Get the href value
							const hrefValue = res.data.substring(hrefStartIndex + 6, hrefEndIndex);

							if (lastMTV == hrefValue) return;
							console.log("New weather news link: ", hrefValue);
							lastMTV = hrefValue;

							client.channels.cache
								.get(config.weatherId)
								.send("https://www.mtvuutiset.fi" + hrefValue);
						}
					}
				}
			}
		});
};

const sendFarewell = () => {
	client.channels.cache
		.get(config.weatherId)
		.send(
			"# SÄÄBOTTI ILMOITUS\n### Keskeytämme kesän sääilmoituspalvelumme välittömästi, koska kesä on päättynyt. Kiitämme tuestanne ja odotamme innolla palvelumme tarjoamista jälleen ensi kesänä!\nhttps://www.youtube.com/watch?v=ecE2Wrzqozg"
		);
};

client.login(config.token);

const axios = require("axios");
const fs = require("fs");
const config = require("../../configs/config.json");
const {
	features: { clips },
} = config;

const parseVideoUrl = (url) => {
	if (!url) return;
	const splitIds = url.split("/");
	const userId = splitIds[3];
	const videoId = splitIds[5].split("_")[0];

	if (userId && videoId) return `https://media.allstar.gg/${userId}/clips/${videoId}.mp4`;
	return null;
};

const getRecentHighlights = async () => {
	const data = await axios
		.get("https://api.cs-prod.leetify.com/api/highlights/recent-highlights", {
			headers: {
				authorization: `Bearer ${process.env.LEETIFY_AUTHORIZATION_KEY}`,
			},
		})
		.then((res) => {
			console.log(res.data);
			return res.data;
		})
		.catch((err) => {
			console.log(err);
			return null;
		});

	if (!data) return null;
	const newHighlights = [];

	for (const clip of data) {
		if (clip.id === clips.latestHighlightId) break;
		console.log("New highlight", clip.id);
		newHighlights.push({
			id: clip.id,
			desc: clip.description,
			username: clip.username,
			steamId: clip.steam64Id,
			videoUrl: parseVideoUrl(clip?.thumbnailUrl),
			fallbackUrl: clip.url,
		});
	}

	if (!newHighlights.length) return null;

	// Update latest highlight ID
	clips.latestHighlightId = newHighlights[0].id;
	fs.writeFile("./configs/config.json", JSON.stringify(config, null, 4), (err) => {
		if (err) console.log(err);
	});

	return newHighlights;
};

const getUserClips = async (id) => {
	console.log("Finding clips for", id);
	const data = await axios
		.get(`${clips.url}/user/clips`, {
			headers: {
				"content-type": "application/json",
				"X-API-Key": process.env.ALLSTAR_API_KEY,
			},
			params: { steamId: id, limit: 5 },
		})
		.then((res) => {
			console.log(res.data);
			return res.data?.data?.clips;
		})
		.catch((err) => {
			console.log(err);
			return null;
		});

	return data;
};

const test = async () => {
	console.log("testing");
	const data = await axios
		.get("https://api.cs-prod.leetify.com/api/highlights/recent-highlights", {
			headers: {
				authorization: `Bearer ${process.env.LEETIFY_AUTHORIZATION_KEY}`,
			},
		})
		.then((res) => {
			console.log(res.data);
			return res.data;
		})
		.catch((err) => {
			console.log(err);
			return null;
		});

	return data;
};

module.exports = { getRecentHighlights, getUserClips, test };

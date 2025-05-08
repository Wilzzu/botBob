const axios = require("axios");
const fs = require("fs");
const config = require("../../configs/config.json");
const {
	features: { clips },
} = config;

let latestHighlights = clips.latestHighlights;

const parseVideoUrl = (url) => {
	if (!url) return;
	const splitIds = url.split("/");
	const userId = splitIds[3];
	const videoId = splitIds[5].split("_")[0];

	if (userId && videoId)
		return {
			video: `https://media.allstar.gg/${userId}/clips/${videoId}.mp4`,
			clipPage: `https://allstar.gg/clip/${videoId}`,
		};
	return null;
};

const getClubHighlights = async () => {
	// Fetch recent highlights from the club page
	const data = await axios
		.get(`https://api.cs-prod.leetify.com/api/club/${clips.clubId}/recent-highlights`, {
			headers: {
				authorization: `Bearer ${process.env.LEETIFY_AUTHORIZATION_KEY}`,
			},
		})
		.then((res) => res.data)
		.catch((err) => {
			console.log(err);
			return null;
		});

	if (!data) return null;

	// Parse clip data
	const newHighlights = [];
	const foundHighlights = [];
	for (const clip of data) {
		if (clip.status !== "completed") continue; // Skip if clip is still processing
		foundHighlights.push(clip.id); // Add clip to found highlights
		if (latestHighlights.includes(clip.id)) continue; // Skip clip if it has already been sent

		const videoData = parseVideoUrl(clip?.thumbnailUrl);
		newHighlights.push({
			id: clip.id,
			desc: clip.description,
			username: clip.username,
			steamId: clip.steam64Id,
			videoUrl: videoData?.video,
			clipPageUrl: videoData?.clipPage,
			fallbackUrl: clip.url,
		});
	}

	// Return if no new clips
	if (!newHighlights.length) return null;

	// Update latestHighlights array
	latestHighlights = foundHighlights;
	clips.latestHighlights = foundHighlights;
	fs.writeFile("./configs/config.json", JSON.stringify(config, null, 4), (err) => {
		if (err) console.log(err);
	});

	return newHighlights;
};

module.exports = getClubHighlights;

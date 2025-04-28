const cron = require("node-cron");
const {
	features: { clips },
} = require("../../configs/config.json");
const getClubHighlights = require("./getClubClips");
const { userMention } = require("discord.js");

let client;

const sendClipToChannel = async (clip) => {
	const parseUser = clips.users.find((e) => e.steam === clip.steamId);
	const user = parseUser ? userMention(parseUser.discord) : clip.username;
	const message = `## 🎬 ${user} - [${clip.desc}](${clip?.videoUrl || clip.clipPageUrl})`;

	const channel = client.channels.cache.get(clips.channelId);
	if (!channel) return console.log("❌ Couldn't find the clip channel!");

	await channel.send(message);
};

// Check recent club highlights
const checkForClubClips = async () => {
	const clips = await getClubHighlights();
	if (!clips) return;

	// Send new clips to channel
	clips.forEach((clip) => sendClipToChannel(clip));
};

const startClips = (bot) => {
	client = bot;
	checkForClubClips();
	cron.schedule(clips.cron, () => {
		checkForClubClips();
	});
};

module.exports = startClips;

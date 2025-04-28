const cron = require("node-cron");
const {
	features: { clips },
} = require("../../configs/config.json");
const { getRecentHighlights, getUserClips, test } = require("./getUserClips");

let client;

// Check recent highlights (all users)
const checkForRecentClips = async () => {
	const clips = await getRecentHighlights();

	if (!clips) return;
	console.log(clips);
};

// Check each users clips
// const checkForClips = async () => {
// 	for (const id of clips.ids) {
// 		const userClips = await getUserClips(id);
// 		if (!userClips || !userClips.length) continue;
// 		console.log(userClips);
// 	}
// };

const startClips = (bot) => {
	client = bot;
	// test();
	checkForRecentClips();
	cron.schedule(clips.cron, () => {
		checkForRecentClips();
	});
};

module.exports = startClips;

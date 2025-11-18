const cron = require("node-cron");
const config = require("../../configs/config.json");
const {
	guildID,
	features: { clips },
} = config;
const getClubHighlights = require("./getClubClips");
const { userMention, ThreadAutoArchiveDuration } = require("discord.js");
const fs = require("fs");

let client;
let clipUsers = clips.users;
let updateConfigUsers = false;

const clipContent = (user, clip) => {
	const username = user ? userMention(user.discord) : clip.username;
	return `## 🎬 ${username} - [${clip.desc}](${clip?.videoUrl || clip.clipPageUrl})`;
};

const handleForum = async (forum, user, clip) => {
	const thread = user?.threadId ? await forum.threads.fetch(user?.threadId) : null;
	const member = forum.guild.members.cache.get(user?.discord);
	const username = member
		? member.nickname || member.user.globalName || member.user.username
		: clip.username;

	// If thread already exists for the user, update the name if needed and send the clip
	if (thread) {
		if (thread.archived) await thread.setArchived(false);
		if (thread.name !== username) await thread.setName(username);
		await thread.send(clipContent(user, clip));
		return;
	}

	// Create new thread if user doesn't have one yet and send the clip
	const newThread = await forum.threads.create({
		name: username,
		autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
		message: {
			content: clipContent(user, clip),
		},
	});
	if (!newThread) return;

	// Update config user data
	if (user) {
		const clipUser = clipUsers.find((e) => e.steam === user.steam);
		clipUser.threadId = newThread.id;
	} else {
		clipUsers.push({ name: clip.username, steam: clip.steamId, threadId: newThread.id });
	}
	updateConfigUsers = true;
};

const sendClipToChannel = async (clip) => {
	const channel = client.channels.cache.get(clips.channelId);
	if (!channel) return console.log("❌ Couldn't find the clip channel!");

	const user = clipUsers.find((e) => e.steam === clip.steamId);

	// Send to forum thread or normal text channel
	if (channel.type === 15) {
		await handleForum(channel, user, clip);
		return;
	}
	await channel.send(clipContent(user, clip));
};

// Check recent club highlights
const checkForClubClips = async () => {
	const foundClips = await getClubHighlights();
	if (!foundClips) return;

	// Update guild user cache so we can get the latest nicknames
	await client.guilds.cache.get(guildID)?.members.fetch();

	// Send new clips to channel
	for (const clip of foundClips) {
		await sendClipToChannel(clip);
	}

	// Update config if needed
	if (updateConfigUsers) {
		updateConfigUsers = false;
		clips.users = clipUsers;
		fs.writeFile("./configs/config.json", JSON.stringify(config, null, 4), (err) => {
			if (err) console.log(err);
		});
	}
};

const startClips = (bot) => {
	client = bot;
	checkForClubClips();
	cron.schedule(clips.cron, () => {
		checkForClubClips();
	});
};

module.exports = startClips;

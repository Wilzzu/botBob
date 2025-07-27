const oldClips = require("../databases/oldClips.json");
const { ThreadAutoArchiveDuration, time } = require("discord.js");
const config = require("../configs/config.json");
const {
	guildID,
	features: { clips },
} = config;
const fs = require("fs");

let client;
let clipUsers = clips.users;
let updateConfigUsers = false;

const start = async () => {
	const allClips = oldClips.flat().reverse();
	await client.guilds.cache.get(guildID)?.members.fetch();

	let count = 0;
	for (const clip of allClips) {
		count++;
		let user = null;
		if (clip.content[6] === "<") {
			const start = clip.content.split("@")[1];
			const id = start.slice(0, start.indexOf(">"));
			user = clips.users.find((e) => e.discord === id);
		} else {
			const end = clip.content.indexOf("- [") - 1;
			const username = clip.content.slice(6, end);
			user = clips.users.find((e) => e.name === username) || { name: username };
		}

		const channel = client.channels.cache.get(clips.channelId);
		if (!channel) return console.log("❌ Couldn't find the clip channel!");

		const thread = channel.threads.cache.find((thread) => thread.id === user?.threadId);
		const member = channel.guild.members.cache.get(user?.discord);
		const username = member
			? member.nickname || member.user.globalName || member.user.username
			: user?.name || "🤔";

		if (thread) {
			if (thread.name !== username) await thread.setName(username);
			await thread.send(clip.content + "\n" + time(new Date(clip.timestamp)));
			continue;
		}

		console.log("#" + count + ": New thread", username, clip.content);
		const newThread = await channel.threads.create({
			name: username,
			autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
			message: {
				content: clip.content + "\n" + time(new Date(clip.timestamp)),
			},
		});
		if (!newThread) continue;

		// Update config user data
		if (user?.steam) {
			const clipUser = clipUsers.find((e) => e.steam === user.steam);
			clipUser.threadId = newThread.id;
		} else {
			clipUsers.push({ name: user?.name, threadId: newThread.id });
		}

		updateConfigUsers = true;
	}

	console.log(count + " clips added!");

	if (updateConfigUsers) {
		updateConfigUsers = false;
		clips.users = clipUsers;
		fs.writeFile("./configs/config.json", JSON.stringify(config, null, 4), (err) => {
			if (err) console.log(err);
		});
	}
};

const addOldClipsToForum = (bot) => {
	client = bot;
	start();
};

module.exports = addOldClipsToForum;

const { Events } = require("discord.js");
const setup = require("../features/setup");

module.exports = {
	name: Events.GuildCreate,
	execute(guild) {
		setup(guild, guild.client);
	},
};

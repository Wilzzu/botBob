const { prefix, lang } = require("../configs/config.json");

// If message starts with prefix, execute chat command
module.exports = function (msg) {
	if (msg.content.startsWith(prefix)) {
		// Get command name and args
		const args = msg.content.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();

		// Check if command exists
		const command = msg.client.commands.get(commandName);
		if (!command) return false;

		// Execute command
		try {
			return command.execute(msg, args);
		} catch (error) {
			console.error(error);
			return msg.reply(str[lang].error.commandExec);
		}
	}
};

const fs = require("fs");
const { updateDebtEmbed } = require("./modifyDebtEmbed");
const { lang } = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const sendConfirmation = require("./sendConfirmation");

// Create string for confirmation message
const confirmationContent = (from, to, amount) => {
	return `✅ \`${from?.globalName || from?.username} ➡ ${amount}🍔 ➡ ${
		to?.globalName || to?.username
	}\``;
};

// Respond to interaction
const respond = (i, content) => {
	i.reply({ content: content, ephemeral: true });
	setTimeout(() => i.deleteReply(), 5000);
};

const updateAndRespond = (db, interaction, from, to, amount) => {
	// Update final amount for user
	const user = db.find((user) => user.id === from.id);
	if (user) {
		let amount = 0;
		user.debts.forEach((debt) => {
			amount += debt.amount;
		});
		user.amount = amount;
	}

	// Write to db
	fs.writeFileSync("./databases/debtsDb.json", JSON.stringify(db, null, 4), (err) => {
		if (err) return respond(interaction, str[lang].commands.debt.errUpdatingDebts);
	});

	// Update embed, respond to interaction and send a confirmation
	updateDebtEmbed(db, interaction.guild);
	respond(interaction, confirmationContent(from, to, amount));
	sendConfirmation(interaction, from, to, amount);
};

module.exports = function handleDebt(i, from, to, amount) {
	// Find user from db
	const db = JSON.parse(fs.readFileSync("./databases/debtsDb.json", "utf8"));
	const user = db.find((user) => user.id === from.id);

	// Add user to db if they don't exist, else update their debt
	if (!user) {
		if (amount <= 0) return;
		db.push({
			id: from.id,
			name: from?.globalName || from?.username,
			amount: amount,
			debts: [{ id: to.id, amount: amount }],
		});
		return updateAndRespond(db, i, from, to, amount);
	}

	// Check if user already is in debt to the other user
	const debt = user.debts.find((debt) => debt.id === to.id);
	if (debt) {
		// If the user doesn't have debt for the other user anymore, remove them
		if (debt.amount + amount <= 0) {
			user.debts = user.debts.filter((remove) => remove.id !== debt.id);
			let updatedDb = db;

			// Check if there are any more debts left for the user
			if (!user.debts.length) updatedDb = db.filter((remove) => remove.id !== user.id);
			return updateAndRespond(updatedDb, i, from, to, amount);
		}
		// Else update the debt
		debt.amount += amount;
	}
	// Create new debt if the user doesn't have one already
	else if (amount > 0)
		user.debts.push({ id: to.id, name: to?.globalName || to?.username, amount: amount });

	updateAndRespond(db, i, from, to, amount);
};

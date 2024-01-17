const mongoose = require("mongoose");
const Timeout = require("../models/timeoutModel");
mongoose.set("strictQuery", false);

const connectMongoose = async () => {
	try {
		const uri = `${process.env.MONGO_URI}?retryWrites=true&w=majority`;
		const conn = await mongoose.connect(uri);

		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.log(error);
		process.exit(1);
	}
};

const addTimeoutToMongoDB = async (user) => {
	const userExists = await Timeout.exists({ id: user.id });
	if (userExists) {
		const updated = await Timeout.findOneAndUpdate(
			{ id: user.id },
			{ $inc: { timeouts: 1 }, avatar: user.avatar },
			{ new: true }
		);
		if (!updated) return console.log("Couldn't update user's timeouts");
		console.log(`Updated user ${updated.name}'s timeouts to: ${updated.timeouts}`);
	} else {
		const timeout = await Timeout.create({ ...user, timeouts: 1 });
		console.log(`Created new user "${timeout.name}" to the database!`);
	}
};

module.exports = { connectMongoose, addTimeoutToMongoDB };

const {
	features: { timeout },
	lang,
} = require("../../configs/config.json");
const str = require("../../configs/languages.json");
const tiebreaker = require("./tiebreaker");

// Calculate vote's result
const calculateVotes = (votes) => {
	if (!votes.voteYes.length) return { passed: false, desc: str[lang].timeout.notEnoughVotes };
	if (votes.voteYes.length > votes.voteNo.length) {
		if (votes.voteYes.length < 2) return { passed: false, desc: str[lang].timeout.notEnoughVotes };
		return { passed: true, desc: str[lang].timeout.votePassed };
	}

	if (votes.voteYes.length === votes.voteNo.length)
		return { desc: str[lang].timeout.tie, tie: true };

	return { passed: false, desc: str[lang].timeout.voteFailed };
};

const handleDatabase = (user) => {
	// Add user to timeoutDb
};

module.exports = function endVote(message, votes, user, voiceChannelID, usersBeingTimedOut) {
	let description = str[lang].timeout.embedDescEnd;
	let vote = calculateVotes(votes);

	if (vote?.tie) tiebreaker(message, user, description + vote.desc, votes);
	else {
		// TODO: Put all the end stuff in own function, so it can be called from tiebreaker as well
		// Remove user from usersBeingTimedOut
		usersBeingTimedOut.splice(usersBeingTimedOut.indexOf(user.id), 1);
	}

	// Remove user from usersBeingTimedOut
	// Add user to timeoutDB if vote passed
	// Update embed with final result
	// Send AI response if vote passed, and if one is available
	// Remove sent AI response from aiResponses

	// Maybe add fun modifiers that have a chance to trigger,
	// like 1% chance to timeout if not enough votes, or 10% chance to timeout the initiator if vote fails
};

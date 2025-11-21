const express = require("express");
const router = express.Router();

module.exports = (db, checkLoggedIn) => {

    //route to gte the currentscore of the players
    router.get("/scoreboard", checkLoggedIn, (req, res) => {
        const game_session_id = req.session.game_session_id;

        if (!game_session_id) {
            return res.json({ error: "Invalid game session." });
        }

        const query = `SELECT u.username, SUM(q.score) AS total_score FROM questions_answered q
            JOIN user u ON q.user_id = u.user_id WHERE q.game_session_id = ?
            GROUP BY u.user_id, u.username
            ORDER BY total_score DESC;`;

        db.query(query, [game_session_id], (err, results) => {
            if (err) {
                console.error("There was en error encountered while fetching the scoreboard in the database.", err);
                return res.json({ error: "There was en error encountered while fetching the scoreboard in the database." });
            }

            res.json({ players: results });
        });
    });

    //route to rende the game.pug - assigning isHost or isPlayer to be used by the pug
    // to diplay repsctive fucntionalities
    router.get('/game', checkLoggedIn, (req, res) => {
        const isPlayer = req.session.user_id;
        const gamePin = req.session.game_pin;
        const isHost = req.session.host_id;

        res.render('game', { isHost, isPlayer, gamePin });
    });


    router.post("/validateAnswer", checkLoggedIn, (req, res) => {
        const { option_id, question_id } = req.body;
        const user_id = req.session.user_id;
        const level_id = req.session.level_id;
        const game_session_id = req.session.game_session_id;

        if (!user_id) {
            return res.json({ message: "Please login." });
        }

        // retrieves all the options ids and correct 
        const queryCheckAnswer = `SELECT option_id, correct FROM options WHERE question_id = ?;`;

        db.query(queryCheckAnswer, [question_id], (err, answerResults) => {
            if (err) {
                console.error("Database error:", err);
                return res.json({ message: "Internal server error." });
            }

            if (answerResults.length === 0) {
                return res.json({ message: "Invalid question." });
            }

            // idnetifying the correct option id
            const correctOption = answerResults.find(opt => opt.correct === 1);
            const correct_option_id = correctOption ? correctOption.option_id : null;

            const isCorrect = option_id == correct_option_id;
            const consequenceType = isCorrect ? "reward" : "penalty";

            // retriecing a rewrad based on the consequenceType
            const queryConsequence = `SELECT consequence_text FROM consequences WHERE level_id = ? AND type = ? ORDER BY RAND() LIMIT 1;`;

            db.query(queryConsequence, [level_id, consequenceType], (err, consequenceResults) => {
                if (err) {
                    console.error("Error fetching consequence:", err);
                    return res.json({ message: "Internal server error." });
                }

                const consequenceText = consequenceResults.length > 0
                    ? consequenceResults[0].consequence_text
                    : "No consequence found.";

                // adding the naswered question detail into the table so that the question is not fetched again
                const queryInsertAnswer = `INSERT INTO questions_answered (user_id, game_session_id, question_id, score)VALUES (?, ?, ?, ?);`;

                db.query(queryInsertAnswer, [user_id, game_session_id, question_id, isCorrect ? 1 : 0], (err) => {
                    if (err) {
                        console.error("Error updating score:", err);
                        return res.json({ message: "Internal server error." });
                    }

                    res.json({
                        correct: isCorrect,
                        correct_option_id: correct_option_id,
                        consequence: consequenceText,
                    });
                });
            });
        });
    });


    //get route to chc=cek the score of the player if he has recahed a reward milestone
    router.get('/getScore', (req, res) => {
        const user_id = req.session.user_id;
        const game_session_id = req.session.game_session_id;

        const queryScore = "SELECT SUM(score) AS total FROM questions_answered WHERE user_id = ? AND game_session_id = ?";

        db.query(queryScore, [user_id, game_session_id], (err, results) => {
            if (err) {
                console.error(err);
                return res.json({ error: "There was an error encountered while calculating the total score." });
            }

            const totalScore = results[0].total || 0;

            if (!req.session.lastMilestone) {
                req.session.lastMilestone = 0;
            }

            if (totalScore > 0 && totalScore % 5 === 0 && totalScore !== req.session.lastMilestone) {
                req.session.lastMilestone = totalScore;

                const queryReward = "SELECT consequence_text FROM consequences WHERE type = 'reward' ORDER BY RAND() LIMIT 1";
                db.query(queryReward, (err, rewardResults) => {
                    if (err) {
                        console.error(err);
                        return res.json({ error: "There was an error encountered while calculating the total score." });
                    }

                    const reward = rewardResults.length > 0 ? rewardResults[0].consequence_text : "Choose a player to draw 4 cards.";
                    return res.json({ totalScore, reward });
                });
            } else {
                return res.json({ totalScore, reward: null });
            }
        });
    });

    return router;
};
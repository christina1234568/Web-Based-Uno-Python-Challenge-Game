const express = require("express");
const router = express.Router();

module.exports = (db, checkLoggedIn) => {
    
    //generating a random game pin form numbers and letters
    const generateGamePin = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    //method to craete a game pin and chceking it in the dtaabse to make sure it is unique
    //so that no two game session overlap
    function createGamePin() {
        return new Promise((resolve, reject) => {
            function tryGeneratePin() {
                const gamePin = generateGamePin();
                const query = `SELECT COUNT(*) AS count FROM game_session WHERE game_pin = ? AND state = 'active'`;
    
                db.query(query, [gamePin], (error, results) => {
                    if (error) return reject(error);
    
                    if (results[0].count === 0) {
                        return resolve(gamePin);
                    } else {
                        tryGeneratePin();
                    }
                });
            }
    
            tryGeneratePin();
        });
    }
    
    // post router to create the game session 
    // sending the responses to the frontend
    router.post("/createGame", checkLoggedIn, (req, res) => {
        const user_id = req.session.user_id;
        const session_id = req.session.session_id;
        const levelDescription = req.body.level;
    
        if (!levelDescription) {
            return res.json({ success: false, message: "Please select one level before proceeding!" });
        }
    
        const queryLevel = `SELECT level_id FROM level WHERE description = ?`;
        db.query(queryLevel, [levelDescription], (levelError, levelResults) => {
            if (levelError) {
                console.error("Database error:", levelError);
                return res.json({ success: false, message: "An error occurred. Please try again later." });
            }
    
            if (levelResults.length === 0) {
                return res.json({ success: false, message: "Invalid level selected." });
            }
            const level_id = levelResults[0].level_id;
    
            createGamePin()
                .then((game_pin) => {
                    const queryGameSession = 'INSERT INTO game_session (user_id, level_id, session_id, game_pin, time_created) VALUES (?, ?, ?, ?, NOW())';
                    db.query(queryGameSession, [user_id, level_id, session_id, game_pin], (insertError, insertResult) => {
                        if (insertError) {
                            console.error("Database error:", insertError);
                            return res.json({ success: false, message: "There was an error encountered while creating the game session. Please try again later." });
                        }
    
                        if (!insertResult.insertId) {
                            return res.json({ success: false, message: "There was an error encountered while creating the game session. Please try again later." });
                        }
    
                        const game_session_id = insertResult.insertId;
                        req.session.game_session_id = game_session_id;
                        req.session.game_pin = game_pin;
                        req.session.level_id = level_id;
                        req.session.host_id = user_id;
    
                        res.json({ success: true, gameSessionId: game_session_id, game_pin, level_id });
                    });
                })
                .catch((error) => {
                    console.error("Game Pin Error:", error);
                    res.json({ success: false, message: error.message });
                });
        });
    });
    


    return router;
};


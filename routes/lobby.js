const express = require("express");
const router = express.Router();


module.exports = (db, checkLoggedIn) => {

    //sending the ids to the frontedn to disabel the button accordingly
    router.get("/gameSession", checkLoggedIn, (req, res) => {
        res.json({
            host_id: req.session.host_id,
            user_id: req.session.user_id,
        });
    });

    //post route to end the game - updating the state of the game in game_session
    router.post("/endGame", checkLoggedIn, (req, res) => {
        const game_session_id = req.session.game_session_id;

        const queryEndGame = 'UPDATE game_session SET state = "ended" WHERE game_session_id = ?';
        db.query(queryEndGame, [game_session_id], (err) => {
            if (err) {
                return res.json({ error: "There was an error encountered while ending the game session. Please try again." });
            } else {
                return res.json({ success: true });
            }
        });
    });

    //when players clcik on exit game button
    router.get("/exitGame", checkLoggedIn, (req, res) => {
        return res.render('homepage');
    });

    //rendering the lobby 
    //passing gamePin to be displayed
    router.get('/lobby', checkLoggedIn, (req, res) => {
        const isPlayer = req.session.user_id;
        const gamePin = req.session.game_pin;
        const isHost = req.session.host_id;

        res.render('lobby', { isHost, isPlayer, gamePin });
    });

    /*router.get('/lobby', checkLoggedIn, (req, res) => {
        const game_pin = req.session.game_pin;

        res.render('lobby', { gamePin: game_pin });
    });*/

    //players route to be used in fetchPlayers (lobby.js frontend)
    //passing players username and the state of the game to be chceked 
    router.get('/players', checkLoggedIn, (req, res) => {
        const game_session_id = req.session.game_session_id;

        if (!game_session_id) {
            return res.json({ error: "Invalid game session." });
        }

        const queryPlayer = 'SELECT user.username FROM game_session_participants JOIN user ON game_session_participants.user_id = user.user_id WHERE game_session_id = ?';

        const queryState = `SELECT state FROM game_session WHERE game_session_id = ?;`;

        db.query(queryPlayer, [game_session_id], (err, players) => {
            if (err) {
                console.error("There was en error encountered while fetching the players: ", err);
                return res.json({ error: "There was en error encountered while fetching the players." });
            }

            db.query(queryState, [game_session_id], (err, stateResults) => {
                if (err) {
                    console.error("There was en error encountered while fetching the game state:", err);
                    return res.json({ error: "There was en error encountered while fetching the game state." });
                }

                const gameState = stateResults.length > 0 ? stateResults[0].state : "unknown";

                res.json({ players, state: gameState });
            });
        });
    });

    //updating the state of the game in game_session table so that when fetching player(lobby.js frontend) the state is chceked
    //and players are redirected to the game page
    router.post("/startGame", checkLoggedIn, (req, res) => {
        const game_session_id = req.session.game_session_id;

        const queryCheckPlayers = 'SELECT COUNT(*) AS player_count FROM game_session_participants WHERE game_session_id = ?';

        db.query(queryCheckPlayers, [game_session_id], (err, results) => {
            if (err) {
                console.error("Error checking player count:", err);
                return res.json({ message: "There was an error encountered while checking the number of players in the game." });
            }

            if (results[0].player_count < 2) {
                return res.json({ message: "There must be at least two players in the game to start a session." });
            }

            const queryUpdate = 'UPDATE game_session SET state = "started" WHERE game_session_id = ?';

            db.query(queryUpdate, [game_session_id], (err, result) => {
                if (err) {
                    console.error("Error starting the game:", err);
                    return res.json({ message: "Error starting the game." });
                }

                res.json({ message: "The game has been started." });
            });
        });
    });

    return router;
};
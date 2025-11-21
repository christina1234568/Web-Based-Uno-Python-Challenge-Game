const express = require('express');
const router = express.Router();

module.exports = (db, checkLoggedIn) => {

    // join route for the playerr to join a game session by entering a agame pin
    router.post('/join', checkLoggedIn, (req, res) => {
        const game_pin = req.body.gamePin;
        if (!game_pin) {
            return res.render('joinGame', { message: 'Please enter a game pin.' });
        }
    
        // chceking if the pin exixts in the databse and fetching the details
        const queryPin = 'SELECT * FROM game_session WHERE game_pin = ? AND state = "active";';
        db.query(queryPin, [game_pin], (err, result) => {
            if (err) {
                console.error('Database query error:', err);
                return res.render('joinGame', { message: 'There was a problem encountered while joining the game. Please try again later.' });
            }
    
            if (result.length === 0) {
                return res.render('joinGame', { message: 'Game Pin Invalid.' });
            }
    
            //fetching the results from the database
            const results = result[0];
            const game_session_id = results.game_session_id;
            const host_id = results.user_id;
            const level_id = results.level_id;
            const user_id = req.session.user_id;
    
            if (user_id === host_id) {
                return res.render('joinGame', { message: 'The user hosting the game session is not allowed to join.' });
            }
    
            // chceking if the game session alredy has 10 players
            const queryCheckPlayers = 'SELECT COUNT(*) AS player_count FROM game_session_participants WHERE game_session_id = ?';
            db.query(queryCheckPlayers, [game_session_id], (err, countResult) => {
                if (err) {
                    console.error('Error checking player count:', err);
                    return res.render('joinGame', { message: 'There was a problem encountered while joining the game. Please try again later.' });
                }
    
                const playerCount = countResult[0].player_count;
                if (playerCount >= 10) {
                    return res.render('joinGame', { message: 'The game session is full. Maximum 10 players allowed.' });
                }
    
                // query to check if the player is laredy in the game session - if he is he cannot join again
                const queryCheckPlayer = 'SELECT * FROM game_session_participants WHERE user_id = ? AND game_session_id = ?';
                db.query(queryCheckPlayer, [user_id, game_session_id], (err, playerResult) => {
                    if (err) {
                        console.error('Error checking player existence:', err);
                        return res.render('joinGame', { message: 'There was a problem encountered while joining the game. Please try again later.' });
                    }
    
                    // preventing user form joining twice
                    if (playerResult.length > 0) {
                        return res.render('joinGame', { message: 'You are not allowed to join the same game session twice.' });
                    }
    
                    // quey to insert the relevant details into the game_session_particpoants table
                    const queryInsertPlayer = 'INSERT INTO game_session_participants (user_id, game_session_id) VALUES (?, ?)';
                    db.query(queryInsertPlayer, [user_id, game_session_id], (err) => {
                        if (err) {
                            console.error('Error adding player to the game:', err);
                            return res.render('joinGame', { message: 'There was a problem encountered while joining the game. Please try again later.' });
                        }
    
                        // setting the req.session varaibles for the game session fo the player
                        req.session.game_session_id = game_session_id;
                        req.session.game_pin = game_pin.toUpperCase();
                        req.session.level_id = level_id;
    
                        // directing the player to the lobby to wait for more players
                        res.render('lobby', { gamePin: req.session.game_pin });
                    });
                });
            });
        });
    });
    
    return router;
};

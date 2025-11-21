const express = require("express");
const router = express.Router();

module.exports = (db) => {
    const QRCodeCheck = "Uno_Python_Challenge_Game";
    //qr code password to prevent the player form scanning just any qr code

    //route to retrive the question and the corresponding options
    router.get("/processingQR/:qrValue", (req, res) => {
        const { qrValue } = req.params;
        const game_session_id = req.session.game_session_id;
        const user_id = req.session.user_id;
        const level_id = req.session.level_id;

        if (!user_id) {
            return res.json({ message: "Please login." });
        }

        if (qrValue !== QRCodeCheck) {
            return res.json({ message: "QR code is not valid." });
        }

        if (req.session.current_question && req.session.last_question_time) {
            const timeDiff = Date.now() - req.session.last_question_time;
            if (timeDiff < 5000) {
                return res.json(req.session.current_question);
            } else {
                // Reseting the  session variables after time limit
                delete req.session.current_question;
                delete req.session.last_question_time;
            }
        }

        //retriveing a random question id and question text matching the level retrived form the game session 
        const queryQuestions = `SELECT q.question_id, q.question_text FROM questions q WHERE q.level_id = ? 
            AND q.question_id NOT IN (
                SELECT question_id FROM questions_answered
                WHERE user_id = ? AND game_session_id = ?)
            ORDER BY RAND() LIMIT 1;`;

        db.query(queryQuestions, [level_id, user_id, game_session_id], (err, questionResults) => {
            if (err) {
                console.error("Error fetching question:", err);
                return res.json({ message: "Internal server error." });
            }

            if (questionResults.length === 0) {
                return res.json({ message: "No questions found for this level." });
            }

            const { question_id, question_text } = questionResults[0];

            //retrieving the options corresposponding to questions id retrieved
            const queryOptions = `SELECT option_id, option_text, option_character FROM options WHERE question_id = ?;`;

            db.query(queryOptions, [question_id], (err, optionsResults) => {
                if (err) {
                    console.error("Error fetching options:", err);
                    return res.json({ message: "Internal server error." });
                }

                const questionData = {
                    username: req.session.username,
                    level_id,
                    question_id,
                    question_text,
                    options: optionsResults
                };

                req.session.current_question = questionData;
                req.session.last_question_time = Date.now();

                //passing the data to the forntedn(processQR.js)
                res.json(questionData);
            });
        });
    });
    return router;
};
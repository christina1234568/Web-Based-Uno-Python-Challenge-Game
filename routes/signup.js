const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (db) => {

    //method to craete a random userid for the registering user
    function createUserID() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
        let userID = '';
        for (let i = 0; i < 7; i++) {
            userID += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return userID;
    }

    //chceking in the databse if the userid is already taken
    function validUser(userID, callback) {
        db.query(
            'SELECT COUNT(*) AS count FROM user WHERE user_id = ?',
            [userID],
            (err, results) => {
                if (err) return callback(err, null);
                callback(null, results[0].count > 0);
            }
        );
    }

    //additional check in the database other that checksignupemail route and ajax
    function validEmail(email, callback) {
        db.query(
            'SELECT COUNT(*) AS count FROM user WHERE email = ?',
            [email],
            (err, results) => {
                if (err) return callback(err, null);
                callback(null, results[0].count > 0);
            }
        );
    }

    // sign up route that create the userid, chceks the email in database and inserts the new user created
    router.post('/signup', (req, res) => {
        const { username, email, password, confirmPassword } = req.body;

        validEmail(email, (err, emailExists) => {
            if (err) {
                console.error(err);
                return res.render('signup', { error: 'There was a problem encountered while contacting the database. Please try again later.' });
            }

            if (emailExists) {
                return res.render('signup', { error: "This email is already connected to another account!" });
            }

            if (password.length < 7) {
                return res.render('signup', { error: "Password must be at least 7 characters!" });
            } else if (password.length > 20) {
                return res.render('signup', { error: "Password must be less than 21 characters!" });
            } else if (password !== confirmPassword) {
                return res.render('signup', { error: "Passwords do not match!" });
            }

            //genearte and chceks the user id if unique
            function generateUniqueUserID(callback) {
                let user_id = createUserID();
                validUser(user_id, (err, exists) => {
                    if (err) return callback(err, null);
                    if (exists) return generateUniqueUserID(callback);
                    callback(null, user_id);
                });
            }

            generateUniqueUserID((err, user_id) => {
                if (err) {
                    console.error(err);
                    return res.render('signup', { error: "Error generating user ID. Please try again." });
                }

                // bcrypting the password
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds, (err, passwordHashed) => {
                    if (err) {
                        console.error("Error hashing password:", err);
                        return res.render('signup', { error: "There was a problem encountered while processing your password. Please try again later." });
                    }

                    // inserting the new created user in the user table
                    const query = 'INSERT INTO user (user_id, username, email, password) VALUES (?, ?, ?, ?)';
                    db.query(query, [user_id, username, email, passwordHashed], (err) => {
                        if (err) {
                            console.error(err);
                            return res.render('signup', { error: 'There was a problem encountered while creating your account. Please try again later.' });
                        }
                        res.redirect('/login');
                    });
                });
            });
        });
    });

    return router;
};


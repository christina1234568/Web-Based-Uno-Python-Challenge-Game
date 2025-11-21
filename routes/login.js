const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (db, checkLoggedIn) => {
    //route for loginn
    router.post('/login', (req, res) => {
        const email = req.body.email;
        const password = req.body.password;
        if (email && password) {
            db.query('SELECT * FROM user WHERE email = ?', [email], (error, results) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.render('login', { error: 'A problem was encountered while login. Please try again later.' });
                }

                if (results.length > 0) {
                    const user = results[0];
                    bcrypt.compare(password, user.password, (err, match) => {
                        if (err) {
                            console.error('Bcrypt error:', err);
                            return res.render('login', { error: 'There was en error encounterd while login.' });
                        }
                        
                        if (match) {
                            // chceking if this is active user and not a dleted user
                            if (user.in_use === "active") {
                                db.query('INSERT INTO session (user_id) VALUES (?)',
                                    [user.user_id], (err, sessionResult) => {
                                        if (err) {
                                            console.error('Error inserting session:', err);
                                            return res.render('login', { error: 'There was en error encounterd while login.' });
                                        }
                                        //setting the session vraibles to be used thorughout the web app
                                        req.session.session_id = sessionResult.insertId;
                                        req.session.loggedin = true;
                                        req.session.email = email;
                                        req.session.user_id = user.user_id;
                                        req.session.username = user.username;
                                        res.redirect('/homepage');
                                    });
                            } else {
                                res.render('login', { error: 'This account has been deleted. Please sign up again.' });
                            }
                        } else {
                            res.render('login', { error: 'Incorrect Email and/or Password!' });
                        }
                    });
                } else {
                    res.render('login', { error: 'Incorrect Email and/or Password!' });
                }
            });
        } else {
            res.render('login', { error: 'Please enter a valid Email and Password!' });
        }
    });

    //logout route
    router.get('/logout', checkLoggedIn, (req, res) => {
        const session_id = req.session.session_id;

        db.query('UPDATE session SET status = "expired" WHERE session_id = ?', [session_id], (err) => {
            if (err) {
                console.error('Error updating session status:', err);
                return res.render('homepage', { error: 'There was an error encountered while logging out.' });
            }

            req.session.destroy(function (err) {
                if (err) {
                    return res.render('homepage', { error: 'There was an error encountered while logging out.' });
                } else {
                    return res.redirect('/login');
                }
            });
        });
    });
    
    return router;
};
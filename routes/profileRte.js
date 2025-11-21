const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

module.exports = (db, checkLoggedIn) => {

    router.get('/profile', checkLoggedIn, (req, res) => {
        res.render('profile', { username: req.session.username, email: req.session.email })
    });

    function validEmail(email, user_id, callback) {
        db.query(
            'SELECT COUNT(*) AS count FROM user WHERE email = ? AND user_id != ?',
            [email, user_id],
            (err, results) => {
                if (err) return callback(err, null);
                callback(null, results[0].count > 0);
            }
        );
    }

    router.post('/profile', checkLoggedIn, (req, res) => {
        const user_id = req.session.user_id;
        const { username, email, password, confirmPassword } = req.body;

        validEmail(email, user_id, (err, emailChosen) => {
            if (err) {
                console.error(err);
                return res.render('profile', { error: 'There was a problem encountered while contacting the database. Please try again later.', username: req.session.username, email: req.session.email });
            }

            if (emailChosen) {
                return res.render('profile', { error: "This email is already connected to another account!", username: req.session.username, email: req.session.email });
            }

            if (password.length < 7) {
                return res.render('profile', { error: "Password must be at least 7 characters!", username: req.session.username, email: req.session.email });
            } else if (password.length > 20) {
                return res.render('profile', { error: "Password must be less than 21 characters!", username: req.session.username, email: req.session.email });
            } else if (password !== confirmPassword) {
                return res.render('profile', { error: "Passwords do not match!", username: req.session.username, email: req.session.email });
            }

            const saltRounds = 10;
            bcrypt.hash(password, saltRounds, (err, passwordHashed) => {
                if (err) {
                    console.error('Bcrypt error:', err);
                    return res.render('profile', { error: 'There was a problem encountered while processing your password. Please try again later.', username: req.session.username, email: req.session.email });
                }

                const query = 'UPDATE user SET username = ?, email = ?, password = ? WHERE user_id = ?';
                db.query(query, [username, email, passwordHashed, user_id], (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.render('profile', { error: 'There was a problem encountered while updating your account. Please try again later.', username: req.session.username, email: req.session.email });
                    }

                    if (results.affectedRows > 0) {
                        return res.redirect('/logout');

                    }
                });
            });
        });
    });


    //delete route to deleet the user - route called thorugh the ajax frontend 
    router.post('/delete', checkLoggedIn, (req, res) => {
        const user_id = req.session.user_id;
        const query = 'UPDATE user SET in_use = "deleted" WHERE user_id = ?;';
    
        db.query(query, [user_id], (err, results) => {
            if (err) {
                return res.json({ error: 'The deletion could not be processed. Please sign up again.' });
            }
    
            if (results.affectedRows > 0) {
                return res.json({ success: true, message: 'Your account has been succesfully deleted. You will be directed back to the login page.' });
            }
    
            return res.json({ error: 'No account found to delete.' });
        });
    });
    
    return router;

};
const express = require('express');
const router = express.Router();

module.exports = function (db, checkLoggedIn) {
    router.get('/checkUpdateEmail', checkLoggedIn, (req, res) => {
        const email = req.query.email;
        const user_id = req.session.user_id;

        const query = "SELECT * FROM user WHERE email = ? AND user_id != ? AND in_use = ?";
        
        db.query(query, [email, user_id, 'active'], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "An error occurred while checking the email." });
            }
            
            const exists = result.length > 0;
            res.json({ exists });
        });
    });

    return router;
};

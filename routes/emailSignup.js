const express = require('express');
const router = express.Router();

module.exports = function (db) {
    router.get('/checkSignupEmail', function (req, res) {
        const email = req.query.email;
        
        const query = "SELECT * FROM user WHERE email = ? AND in_use = ?";
        db.query(query, [email, 'active'], function (err, result) {
            if (err) {
                console.error("Database error:", err);
                return res.json({ error: "An error occurred while checking the email." });
            }
            const exists = result.length > 0;
            res.json({ exists: exists });
        });
    });

    return router;
};


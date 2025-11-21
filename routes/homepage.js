const express = require('express');
const router = express.Router();

module.exports = (checkLoggedIn) => {

    router.get('/homepage', checkLoggedIn, (req, res) => {
        res.render('homepage');
    });

    return router;
};

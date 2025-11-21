const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const app = express();
const session = require('express-session');
const bcrypt = require("bcrypt");

app.use(session({
    secret: '',
    resave: true,
    saveUninitialized: true,
}));

const db = mysql.createConnection({
    host: 'localhost',
    user: '',
    password: '',
    database: ''
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Connected to the database');
    }
});

function checkLoggedIn(req, res, next) {
    if (req.session.loggedin) {
        next();
    } else {
        req.session.error = 'Please Login!';
        res.redirect('/login');
    }
}

const homepageRoute = require('./routes/homepage')(checkLoggedIn);
const loginRoute = require('./routes/login')(db, checkLoggedIn);
const signupRoute = require('./routes/signup')(db);
const profileRoute = require('./routes/profileRte')(db, checkLoggedIn);
const emailSignupRoute = require('./routes/emailSignup')(db);
const emailUpdateRoute = require('./routes/emailUpdate')(db, checkLoggedIn);
const createGameRoute = require('./routes/createGame')(db, checkLoggedIn);
const lobbyRoute = require('./routes/lobby')(db, checkLoggedIn);
const joinGameRoute = require('./routes/joinGame')(db, checkLoggedIn);
const gameRoute = require('./routes/game')(db, checkLoggedIn);
const QRRoute = require('./routes/processQR')(db);


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));


app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'pug');

app.use(homepageRoute);
app.use(loginRoute);
app.use(signupRoute);
app.use(profileRoute);
app.use(emailSignupRoute);
app.use(emailUpdateRoute);
app.use(createGameRoute);
app.use(lobbyRoute);
app.use(joinGameRoute);
app.use(gameRoute);
app.use(QRRoute);

app.use((req, res, next) => {
    res.locals.loggedin = req.session.loggedin || false;
    next();
});


app.get('/', function (req, res) {
    res.render('index');
});

app.get('/index', function (req, res) {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/homepage',checkLoggedIn, (req, res) => {
    res.render('homepage');
});

app.get('/profile', checkLoggedIn, (req, res) => {
    res.render('profile');
});

app.get('/lobby', checkLoggedIn, (req, res) => {
    res.render('lobby');
});

app.get('/joinGame', checkLoggedIn, (req, res) => {
    res.render('joinGame');
});

app.get('/game', checkLoggedIn, (req, res) => {
    res.render('game');
});

app.get('/rules', (req, res) => {
    res.render('rules');
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
// imports
import express from "express";
import morgan from "morgan";
import { getUser,  getSetupNetwork, getPlayNetwork, getLeaderboard, startGame, submitGame } from './dao.js';
import { check, validationResult } from "express-validator";

import passport from 'passport';
import LocalStrategy from 'passport-local';
import session from 'express-session';

import cors from "cors";


// init express
const app = new express();
const port = 3001;


// middlewares
app.use(express.json());
app.use(morgan("dev"));


passport.use(new LocalStrategy(async function verify(username, password, cb) {
  const user = await getUser(username, password);
  if (!user)
    return cb(null, false, "Incorrect username or password.");

  return cb(null, user);
}));

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (user, cb) {
  return cb(null, user);
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
}


app.use(session({
  secret: "ultima-corsa-secret",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.authenticate("session"));


const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  exposedHeaders: ["WWW-Authenticate"],
  credentials: true
};

app.use(cors(corsOptions));


/* ROUTES */

// POST /api/sessions
app.post("/api/sessions", passport.authenticate("local"), function(req, res) {
  return res.status(201).json(req.user);
});

// GET /api/sessions/current
app.get("/api/sessions/current", (req, res) => {
  if(req.isAuthenticated()) {
    res.json(req.user);}
  else
    res.status(401).json({error: "Not authenticated"});
});

// DELETE /api/sessions/current
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// GET /api/network/setup
app.get('/api/network/setup', isLoggedIn, async (req, res) => {
  try {
    const network = await getSetupNetwork();
    res.json(network);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/network/play
app.get('/api/network/play', isLoggedIn, async (req, res) => {
  try {
    const network = await getPlayNetwork();
    res.json(network);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard
app.get('/api/leaderboard', isLoggedIn, async (req, res) => {
  try {
    const leaderboard = await getLeaderboard();
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/start
app.post('/api/games/start', isLoggedIn, async (req, res) => {
  try {
    const game = await startGame(req.user.id);
    res.status(201).json(game);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/games/:id/submit
app.post('/api/games/:id/submit', isLoggedIn, [
  check('id').isInt({ min: 1 }).toInt(),
  check('path').isArray(),
  check('path.*').isInt({ min: 1 }).toInt()
  ], async (req, res) => {
  
  const errors = validationResult(req);
    
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const result = await submitGame(
      req.params.id,
      req.user.id,
      req.body.path
    );

    if (result.notFound) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (result.alreadyCompleted) {
      return res.status(409).json({ error: 'Game already completed' });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
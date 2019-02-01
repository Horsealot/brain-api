const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

var models = require('./../models');

passport.use(new LocalStrategy({
    usernameField: 'user[email]',
    passwordField: 'user[password]',
}, (email, password, done) => {
    models.Users
        .find({ where: { email: email }, include: ['squads'] })
        .then((user) => {
            if(!user || !user.validatePassword(password)) {
                return done(null, false, { errors: { 'email or password': 'is invalid' } });
            }

            return done(null, user);
        }).catch(done);
}));
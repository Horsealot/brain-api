const passport = require('passport');
const LocalStrategy = require('passport-local');

const models = require('./../models');

passport.use(new LocalStrategy({
    usernameField: 'user[email]',
    passwordField: 'user[password]',
}, (email, password, done) => {
    models.Users
        .findOne({ where: { email: email }, include: ['squads']})
        .then((user) => {
            if(!user || !user.validatePassword(password)) {
                return done(null, false, { errors: { 'email or password': 'is invalid' } });
            }

            return done(null, user);
        }).catch(done);
}));
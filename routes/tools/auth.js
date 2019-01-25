const jwt = require('express-jwt');
const mongoose = require('mongoose');
const Users = require('./../../models/Users');
const UserRole = require('./../../models/UserRole');
const UsersModel = mongoose.model('Users');

const getTokenFromHeaders = (req) => {
    const { headers: { authorization } } = req;

    if(authorization && authorization.split(' ')[0] === 'Bearer') {
        return authorization.split(' ')[1];
    }
    return null;
};

const auth = {
    required: jwt({
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
    }),
    optional: jwt({
        secret: 'secret',
        userProperty: 'payload',
        getToken: getTokenFromHeaders,
        credentialsRequired: false,
    }),
    loadUser: (req, res, next) => {
        const { payload: { id } } = req;
        UsersModel.findById(id).then((user) => {
            if(!user) {
                return res.sendStatus(400);
            }
            req.user = user;
            next();
        });
    },
    admin: (req, res, next) => {
        if(!req.user) {
            const { payload: { id } } = req;
            UsersModel.findById(id).then((user) => {
                if(!user) {
                    return res.sendStatus(400);
                }
                req.user = user;
                if(!UserRole.isSuperAdmin(req.user)) {
                    return res.sendStatus(401);
                }
                next();
            });
        } else {
            if(!UserRole.isSuperAdmin(req.user)) {
                return res.sendStatus(401);
            }
            next();
        }
    }
};

module.exports = auth;
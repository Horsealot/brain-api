const mongoose = require('mongoose');
const config = require('config');
const crypto = require('crypto');

/** Connect to the database */
mongoose.connect(`${config.get('db.host')}/${config.get('db.db_name')}`, { useNewUrlParser: true });
console.log(`Connecting to ${config.get('db.host')}/${config.get('db.db_name')}`);

const Users = require('./../models/Users');
const UsersModel = mongoose.model('Users');

// Find if already existing
UsersModel.findOne({email: 'tech@horsealot.com'}).then((existingAdmin) => {
    const newPassword = crypto.randomBytes(16).toString('hex');
    if(!existingAdmin) {
        existingAdmin = new UsersModel({email: 'tech@horsealot.com', firstname: 'Brain', lastname: 'Superadmin', roles: ['ADMIN']});
    }
    existingAdmin.setPassword(newPassword);
    existingAdmin.save().then(() => {
        console.log(`Super admin created with password : ${newPassword}`);
        process.exit(1);
    })
});


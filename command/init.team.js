const async = require('async');

// /** Connect to the database */
// mongoose.connect(`${config.get('db.host')}/${config.get('db.db_name')}`, { useNewUrlParser: true });
// console.log(`Connecting to ${config.get('db.host')}/${config.get('db.db_name')}`);

var models = require('./../models');

const baseUsers = [
    {
        email: 'alexandra@horsealot.com',
        firstname: 'Alexandra',
        lastname: 'Martel',
        password: 'alexandra',
        roles: ['ADMIN']
    },
    {
        email: 'thomas@horsealot.com',
        firstname: 'Thomas',
        lastname: 'Desgrippes',
        password: 'thomas',
        roles: ['ADMIN']
    },
    {
        email: 'justine@horsealot.com',
        firstname: 'Justine',
        lastname: 'Eloi',
        password: 'justine',
        roles: ['USER']
    },
    {
        email: 'georgina@horsealot.com',
        firstname: 'Juliette',
        lastname: 'Leroy',
        password: 'juliette',
        roles: ['USER']
    },
    {
        email: 'corentin@horsealot.com',
        firstname: 'Corentin',
        lastname: 'Cronier',
        password: 'corentin',
        roles: ['USER']
    }
]


let processUserPromises = [];
for (let i = 0; i < baseUsers.length; i++) {
    const user = baseUsers[i];
    processUserPromises.push((callback) => {
        models.Users.findOne({where: {email: user.email}}).then((existingUser) => {
            if(!existingUser) {
                existingUser = new models.Users(user);
                existingUser.setPassword(user.password);
                console.log(`User ${user.email} created`);
                return existingUser.save().then((existingUser) => {
                    return models.Squads.findOne({where: {name: 'Horsealot'}});
                }).then((squad) => {
                    if(squad) {
                        existingUser.setSquads([squad]);
                    }
                    return existingUser.save();
                });
            }
        }).then(() => {
            callback();
        })
    })
}
async.waterfall(processUserPromises, () => {
    console.log(`All users created`);
    process.exit(1);
});

/** */
const passport = require('passport');
const models = require('./../models');
const notificationProducer = require('./../producers/notifications');
// const Users = mongoose.model('Users');
// const Invites = mongoose.model('Invites');
// const PasswordRequests = mongoose.model('PasswordRequests');

module.exports = {
    postSquad: async (req, res, next) => {
        const {body: {squad}} = req;

        if (!squad || !squad.name) {
            return res.status(422).json({
                errors: {
                    name: 'is required'
                }
            });
        }


        let existingSquad = await models.Squads.findOne({where: {name: squad.name}});
        if(existingSquad) {
            return res.status(401).json({
                errors: "Squad already existing"
            });
        } else {
            const newSquad = new models.Squads({
                name: squad.name,
                slug: squad.name
            });
            newSquad.save().then(() => {
                res.json({ squad: newSquad.slug });
            });
        }
    },
};

/** */
const models = require('./../models');

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

        const newSquad = new models.Squads({
            name: squad.name
        });
        newSquad.setSlug(squad.name);

        let existingSquad = await models.Squads.findOne({where: {$or: [{name: squad.name}, {slug: newSquad.slug}]}});
        if(existingSquad) {
            return res.status(409).json({
                errors: "Squad already existing"
            });
        } else {
            newSquad.save().then((newSquad) => {
                res.json({ squad: newSquad });
            });
        }
    },
};

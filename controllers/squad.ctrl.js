/** */
const models = require('./../models');
const UserRole = require("../old_models/mongoose/UserRole");

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
    updateSquad: async (req, res, next) => {
        const {body: {squad}} = req;

        if (!squad) {
            return res.status(422).json({
                errors: {
                    squad: 'is required'
                }
            });
        }

        const {params: {id}} = req;
        let dbSquad = await models.Squads.findOne({where: {id: id}});
        if(!dbSquad) {
            return res.sendStatus(404);
        }
        if (!UserRole.isSuperAdmin(req.user) && !(await models.UserSquads.findOne({where: {UserId: req.user.id, SquadId: id, role: 'ADMIN'}}))) {
            return res.sendStatus(403);
        }

        let nameInConflict = false;
        if(squad.name && await models.Squads.findOne({where: {name: squad.name}})) {
            delete squad.name;
            nameInConflict = true;
        }

        let response = dbSquad.updateFromEntity(squad);
        if(nameInConflict) {
            response.name = "conflict";
        }

        return dbSquad.save().then((dbSquad) => {
            res.json({squad: response});
        }).catch((err) => {
            console.log(err);
            res.sendStatus(400);
        });
    },
};

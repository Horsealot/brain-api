/** */
const models = require('./../models');
const asanaService = require('./../services/asana.service');

module.exports = {
    getSquadTodo: async (req, res, next) => {
        const {squad} = req;

        if(!squad.asanaProjectId) {
            return res.status(404).json({
                errors: 'Squad is not linked to an Asana project'
            });
        }

        asanaService.getTodo(squad.asanaProjectId).then((tasks) => {
            let organizedTasks = {
                todo: [],
                inProgress: [],
                done: []
            };
            tasks.map((task) => {
                if(task.done) {
                    organizedTasks.done.push(task);
                } else if(task.inProgress) {
                    organizedTasks.inProgress.push(task);
                } else {
                    organizedTasks.todo.push(task);
                }
            });
            return res.json({
                tasks: organizedTasks
            });
        }).catch((err) => {
            console.log(err);
            if(err.message && err.message === "Not Found") {
                return res.status(404).json({
                    errors: 'Asana project does not exist'
                });
            } else {

                return res.status(502).json({
                    errors: err
                });
            }
        });
    },
};

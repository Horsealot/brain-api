const Asana = require('asana');
const config = require('config')
const client = Asana.Client.create().useAccessToken(config.get('asana.access_token'));

const self = {
    formatTask: (task) => {
        return {
            id: task.id,
            name: task.name,
            inProgress: !!task.assignee,
            done: task.completed,
            assignee: task.assignee ? task.assignee.name : null
        };
    },
    getTodo: (projectId) => {
        return client.projects.tasks(projectId, {
            opt_fields: 'id,gid,name,resource_type,assignee_status,completed,assignee.name'
        }).then((collection) => {
            return new Promise((resolve) => {
                resolve(collection.data.map((task) => self.formatTask(task)));
            });
        }).catch((err) => {
            return new Promise((resolve, reject) => {
                reject(err);
            });
        })
    }
};

module.exports = self;
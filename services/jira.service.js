const JiraApi = require('jira-client');
const config = require('config')

// Initialize
var jira = new JiraApi({
    protocol: 'https',
    host: 'horsealot.atlassian.net',
    username: config.get('jira.email'),
    password: config.get('jira.token'),
    apiVersion: '2',
    strictSSL: true
});


module.exports = {
    getAllBoards: () => {
        jira.getAllBoards().then((data) => {
            console.log(data.values);
        }).catch((err) => {
            console.log(err);
        });
    },
    getIssues: (boardId) => {
        jira.getIssuesForBoard(boardId).then((data) => {
            console.log(data);
        }).catch((err) => {
            console.log(err);
        });
    },

};

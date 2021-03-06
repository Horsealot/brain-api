const availableCommands = [
    {
        file: 'init.admin',
        cmd: 'init-admin',
        description: 'Init the first superadmin'
    },
    {
        file: 'init.team',
        cmd: 'init-team',
        description: 'Init basic team members'
    },
    {
        file: 'create.squad',
        cmd: 'create-squad',
        description: 'Create an empty squad ${SQUAD_NAME}'
    },
    {
        file: 'create.period',
        cmd: 'create-period',
        description: 'Create current period if not existing'
    }
];

if(process.argv.length <= 2) {
    console.log(`Available commands :`);
    availableCommands.forEach(function (val) {
        console.log(`${val.cmd}\t${val.description}`);
    });
} else {
    const cmd = process.argv[2];
    availableCommands.forEach(function (val) {
        if(cmd === val.cmd) {
            require('./command/' + val.file);
        }
    });
}

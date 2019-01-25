const availableCommands = [
    {
        file: 'init.admin',
        cmd: 'init-admin',
        description: 'Init the first superadmin'
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

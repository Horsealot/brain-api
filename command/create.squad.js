const models = require('./../models');

if(process.argv.length <= 2) {
    console.log(`Missing squad name`);
    process.exit(1);
    return;
}

const squadName = process.argv[2];
if(!squadName.length) {
    console.log(`Empty squad name`);
    process.exit(1);
    return;
}

const squad = new models.Squads({name: squadName});
squad.save().then(() => {
    process.exit(1);
}).catch((err) => {
    console.log(`Error creating squad ${err}`);
    process.exit(1);
});

const models = require('./../models');

models.Periods.findOne({where: {startDate: {$lte: new Date()}, endDate: {$gte: new Date()}}}).then((currentPeriod) => {
    if(currentPeriod) {
        console.log(`Period already existing`);
        process.exit(1);
    }
    const currentDate = new Date();
    const month = (new Date()).getMonth();
    if(month < 3) {
        return new models.Periods({
            startDate: new Date(currentDate.getFullYear() + '-01-01T00:00:00Z'),
            endDate: new Date(currentDate.getFullYear() + '-03-31T23:59:59Z'),
        }).save();
    } else if(month < 6) {
        return new models.Periods({
            startDate: new Date(currentDate.getFullYear() + '-04-01T00:00:00Z'),
            endDate: new Date(currentDate.getFullYear() + '-06-30T23:59:59Z'),
        }).save();
    } else if(month < 9) {
        return new models.Periods({
            startDate: new Date(currentDate.getFullYear() + '-07-01T00:00:00Z'),
            endDate: new Date(currentDate.getFullYear() + '-09-30T23:59:59Z'),
        }).save();
    } else {
        return new models.Periods({
            startDate: new Date(currentDate.getFullYear() + '-10-01T00:00:00Z'),
            endDate: new Date(currentDate.getFullYear() + '-12-31T23:59:59Z'),
        }).save();
    }
}).then((latestPeriod) => {
    console.log(`Period created`);
    process.exit(1);
});

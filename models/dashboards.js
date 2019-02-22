'use strict';

module.exports = (sequelize, DataTypes) => {
    const Dashboards = sequelize.define('Dashboards', {
        publicId: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
        },
        name: DataTypes.STRING,
    }, {
        timestamps: false
    });

    Dashboards.associate = function(models) {
        // associations can be defined here
    };

    // Dashboards.prototype.toJSON = function() {
    //     // return {...this.toJSON(), id: this.publicId};
    //     let jsonDashboard = {
    //         id: this.publicId,
    //         name: this.name,
    //         modules: this.modules,
    //     };
    //     return jsonDashboard;
    // };

    return Dashboards;
};
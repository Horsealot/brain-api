'use strict';

module.exports = (sequelize, DataTypes) => {
    const Okrs = sequelize.define('Okrs', {
        link: DataTypes.STRING,
        picture: DataTypes.STRING
    }, {
        timestamps: false
    });

    Okrs.associate = function(models) {
        // associations can be defined here
    };

    /**
     * To JSON
     * @returns {{id: *, link: *, picture: *, isSquad: boolean}}
     */
    Okrs.prototype.toJSON = function() {
        let jsonOKR = {
            id: this.id,
            link: this.link,
            picture: this.picture,
            isSquad: (this.SquadId !== null)
        };
        if(this.period) {
            jsonOKR.period = this.period.toJSON();
        }
        return jsonOKR;
    };

    return Okrs;
};
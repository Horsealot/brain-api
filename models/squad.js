'use strict';

module.exports = (sequelize, DataTypes) => {
    const Squads = sequelize.define('Squads', {
        name: DataTypes.STRING,
        slug: DataTypes.STRING
    }, {});
    Squads.associate = function(models) {
        // associations can be defined here
    };


    /**
     * @returns {{id: *, name: *, slug: *}}
     */
    Squads.prototype.toJSON = function() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug
        };
    };
    /**
     *
     * @param name
     */
    Squads.prototype.setSlug = function(name) {
        this.slug = name
            .toLowerCase()
            .replace(/[^\w ]+/g,'')
            .replace(/ +/g,'-')
            ;
    };

  return Squads;
};
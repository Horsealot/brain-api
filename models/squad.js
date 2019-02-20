'use strict';

module.exports = (sequelize, DataTypes) => {
    const Squads = sequelize.define('Squads', {
        name: DataTypes.STRING,
        slug: {
            type: DataTypes.STRING,
            unique: true
        }
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

    Squads.beforeUpdate(function(user) {
        if(!user.slug) {
            user.setSlug(user.name)
        }
    });

  return Squads;
};
'use strict';

module.exports = (sequelize, DataTypes) => {
    const Squads = sequelize.define('Squads', {
        name: DataTypes.STRING,
        slug: {
            type: DataTypes.STRING,
            unique: true
        },
        asanaProjectId: DataTypes.STRING
    }, {});
    Squads.associate = function(models) {
        // associations can be defined here
    };


    const EDITABLE = [
        "name", "asanaProjectId"
    ];


    /**
     * @returns {{id: *, name: *, slug: *}}
     */
    Squads.prototype.toJSON = function() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug,
            asanaProjectId: this.asanaProjectId
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

    Squads.prototype.updateFromEntity = function(newSquad) {
        const updateStatus = Object.assign({}, newSquad);
        for(let key in newSquad) {
            const upperCaseKey = key.replace(/^\w/, c => c.toUpperCase());
            if(EDITABLE.indexOf(key) >= 0) {
                if(typeof this["set" + upperCaseKey] === 'function') {
                    this["set" + upperCaseKey](newSquad[key]);
                } else {
                    this[key] = newSquad[key];
                }
                updateStatus[key] = "updated";
            } else {
                updateStatus[key] = "not allowed";
            }
        }
        return updateStatus;
    };

  return Squads;
};
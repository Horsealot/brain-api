'use strict';

module.exports = (sequelize, DataTypes) => {
    const DashboardModules = sequelize.define('DashboardModules', {
        type: {
            type: DataTypes.ENUM,
            values: ['chart', 'goal', 'period'],
        },
        order: DataTypes.INTEGER,
        properties: DataTypes.JSON,
        width: DataTypes.INTEGER
    }, {
        timestamps: false
    });

    DashboardModules.associate = function(models) {
        // associations can be defined here
    };

    DashboardModules.prototype.validateProperties = function() {
        const properties = this.properties;
        if(!properties) {
            return {
                error: {properties: 'Mandatory value'}
            };
        }
        switch (this.type) {
            case 'chart':
                const error = { error : {} };
                if(!properties.period) {
                    error.period = 'Mandatory value';
                }
                if(!properties.kpi) {
                    error.kpi = 'Mandatory value';
                }
                if(Object.keys(error.error).length) {
                    return error;
                }
                break;
            case 'goal':
                if(!Array.isArray(properties.categories)) {
                    return {
                        error: {
                            categories: 'Invalid format'
                        }
                    };
                }
                properties.categories.forEach((category) => {
                    const error = { error : {} };
                    if(!category.kpi) {
                        error.kpi = 'Mandatory value';
                    }
                    if(!category.title) {
                        error.title = 'Mandatory value';
                    }
                    if(!category.goal) {
                        error.goal = 'Mandatory value';
                    }
                    if(Object.keys(error.error).length) {
                        return error;
                    }
                });
                break;
            case 'period':
                if(!Array.isArray(properties)) {
                    return {
                        error: {
                            categories: 'Invalid format'
                        }
                    };
                }
                properties.forEach((category) => {
                    const error = { error : {} };
                    if(!category.kpi) {
                        error.kpi = 'Mandatory value';
                    }
                    if(!category.title) {
                        error.title = 'Mandatory value';
                    }
                    if(Object.keys(error.error).length) {
                        return error;
                    }
                });
                break;
            default:
                return {error: {type: 'Invalid type'}};
        }
        return null;
    };

    return DashboardModules;
};
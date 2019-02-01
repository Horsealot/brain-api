'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      publicId: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
      },
      firstname: {
        type: Sequelize.STRING
      },
      lastname: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      hash: {
        type: Sequelize.TEXT
      },
      salt: {
        type: Sequelize.STRING
      },
      updatedAt: {
        type: Sequelize.DATE
      },
      lastUpdatedAt: {
        type: Sequelize.DATE
      },
      lastPasswordUpdateAt: {
        type: Sequelize.DATE
      },
      birthdate: {
        type: Sequelize.DATEONLY
      },
      phoneNumber: {
        type: Sequelize.STRING
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      picture: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.STRING
      },
      scorecard: {
        type: Sequelize.STRING
      },
      jobTitle: {
        type: Sequelize.STRING
      },
      administrativeLink: {
        type: Sequelize.STRING
      },
        roles: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Users');
  }
};
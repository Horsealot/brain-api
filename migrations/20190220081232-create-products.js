
'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.createTable('Products',
          {
              id: {
                  type: Sequelize.INTEGER,
                  primaryKey: true,
                  autoIncrement: true
              },
              name: Sequelize.STRING,
              createdAt: Sequelize.DATE,
              updatedAt: Sequelize.DATE,
          }
      );
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable('Products')
  }
};
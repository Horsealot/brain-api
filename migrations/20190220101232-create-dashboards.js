'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.createTable('Dashboards',
          {
              id: {
                  type: Sequelize.INTEGER,
                  primaryKey: true,
                  autoIncrement: true
              },
              publicId: {
                  type: Sequelize.UUID,
                  defaultValue: Sequelize.UUIDV4,
              },
              SquadId: {
                  type: Sequelize.INTEGER,
                  references: {
                      model: 'Squads',
                      key: 'id'
                  },
                  allowNull: true
              },
              ProductId: {
                  type: Sequelize.INTEGER,
                  references: {
                      model: 'Products',
                      key: 'id'
                  },
                  allowNull: true
              },
              ProductDashboardId: {
                  type: Sequelize.INTEGER,
                  references: {
                      model: 'Dashboards',
                      key: 'id'
                  },
                  allowNull: true
              },
              name: Sequelize.STRING,
              createdAt: Sequelize.DATE,
              updatedAt: Sequelize.DATE,
          }
      );
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable('Dashboards')
  }
};
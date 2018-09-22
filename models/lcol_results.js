/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('lcol_results', {
    search_id: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    result_index: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(1020),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'lcol_results'
  });
};

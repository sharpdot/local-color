/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('lcol_searches', {
    term: {
      type: DataTypes.STRING(1020),
      allowNull: false
    },
    page: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    options: {
      type: DataTypes.STRING(1020),
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(1020),
      allowNull: false
    },
    formdata: {
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
    tableName: 'lcol_searches'
  });
};

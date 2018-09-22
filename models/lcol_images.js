/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('lcol_images', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    jsondata: {
      type: "BLOB",
      allowNull: false
    },
    localpath: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER(11),
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
    tableName: 'lcol_images'
  });
};

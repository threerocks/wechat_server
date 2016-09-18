/**
 * Created by yangtao on 16/2/23.
 */

'use strict';

var schema = db.define('qrUrl',{
  //编号
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  //随机产生的scene_id
  scene_id: {
    type: Sequelize.INTEGER.UNSIGNED
  },
  //传进来的keyword
  keyword: {
    type: Sequelize.STRING
  },
  //状态码
  status: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  //微信返回的url
  qr_url: {
    type: Sequelize.STRING
  }
},{
  tableName: 'qr_url',
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

schema.sync();
module.exports = schema;
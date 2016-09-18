/**
 * Created by yangtao on 16/2/23.
 */
'use strict';

//引用
var util = require('util');
var Base = require('./base');

var Model = function () {
  this.orm = require('../schemas/qr_url');
}
util.inherits(Model, Base);
var me = module.exports = new Model();

Model.prototype.save = function* (data) {
  var values = {
    scene_id: data.scene_id,
    keyword: data.keyword,
    status: data.status,
    qr_url: data.qr_url
  };

  var ret = yield me.orm.create(values);
  return ret;
};
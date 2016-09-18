'use strict';

/**
 * 基础模型
 */
var Model = module.exports = function() {};

/**
 * 获取
 *
 * @param {Object} where 筛选条件
 * @param {Object} options 其它条件
 * @return {Object} 文档
 */
Model.prototype.get = function*(where, options) {
  options = options || {};

  // 生成查询条件
  var queryOptions = {where: where};
  for (var i in options) {
    if (i === 'oneToMany') continue;
    if (i === 'manyToMany') continue;
    queryOptions[i] = options[i];
  }
  queryOptions.raw = true;
  
  // 获取数据
  var data = yield this.orm.findOne(queryOptions);

  // 获取一对多的关联数据
  if (options.oneToMany) {
    data = yield this.getOneToMany(this.orm.name, data, options.oneToMany);
  }

  // 获取多对多关联数据
  if (options.manyToMany) {
    data = yield this.getManyToMany(this.orm.name, data, options.manyToMany);
  }

  // 返回
  return data;
};

/**
 * 通过ID获取
 *
 * @param {Number} id 编号
 * @param {Object} options 其它条件
 * @return {Object} 数据
 */
Model.prototype.getById = function*(id, options) {
  var res = yield this.get({id: id}, options);
  return res;
};

/**
 * 通过字段获取用户信息
 *
 * @param {String} field 字段
 * @param {String} value 值
 * @param {Object} options 其它条件
 * @return {Object} 数据
 */
Model.prototype.getByField = function*(field, value, options) {
  var where = {};
  where[field] = value;

  var res = yield this.get(where, options);
  return res;
};

/**
 * 查找
 *
 * @param {Object} where 筛选条件
 * @param {Object} options 其它条件
 * @return {Array} 文档
 */
Model.prototype.find = function*(where, options) {
  options = options || {};

  // 生成查询条件
  var queryOptions = {where: where};
  for (var i in options) {
    if (i === 'oneToMany') continue;
    if (i === 'manyToMany') continue;
    queryOptions[i] = options[i];
  }
  queryOptions.raw = true;

  // 获取数据
  var data = yield this.orm.findAll(queryOptions);

  // 获取一对多的关联数据
  if (options.oneToMany) {
    data = yield this.getOneToMany(this.orm.name, data, options.oneToMany);
  }

  // 获取多对多关联数据
  if (options.manyToMany) {
    data = yield this.getManyToMany(this.orm.name, data, options.manyToMany);
  }

  // 返回
  return data;
};

/**
 * 删除
 *
 * @param {Number} id 编号
 */
Model.prototype.delete = function*(id) {
  var res = yield this.orm.destroy({where: {id: id}});
  if (!res) {
    throw new Exception(10006);
  }
};

/**
 * 统计数量
 *
 * @param {Object} where 筛选条件
 * @param {Object} other 其它条件
 * @return {Array} 文档
 */
Model.prototype.count = function*(where, other) {
  var options = {where: where};
  for (var i in other) {
    options[i] = other[i];
  }
  options.raw = true;
  
  var res = yield this.orm.count(options);
  return res;
};

// 获取一对多关联数据
Model.prototype.getOneToMany = function*(model, data, oneToMany) {
  for (var i = 0; i < oneToMany.length; i++) {
    if (typeof oneToMany[i] === 'string') {
      var associationData = yield this.getAssociationDataByOneToMany(model, oneToMany[i], data);
      data = yield this.mergeAssociationDataByOneToMany(model, oneToMany[i], data, associationData);
    } else {
      var associationData = yield this.getAssociationDataByOneToMany(model, oneToMany[i].model, data);
      if (oneToMany[i].oneToMany) {
        associationData = yield this.getOneToMany(oneToMany[i].model, associationData, oneToMany[i].oneToMany);
      }
      if (oneToMany[i].manyToMany) {
        associationData = yield this.getManyToMany(oneToMany[i].model, associationData, oneToMany[i].manyToMany);
      }
      data = yield this.mergeAssociationDataByOneToMany(model, oneToMany[i].model, data, associationData);
    }
  }

  return data;
};

// 获取多对多关联数据
Model.prototype.getManyToMany = function*(model, data, manyToMany) {
  for (var i = 0; i < manyToMany.length; i++) {
    if (typeof manyToMany[i] === 'string') {
      var associationInfo = yield this.getAssociationInfo(model, manyToMany[i], data);
      var associationData = yield this.getAssociationData(manyToMany[i], associationInfo);
      data = yield this.mergeAssociationData(
        model, manyToMany[i], data, associationData, associationInfo
      );
    } else {
      var associationInfo = yield this.getAssociationInfo(model, manyToMany[i].model, data);
      var associationData = yield this.getAssociationData(manyToMany[i].model, associationInfo);
      if (manyToMany[i].oneToMany) {
        associationData = yield this.getOneToMany(manyToMany[i].model, associationData, manyToMany[i].oneToMany);
      }
      if (manyToMany[i].manyToMany) {
        associationData = yield this.getManyToMany(manyToMany[i].model, associationData, manyToMany[i].manyToMany);
      }
      data = yield this.mergeAssociationData(
        model, manyToMany[i].model, data, associationData, associationInfo
      );
    }
  }

  return data;
};

// 获取关联信息
Model.prototype.getAssociationInfo = function*(modelA, modelB, data) {
  // 初始化
  var modelAB =
    models[modelA + modelB[0].toUpperCase() + modelB.substr(1)]
      ? modelA + modelB[0].toUpperCase() + modelB.substr(1)
      : modelB + modelA[0].toUpperCase() + modelA.substr(1);
  var idA = modelA + 'Id';
  var idB = modelB + 'Id';

  // 获取编号列表

  if (data instanceof Array) {
    var idsA = data.map(function(item) {
      return item.id;
    });
  } else {
    var idsA = [data.id];
  }

  // 获取关联信息
  var where = {};
  where[idA] = {in: idsA};
  var associations = yield models[modelAB].find(where);

  return associations;
};

// 获取关联数据
Model.prototype.getAssociationData = function*(model, associationInfo) {
  var id = model + 'Id';

  var ids = associationInfo.map(function(item) {
    return item[id];
  });

  var data = yield models[model].find({
    id: {in: ids}
  });

  // 返回
  return data;
}

// 获取关联数据
Model.prototype.getAssociationDataByOneToMany = function*(modelA, modelB, associationInfo) {
  var idA = modelA + 'Id';

  if (associationInfo instanceof Array) {
    var ids = associationInfo.map(function(item) {
      return item.id;
    });
  } else {
    var ids = [associationInfo.id];
  }

  var where = {};
  where[idA] = {in: ids};
  var data = yield models[modelB].find(where);

  // 返回
  return data;
}

// 组合关联数据
Model.prototype.mergeAssociationData = function*(modelA, modelB, data, associationData, associationInfo) {
  var idA = modelA + 'Id';
  var idB = modelB + 'Id';

  var find = data instanceof Array;
  if (!find) {
    data = [data];
  }

  // 关联
  data = data.map(function(item) {
    item[modelB + 's'] = [];

    for (var i = 0; i < associationData.length; i++) {
      for (var j = 0; j < associationInfo.length; j++) {
        if (item.id === associationInfo[j][idA] && associationData[i].id === associationInfo[j][idB]) {
          item[modelB + 's'].push(associationData[i]);
          break;
        }
      }
    }

    return item;
  });

  // 返回
  return find ? data : data[0];
};

// 组合关联数据
Model.prototype.mergeAssociationDataByOneToMany = function*(modelA, modelB, data, associationData) {
  var idA = modelA + 'Id';
  var idB = modelB + 'Id';

  var find = data instanceof Array;
  if (!find) {
    data = [data];
  }

  // 关联
  data = data.map(function(item) {
    item[modelB + 's'] = [];

    for (var i = 0; i < associationData.length; i++) {
      if (item.id === associationData[i][idA]) {
        item[modelB + 's'].push(associationData[i]);
      }
    }

    return item;
  });

  // 返回
  return find ? data : data[0];
};

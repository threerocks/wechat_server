/**
 * Created by CDENG on 15/8/30.
 */
'use strict';


let Ctrl = function() {};
let that = module.exports = new Ctrl();

let CONSTANT = require('../common/constant');
let wx = require("wechat-toolkit");
let request = require('request');
let debug = require('debug')('weixin');
let fase = require('fase');
let async = fase.async;

let weixin = require('./weixin.js');

let getTags = function (str) {
  if (!str) {
    return false;
  }
  let getStr = str.match(/\[\[.+?-.+?\]\]/g);
  let getUrl = str.match(/\[\[\[.+?\]\]\]/g);
  if (!getStr) {
    return false;
  }
  else {
    let tags = getStr[0];
    if(tags.length){
      let key = tags.match(/([\u4E00-\u9FFF]|[\u0061-\u007A]|[\u0041-\u005A])+/g)[0];
      let num = tags.match(/[0-9]+/g)[0];
      let scene_type = tags.match(/([\u4E00-\u9FFF]|[\u0061-\u007A]|[\u0041-\u005A]|[0-9])+/g)[2];
      if(!getUrl){
        return {
          key: key,
          num: parseInt(num),
          scene_type: scene_type
        };
      }
      else {
        let url = getUrl[0];
        url = url.replace('[[[', '');
        url = url.replace(']]]', '');
        return {
          key: key,
          num: parseInt(num),
          scene_type: scene_type,
          urlRedirectFromBind: url
        };
      }
    }
  }
  return false;
}

let generateMediaObj = function (mediaArray) {
  let mediaObj = {};
  mediaArray.forEach(function(media){
    let tags = getTags(media.content);
    if (tags) {
      media.key = tags.key;
      media.num = tags.num;
      media.scene_type = tags.scene_type;
      if (tags.key === 'HYZH') {
        media.url = CONSTANT.URL.WX_OAUTH_INI + config.weixin.appId
          + '&redirect_uri=' + encodeURIComponent(CONSTANT.URL.USER_BIND)
          + '&response_type=code'
          + '&scope=snsapi_userinfo'
          + '&state=' + 'bindAccount' + '#wechat_redirect';
      }
      if (tags.scene_type && tags.urlRedirectFromBind) {
        media.url = CONSTANT.URL.WX_OAUTH_INI + config.weixin.appId
          + '&redirect_uri=' + encodeURIComponent(CONSTANT.URL.USER_BIND + '?redirect=' + encodeURIComponent(tags.urlRedirectFromBind))
          + '&response_type=code'
          + '&scope=snsapi_userinfo'
          + '&state=' + 'bindAccount' + '#wechat_redirect';
      }
      if (!media.scene_type) {
        media.scene_type = 'default';
      }
      mediaObj[CONSTANT.WEIXIN_KEY_SORT[media.key] + '_' + media.scene_type] = mediaObj[CONSTANT.WEIXIN_KEY_SORT[media.key] + '_' + media.scene_type] || [];
      mediaObj[CONSTANT.WEIXIN_KEY_SORT[media.key] + '_' + media.scene_type].push(media);
    }
  });
  for (let key in mediaObj) {
    mediaObj[key].sort(function(obj1,obj2){
      if (obj1.num > obj2.num) {
        return 1;
      }
      else if (obj1.num < obj2.num) {
        return -1;
      }
      else {
        return 0;
      }
    });
  }
  return mediaObj;
}

Ctrl.prototype.mediaFromWeixin = function* (type, MaxNum) {
  let uri = 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=';
  uri += config.weixin.accToken;

  let data = {
    type: type,
    offset: 0,
    count: 20
  };

  let retMedia = {
    item_count: 0,
    item: []
  };

  for(let offset = 0; offset < MaxNum;) {
    data.offset = offset;
    let media = yield func.sendPostRequest(uri,data);

    if (!media || media.errcode || !parseInt(media.item_count) || parseInt(media.item_count) < 0) {
      console.log('err getting media ' + media.errcode);
      break;
    }

    retMedia.total_count = media.total_count;
    retMedia.item_count += media.item_count;
    for (let i = 0; i < media.item.length; i++ ) {
      retMedia.item.push(media.item[i]);
    }
    offset += media.item_count;
    if (offset >= media.total_count) {
      break;
    }
  }

  return retMedia;
}

Ctrl.prototype.refreshMediaObject = function* () {

  let newsMedia = yield that.mediaFromWeixin('news',300);
  let imgMedia = yield that.mediaFromWeixin('image', 300);

  let retArray = [];
  let mediaObj = {};

  if (newsMedia.item_count && newsMedia.item_count > 0) {
    //debug(imgMedia);
    //debug(newsMedia.item[0].content.news_item[0]);
    let count = 
      config.weixin.countMedia < newsMedia.item_count ?
      config.weixin.countMedia :
      newsMedia.item_count;
    for (let iNews = 0; iNews < count; ++iNews) {
      let newObj= {
        title: newsMedia.item[iNews].content.news_item[0].title,
        description: newsMedia.item[iNews].content.news_item[0].digest,
        url: newsMedia.item[iNews].content.news_item[0].url,
        content: newsMedia.item[iNews].content.news_item[0].content,
      };
      let newsThumbId = newsMedia.item[iNews].content.news_item[0].thumb_media_id;
      if (imgMedia.item_count && imgMedia.item_count > 0){
        for (let iImg = 0; iImg < imgMedia.item_count; ++ iImg) {
          if (imgMedia.item[iImg].media_id === newsThumbId) {
            newObj.picurl = imgMedia.item[iImg].url;
            break;
          }
        }
      }

      retArray[iNews] = newObj;
    }
  }
  else {
    retArray = [
      {
        title: '【欢迎2】小鹏哥雅思写作真题解析及预测',
        description: '考生在雅思写作过程中往往面临三种困境：没有观点、没有语言、表达不精彩。怎么办？你需要是精彩的语料库！9月15日晚，经验丰富的小鹏哥针对2015年9月的雅思写作考试精准预测，根据考情预测趋势，分享精彩语料库，让你轻松应对雅思写作！',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊哈哈哈啊[[HY-1－yaya2]][[[http://dev.smartstudy.com:9009/reg/banshee?hmsr=test3]]]'
      },
      {
        title: '【欢迎4】小鹏哥雅思写作真题解析及预测',
        description: '考生在雅思写作过程中往往面临三种困境：没有观点、没有语言、表达不精彩。怎么办？你需要是精彩的语料库！9月15日晚，经验丰富的小鹏哥针对2015年9月的雅思写作考试精准预测，根据考情预测趋势，分享精彩语料库，让你轻松应对雅思写作！',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊哈哈哈啊[[HY-4-GRE1]]'
      },
      {
        title: '【欢迎4】小鹏哥雅思写作真题解析及预测',
        description: '考生在雅思写作过程中往往面临三种困境：没有观点、没有语言、表达不精彩。怎么办？你需要是精彩的语料库！9月15日晚，经验丰富的小鹏哥针对2015年9月的雅思写作考试精准预测，根据考情预测趋势，分享精彩语料库，让你轻松应对雅思写作！',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊哈哈哈啊[[HY-6-GRE1]]'
      },
      {
        title: '【欢迎7】小鹏哥雅思写作真题解析及预测',
        description: '考生在雅思写作过程中往往面临三种困境：没有观点、没有语言、表达不精彩。怎么办？你需要是精彩的语料库！9月15日晚，经验丰富的小鹏哥针对2015年9月的雅思写作考试精准预测，根据考情预测趋势，分享精彩语料库，让你轻松应对雅思写作！',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊哈哈哈啊[[HY-2-GRE3]]'
      },
      {
        title: '【欢迎4】小鹏哥雅思写作真题解析及预测',
        description: '考生在雅思写作过程中往往面临三种困境：没有观点、没有语言、表达不精彩。怎么办？你需要是精彩的语料库！9月15日晚，经验丰富的小鹏哥针对2015年9月的雅思写作考试精准预测，根据考情预测趋势，分享精彩语料库，让你轻松应对雅思写作！',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊哈哈哈啊[[HY-4]]'
      },
      {
        title: '【绑账号1】',
        description: '接收通知',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊[[HYZH-1-HYZH]]<<http://dev.smartstudy.com:9009/reg/banshee?hmsr=test3>>'
      },
      {
        title: '【欢迎3】',
        description: '欢迎',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊[[HY-3-Toefl]]<<http://dev.smartstudy.com:9009/reg/banshee?hmsr=test1>>'
      },
      {
        title: '【欢迎5】',
        description: '欢迎',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊[[HY-5-Toefl]]<<http://dev.smartstudy.com:9009/reg/banshee?hmsr=test2>>'
      },
      {
        title: '【直播】',
        description: '直播',
        url: 'http://mp.weixin.qq.com/s?__biz=MzA5ODIzMDI2NQ==&mid=216246151&idx=1&sn=7c055208f9daae2f97823bd1f85fc1d1#rd',
        picurl: 'http://mmbiz.qpic.cn/mmbiz/iaBmDVE8BLHfvOVEyNdGUTQVqPNCyKAHibvluBYDFOTfJpKNmMFLXMxfFZSyp18jMmrL5UpA2aAjNjqrsDh0997g/640?wx_fmt=jpeg&tp=webp&wxfrom=5',
        content: '啊[[ZB-3]]'
      }
    ];
  }
  mediaObj = yield generateMediaObj(retArray);
  for(let key in mediaObj) {
    yield func.cacheSet(key, JSON.stringify(mediaObj[key]));
  }
  return mediaObj;
};

Ctrl.prototype.refreshMediaInfo = function* (req, res) {
  if (config.authorized.indexOf(req.body.token) === -1) {
    throw new Exception(1101);
  }
  return yield that.refreshMediaObject();
};

Ctrl.prototype.getNewsMedia = function* (getCacheKey) {
  try{
    let cacheStr = yield func.cacheGet(getCacheKey);
    let retObj = JSON.parse(cacheStr);
    if (!retObj) {
      let mediaObj = yield that.refreshMediaObject();
      retObj = mediaObj[getCacheKey];
    }
    if (retObj instanceof Array) {
      return retObj;
    }
    return false;
  }
  catch(e) {
    return false;
  }
}

Ctrl.prototype.getWelcome = function* () {
  try{
    let cacheStr = yield func.cacheGet(CONSTANT.CACHE_KEYS.MEDIA);
    let retObj = JSON.parse(cacheStr);
    if (!retObj) {
      retObj = yield that.refreshMediaObject();
    }
    if (retObj.welcome instanceof Array) {
      return retObj.welcome
    }
    return false;
  }
  catch(e) {
    return false;
  }
}

Ctrl.prototype.getBind = function* () {
  try{
    let cacheStr = yield func.cacheGet(CONSTANT.CACHE_KEYS.MEDIA);
    let retObj = JSON.parse(cacheStr);
    if (!retObj) {
      retObj = yield that.refreshMediaObject();
    }
    if (retObj.bind instanceof Array) {
      return retObj.bind
    }
    return false;
  }
  catch(e) {
    return false;
  }
}

Ctrl.prototype.getLive = function* () {
  try{
    let cacheStr = yield func.cacheGet(CONSTANT.CACHE_KEYS.MEDIA);
    let retObj = JSON.parse(cacheStr);
    if (!retObj) {
      retObj = yield that.refreshMediaObject();
    }
    if (retObj.live instanceof Array) {
      return retObj.live
    }
    return false;
  }
  catch(e) {
    return false;
  }
}
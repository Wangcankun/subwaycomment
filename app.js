// txhash； 346fdcf4c1cd2ee8d0d26d3514652b44609b1f5a5486844006283699fcb8c08a
// n1ibjQU2Z9RbB578tFkRe1ZkUw6Hg3Av9As
// txhash: cec39a6270922c6e9e4d77752ed7de9eb9c7d5d0e251beb352fbfbfcd92b7ef5
// n1ypd7qGoqsmxeNsnj6r736TmpJQUxbLWa6
/**
* 从所有城市列表中获取北京信息
* 结果格式
* {
*     keyword: 'beijing',
*     name: '北京',
*     citycode: '131'
* }
*/
'use strict';
var _g        = {};
_g.contract   = {};
_g.state      = {};
// _g.draw       = {};
_g.wallet     = {};
_g.transaction= {};

// state
_g.state.isDebugging= false;        // use to sign now is main/test
_g.state.citycode   = 0;
_g.state.subwayname = '';
// _g.state.comment    = '';
// _g.state.isChanging = false;        // use to prevent switch module to fast
// _g.state.changeTime = 1000;
// _g.state.isHistoryLoading = false;
// _g.state.nowModule  = 'content';
// contract
_g.contract.mainnetUrl = 'https://mainnet.nebulas.io';
_g.contract.testnetUrl = 'https://testnet.nebulas.io';
_g.contract.address = _g.state.isDebugging? 'n1ibjQU2Z9RbB578tFkRe1ZkUw6Hg3Av9As': 'n1ypd7qGoqsmxeNsnj6r736TmpJQUxbLWa6';    
// draw
// _g.draw.imgUrlPrefix= 'assert/img/MajorArcana/';
// _g.draw.num         = -1;     // num of draw
// _g.draw.maxnum      = 43;     // tarotsNum, it may change when use different tarot mode
// _g.draw.total       = 0;      // total times of user draw
// _g.draw.tarotList   = [];     // all data of tarot (hardcode in data/data.json)
// _g.draw.allData     = [];     // all records of you
// _g.draw.historyData = [];     // all records for show (just use allData is ok but this is faster)
// wallet
_g.wallet.address     = '';   // address read from wallet/walletExtension  
_g.wallet.balance     = -1;   // balance read from wallet/walletExtension
_g.wallet.type        = 87;   // 0-illegality, 87-user wallet, 88-contract wallet
_g.wallet.plugInExist = false;// if walletExtension exist
// transaction
_g.comments = [];

var nebulas = require('nebulas');
var Account = nebulas.Account;
var Neb = new nebulas.Neb();
Neb.setRequest(new nebulas.HttpRequest(_g.state.isDebugging? _g.contract.testnetUrl: _g.contract.mainnetUrl));
var NebPay = require('nebpay');
var nebPay = new NebPay();

function getCityData(citycode) {
  if (Neb.api) {
    Neb.api.call({
      from: _g.wallet.address? _g.wallet.address: _g.contract.address,
      to:   _g.contract.address,
      value: 0,
      contract: {
        function: 'getData',
        args: JSON.stringify([citycode])
      },
      gasPrice: 1000000,
      gasLimit: 2000000
    }).then(function (data) {
      console.log('data', data);
      _g.comments = JSON.parse(data.result);
      console.log('_g.comments：', _g.comments);
      return _g.comments;
    });
  }
}

function submit () {
  // _g.state.subwayname
  console.log(document.getElementById('mycomment').value);
  var comment = document.getElementById('mycomment').value + '';
  var listenCount = 0;
  var hashCount = 0;
  var to        = _g.contract.address;
  var value     = '0';
  var callFunc  = 'save';
  var callArgs  = JSON.stringify([_g.state.citycode, _g.state.subwayname, comment]);
  var options   = {
    goods: {
      name: "subway comment"
    },
    callback: _g.state.isDebugging? NebPay.config.testnetUrl: NebPay.config.mainnetUrl,
  };
  var hashListener = function (txhash) {
    if (hashCount < 8) {
      Neb.api.getTransactionReceipt({
        hash: txhash
      }).then (function (response) { // status: 2(pending) 1(success)
        console.log('response:', response); 
        if (response.status === 1) {
          console.log('write to NEBULAS success!');
          alert('评论写入星云链成功!');
          getCityData(_g.state.citycode);
        } else {
          hashCount++;
          setTimeout(() => {
            hashListener(txhash);
          }, 5000);
        }
      });
    } else {
      console.log('write to NEBULAS timeout');
      alert('timeout');
    }
  }
  var serialNum = nebPay.call(to, value, callFunc, callArgs, options);
  console.log('serialNum:', serialNum);
  var intervalQuery = setInterval(function() {
    nebPay.queryPayInfo(serialNum, options)
      .then(function (dataStr) {
        if (listenCount < 8) {
          var data = JSON.parse(dataStr);
          console.log('data:', data);
          if (data.code === 0) {    // data.code为0即serialNum已确认，可以换hash继续查或者继续等待data.data.status为1
            if (data.data.status === 1) {
              getCityData(_g.state.citycode);
              clearInterval(intervalQuery);
            } else {
              console.log('get transaction txhash， show tarot and wait for writing to NEBULAS by txhash.');
              // tx_loading.text('提交成功，正在写入星云链.');
              setTimeout(function () {
                clearInterval(intervalQuery);
                console.log('data.data:', data.data);
                hashListener(data.data.hash);
              }, 2000);
            }
          } else {
            console.log("data.msg.indexOf('does not exist')", data.msg.indexOf('does not exist'));
            console.log('listenCount:', listenCount);
            if (data.msg.indexOf('does not exist') !== -1 && listenCount>4) {
              console.log('can\'t recognize state of transaction, so go to guide page.');
              setTimeout(function () {
                clearInterval(intervalQuery);
              }, 5000);
            }
          }
          listenCount++;
        } else {
          console.log('网络连接超时, 五秒后自动刷新网页');
          clearInterval(intervalQuery);
          setTimeout(function () {
            window.location.reload(); 
          }, 5000);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }, 10000);
}

function submitEvaluate (key, isGood) {
  console.log('key:', key);
  console.log('isGood:', isGood);

  var listenCount = 0;
  var hashCount = 0;
  var to        = _g.contract.address;
  var value     = '0';
  var callFunc  = 'saveEvaluate';
  var callArgs  = JSON.stringify([key, isGood]);
  var options   = {
    goods: {
      name: "subway comment"
    },
    callback: _g.state.isDebugging? NebPay.config.testnetUrl: NebPay.config.mainnetUrl,
  };
  var hashListener = function (txhash) {
    if (hashCount < 8) {
      Neb.api.getTransactionReceipt({
        hash: txhash
      }).then (function (response) { // status: 2(pending) 1(success)
        console.log('response:', response); 
        if (response.status === 1) {
          console.log('write to NEBULAS success!');
          alert('评论写入星云链成功!');
          getCityData(_g.state.citycode);
        } else {
          hashCount++;
          setTimeout(() => {
            hashListener(txhash);
          }, 5000);
        }
      });
    } else {
      console.log('write to NEBULAS timeout');
      alert('timeout');
    }
  }
  var serialNum = nebPay.call(to, value, callFunc, callArgs, options);
  console.log('serialNum:', serialNum);
  var intervalQuery = setInterval(function() {
    nebPay.queryPayInfo(serialNum, options)
      .then(function (dataStr) {
        if (listenCount < 8) {
          var data = JSON.parse(dataStr);
          console.log('data:', data);
          if (data.code === 0) {    // data.code为0即serialNum已确认，可以换hash继续查或者继续等待data.data.status为1
            if (data.data.status === 1) {
              getCityData(_g.state.citycode);
              clearInterval(intervalQuery);
            } else {
              console.log('get transaction txhash， show tarot and wait for writing to NEBULAS by txhash.');
              // tx_loading.text('提交成功，正在写入星云链.');
              setTimeout(function () {
                clearInterval(intervalQuery);
                console.log('data.data:', data.data);
                hashListener(data.data.hash);
              }, 2000);
            }
          } else {
            console.log("data.msg.indexOf('does not exist')", data.msg.indexOf('does not exist'));
            console.log('listenCount:', listenCount);
            if (data.msg.indexOf('does not exist') !== -1 && listenCount>4) {
              console.log('can\'t recognize state of transaction, so go to guide page.');
              setTimeout(function () {
                clearInterval(intervalQuery);
              }, 5000);
            }
          }
          listenCount++;
        } else {
          console.log('网络连接超时, 五秒后自动刷新网页');
          clearInterval(intervalQuery);
          setTimeout(function () {
            window.location.reload(); 
          }, 5000);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }, 10000);
}

function detectWallet () {
  _g.wallet.plugInExist = typeof(webExtensionWallet) !== 'undefined'? true: false;
  if (!_g.wallet.plugInExist) {
    console.error('wallet no exist');
  }  _g.wallet.plugInExist = typeof(webExtensionWallet) !== 'undefined'? true: false;
}

detectWallet();
window.postMessage({
  'target': 'contentscript',
  'data': {},
  'method': 'getAccount'
}, '*');
window.addEventListener('message', function (e) {
  console.log('e:', e);
  if (e.data && e.data.data) {
    if (e.data.data.account) {
      _g.wallet.address = e.data.data.account;
      console.log('_g.wallet.address:', _g.wallet.address);
    }
  }
});

var subwayCityName = '广州';
var list = BMapSub.SubwayCitiesList;
console.log('list:', list);
var subwaycity = null;
for (var i = 0; i < list.length; i++) {
  if (list[i].name === subwayCityName) {
    subwaycity = list[i];
    _g.state.citycode = subwaycity.citycode;
    setTimeout(() => {
      getCityData(subwaycity.citycode);
    }, 1000);
    break;
  }
}
// get subway data & init subwayMap
var subway = new BMapSub.Subway('container', subwaycity.citycode);
var zoomControl = new BMapSub.ZoomControl({
  anchor: BMAPSUB_ANCHOR_BOTTOM_RIGHT,
  offset: new BMapSub.Size(10, 100)
});
subway.addControl(zoomControl);
subway.setZoom(0.5);

subway.addEventListener('tap', function (e) {
  _g.state.subwayname = e.station.name;
  var dataOfThisSubway = '';
  if (_g.comments.length > 0) {
    for (var i=0; i<_g.comments.length; i++) {
      // console.log(_g.comments[i]);
      if (_g.comments[i].subwayname === _g.state.subwayname) {
        dataOfThisSubway += '<p><span>' + _g.comments[i].comment + '</span>'
                            + '<a href="javascript:void(0)" onclick="submitEvaluate(\''+ _g.comments[i].key +'\', true)">点赞('
                            + _g.comments[i].goodcount + ')</a>&nbsp;&nbsp;'
                            + '<a href="javascript:void(0)" onclick="submitEvaluate(\''+ _g.comments[i].key +'\', false)">差评('
                            + _g.comments[i].badcount + ')</a>'
                            + '</p>';
      }
    }
  }
  dataOfThisSubway = dataOfThisSubway? dataOfThisSubway: '暂无评论记录，快来成为第一位评论者吧~'
  var windowStr = 
    '<div id="bd-subwayInfo">'
    + '<div id="bd-subwayTitle">'
    + e.station.name
    + '</div>'
    + '<div id="subwayContent">'
    + '<div id="simpleComment">'
    + dataOfThisSubway
    // + '<p>haha看来撒娇大家都啦啦队就爱上了大家埃里克</p>'
    // + '<p>haha啊大家案例角动量喀什角动量喀军队垃圾的</p>'
    // + '<p>haha奥克兰大家坷拉建档立卡建档立卡角度来看阿克苏来得及啊离开的烧录卡打开拉萨觉得</p>'
    + '</div>'
    + '</div>'
    + '<div>'
    + '<input type="text" id="mycomment"/>'
    + '<button type="button" id="btn_submit" onclick="submit()">提交</button>'
    + '</div>'
    + '</div>';
  var infowindow = new BMapSub.InfoWindow(windowStr);
  subway.openInfoWindow(infowindow, e.station.name);
  subway.setCenter(e.station.name);
  subway.setZoom(0.8);
});
subway.addEventListener('subwayloaded', function () {
    console.log('地铁图加载完成');
});
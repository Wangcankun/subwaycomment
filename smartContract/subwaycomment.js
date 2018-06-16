'use strict';
var CommentItem = function (text) {
  if (text) {
    var obj = JSON.parse(text);
    this.key        = obj.key;
    this.address    = obj.address;
    this.subwayname = obj.subwayname;
    this.comment    = obj.comment;
    this.goodcount  = obj.goodcount;
    this.badcount   = obj.badcount;
    this.createdate = obj.createdate;
  }
};
CommentItem.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
};

var SubwayCommentContract = function () {
  //  add property to contract
  LocalContractStorage.defineProperty(this, 'ownerAddress');     
  LocalContractStorage.defineProperty(this, 'commentCount', {
    stringify: function (obj) {
      return obj.toString();
    },
    parse: function (str) {
      return new BigNumber(str);
    }
  });
  LocalContractStorage.defineMapProperty(this, 'arrayMap');
  // add map property to contract
  LocalContractStorage.defineMapProperty(this, 'dataMap', {
    stringify: function (obj) {
      return obj.toString();
    },
    parse: function (str) {
      return new CommentItem(str);
    }
  });
};
SubwayCommentContract.prototype = {
  init: function () {         // run once when deploy smartContract
    this.ownerAddress = Blockchain.transaction.from;    // save my address
    this.commentCount = new BigNumber(0);
  },
  _isOwner: function () {
    return this.ownerAddress === Blockchain.transaction.from;
  },
  setOwner: function (newWalletAddress) {
    if (!this._isOwner()) {
      throw new Error('Method is only available to the owner');
    }
    if (!this.verifyAddress(newWalletAddress)) {
      throw new Error('Invaild address');
    }
    this.ownerAddress = newWalletAddress;
    return this.ownerAddress;
  },
  getOwner: function () {
    return this.ownerAddress;
  },
  save: function (cityCode, subwayname, comment) {
    if (!cityCode || !subwayname || !comment) {
      throw new Error('empty content')
    }
    if (typeof(cityCode)!=='string' || typeof(subwayname)!=='string' || typeof(comment)!=='string') {
      throw new Error('name or comment is not a string');
    }
    var from = Blockchain.transaction.from;
    if (!from) {
      throw new Error('Empty address');
    }
    
    var dataKey = cityCode + '@' + Date.now().toString();
    var commentItem = new CommentItem();
    commentItem.key         = dataKey;
    commentItem.address     = from;
    commentItem.subwayname  = subwayname;
    commentItem.comment     = comment;
    commentItem.createdate  = Date.now();
    commentItem.goodcount   = 0;
    commentItem.badcount    = 0;

    this.arrayMap.put(parseInt(this.commentCount), dataKey);
    this.dataMap.put(dataKey, commentItem);
    this.commentCount = this.commentCount.plus(new BigNumber(1));
    return JSON.stringify(commentItem);
  },
  saveEvaluate: function (key, isGood) {
    var totalCount = parseInt(this.commentCount);
    var commentObj;
    for (var i=totalCount-1; i>=0; i--) {
      var datakey = this.arrayMap.get(i);
      if (datakey === key) {
        commentObj = this.dataMap.get(key);
        commentObj.key         = commentObj.key;
        commentObj.address     = commentObj.address;
        commentObj.subwayname  = commentObj.subwayname;
        commentObj.comment     = commentObj.comment;
        commentObj.createdate  = commentObj.createdate;
        commentObj.goodcount   = isGood? commentObj.goodcount+1: commentObj.goodcount;
        commentObj.badcount    = isGood? commentObj.badcount: commentObj.badcount+1;
        this.dataMap.put(key, commentObj);
      }
    }
    return commentObj;
  },
  getData: function (cityCode) {
    var from = Blockchain.transaction.from;
    if (!from) {
      throw new Error('Empty address');
    }
    if (!this.verifyAddress(from)) {
      throw new Error('Invaild address');
    }
    var resultList = [];
    var totalCount = parseInt(this.commentCount);
    if (totalCount > 0) {
      for (var i=totalCount-1; i>=0; i--) {
        var datakey = this.arrayMap.get(i);
        if (datakey.indexOf(cityCode) === 0) {
          var obj = this.dataMap.get(datakey);
          if (obj) {
            resultList.push(obj);
          }
        }
      }
    }
    return resultList;
  },
  getCount: function () {
    return parseInt(this.commentCount);
  },

  // common
  verifyAddress: function (address) {
    return Blockchain.verifyAddress(address)===0? false: true;
  },
  withdraw: function (address, value) {     // withdraw NAS from contract to address
    if (!this._isOwner()) {
      throw new Error('Method is only available to the owner');
    }
    if (!this.verifyAddress(address)) {
      throw new Error('Invaild address');
    }
    if (typeof(value) === 'number') {
      throw new Error('Value type isn\'t number: ', typeof(value));
    }
    Blockchain.transfer(address, new BigNumber(value));
    console.log("transfer result:", result);  
    Event.Trigger("transfer", {
      Transfer: {
          from: Blockchain.transaction.to,
          to: address,
          value: value
      }
    });
    return result;
  }
};
module.exports = SubwayCommentContract;
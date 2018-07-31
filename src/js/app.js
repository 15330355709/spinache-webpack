// Import the page's CSS. Webpack will know what to do with it.
import '../stylesheets/app.css'

// Import libraries we need.
import { default as Web3 } from 'web3'
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import metacoin_artifacts from '../../build/contracts/MetaCoin.json'
import game_artifacts from  '../../build/contracts/Game.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var MetaCoin = contract(metacoin_artifacts)
var Game = contract(game_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts
var account
var $ = require('jquery/src/core')
require('jquery/src/ajax')
require('jquery/src/ajax/xhr')

window.App = {
  start: function () {
    var self = this

    // Bootstrap the MetaCoin abstraction for Use.
    MetaCoin.setProvider(web3.currentProvider);
    Game.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function (err, accs) {
      if (err != null) {
        alert('There was an error fetching your accounts.')
        return
      }

      if (accs.length == 0) {
        alert('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.')
        return
      }

      accounts = accs
      account = accounts[0]

      self.refreshBalance();
      document.getElementById('period').value = '1';
      document.getElementById('origin').value = '0x0000000000000000000000000000000000000000000000000000000000000064';


    })
  },

  setStatus: function (message) {
    var status = document.getElementById('status')
    status.innerHTML = message
  },

  refreshBalance: function () {
    var self = this

    var meta
    MetaCoin.deployed().then(function (instance) {
      meta = instance
      return meta.getBalance.call(account, { from: account })
    }).then(function (value) {
      var balance_element = document.getElementById('balance')
      balance_element.innerHTML = value.valueOf()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error getting balance; see log.')
    })
  },

  sendCoin: function () {
    var self = this

    var amount = parseInt(document.getElementById('amount').value)
    var receiver = document.getElementById('receiver').value

    this.setStatus('Initiating transaction... (please wait)')

    var meta
    MetaCoin.deployed().then(function (instance) {
      meta = instance
      return meta.sendCoin(receiver, amount, { from: account })
    }).then(function (result) {
      self.setStatus(result)
      self.setStatus('Transaction complete!' + result.tx)
      self.refreshBalance()
      var sid = document.getElementById('id').value
      App.sendTx(sid, result.tx,account, '1010101010', 0.1, 1, 1, 1)
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error sending coin; see log.')
    })
  },
  startGame: function () {
    var self = this
    var period = parseInt(document.getElementById('period').value);
    var origin = parseInt(document.getElementById('origin').value);
    var hash = web3.sha3(origin);

    this.setStatus('Initiating transaction... (please wait) hash:'+hash+'origin:'+origin)

    var game
    Game.deployed().then(function (instance) {
      //var value = web3.toWei('10', 'ether');
      game = instance
      return game.startGame(1,2,100,100,50, { from: account,gas:3000000})
    }).then(function (result) {
      self.setStatus('Transaction complete!' + result.tx)
      self.refreshBalance()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error sending coin; see log.')
    })
  },
  open: function () {
    var self = this
    var period = parseInt(document.getElementById('period').value);
    var game
    Game.deployed().then(function (instance) {
      game = instance
      return game.open(period, { from: account,gas:3000000 })
    }).then(function (result) {
      self.setStatus('Transaction complete!' + result.tx)
      self.refreshBalance()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error sending coin; see log.')
    })
  },
  play: function () {
    var self = this
    var period = parseInt(document.getElementById('period').value);
    var origin = document.getElementById('origin').value;
    var hash = web3.sha3(origin,{encoding: 'hex'});
    this.setStatus('Initiating transaction... (please wait) hash:'+hash+'origin:'+origin)
    var game
    Game.deployed().then(function (instance) {
      var value = web3.toWei('10', 'ether');
      game = instance
      return game.play(period, hash, { from: account,value:value,gas:300000})
    }).then(function (result) {
      self.setStatus('Transaction complete!' + result.tx)
      self.refreshBalance()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error sending coin; see log.')
    })
  },
  commitOrigin: function () {
    var self = this
    var period = parseInt(document.getElementById('period').value);
    var origin = document.getElementById('origin').value;
    var game
    Game.deployed().then(function (instance) {
      game = instance
      return game.commitOrigin(period, origin, { from: account,gas:300000})
    }).then(function (result) {
      self.setStatus('Transaction complete!' )
      self.refreshBalance()
    }).catch(function (e) {
      console.log(e)
      self.setStatus('Error sending coin; see log.')
    })
  }

}
window.WS = {
  websocket: null,
  init: function () {
    var userID = WS.generateRandomID()
    WS.setUserIdInnerHTML(userID)
    // 判断当前浏览器是否支持WebSocket
    if ('WebSocket' in window) {
      WS.websocket = new WebSocket('ws://localhost:8081/webservice/websocket/' + userID)
    } else {
      alert('当前浏览器 Not support websocket')
    }

    // 连接发生错误的回调方法
    WS.websocket.onerror = function () {
      WS.setMessageInnerHTML('WebSocket连接发生错误')
    }

    // 连接成功建立的回调方法
    WS.websocket.onopen = function () {
      WS.setMessageInnerHTML('WebSocket连接成功')
    }

    // 接收到消息的回调方法
    WS.websocket.onmessage = function (event) {
      WS.setMessageInnerHTML(event.data)
    }

    // 连接关闭的回调方法
    WS.websocket.onclose = function () {
      WS.setMessageInnerHTML('WebSocket连接关闭')
    }

    // 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
    window.onbeforeunload = function () {
      WS.closeWebSocket()
    }
  },
  // 发送消息函数
  send: function () {
    var message = document.getElementById('text').value
    WS.websocket.send(message)
  },

  // 关闭WebSocket连接
  closeWebSocket: function () {
    WS.websocket.close()
  },
  sendAjax: function () {
    // var sid =$(event.target).data('id').value;
    var sid = document.getElementById('id').value
    $.ajax({
      type: 'POST',
      contentType: 'application/json;charset=UTF-8',
      url: 'http://localhost:8081/webservice/grow/vegetable',
      data: JSON.stringify({
        'txHash': '23423453245345345',
        'period': 1,
        'amount': 12,
        'key': '0101010',
        'sid': sid
      }),
      success: function (data) {
      },
      // 调用出错执行的函数
      error: function () {
      }
    })
  },
  // 将消息显示在网页上
  setMessageInnerHTML: function (innerHTML) {
    document.getElementById('message').innerHTML += innerHTML + '<br/>'
  },
  generateRandomID: function () {
    var x = 100
    var y = 0
    var rand = parseInt(Math.random() * (x - y + 1) + y)
    return rand
  },
  setUserIdInnerHTML: function (userID) {
    document.getElementById('id').value = userID
  }

}

window.addEventListener('load', function () {
  // // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  // if (typeof web3 !== 'undefined') {
  //   console.warn('Using web3 detected from external source. If you find that your accounts don\'t appear or you have 0 MetaCoin, ensure you\'ve configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask')
  //   // Use Mist/MetaMask's provider
  //   window.web3 = new Web3(web3.currentProvider)
  // } else {
  //   console.warn('No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it\'s inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask')
  //   // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
  //   window.web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9545'))
  // }

  App.start()
  WS.init()
  //WS.bindEvents()// 绑定事件

})

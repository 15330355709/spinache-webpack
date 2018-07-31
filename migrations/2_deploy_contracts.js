var ConvertLib = artifacts.require("./ConvertLib.sol");
var Users = artifacts.require("./Users.sol");
var MetaCoin = artifacts.require("./MetaCoin.sol");
var Game = artifacts.require("./Game.sol");
module.exports = function(deployer) {
  deployer.deploy(Users);
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, MetaCoin);
  deployer.deploy(MetaCoin);
  deployer.deploy(Game);
};




const NiftyConnectPass = artifacts.require("NiftyConnectPass");

module.exports = function (deployer, network, accounts) {
  deployer.deploy(NiftyConnectPass, "Nifty Connect Pass", "PASS");
};

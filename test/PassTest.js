const Web3 = require('web3');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { expectRevert, time, expectEvent } = require('@openzeppelin/test-helpers');
const sleep = require("await-sleep");
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const NiftyConnectPass = artifacts.require("NiftyConnectPass");

contract('NiftyConnectPass Contract', (accounts) => {
    it('Test Query Initial Status', async () => {
        const niftyConnectPassInst = await NiftyConnectPass.deployed();

        const symbol = await niftyConnectPassInst.symbol();
        assert.equal(symbol, "PASS", "wrong symbol");

        const name = await niftyConnectPassInst.name();
        assert.equal(name, "Nifty Connect Pass", "wrong name");
    });
});
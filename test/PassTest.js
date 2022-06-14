const Web3 = require('web3');
const crypto = require('crypto');
const truffleAssert = require('truffle-assertions');
const { expectRevert, time, expectEvent } = require('@openzeppelin/test-helpers');
const sleep = require("await-sleep");
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const NiftyConnectPass = artifacts.require("NiftyConnectPass");

const Black = "0";
const Platinum = "1";
const Gold = "2";
const Normal = "3";
const EarlyBird = "4";

const month = 0;
const season = 1;
const yaer = 2;

contract('NiftyConnectPass Contract', (accounts) => {
    it('Test Query Initial Status', async () => {
        const niftyConnectPassInst = await NiftyConnectPass.deployed();

        const symbol = await niftyConnectPassInst.symbol();
        assert.equal(symbol, "PASS", "wrong symbol");

        const name = await niftyConnectPassInst.name();
        assert.equal(name, "Nifty Connect Pass", "wrong name");
    });
    it('Test Mint', async () => {
        const niftyConnectPassInst = await NiftyConnectPass.deployed();
        const owner = accounts[0];
        const player0 = accounts[1];
        const player1 = accounts[2];
        const player2 = accounts[3];
        const player3 = accounts[4];

        let tokenIdIdx = await niftyConnectPassInst.tokenIdIdx(); // 1
        const mintTx = await niftyConnectPassInst.mintGoldTo(month, player0, {value: 15e16, from: player0})
        truffleAssert.eventEmitted(mintTx, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.currTokenId.toString() === tokenIdIdx.toString() && ev.preTokenId.toString() === "0" && ev.nextTokenId.toString() === "0";
        });
        truffleAssert.eventEmitted(mintTx, "Transfer",(ev) => {
            return ev.from.toString() === "0x0000000000000000000000000000000000000000" && ev.to.toString() === player0.toString();
        });
        let attrTemp;

        tokenIdIdx = await niftyConnectPassInst.tokenIdIdx(); // 2
        await time.increase(1);
        const mintTx1 = await niftyConnectPassInst.mintGoldTo(month, player1, {value: 15e16, from: player1})
        truffleAssert.eventEmitted(mintTx1, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.currTokenId.toString() === tokenIdIdx.toString() && ev.preTokenId.toString() === "0" && ev.nextTokenId.toString() === "0";
        });

        tokenIdIdx = await niftyConnectPassInst.tokenIdIdx(); // 3
        await time.increase(1);
        const mintTx2 = await niftyConnectPassInst.mintGoldTo(month, player0, {value: 15e16, from: player0})
        truffleAssert.eventEmitted(mintTx2, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.currTokenId.toString() === tokenIdIdx.toString() && ev.preTokenId.toString() === "1" && ev.nextTokenId.toString() === "0";
        });

        tokenIdIdx = await niftyConnectPassInst.tokenIdIdx(); // 4
        await time.increase(1);
        const mintTx3 = await niftyConnectPassInst.mintGoldTo(month, player2, {value: 15e16, from: player2})
        truffleAssert.eventEmitted(mintTx3, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.currTokenId.toString() === tokenIdIdx.toString() && ev.preTokenId.toString() === "0" && ev.nextTokenId.toString() === "0";
        });

        tokenIdIdx = await niftyConnectPassInst.tokenIdIdx(); // 5
        await time.increase(1);
        const mintTx4 = await niftyConnectPassInst.mintGoldTo(month, player0, {value: 15e16, from: player0})
        truffleAssert.eventEmitted(mintTx4, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.currTokenId.toString() === tokenIdIdx.toString() && ev.preTokenId.toString() === "3" && ev.nextTokenId.toString() === "0";
        });

        tokenIdIdx = await niftyConnectPassInst.tokenIdIdx(); // 6
        await time.increase(1);
        const mintTx5 = await niftyConnectPassInst.mintGoldTo(month, player1, {value: 15e16, from: player1})
        truffleAssert.eventEmitted(mintTx5, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.currTokenId.toString() === tokenIdIdx.toString() && ev.preTokenId.toString() === "2" && ev.nextTokenId.toString() === "0";
        });

        tokenIdIdx = await niftyConnectPassInst.tokenIdIdx(); // 7
        await time.increase(1);
        const mintTx6 = await niftyConnectPassInst.mintGoldTo(month, player0, {value: 15e16, from: player0})
        truffleAssert.eventEmitted(mintTx6, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.currTokenId.toString() === tokenIdIdx.toString() && ev.preTokenId.toString() === "5" && ev.nextTokenId.toString() === "0";
        });

        tokenIdIdx = await niftyConnectPassInst.tokenIdIdx(); // 8
        await time.increase(1);
        const mintTx7 = await niftyConnectPassInst.mintGoldTo(month, player2, {value: 15e16, from: player2})
        truffleAssert.eventEmitted(mintTx7, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.currTokenId.toString() === tokenIdIdx.toString() && ev.preTokenId.toString() === "4" && ev.nextTokenId.toString() === "0";
        });

        // tokenIds of player0: 1->3->5->7
        // tokenIds of player1: 2->6
        // tokenIds of player2: 4->8

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("1"));
        assert.equal(attrTemp["3"].toString(), "0", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "3", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("2"));
        assert.equal(attrTemp["3"].toString(), "0", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "6", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("3"));
        assert.equal(attrTemp["3"].toString(), "1", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "5", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("4"));
        assert.equal(attrTemp["3"].toString(), "0", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "8", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("5"));
        assert.equal(attrTemp["3"].toString(), "3", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "7", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("6"));
        assert.equal(attrTemp["3"].toString(), "2", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("7"));
        assert.equal(attrTemp["3"].toString(), "5", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("8"));
        assert.equal(attrTemp["3"].toString(), "4", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "Nifty Connect Pass", "wrong name");

        const transferTx = await niftyConnectPassInst.transferFrom(player0, player1, web3.utils.toBN("3"), {from: player0});
        truffleAssert.eventEmitted(transferTx, "ValidityPeriodLinkForIssuer",(ev) => {
            return ev.preTokenId.toString() === "1" && ev.nextTokenId.toString() === "5";
        });
        truffleAssert.eventEmitted(transferTx, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.preTokenId.toString() === "2" && ev.nextTokenId.toString() === "6";
        });

        // tokenIds of player0: 1->5->7
        // tokenIds of player1: 2->3->6
        // tokenIds of player2: 4->8

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("1"));
        assert.equal(attrTemp["3"].toString(), "0", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "5", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("2"));
        assert.equal(attrTemp["3"].toString(), "0", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "3", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("3"));
        assert.equal(attrTemp["3"].toString(), "2", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "6", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("4"));
        assert.equal(attrTemp["3"].toString(), "0", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "8", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("5"));
        assert.equal(attrTemp["3"].toString(), "1", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "7", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("6"));
        assert.equal(attrTemp["3"].toString(), "3", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("7"));
        assert.equal(attrTemp["3"].toString(), "5", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("8"));
        assert.equal(attrTemp["3"].toString(), "4", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "Nifty Connect Pass", "wrong name");

        const transferTx1 = await niftyConnectPassInst.safeTransferFrom(player0, player2, web3.utils.toBN("1"), {from: player0});
        truffleAssert.eventEmitted(transferTx1, "ValidityPeriodLinkForIssuer",(ev) => {
            return ev.preTokenId.toString() === "0" && ev.nextTokenId.toString() === "5";
        });
        truffleAssert.eventEmitted(transferTx1, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.preTokenId.toString() === "0" && ev.nextTokenId.toString() === "4";
        });

        // tokenIds of player0: 5->7
        // tokenIds of player1: 2->3->6
        // tokenIds of player2: 1->4->8

        const transferTx2 = await niftyConnectPassInst.safeTransferFrom(player0, player2, web3.utils.toBN("7"), {from: player0});
        truffleAssert.eventEmitted(transferTx2, "ValidityPeriodLinkForIssuer",(ev) => {
            return ev.preTokenId.toString() === "5" && ev.nextTokenId.toString() === "0";
        });
        truffleAssert.eventEmitted(transferTx2, "ValidityPeriodLinkForReceiver",(ev) => {
            return ev.preTokenId.toString() === "4" && ev.nextTokenId.toString() === "8";
        });

        // tokenIds of player0: 5
        // tokenIds of player1: 2->3->6
        // tokenIds of player2: 1->4->7->8

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("5"));
        assert.equal(attrTemp["3"].toString(), "0", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "Nifty Connect Pass", "wrong name");
    });
});
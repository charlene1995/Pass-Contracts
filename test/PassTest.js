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
const year = 2;

contract('NiftyConnectPass Contract', (accounts) => {
    it('Test Query Initial Status', async () => {
        const niftyConnectPassInst = await NiftyConnectPass.deployed();

        const symbol = await niftyConnectPassInst.symbol();
        assert.equal(symbol, "PASS", "wrong symbol");

        const name = await niftyConnectPassInst.name();
        assert.equal(name, "Nifty Connect Pass", "wrong name");
    });
    it('Test Mint Gold Card', async () => {
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
        assert.equal(attrTemp["3"].toString(), "0", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "3", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("2"));
        assert.equal(attrTemp["3"].toString(), "0", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "6", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("3"));
        assert.equal(attrTemp["3"].toString(), "1", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "5", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("4"));
        assert.equal(attrTemp["3"].toString(), "0", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "8", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("5"));
        assert.equal(attrTemp["3"].toString(), "3", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "7", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("6"));
        assert.equal(attrTemp["3"].toString(), "2", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "wrong next tokenId");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("7"));
        assert.equal(attrTemp["3"].toString(), "5", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "wrong next tokenId");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("8"));
        assert.equal(attrTemp["3"].toString(), "4", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "wrong next tokenId");

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
        assert.equal(attrTemp["3"].toString(), "0", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "5", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("2"));
        assert.equal(attrTemp["3"].toString(), "0", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "3", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("3"));
        assert.equal(attrTemp["3"].toString(), "2", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "6", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("4"));
        assert.equal(attrTemp["3"].toString(), "0", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "8", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("5"));
        assert.equal(attrTemp["3"].toString(), "1", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "7", "Nifty Connect Pass", "wrong name");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("6"));
        assert.equal(attrTemp["3"].toString(), "3", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "wrong next tokenId");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("7"));
        assert.equal(attrTemp["3"].toString(), "5", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "wrong next tokenId");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("8"));
        assert.equal(attrTemp["3"].toString(), "4", "Nifty Connect Pass", "wrong name");
        assert.equal(attrTemp["4"].toString(), "0", "wrong next tokenId");

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
        assert.equal(attrTemp["3"].toString(), "0", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "0", "wrong next tokenId");
    });
    it('Test Mint Normal Card', async () => {
        const niftyConnectPassInst = await NiftyConnectPass.deployed();
        const owner = accounts[0];
        const player0 = accounts[5];
        const player1 = accounts[6];
        const player2 = accounts[7];
        const player3 = accounts[8];

        // tokenId 9
        await niftyConnectPassInst.mintNormalTo(year, player0, {value: 100e15, from: player0})
        // tokenId 10
        await niftyConnectPassInst.mintNormalTo(month, player0, {value: 15e15, from: player0})
        // tokenId 11
        await niftyConnectPassInst.mintNormalTo(season, player0, {value: 35e15, from: player0})

        await time.increase(1);
        // tokenId 12
        await niftyConnectPassInst.mintNormalTo(year, player1, {value: 100e15, from: player1})
        // tokenId 13
        await niftyConnectPassInst.mintNormalTo(month, player1, {value: 15e15, from: player1})
        // tokenId 14
        await niftyConnectPassInst.mintNormalTo(season, player1, {value: 35e15, from: player1})

        await time.increase(1);
        // tokenId 15
        await niftyConnectPassInst.mintNormalTo(year, player2, {value: 100e15, from: player2})
        // tokenId 16
        await niftyConnectPassInst.mintNormalTo(month, player2, {value: 15e15, from: player2})
        // tokenId 17
        await niftyConnectPassInst.mintNormalTo(season, player2, {value: 35e15, from: player2})

        let attrTemp;


        // Normal card
        // player0 10->11->9
        // player1 13->14->12
        // player2 16->17->15

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("9"));
        assert.equal(attrTemp["3"].toString(), "11", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "0", "wrong next tokenId");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("10"));
        assert.equal(attrTemp["3"].toString(), "0", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "11", "wrong next tokenId");

        attrTemp = await niftyConnectPassInst.attributionHub(web3.utils.toBN("11"));
        assert.equal(attrTemp["3"].toString(), "10", "wrong previous tokenId");
        assert.equal(attrTemp["4"].toString(), "9", "wrong next tokenId");

        const longestTokenId0 = await niftyConnectPassInst.userToLongestValidityPeriodMap(Normal, player0);
        assert.equal(longestTokenId0.toString(), "9", "wrong tokenId");

        const longestTokenId1 = await niftyConnectPassInst.userToLongestValidityPeriodMap(Normal, player1);
        assert.equal(longestTokenId1.toString(), "12", "wrong tokenId");

        const longestTokenId2 = await niftyConnectPassInst.userToLongestValidityPeriodMap(Normal, player2);
        assert.equal(longestTokenId2.toString(), "15", "wrong tokenId");
    });
    it('Test Mint Other Card', async () => {
        const niftyConnectPassInst = await NiftyConnectPass.deployed();
        const owner = accounts[0];
        const player0 = accounts[1];
        const player1 = accounts[2];
        const player2 = accounts[3];
        const player3 = accounts[4];
        const player4 = accounts[5];
        const player7 = accounts[8];
        const player8 = accounts[9];

        await niftyConnectPassInst.addSigner(owner, {from: owner});

        let salt = "0x"+crypto.randomBytes(32).toString("hex");
        let signPayload = await niftyConnectPassInst.signaturePayload(player7, Black, salt);
        let signature = await web3.eth.sign(signPayload, owner);
        signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");

        let alreadyMinted = await niftyConnectPassInst.alreadyMinted(player7, Black, salt);
        assert.equal(alreadyMinted.toString(), "false", "wrong alreadyMinted");

        await niftyConnectPassInst.mintBlackOrPlatinumTo(player7, Black, salt, signature, {from: player7});

        alreadyMinted = await niftyConnectPassInst.alreadyMinted(player7, Black, salt);
        assert.equal(alreadyMinted.toString(), "true", "wrong alreadyMinted");

        salt = "0x"+crypto.randomBytes(32).toString("hex");
        signPayload = await niftyConnectPassInst.signaturePayload(player0, EarlyBird, salt);
        signature = await web3.eth.sign(signPayload, owner);
        signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
        await niftyConnectPassInst.mintEarlyBirdTo(player0, salt, signature, {from: player0});

        salt = "0x"+crypto.randomBytes(32).toString("hex");
        signPayload = await niftyConnectPassInst.signaturePayload(player8, Platinum, salt);
        signature = await web3.eth.sign(signPayload, owner);
        signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
        await niftyConnectPassInst.mintBlackOrPlatinumTo(player8, Platinum, salt, signature, {from: player8});

        salt = "0x"+crypto.randomBytes(32).toString("hex");
        signPayload = await niftyConnectPassInst.signaturePayload(player4, EarlyBird, salt);
        signature = await web3.eth.sign(signPayload, owner);
        signature = signature.substr(0, 130) + (signature.substr(130) == "00" ? "1b" : "1c");
        await niftyConnectPassInst.mintEarlyBirdTo(player4, salt, signature, {from: player4});
    });
    it('Test redeem', async () => {
        const niftyConnectPassInst = await NiftyConnectPass.deployed();
        const owner = accounts[0];
        const player0 = accounts[1];

        try {
            await niftyConnectPassInst.redeem(player0, "0x0000000000000000000000000000000000000000", {from: player0});
            assert.fail();
        } catch (error) {
            assert.ok(error.toString().includes("Ownable: caller is not the owner"));
        }
        await niftyConnectPassInst.redeem(owner, "0x0000000000000000000000000000000000000000", {from: owner});
    });
    it('Test calculateFee', async () => {
        const niftyConnectPassInst = await NiftyConnectPass.deployed();
        const owner = accounts[0];
        const governor = accounts[0];
        const player0 = accounts[1];
        const player1 = accounts[2];
        const player2 = accounts[3];
        const player3 = accounts[4];
        const player4 = accounts[5];
        const player5 = accounts[6];
        const player6 = accounts[7];
        const player7 = accounts[8];
        const player8 = accounts[9];

        let feeRatePlayer0 = await niftyConnectPassInst.calculateFee(player0);
        assert.equal(feeRatePlayer0.toString(), "0", "wrong fee");

        let feeRatePlayer1 = await niftyConnectPassInst.calculateFee(player1);
        assert.equal(feeRatePlayer1.toString(), "0", "wrong fee");

        let feeRatePlayer2 = await niftyConnectPassInst.calculateFee(player2);
        assert.equal(feeRatePlayer2.toString(), "0", "wrong fee");

        let feeRatePlayer3 = await niftyConnectPassInst.calculateFee(player3);
        assert.equal(feeRatePlayer3.toString(), "200", "wrong normal fee");

        let feeRatePlayer4 = await niftyConnectPassInst.calculateFee(player4);
        assert.equal(feeRatePlayer4.toString(), "35", "wrong normal fee");

        let feeRatePlayer5 = await niftyConnectPassInst.calculateFee(player5);
        assert.equal(feeRatePlayer5.toString(), "35", "wrong normal fee");

        let feeRatePlayer6 = await niftyConnectPassInst.calculateFee(player6);
        assert.equal(feeRatePlayer6.toString(), "35", "wrong normal fee");

        let feeRatePlayer7 = await niftyConnectPassInst.calculateFee(player7);
        assert.equal(feeRatePlayer7.toString(), "0", "wrong normal fee");

        let feeRatePlayer8 = await niftyConnectPassInst.calculateFee(player8);
        assert.equal(feeRatePlayer8.toString(), "20", "wrong normal fee");

        try {
            await niftyConnectPassInst.changeDefaultFeeRate(300, {from: player0});
            assert.fail();
        } catch (error) {
            assert.ok(error.toString().includes("Governable: caller is not the governor"));
        }
        await niftyConnectPassInst.changeDefaultFeeRate(300, {from: governor});
        feeRatePlayer3 = await niftyConnectPassInst.calculateFee(player3);
        assert.equal(feeRatePlayer3.toString(), "300", "wrong default fee");

        await niftyConnectPassInst.changeNormalCardFeeRate(50, {from: governor});
        feeRatePlayer4 = await niftyConnectPassInst.calculateFee(player4);
        assert.equal(feeRatePlayer4.toString(), "50", "wrong normal fee");

        await niftyConnectPassInst.changePlatinumCardFeeRate(25, {from: governor});
        feeRatePlayer8 = await niftyConnectPassInst.calculateFee(player8);
        assert.equal(feeRatePlayer8.toString(), "25", "wrong normal fee");
    });
});
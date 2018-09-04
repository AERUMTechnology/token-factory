let utils = require("./utils");

let ERC223Token = artifacts.require('ERC223Token');
let TokenFactory = artifacts.require('TokenFactory');

let TestContractReceiver = artifacts.require('TestContractReceiver');
let TestNotReceivingContract = artifacts.require('TestNotReceivingContract');

contract('TokenFactory', (accounts) => {

  var token;
  var factory;

  beforeEach(async () => {
    factory = await TokenFactory.new();

    let tx = await factory.create("Asset Token", "CLR", 18, 1000);
    let addr = utils.getEventArg(tx, "NewToken", "token");
    token = await utils.contractAt(ERC223Token, addr);
  });

  it("Contracts should exist", async () => {
    assert.isTrue(!!factory, 'Factory is not deployed');
    assert.isTrue(!!token, 'Token is not deployed');
  });

  it('Should be able to access token properties', async () => {
      assert.equal(await token.name.call(), "Asset Token");
      assert.equal(await token.symbol.call(), "CLR");
      assert.equal(await token.decimals.call(), 18);
      assert.equal(await token.totalSupply.call(), 1000000000000000000000);
  });

  it('Should be able to transfer tokens to an address', async () => {
    const addrSender = accounts[1];
    const addrRecipient = accounts[2];

    const balanceSenderStart = await token.balanceOf.call(addrSender);
    const balanceRecipientStart = await token.balanceOf.call(addrRecipient);

    const fundVal = 100;
    await token.transfer(addrSender, fundVal);

    const balanceSenderFund = await token.balanceOf.call(addrSender);
    const balanceRecipientFund = await token.balanceOf.call(addrRecipient);

    const transferVal = 50;
    const transferRes = await token.transfer(addrRecipient, transferVal, { from: addrSender });

    const balanceSenderAfterTransfer = await token.balanceOf.call(addrSender);
    const balanceRecipientAfterTransfer = await token.balanceOf.call(addrRecipient);

    const transferEvent = transferRes.logs.find(element => element.event.match('Transfer'));
    const transferEventFrom = transferEvent.args.from;
    const transferEventTo = transferEvent.args.to;
    const transferEventValue = transferEvent.args.value.toNumber()

    assert(transferEvent != null);
    assert.strictEqual(transferEventFrom, addrSender);
    assert.strictEqual(transferEventTo, addrRecipient);
    assert.strictEqual(transferEventValue, transferVal);

    assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
    assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

    assert.strictEqual(balanceSenderFund.toNumber() - transferVal, balanceSenderAfterTransfer.toNumber());
    assert.strictEqual(balanceRecipientFund.toNumber() + transferVal, balanceRecipientAfterTransfer.toNumber());
  });

  it('Should NOT be able to transfer more tokens than in the account to an address', async () => {
    const addrSender = accounts[1];
    const addrRecipient = accounts[2];

    const balanceSenderStart = await token.balanceOf.call(addrSender);
    const balanceRecipientStart = await token.balanceOf.call(addrRecipient);

    const fundVal = 100;
    await token.transfer(addrSender, fundVal);

    const balanceSenderFund = await token.balanceOf.call(addrSender);
    const balanceRecipientFund = await token.balanceOf.call(addrRecipient);

    try {
      const transferVal = balanceSenderFund.toNumber() + 50;
      await token.transfer(addrRecipient, transferVal, { from: addrSender });
    } catch (error) {
      utils.assertVMError(error);
    }

    const balanceSenderAfterTransfer = await token.balanceOf.call(addrSender);
    const balanceRecipientAfterTransfer = await token.balanceOf.call(addrRecipient);

    assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
    assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

    assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
    assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());
  });

  it('Should be able to transfer tokens to a contract', async () => { 
    let receiver = await TestContractReceiver.new();

    const addrSender = accounts[1];
    const addrRecipient = receiver.address;

    const balanceSenderStart = await token.balanceOf.call(addrSender);
    const balanceRecipientStart = await token.balanceOf.call(addrRecipient);

    const fundVal = 100;
    await token.transfer(addrSender, fundVal);

    const balanceSenderFund = await token.balanceOf.call(addrSender);
    const balanceRecipientFund = await token.balanceOf.call(addrRecipient);

    const receiverEvents = receiver.allEvents();

    const transferVal = 50;
    const transferRes = await token.transfer(addrRecipient, transferVal, { from: addrSender });

    const balanceSenderAfterTransfer = await token.balanceOf.call(addrSender);
    const balanceRecipientAfterTransfer = await token.balanceOf.call(addrRecipient);

    const transferEvent = transferRes.logs.find(element => element.event.match('Transfer'));
    const transferEventFrom = transferEvent.args.from;
    const transferEventTo = transferEvent.args.to;
    const transferEventValue = transferEvent.args.value.toNumber()

    assert(transferEvent != null);
    assert.strictEqual(transferEventFrom, addrSender);
    assert.strictEqual(transferEventTo, addrRecipient);
    assert.strictEqual(transferEventValue, transferVal);

    assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
    assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

    assert.strictEqual(balanceSenderFund.toNumber() - transferVal, balanceSenderAfterTransfer.toNumber());
    assert.strictEqual(balanceRecipientFund.toNumber() + transferVal, balanceRecipientAfterTransfer.toNumber());

    receiverEvents.watch((error, response) => {
      assert.strictEqual(error, null);

      const calledEventFrom = response.args.from;
      const calledEventData = response.args.data;
      const calledEventValue = response.args.value.toNumber();

      assert(response.event == "Called");
      assert.strictEqual(calledEventFrom, addrSender);
      assert.strictEqual(calledEventData, '0x');
      assert.strictEqual(calledEventValue, transferVal);
    });

    receiverEvents.stopWatching();
  });

  it('Should NOT be able to transfer more tokens than in the account to a contract', async () => {
    let receiver = await TestContractReceiver.new();

    const addrSender = accounts[1];
    const addrRecipient = receiver.address;

    const balanceSenderStart = await token.balanceOf.call(addrSender);
    const balanceRecipientStart = await token.balanceOf.call(addrRecipient);

    const fundVal = 100;
    await token.transfer(addrSender, fundVal);

    const balanceSenderFund = await token.balanceOf.call(addrSender);
    const balanceRecipientFund = await token.balanceOf.call(addrRecipient);

    const transferVal = fundVal + 50;
    try {
      await token.transfer(addrRecipient, transferVal, { from: addrSender });
    } catch (error) {
      utils.assertVMError(error);
    }

    const balanceSenderAfterTransfer = await token.balanceOf.call(addrSender);
    const balanceRecipientAfterTransfer = await token.balanceOf.call(addrRecipient);

    assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
    assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

    assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
    assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());
  });

  it('Should NOT be able to transfer tokens to a contract without fallback function', async () => {
    let receiver = await TestNotReceivingContract.new();

    const addrSender = accounts[1];
    const addrRecipient = receiver.address;

    const balanceSenderStart = await token.balanceOf.call(addrSender);
    const balanceRecipientStart = await token.balanceOf.call(addrRecipient);

    const fundVal = 100;
    await token.transfer(addrSender, fundVal);

    const balanceSenderFund = await token.balanceOf.call(addrSender);
    const balanceRecipientFund = await token.balanceOf.call(addrRecipient);

    const transferVal = 50;
    try {
      await token.transfer(addrRecipient, transferVal, { from: addrSender });
    } catch (error) {
      utils.assertVMError(error);
    }

    const balanceSenderAfterTransfer = await token.balanceOf.call(addrSender);
    const balanceRecipientAfterTransfer = await token.balanceOf.call(addrRecipient);

    assert.strictEqual(balanceSenderStart.toNumber() + fundVal, balanceSenderFund.toNumber());
    assert.strictEqual(balanceRecipientStart.toNumber(), balanceRecipientFund.toNumber());

    assert.strictEqual(balanceSenderFund.toNumber(), balanceSenderAfterTransfer.toNumber());
    assert.strictEqual(balanceRecipientFund.toNumber(), balanceRecipientAfterTransfer.toNumber());
  });

});

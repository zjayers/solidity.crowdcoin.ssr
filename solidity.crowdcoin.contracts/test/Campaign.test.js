const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");

const provider = ganache.provider();
const web3 = new Web3(provider);

const {
  bytecode: campaignBytecode,
  interface: campaignInterface,
} = require("../etherium/build/Campaign.json");
const jsonCampaignInterface = JSON.parse(campaignInterface);

const {
  bytecode: factoryBytecode,
  interface: factoryInterface,
} = require("../etherium/build/CampaignFactory.json");
const jsonFactoryInterface = JSON.parse(factoryInterface);

describe("Campaign Contract", () => {
  let accounts;
  let campaignContract;
  let factoryContract;
  let campaignAddress;

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    factoryContract = await new web3.eth.Contract(jsonFactoryInterface)
      .deploy({ data: factoryBytecode })
      .send({ from: accounts[0], gas: "1000000" });

    await factoryContract.methods.createCampaign("100").send({
      from: accounts[0],
      gas: "1000000",
    });

    // Get the deployed campaign address and contract
    [
      campaignAddress,
    ] = await factoryContract.methods.getDeployedCampaigns().call();
    campaignContract = await new web3.eth.Contract(
      jsonCampaignInterface,
      campaignAddress
    );
  });

  it("should deploy a factory and a campaign", function () {
    assert.ok(factoryContract.options.address);
    assert.ok(campaignContract.options.address);
  });

  it("marks caller as the campaign manager", async () => {
    const manager = await campaignContract.methods.manager().call();
    assert.strictEqual(accounts[0], manager);
  });

  it("allows people to contribute money and marks them as approvers", async () => {
    await campaignContract.methods.contribute().send({
      value: "200",
      from: accounts[1],
    });
    const isContributor = await campaignContract.methods
      .contributors(accounts[1])
      .call();
    assert(isContributor);
  });

  it("requires a minimum contribution", async () => {
    try {
      await campaignContract.methods.contribute().send({
        value: "5",
        from: accounts[1],
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("allows a manager to make a payment request", async () => {
    await campaignContract.methods
      .createSpendingRequest("Buy batteries", "100", accounts[1])
      .send({
        from: accounts[0],
        gas: "1000000",
      });
    const request = await campaignContract.methods.spendingRequests(0).call();

    assert.strictEqual("Buy batteries", request.description);
  });

  it("processes requests", async () => {
    await campaignContract.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei("10", "ether"),
    });

    await campaignContract.methods
      .createSpendingRequest("A", web3.utils.toWei("5", "ether"), accounts[1])
      .send({ from: accounts[0], gas: "1000000" });

    await campaignContract.methods.approveRequest(0).send({
      from: accounts[0],
      gas: "1000000",
    });

    await campaignContract.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: "1000000",
    });

    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, "ether");
    balance = parseFloat(balance);

    assert(balance > 104);
  });
});

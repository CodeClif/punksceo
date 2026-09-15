const { expect } = require("chai");
const { utils, constants } = require("ethers");
const { network } = require("hardhat");

describe("Bribes defensive regression checks", function () {
  const peth = utils.parseEther;
  const BRIBE_AMOUNT = peth("100000");
  const CLAIM_SECONDS = 100;

  let ceo, punkOwner, contributor, caller;
  let cig, punks, bribes;

  function slogan32(text) {
    return utils.formatBytes32String(text);
  }

  async function deployFixture({ ceoOwnsPunk }) {
    [ceo, punkOwner, contributor, caller] = await ethers.getSigners();

    const CigTokenMock = await ethers.getContractFactory("CigTokenMock");
    cig = await CigTokenMock.deploy(ceo.address);
    await cig.deployed();

    await cig.mint(ceo.address, peth("1000000"));
    await cig.mint(contributor.address, peth("1000000"));

    const PunkMock = await ethers.getContractFactory("PunkMock");
    const ownerOf4513 = ceoOwnsPunk ? ceo.address : punkOwner.address;
    punks = await PunkMock.deploy(ownerOf4513, ceo.address, contributor.address);
    await punks.deployed();

    const Bribes = await ethers.getContractFactory("Bribes");
    bribes = await Bribes.deploy(
      cig.address,
      punks.address,
      1,   // claim days
      30,  // state days
      CLAIM_SECONDS,
      0    // min blocks for the test fixture
    );
    await bribes.deployed();

    await bribes.updateMinAmount();
    await cig.connect(contributor).approve(bribes.address, constants.MaxUint256);

    await bribes.connect(contributor).newBribe(
      4513,
      BRIBE_AMOUNT,
      0,
      20,
      0,
      20,
      slogan32("regression")
    );
  }

  it("documents that accept() does not currently verify actual Punk ownership", async function () {
    await deployFixture({ ceoOwnsPunk: false });

    const actualOwner = await punks.callStatic.punkIndexToAddress(4513);
    expect(actualOwner).to.equal(punkOwner.address);
    expect(actualOwner).to.not.equal(ceo.address);

    await expect(bribes.connect(ceo).accept(0, 20, 0))
      .to.emit(bribes, "Accepted")
      .withArgs(1);

    expect(await bribes.acceptedBribeID()).to.equal(1);
  });

  it("documents that payout() can advance updatedAt even when no additional amount becomes claimable", async function () {
    await deployFixture({ ceoOwnsPunk: true });
    await bribes.connect(ceo).accept(0, 20, 0);

    let info = await bribes.getInfo(ceo.address);
    let accepted = info[3];
    const acceptedAt = accepted.updatedAt.toNumber();

    await network.provider.send("evm_setNextBlockTimestamp", [acceptedAt + 20]);
    await bribes.connect(caller).payout(20, 0, 20);

    info = await bribes.getInfo(ceo.address);
    accepted = info[3];
    const claimedAfterFirstPayout = accepted.claimed;
    const firstUpdatedAt = accepted.updatedAt.toNumber();

    expect(claimedAfterFirstPayout).to.equal(peth("20000"));

    await network.provider.send("evm_setNextBlockTimestamp", [firstUpdatedAt + 1]);
    await bribes.connect(caller).payout(20, 0, 20);

    info = await bribes.getInfo(ceo.address);
    accepted = info[3];

    expect(accepted.claimed).to.equal(claimedAfterFirstPayout);
    expect(accepted.updatedAt.toNumber()).to.equal(firstUpdatedAt + 1);
  });

  it("documents that the Burned path does not reduce CIG totalSupply", async function () {
    await deployFixture({ ceoOwnsPunk: false });
    await bribes.connect(ceo).accept(0, 20, 0);

    let info = await bribes.getInfo(ceo.address);
    const acceptedAt = info[3].updatedAt.toNumber();

    const supplyBefore = await cig.totalSupply();
    const bribesBalanceBefore = await cig.balanceOf(bribes.address);

    await network.provider.send("evm_setNextBlockTimestamp", [acceptedAt + CLAIM_SECONDS]);
    await expect(bribes.connect(caller).payout(20, 0, 20))
      .to.emit(bribes, "Burned")
      .withArgs(1, BRIBE_AMOUNT);

    const supplyAfter = await cig.totalSupply();
    const bribesBalanceAfter = await cig.balanceOf(bribes.address);

    expect(supplyAfter).to.equal(supplyBefore);
    expect(bribesBalanceAfter).to.equal(bribesBalanceBefore);
    expect(await bribes.acceptedBribeID()).to.equal(0);
  });
});

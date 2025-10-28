const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReputationScore", function () {
  let reputationScore;
  let owner;
  let user1;
  let user2;
  let authorized;
  let unauthorized;

  beforeEach(async function () {
    [owner, user1, user2, authorized, unauthorized] = await ethers.getSigners();

    const ReputationScore = await ethers.getContractFactory("ReputationScore");
    reputationScore = await ReputationScore.deploy();
    await reputationScore.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await reputationScore.owner()).to.equal(owner.address);
    });

    it("Should authorize owner by default", async function () {
      expect(await reputationScore.authorizedCallers(owner.address)).to.be.true;
    });

    it("Should have correct level thresholds", async function () {
      expect(await reputationScore.LEVEL_ACTIVE()).to.equal(101n);
      expect(await reputationScore.LEVEL_TRUSTED()).to.equal(501n);
      expect(await reputationScore.LEVEL_VETERAN()).to.equal(1001n);
      expect(await reputationScore.LEVEL_LEGEND()).to.equal(5001n);
    });
  });

  describe("Authorization Management", function () {
    it("Should allow owner to add authorized caller", async function () {
      await expect(reputationScore.addAuthorizedCaller(authorized.address))
        .to.emit(reputationScore, "AuthorizedCallerAdded")
        .withArgs(authorized.address);

      expect(await reputationScore.authorizedCallers(authorized.address)).to.be.true;
    });

    it("Should allow owner to remove authorized caller", async function () {
      await reputationScore.addAuthorizedCaller(authorized.address);

      await expect(reputationScore.removeAuthorizedCaller(authorized.address))
        .to.emit(reputationScore, "AuthorizedCallerRemoved")
        .withArgs(authorized.address);

      expect(await reputationScore.authorizedCallers(authorized.address)).to.be.false;
    });

    it("Should revert when non-owner tries to add authorized caller", async function () {
      await expect(
        reputationScore.connect(unauthorized).addAuthorizedCaller(user1.address)
      ).to.be.revertedWith("ReputationScore: caller is not the owner");
    });

    it("Should revert when adding zero address", async function () {
      await expect(
        reputationScore.addAuthorizedCaller(ethers.ZeroAddress)
      ).to.be.revertedWith("ReputationScore: invalid address");
    });
  });

  describe("Score Management - Add Score", function () {
    beforeEach(async function () {
      await reputationScore.addAuthorizedCaller(authorized.address);
    });

    it("Should add score successfully", async function () {
      const amount = 50n;

      await expect(reputationScore.connect(authorized).addScore(user1.address, amount))
        .to.emit(reputationScore, "ScoreChanged")
        .withArgs(user1.address, amount, amount);

      const reputation = await reputationScore.reputations(user1.address);
      expect(reputation.score).to.equal(amount);
    });

    it("Should update last activity time when adding score", async function () {
      await reputationScore.connect(authorized).addScore(user1.address, 10);

      const reputation = await reputationScore.reputations(user1.address);
      const block = await ethers.provider.getBlock('latest');

      expect(Number(reputation.lastActivityTime)).to.be.closeTo(block.timestamp, 2);
    });

    it("Should emit LevelUp event when crossing threshold", async function () {
      await expect(reputationScore.connect(authorized).addScore(user1.address, 150))
        .to.emit(reputationScore, "LevelUp")
        .withArgs(user1.address, 1);

      const level = await reputationScore.getLevel(user1.address);
      expect(level).to.equal(1n);
    });

    it("Should accumulate score correctly", async function () {
      await reputationScore.connect(authorized).addScore(user1.address, 30);
      await reputationScore.connect(authorized).addScore(user1.address, 20);

      const reputation = await reputationScore.reputations(user1.address);
      expect(reputation.score).to.equal(50n);
    });

    it("Should revert when unauthorized caller tries to add score", async function () {
      await expect(
        reputationScore.connect(unauthorized).addScore(user1.address, 10)
      ).to.be.revertedWith("ReputationScore: caller is not authorized");
    });

    it("Should revert when adding score to zero address", async function () {
      await expect(
        reputationScore.connect(authorized).addScore(ethers.ZeroAddress, 10)
      ).to.be.revertedWith("ReputationScore: invalid user address");
    });

    it("Should revert when adding zero amount", async function () {
      await expect(
        reputationScore.connect(authorized).addScore(user1.address, 0)
      ).to.be.revertedWith("ReputationScore: amount must be greater than 0");
    });
  });

  describe("Score Management - Deduct Score", function () {
    beforeEach(async function () {
      await reputationScore.addAuthorizedCaller(authorized.address);
      await reputationScore.connect(authorized).addScore(user1.address, 100);
    });

    it("Should deduct score successfully", async function () {
      await expect(reputationScore.connect(authorized).deductScore(user1.address, 30))
        .to.emit(reputationScore, "ScoreChanged")
        .withArgs(user1.address, -30, 70);

      const reputation = await reputationScore.reputations(user1.address);
      expect(reputation.score).to.equal(70n);
    });

    it("Should set score to 0 when deducting more than current score", async function () {
      await reputationScore.connect(authorized).deductScore(user1.address, 150);

      const reputation = await reputationScore.reputations(user1.address);
      expect(reputation.score).to.equal(0n);
    });

    it("Should revert when unauthorized caller tries to deduct score", async function () {
      await expect(
        reputationScore.connect(unauthorized).deductScore(user1.address, 10)
      ).to.be.revertedWith("ReputationScore: caller is not authorized");
    });

    it("Should revert when deducting score from zero address", async function () {
      await expect(
        reputationScore.connect(authorized).deductScore(ethers.ZeroAddress, 10)
      ).to.be.revertedWith("ReputationScore: invalid user address");
    });

    it("Should revert when deducting zero amount", async function () {
      await expect(
        reputationScore.connect(authorized).deductScore(user1.address, 0)
      ).to.be.revertedWith("ReputationScore: amount must be greater than 0");
    });
  });

  describe("Level Calculation", function () {
    beforeEach(async function () {
      await reputationScore.addAuthorizedCaller(authorized.address);
    });

    it("Should return Novice level for score < 101", async function () {
      await reputationScore.connect(authorized).addScore(user1.address, 100);
      expect(await reputationScore.getLevel(user1.address)).to.equal(0n);
    });

    it("Should return Active level for score 101-500", async function () {
      await reputationScore.connect(authorized).addScore(user1.address, 200);
      expect(await reputationScore.getLevel(user1.address)).to.equal(1n);
    });

    it("Should return Trusted level for score 501-1000", async function () {
      await reputationScore.connect(authorized).addScore(user1.address, 600);
      expect(await reputationScore.getLevel(user1.address)).to.equal(2n);
    });

    it("Should return Veteran level for score 1001-5000", async function () {
      await reputationScore.connect(authorized).addScore(user1.address, 2000);
      expect(await reputationScore.getLevel(user1.address)).to.equal(3n);
    });

    it("Should return Legend level for score >= 5001", async function () {
      await reputationScore.connect(authorized).addScore(user1.address, 6000);
      expect(await reputationScore.getLevel(user1.address)).to.equal(4n);
    });

    it("Should correctly identify level boundaries", async function () {
      await reputationScore.connect(authorized).addScore(user1.address, 101);
      expect(await reputationScore.getLevel(user1.address)).to.equal(1n);

      await reputationScore.connect(authorized).addScore(user1.address, 400);
      expect(await reputationScore.getLevel(user1.address)).to.equal(2n);

      await reputationScore.connect(authorized).addScore(user1.address, 500);
      expect(await reputationScore.getLevel(user1.address)).to.equal(3n);

      await reputationScore.connect(authorized).addScore(user1.address, 4000);
      expect(await reputationScore.getLevel(user1.address)).to.equal(4n);
    });
  });

  describe("Verification and Contribution Counters", function () {
    beforeEach(async function () {
      await reputationScore.addAuthorizedCaller(authorized.address);
    });

    it("Should increment verification count", async function () {
      await reputationScore.connect(authorized).incrementVerificationCount(user1.address);
      await reputationScore.connect(authorized).incrementVerificationCount(user1.address);

      const reputation = await reputationScore.reputations(user1.address);
      expect(reputation.totalVerifications).to.equal(2n);
    });

    it("Should increment contribution count", async function () {
      await reputationScore.connect(authorized).incrementContributionCount(user1.address);
      await reputationScore.connect(authorized).incrementContributionCount(user1.address);
      await reputationScore.connect(authorized).incrementContributionCount(user1.address);

      const reputation = await reputationScore.reputations(user1.address);
      expect(reputation.totalContributions).to.equal(3n);
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await reputationScore.addAuthorizedCaller(authorized.address);
      await reputationScore.connect(authorized).addScore(user1.address, 200);
      await reputationScore.connect(authorized).incrementVerificationCount(user1.address);
      await reputationScore.connect(authorized).incrementContributionCount(user1.address);
    });

    it("Should check score requirement correctly", async function () {
      expect(await reputationScore.meetsScoreRequirement(user1.address, 150)).to.be.true;
      expect(await reputationScore.meetsScoreRequirement(user1.address, 250)).to.be.false;
    });

    it("Should return complete user reputation data", async function () {
      const [score, level, lastActivityTime, totalVerifications, totalContributions] =
        await reputationScore.getUserReputationData(user1.address);

      expect(score).to.equal(200n);
      expect(level).to.equal(1n);
      expect(totalVerifications).to.equal(1n);
      expect(totalContributions).to.equal(1n);
      expect(lastActivityTime).to.be.gt(0n);
    });

    it("Should correctly identify active users", async function () {
      expect(await reputationScore.isActiveUser(user1.address)).to.be.true;
      expect(await reputationScore.isActiveUser(user2.address)).to.be.false;
    });
  });

  describe("Owner Permissions", function () {
    it("Should allow owner to call authorized functions", async function () {
      await expect(reputationScore.addScore(user1.address, 50))
        .to.emit(reputationScore, "ScoreChanged");
    });

    it("Should allow owner to manage authorizations even after being removed", async function () {
      await reputationScore.removeAuthorizedCaller(owner.address);

      await expect(reputationScore.addScore(user1.address, 50))
        .to.emit(reputationScore, "ScoreChanged");
    });
  });

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await reputationScore.addAuthorizedCaller(authorized.address);
    });

    it("Should handle large score values", async function () {
      const largeScore = 1000000n;
      await reputationScore.connect(authorized).addScore(user1.address, largeScore);

      const reputation = await reputationScore.reputations(user1.address);
      expect(reputation.score).to.equal(largeScore);
      expect(await reputationScore.getLevel(user1.address)).to.equal(4n);
    });

    it("Should handle multiple level upgrades in single transaction", async function () {
      await expect(reputationScore.connect(authorized).addScore(user1.address, 6000))
        .to.emit(reputationScore, "LevelUp")
        .withArgs(user1.address, 4);

      expect(await reputationScore.getLevel(user1.address)).to.equal(4n);
    });

    it("Should handle zero initial score for new users", async function () {
      const reputation = await reputationScore.reputations(user2.address);
      expect(reputation.score).to.equal(0n);
      expect(reputation.lastActivityTime).to.equal(0n);
      expect(reputation.totalVerifications).to.equal(0n);
      expect(reputation.totalContributions).to.equal(0n);
    });
  });
});

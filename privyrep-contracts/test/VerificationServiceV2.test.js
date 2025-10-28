const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * VerificationServiceV2 基础测试
 * 目的：验证合约可以正确部署和初始化
 *
 * 注意：完整的 Oracle 回调测试需要在 Sepolia 真实网络上进行
 */
describe("VerificationServiceV2 - Basic Deployment Test", function () {
  let reputationScore;
  let identityProofManager;
  let verificationServiceV2;
  let owner;
  let user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    // 1. 部署 ReputationScore
    const ReputationScore = await ethers.getContractFactory("ReputationScore");
    reputationScore = await ReputationScore.deploy();
    await reputationScore.waitForDeployment();

    // 2. 部署 IdentityProofManager (无构造参数)
    const IdentityProofManager = await ethers.getContractFactory("IdentityProofManager");
    identityProofManager = await IdentityProofManager.deploy();
    await identityProofManager.waitForDeployment();

    // 3. 部署 VerificationServiceV2
    const VerificationServiceV2 = await ethers.getContractFactory("VerificationServiceV2");
    verificationServiceV2 = await VerificationServiceV2.deploy(
      await identityProofManager.getAddress(),
      await reputationScore.getAddress()
    );
    await verificationServiceV2.waitForDeployment();
  });

  describe("Deployment", function () {
    it("应该正确部署 VerificationServiceV2 合约", async function () {
      expect(await verificationServiceV2.getAddress()).to.be.properAddress;
    });

    it("应该正确设置 identityManager 地址", async function () {
      expect(await verificationServiceV2.identityManager()).to.equal(await identityProofManager.getAddress());
    });

    it("应该正确设置 reputationScore 地址", async function () {
      expect(await verificationServiceV2.reputationScore()).to.equal(await reputationScore.getAddress());
    });

    it("应该正确设置 owner", async function () {
      expect(await verificationServiceV2.owner()).to.equal(owner.address);
    });

    it("taskCounter 初始值应该为 0", async function () {
      expect(await verificationServiceV2.taskCounter()).to.equal(0);
    });
  });

  describe("Constructor Validation", function () {
    it("应该拒绝无效的 identityManager 地址", async function () {
      const VerificationServiceV2 = await ethers.getContractFactory("VerificationServiceV2");

      await expect(
        VerificationServiceV2.deploy(ethers.ZeroAddress, await reputationScore.getAddress())
      ).to.be.revertedWith("VerificationServiceV2: invalid identity manager");
    });

    it("应该拒绝无效的 reputationScore 地址", async function () {
      const VerificationServiceV2 = await ethers.getContractFactory("VerificationServiceV2");

      await expect(
        VerificationServiceV2.deploy(await identityProofManager.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWith("VerificationServiceV2: invalid reputation score");
    });
  });

  describe("View Functions", function () {
    it("getUserVerificationCount 应该返回 0 对于新用户", async function () {
      expect(await verificationServiceV2.getUserVerificationCount(user1.address)).to.equal(0);
    });

    it("isCallbackCalled 应该返回 false 对于不存在的 taskId", async function () {
      expect(await verificationServiceV2.isCallbackCalled(0)).to.equal(false);
    });
  });

  describe("Management Functions", function () {
    it("只有 owner 可以更新 identityManager", async function () {
      const newManager = ethers.Wallet.createRandom().address;

      await expect(
        verificationServiceV2.connect(user1).updateIdentityManager(newManager)
      ).to.be.revertedWith("VerificationServiceV2: caller is not the owner");
    });

    it("只有 owner 可以更新 reputationScore", async function () {
      const newScore = ethers.Wallet.createRandom().address;

      await expect(
        verificationServiceV2.connect(user1).updateReputationScore(newScore)
      ).to.be.revertedWith("VerificationServiceV2: caller is not the owner");
    });

    it("owner 可以成功更新 identityManager", async function () {
      // 部署新的 IdentityProofManager
      const IdentityProofManager = await ethers.getContractFactory("IdentityProofManager");
      const newManager = await IdentityProofManager.deploy();
      await newManager.waitForDeployment();

      await verificationServiceV2.updateIdentityManager(await newManager.getAddress());
      expect(await verificationServiceV2.identityManager()).to.equal(await newManager.getAddress());
    });
  });

  describe("Integration Note", function () {
    it("⚠️  requestVerification 需要在 Sepolia 测试网测试", async function () {
      // 这个测试只是提醒：requestVerification 功能需要：
      // 1. 真实的 FHE Gateway 连接
      // 2. 真实的 Zama Oracle 服务
      // 3. 用户已在 IdentityProofManager 中注册加密数据
      //
      // 因此，完整的功能测试必须在 Sepolia 测试网上进行
      console.log("\n⚠️  完整的 Oracle 回调测试需要在 Sepolia 上进行：");
      console.log("   1. 部署所有合约到 Sepolia");
      console.log("   2. 用户注册加密身份数据");
      console.log("   3. 调用 requestVerification()");
      console.log("   4. 等待 Zama Oracle 回调 verificationCallback()");
      console.log("   5. 验证 callbackCalled[taskId] === true\n");
    });
  });
});

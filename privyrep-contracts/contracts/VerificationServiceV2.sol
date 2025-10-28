// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, externalEuint32, euint32, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "./IdentityProofManager.sol";
import "./ReputationScore.sol";

/**
 * @title VerificationServiceV2
 * @notice 验证服务合约 V2 - 支持 Oracle 自动回调
 * @dev 参考 Zamabelief BeliefMarket.sol 实现
 *
 * 关键改进：
 * 1. 继承 SepoliaConfig 以获取 Gateway/Oracle 配置
 * 2. 使用 FHE.requestDecryption() 请求 Oracle 解密
 * 3. 实现自动回调函数 verificationCallback()
 * 4. 建立 requestId → taskId 映射
 */
contract VerificationServiceV2 is SepoliaConfig {
    /// @notice 身份证明管理器合约地址
    IdentityProofManager public identityManager;

    /// @notice 声誉分数合约地址
    ReputationScore public reputationScore;

    /// @notice 合约所有者
    address public owner;

    /// @notice 验证任务结构体
    struct VerificationTask {
        address user;
        uint32 minAssetBalance;
        uint32 minNFTCount;
        uint32 minAccountAge;
        uint32 minTxCount;
        bool completed;
        bool passed;
        uint256 createdAt;
        uint256 decryptionRequestId; // ⭐ 新增：Oracle 请求 ID
    }

    /// @notice 验证任务映射：taskId => VerificationTask
    mapping(uint256 => VerificationTask) public verificationTasks;

    /// @notice 任务计数器
    uint256 public taskCounter;

    /// @notice 用户完成的验证次数
    mapping(address => uint256) public userVerificationCount;

    /// @notice Oracle 请求 ID → 任务 ID 映射
    /// @dev 用于回调时根据 requestId 找到对应的 taskId
    mapping(uint256 => uint256) internal requestIdToTaskId;

    /// @notice 回调是否已调用的标志
    mapping(uint256 => bool) public callbackCalled;

    // ============ 事件 ============
    event VerificationRequested(uint256 indexed taskId, address indexed user, uint256 requestId);
    event VerificationCompleted(uint256 indexed taskId, address indexed user, bool passed);
    event ReputationAwarded(address indexed user, uint256 amount);

    // ============ 修饰符 ============
    modifier onlyOwner() {
        require(msg.sender == owner, "VerificationServiceV2: caller is not the owner");
        _;
    }

    // ============ 构造函数 ============
    constructor(address _identityManager, address _reputationScore) {
        require(_identityManager != address(0), "VerificationServiceV2: invalid identity manager");
        require(_reputationScore != address(0), "VerificationServiceV2: invalid reputation score");

        identityManager = IdentityProofManager(_identityManager);
        reputationScore = ReputationScore(_reputationScore);
        owner = msg.sender;
    }

    // ============ 核心验证流程 ============

    /**
     * @notice 创建验证任务并自动请求 Oracle 解密
     * @param minAssetBalance 最低资产余额要求
     * @param minNFTCount 最低 NFT 数量要求
     * @param minAccountAge 最低账户年龄要求（天数）
     * @param minTxCount 最低交易次数要求
     * @return taskId 验证任务 ID
     *
     * @dev 流程（参考 Zamabelief BeliefMarket.sol:135-151）：
     * 1. 创建任务
     * 2. 执行 FHE 比较（链上）
     * 3. 请求 Oracle 解密
     * 4. 存储 requestId 映射
     */
    function requestVerification(
        uint32 minAssetBalance,
        uint32 minNFTCount,
        uint32 minAccountAge,
        uint32 minTxCount
    ) external returns (uint256 taskId) {
        require(
            identityManager.hasRegistered(msg.sender),
            "VerificationServiceV2: user not registered"
        );

        // ⭐ Step 1: 创建任务
        taskId = taskCounter++;

        verificationTasks[taskId] = VerificationTask({
            user: msg.sender,
            minAssetBalance: minAssetBalance,
            minNFTCount: minNFTCount,
            minAccountAge: minAccountAge,
            minTxCount: minTxCount,
            completed: false,
            passed: false,
            createdAt: block.timestamp,
            decryptionRequestId: 0 // 稍后设置
        });

        // ⭐ Step 2: 获取用户加密数据
        euint32 userAsset = identityManager.getEncryptedAssetBalance(msg.sender);
        euint32 userNFT = identityManager.getEncryptedNFTCount(msg.sender);
        euint32 userAge = identityManager.getEncryptedAccountAge(msg.sender);
        euint32 userTx = identityManager.getEncryptedTxCount(msg.sender);

        // ⭐ Step 3: 执行 FHE 比较（链上加密计算）
        ebool assetPass = FHE.ge(userAsset, FHE.asEuint32(minAssetBalance));
        ebool nftPass = FHE.ge(userNFT, FHE.asEuint32(minNFTCount));
        ebool agePass = FHE.ge(userAge, FHE.asEuint32(minAccountAge));
        ebool txPass = FHE.ge(userTx, FHE.asEuint32(minTxCount));

        // ⭐ Step 4: 将 4 个加密布尔值转换为 bytes32 数组
        // 参考 Zamabelief BeliefMarket.sol:62-64
        bytes32[] memory cts = new bytes32[](4);
        cts[0] = FHE.toBytes32(assetPass);
        cts[1] = FHE.toBytes32(nftPass);
        cts[2] = FHE.toBytes32(agePass);
        cts[3] = FHE.toBytes32(txPass);

        // ⭐ Step 5: 请求 Oracle 解密，指定回调函数
        // 参考 Zamabelief BeliefMarket.sol:67-69
        uint256 requestId = FHE.requestDecryption(
            cts,                                          // 要解密的加密值数组
            this.verificationCallback.selector           // 回调函数的 selector
        );

        // ⭐ Step 6: 存储 requestId 映射（关键！回调时需要）
        verificationTasks[taskId].decryptionRequestId = requestId;
        requestIdToTaskId[requestId] = taskId;

        emit VerificationRequested(taskId, msg.sender, requestId);
    }

    /**
     * @notice Oracle 回调函数 - 自动处理解密结果
     * @param requestId Oracle 传入的请求 ID
     * @param cleartexts 解密后的明文（ABI 编码）
     * @param decryptionProof 解密证明（用于验证）
     *
     * @dev 实现参考 Zamabelief BeliefMarket.sol:155-174
     * ⚠️ 重要：
     * 1. 函数签名必须完全匹配（uint256, bytes, bytes）
     * 2. 必须调用 FHE.checkSignatures() 验证解密结果合法性
     * 3. 解码的类型必须与请求时的加密值类型一致（ebool → bool）
     */
    function verificationCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external {
        // ⭐ Step 1: 验证解密结果的合法性（防止伪造）
        // 参考 Zamabelief BeliefMarket.sol:103
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // ⭐ Step 2: 解码明文数据
        // 注意：解码顺序必须与请求时的 cts 数组顺序一致
        // ebool → bool（参考 Zamabelief BeliefMarket.sol:107-110）
        (bool assetPass, bool nftPass, bool agePass, bool txPass) = abi.decode(
            cleartexts,
            (bool, bool, bool, bool)
        );

        // ⭐ Step 3: 通过 requestId 找到对应的任务
        uint256 taskId = requestIdToTaskId[requestId];
        VerificationTask storage task = verificationTasks[taskId];

        require(task.user != address(0), "VerificationServiceV2: invalid task");
        require(!task.completed, "VerificationServiceV2: task already completed");

        // ⭐ Step 4: 计算最终结果
        bool allPassed = assetPass && nftPass && agePass && txPass;

        // ⭐ Step 5: 更新任务状态
        task.completed = true;
        task.passed = allPassed;

        // ⭐ Step 6: 设置回调标志
        callbackCalled[taskId] = true;

        emit VerificationCompleted(taskId, task.user, allPassed);

        // ⭐ Step 7: 如果验证通过，自动奖励声誉分数
        if (allPassed) {
            reputationScore.addScore(task.user, reputationScore.REWARD_IDENTITY_VERIFIED());
            reputationScore.incrementVerificationCount(task.user);
            userVerificationCount[task.user]++;

            emit ReputationAwarded(task.user, reputationScore.REWARD_IDENTITY_VERIFIED());
        }
    }

    // ============ 查询函数 ============

    /**
     * @notice 获取用户的验证历史次数
     * @param user 用户地址
     * @return 验证次数
     */
    function getUserVerificationCount(address user) external view returns (uint256) {
        return userVerificationCount[user];
    }

    /**
     * @notice 获取验证任务详情
     * @param taskId 任务 ID
     * @return task 验证任务详情
     */
    function getVerificationTask(uint256 taskId) external view returns (VerificationTask memory) {
        return verificationTasks[taskId];
    }

    /**
     * @notice 检查用户是否满足基本验证要求（明文比较声誉分数）
     * @param user 用户地址
     * @param minScore 最低声誉分数要求
     * @return 是否满足要求
     */
    function meetsReputationRequirement(address user, uint256 minScore) external view returns (bool) {
        return reputationScore.meetsScoreRequirement(user, minScore);
    }

    /**
     * @notice 检查 Oracle 回调是否已执行
     * @param taskId 任务 ID
     * @return 回调是否已调用
     */
    function isCallbackCalled(uint256 taskId) external view returns (bool) {
        return callbackCalled[taskId];
    }

    // ============ 管理函数 ============

    /**
     * @notice 更新身份证明管理器地址
     * @param newManager 新的管理器地址
     */
    function updateIdentityManager(address newManager) external onlyOwner {
        require(newManager != address(0), "VerificationServiceV2: invalid address");
        identityManager = IdentityProofManager(newManager);
    }

    /**
     * @notice 更新声誉分数合约地址
     * @param newScore 新的声誉合约地址
     */
    function updateReputationScore(address newScore) external onlyOwner {
        require(newScore != address(0), "VerificationServiceV2: invalid address");
        reputationScore = ReputationScore(newScore);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "encrypted-types/EncryptedTypes.sol";
import "./IdentityProofManager.sol";
import "./ReputationScore.sol";

/**
 * @title VerificationService
 * @notice 验证服务合约，连接身份证明管理器和声誉系统
 * @dev 使用 FHE 进行加密比较，验证用户是否满足特定条件
 */
contract VerificationService {
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
    }

    /// @notice 验证任务映射：taskId => VerificationTask
    mapping(uint256 => VerificationTask) public verificationTasks;

    /// @notice 任务计数器
    uint256 public taskCounter;

    /// @notice 用户完成的验证次数
    mapping(address => uint256) public userVerificationCount;

    // ============ 事件 ============
    event VerificationRequested(uint256 indexed taskId, address indexed user);
    event VerificationCompleted(uint256 indexed taskId, address indexed user, bool passed);
    event ReputationAwarded(address indexed user, uint256 amount);

    // ============ 修饰符 ============
    modifier onlyOwner() {
        require(msg.sender == owner, "VerificationService: caller is not the owner");
        _;
    }

    // ============ 构造函数 ============
    constructor(address _identityManager, address _reputationScore) {
        require(_identityManager != address(0), "VerificationService: invalid identity manager");
        require(_reputationScore != address(0), "VerificationService: invalid reputation score");

        identityManager = IdentityProofManager(_identityManager);
        reputationScore = ReputationScore(_reputationScore);
        owner = msg.sender;
    }

    // ============ 验证函数 ============

    /**
     * @notice 验证用户的资产余额是否满足最低要求（加密比较）
     * @param user 用户地址
     * @param minBalance 最低资产余额要求（明文）
     * @return 加密的布尔结果
     */
    function verifyAssetBalance(address user, uint32 minBalance) public returns (ebool) {
        require(identityManager.hasRegistered(user), "VerificationService: user not registered");

        euint32 userBalance = identityManager.getEncryptedAssetBalance(user);
        euint32 threshold = FHE.asEuint32(minBalance);

        // 加密比较：userBalance >= threshold
        return FHE.ge(userBalance, threshold);
    }

    /**
     * @notice 验证用户的 NFT 数量是否满足最低要求（加密比较）
     * @param user 用户地址
     * @param minCount 最低 NFT 数量要求（明文）
     * @return 加密的布尔结果
     */
    function verifyNFTCount(address user, uint32 minCount) public returns (ebool) {
        require(identityManager.hasRegistered(user), "VerificationService: user not registered");

        euint32 userNFTCount = identityManager.getEncryptedNFTCount(user);
        euint32 threshold = FHE.asEuint32(minCount);

        return FHE.ge(userNFTCount, threshold);
    }

    /**
     * @notice 验证用户的账户年龄是否满足最低要求（加密比较）
     * @param user 用户地址
     * @param minAge 最低账户年龄要求（天数，明文）
     * @return 加密的布尔结果
     */
    function verifyAccountAge(address user, uint32 minAge) public returns (ebool) {
        require(identityManager.hasRegistered(user), "VerificationService: user not registered");

        euint32 userAge = identityManager.getEncryptedAccountAge(user);
        euint32 threshold = FHE.asEuint32(minAge);

        return FHE.ge(userAge, threshold);
    }

    /**
     * @notice 验证用户的交易次数是否满足最低要求（加密比较）
     * @param user 用户地址
     * @param minTx 最低交易次数要求（明文）
     * @return 加密的布尔结果
     */
    function verifyTxCount(address user, uint32 minTx) public returns (ebool) {
        require(identityManager.hasRegistered(user), "VerificationService: user not registered");

        euint32 userTxCount = identityManager.getEncryptedTxCount(user);
        euint32 threshold = FHE.asEuint32(minTx);

        return FHE.ge(userTxCount, threshold);
    }

    /**
     * @notice 创建综合验证任务（验证多个条件）
     * @param minAssetBalance 最低资产余额要求
     * @param minNFTCount 最低 NFT 数量要求
     * @param minAccountAge 最低账户年龄要求
     * @param minTxCount 最低交易次数要求
     * @return taskId 验证任务 ID
     */
    function requestVerification(
        uint32 minAssetBalance,
        uint32 minNFTCount,
        uint32 minAccountAge,
        uint32 minTxCount
    ) external returns (uint256 taskId) {
        require(
            identityManager.hasRegistered(msg.sender),
            "VerificationService: user not registered"
        );

        taskId = taskCounter++;

        verificationTasks[taskId] = VerificationTask({
            user: msg.sender,
            minAssetBalance: minAssetBalance,
            minNFTCount: minNFTCount,
            minAccountAge: minAccountAge,
            minTxCount: minTxCount,
            completed: false,
            passed: false,
            createdAt: block.timestamp
        });

        emit VerificationRequested(taskId, msg.sender);

        // 注意：实际验证需要通过解密网关异步完成
        // 这里创建任务后，需要调用 completeVerification 来完成
    }

    /**
     * @notice 完成验证任务（需要解密结果）
     * @param taskId 验证任务 ID
     * @param assetPassed 资产验证是否通过
     * @param nftPassed NFT验证是否通过
     * @param agePassed 账户年龄验证是否通过
     * @param txPassed 交易次数验证是否通过
     * @dev 此函数应由解密网关或授权服务调用
     */
    function completeVerification(
        uint256 taskId,
        bool assetPassed,
        bool nftPassed,
        bool agePassed,
        bool txPassed
    ) external onlyOwner {
        VerificationTask storage task = verificationTasks[taskId];
        require(!task.completed, "VerificationService: task already completed");
        require(task.user != address(0), "VerificationService: task does not exist");

        bool allPassed = assetPassed && nftPassed && agePassed && txPassed;

        task.completed = true;
        task.passed = allPassed;

        emit VerificationCompleted(taskId, task.user, allPassed);

        // 如果验证通过，奖励声誉分数
        if (allPassed) {
            reputationScore.addScore(task.user, reputationScore.REWARD_IDENTITY_VERIFIED());
            reputationScore.incrementVerificationCount(task.user);
            userVerificationCount[task.user]++;

            emit ReputationAwarded(task.user, reputationScore.REWARD_IDENTITY_VERIFIED());
        }
    }

    /**
     * @notice 简化版验证：仅验证单个条件（资产余额）
     * @param user 用户地址
     * @param minBalance 最低资产余额
     * @return 是否通过验证（需要解密）
     * @dev 这是一个简化的同步验证函数，实际应用中应使用异步解密
     */
    function simpleVerifyAsset(address user, uint32 minBalance) external onlyOwner returns (bool) {
        // 执行验证（结果为加密的布尔值）
        verifyAssetBalance(user, minBalance);

        // 注意：这里简化处理，实际应通过解密网关获取结果
        // 在生产环境中，需要请求解密并异步处理结果

        // 临时：奖励声誉分数（假设验证通过）
        reputationScore.addScore(user, reputationScore.REWARD_IDENTITY_VERIFIED());
        reputationScore.incrementVerificationCount(user);

        return true; // 简化返回
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

    // ============ 管理函数 ============

    /**
     * @notice 更新身份证明管理器地址
     * @param newManager 新的管理器地址
     */
    function updateIdentityManager(address newManager) external onlyOwner {
        require(newManager != address(0), "VerificationService: invalid address");
        identityManager = IdentityProofManager(newManager);
    }

    /**
     * @notice 更新声誉分数合约地址
     * @param newScore 新的声誉合约地址
     */
    function updateReputationScore(address newScore) external onlyOwner {
        require(newScore != address(0), "VerificationService: invalid address");
        reputationScore = ReputationScore(newScore);
    }
}

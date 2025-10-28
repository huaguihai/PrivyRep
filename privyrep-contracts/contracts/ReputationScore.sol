// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReputationScore
 * @notice 管理用户声誉分数系统（明文存储）
 * @dev 用户通过各种链上行为累积或损失声誉分数
 */
contract ReputationScore {
    /// @notice 用户声誉数据结构
    struct Reputation {
        uint256 score;              // 当前分数
        uint256 lastActivityTime;   // 最后活跃时间
        uint256 totalVerifications; // 完成的验证次数
        uint256 totalContributions; // 贡献次数
    }

    /// @notice 声誉等级枚举
    enum ReputationLevel { Novice, Active, Trusted, Veteran, Legend }

    /// @notice 用户地址 => 声誉数据
    mapping(address => Reputation) public reputations;

    /// @notice 授权调用者（如 VerificationService 合约）
    mapping(address => bool) public authorizedCallers;

    /// @notice 合约所有者
    address public owner;

    // ============ 加分规则常量 ============
    uint256 public constant REWARD_IDENTITY_VERIFIED = 10;
    uint256 public constant REWARD_DAO_VOTE = 5;
    uint256 public constant REWARD_TX_SUCCESS = 2;
    uint256 public constant REWARD_WEEKLY_ACTIVE = 3;
    uint256 public constant REWARD_OPENSOURCE = 15;

    // ============ 减分规则常量 ============
    uint256 public constant PENALTY_MALICIOUS_TX = 20;
    uint256 public constant PENALTY_REPORTED = 10;
    uint256 public constant PENALTY_INACTIVE_MONTHLY = 1;

    // ============ 等级阈值常量 ============
    uint256 public constant LEVEL_ACTIVE = 101;
    uint256 public constant LEVEL_TRUSTED = 501;
    uint256 public constant LEVEL_VETERAN = 1001;
    uint256 public constant LEVEL_LEGEND = 5001;

    // ============ 事件 ============
    event ScoreChanged(address indexed user, int256 change, uint256 newScore);
    event LevelUp(address indexed user, ReputationLevel newLevel);
    event AuthorizedCallerAdded(address indexed caller);
    event AuthorizedCallerRemoved(address indexed caller);

    // ============ 修饰符 ============
    modifier onlyOwner() {
        require(msg.sender == owner, "ReputationScore: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedCallers[msg.sender] || msg.sender == owner,
            "ReputationScore: caller is not authorized"
        );
        _;
    }

    // ============ 构造函数 ============
    constructor() {
        owner = msg.sender;
        authorizedCallers[msg.sender] = true;
    }

    // ============ 授权管理函数 ============

    /**
     * @notice 添加授权调用者
     * @param caller 授权地址
     */
    function addAuthorizedCaller(address caller) external onlyOwner {
        require(caller != address(0), "ReputationScore: invalid address");
        authorizedCallers[caller] = true;
        emit AuthorizedCallerAdded(caller);
    }

    /**
     * @notice 移除授权调用者
     * @param caller 授权地址
     */
    function removeAuthorizedCaller(address caller) external onlyOwner {
        authorizedCallers[caller] = false;
        emit AuthorizedCallerRemoved(caller);
    }

    // ============ 分数管理函数 ============

    /**
     * @notice 增加用户分数
     * @param user 用户地址
     * @param amount 增加的分数
     */
    function addScore(address user, uint256 amount) external onlyAuthorized {
        require(user != address(0), "ReputationScore: invalid user address");
        require(amount > 0, "ReputationScore: amount must be greater than 0");

        uint256 oldScore = reputations[user].score;
        reputations[user].score += amount;
        reputations[user].lastActivityTime = block.timestamp;

        emit ScoreChanged(user, int256(amount), reputations[user].score);

        // 检查是否升级
        ReputationLevel newLevel = getLevel(user);
        ReputationLevel oldLevel = _getLevelByScore(oldScore);
        if (newLevel > oldLevel) {
            emit LevelUp(user, newLevel);
        }
    }

    /**
     * @notice 减少用户分数
     * @param user 用户地址
     * @param amount 减少的分数
     */
    function deductScore(address user, uint256 amount) external onlyAuthorized {
        require(user != address(0), "ReputationScore: invalid user address");
        require(amount > 0, "ReputationScore: amount must be greater than 0");

        uint256 currentScore = reputations[user].score;

        if (currentScore >= amount) {
            reputations[user].score -= amount;
        } else {
            reputations[user].score = 0;
        }

        emit ScoreChanged(user, -int256(amount), reputations[user].score);
    }

    /**
     * @notice 增加验证次数
     * @param user 用户地址
     */
    function incrementVerificationCount(address user) external onlyAuthorized {
        reputations[user].totalVerifications++;
    }

    /**
     * @notice 增加贡献次数
     * @param user 用户地址
     */
    function incrementContributionCount(address user) external onlyAuthorized {
        reputations[user].totalContributions++;
    }

    // ============ 查询函数 ============

    /**
     * @notice 获取用户当前等级
     * @param user 用户地址
     * @return 用户等级
     */
    function getLevel(address user) public view returns (ReputationLevel) {
        return _getLevelByScore(reputations[user].score);
    }

    /**
     * @notice 根据分数计算等级（内部函数）
     * @param score 分数
     * @return 对应等级
     */
    function _getLevelByScore(uint256 score) internal pure returns (ReputationLevel) {
        if (score >= LEVEL_LEGEND) return ReputationLevel.Legend;
        if (score >= LEVEL_VETERAN) return ReputationLevel.Veteran;
        if (score >= LEVEL_TRUSTED) return ReputationLevel.Trusted;
        if (score >= LEVEL_ACTIVE) return ReputationLevel.Active;
        return ReputationLevel.Novice;
    }

    /**
     * @notice 检查用户是否满足最低分数要求
     * @param user 用户地址
     * @param minScore 最低分数要求
     * @return 是否满足要求
     */
    function meetsScoreRequirement(address user, uint256 minScore) external view returns (bool) {
        return reputations[user].score >= minScore;
    }

    /**
     * @notice 获取用户完整声誉数据
     * @param user 用户地址
     * @return score 当前分数
     * @return level 当前等级
     * @return lastActivityTime 最后活跃时间
     * @return totalVerifications 总验证次数
     * @return totalContributions 总贡献次数
     */
    function getUserReputationData(address user)
        external
        view
        returns (
            uint256 score,
            ReputationLevel level,
            uint256 lastActivityTime,
            uint256 totalVerifications,
            uint256 totalContributions
        )
    {
        Reputation memory rep = reputations[user];
        return (
            rep.score,
            getLevel(user),
            rep.lastActivityTime,
            rep.totalVerifications,
            rep.totalContributions
        );
    }

    /**
     * @notice 检查用户是否活跃（最近30天内有活动）
     * @param user 用户地址
     * @return 是否活跃
     */
    function isActiveUser(address user) external view returns (bool) {
        uint256 lastActivity = reputations[user].lastActivityTime;
        if (lastActivity == 0) return false;
        return (block.timestamp - lastActivity) < 30 days;
    }
}

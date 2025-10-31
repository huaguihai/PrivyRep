// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, externalEuint32, euint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title IdentityProofManager
 * @notice 管理用户的加密身份证明数据
 * @dev 使用 FHEVM 存储和管理加密的用户属性（资产、NFT、账户年龄等）
 */
contract IdentityProofManager is SepoliaConfig {
    /// @notice 用户加密身份数据结构
    struct EncryptedIdentity {
        euint32 assetBalance;      // 加密资产余额（单位：milli-ETH，即 ETH * 1000）
        euint32 nftCount;          // 加密 NFT 数量
        euint32 accountAge;        // 加密账户年龄（天）
        euint32 txCount;           // 加密交易次数
        bool exists;               // 是否已注册
        uint256 registeredAt;      // 注册时间
    }

    /// @notice 用户地址 => 加密身份数据
    mapping(address => EncryptedIdentity) private identities;

    /// @notice 用户地址 => 是否已注册
    mapping(address => bool) public hasRegistered;

    /// @notice 授权调用者（如 VerificationService 合约）
    mapping(address => bool) public authorizedCallers;

    /// @notice 合约所有者
    address public owner;

    // ============ 事件 ============
    event IdentityRegistered(address indexed user, uint256 timestamp);
    event IdentityUpdated(address indexed user, string dataType);
    event AuthorizedCallerAdded(address indexed caller);
    event AuthorizedCallerRemoved(address indexed caller);

    // ============ 修饰符 ============
    modifier onlyOwner() {
        require(msg.sender == owner, "IdentityProofManager: caller is not the owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedCallers[msg.sender] || msg.sender == owner,
            "IdentityProofManager: caller is not authorized"
        );
        _;
    }

    modifier onlyRegistered(address user) {
        require(identities[user].exists, "IdentityProofManager: user not registered");
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
        require(caller != address(0), "IdentityProofManager: invalid address");
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

    // ============ 身份注册与更新函数 ============

    /**
     * @notice 用户注册身份（提交加密数据）
     * @param encryptedAsset 加密的资产余额
     * @param encryptedNFT 加密的 NFT 数量
     * @param encryptedAge 加密的账户年龄
     * @param encryptedTx 加密的交易次数
     * @param inputProof 输入证明（用于验证加密数据的合法性）
     */
    function registerIdentity(
        externalEuint32 encryptedAsset,
        externalEuint32 encryptedNFT,
        externalEuint32 encryptedAge,
        externalEuint32 encryptedTx,
        bytes calldata inputProof
    ) external {
        require(!hasRegistered[msg.sender], "IdentityProofManager: already registered");

        // ⭐ Step 1: 将外部加密输入转换为 euint32 类型
        euint32 asset = FHE.fromExternal(encryptedAsset, inputProof);
        euint32 nft = FHE.fromExternal(encryptedNFT, inputProof);
        euint32 age = FHE.fromExternal(encryptedAge, inputProof);
        euint32 tx = FHE.fromExternal(encryptedTx, inputProof);

        // ⭐ Step 2: 存储加密数据（参考 Zama 模式：先存储，后授权）
        identities[msg.sender] = EncryptedIdentity({
            assetBalance: asset,
            nftCount: nft,
            accountAge: age,
            txCount: tx,
            exists: true,
            registeredAt: block.timestamp
        });

        hasRegistered[msg.sender] = true;

        // ⭐ Step 3: 设置访问权限（关键：先 allowThis，后 allow user）
        FHE.allowThis(asset);
        FHE.allow(asset, msg.sender);

        FHE.allowThis(nft);
        FHE.allow(nft, msg.sender);

        FHE.allowThis(age);
        FHE.allow(age, msg.sender);

        FHE.allowThis(tx);
        FHE.allow(tx, msg.sender);

        emit IdentityRegistered(msg.sender, block.timestamp);
    }

    /**
     * @notice 更新资产余额
     * @param encryptedBalance 新的加密资产余额
     * @param inputProof 输入证明
     */
    function updateAssetBalance(
        externalEuint32 encryptedBalance,
        bytes calldata inputProof
    ) external onlyRegistered(msg.sender) {
        // ⭐ Step 1: 转换
        euint32 newBalance = FHE.fromExternal(encryptedBalance, inputProof);

        // ⭐ Step 2: 存储（必须先存储！）
        identities[msg.sender].assetBalance = newBalance;

        // ⭐ Step 3: 授权（必须在存储之后！）
        FHE.allowThis(newBalance);
        FHE.allow(newBalance, msg.sender);

        emit IdentityUpdated(msg.sender, "assetBalance");
    }

    /**
     * @notice 更新 NFT 数量
     * @param encryptedNFT 新的加密 NFT 数量
     * @param inputProof 输入证明
     */
    function updateNFTCount(
        externalEuint32 encryptedNFT,
        bytes calldata inputProof
    ) external onlyRegistered(msg.sender) {
        // ⭐ Step 1: 转换
        euint32 newNFT = FHE.fromExternal(encryptedNFT, inputProof);

        // ⭐ Step 2: 存储（必须先存储！）
        identities[msg.sender].nftCount = newNFT;

        // ⭐ Step 3: 授权（必须在存储之后！）
        FHE.allowThis(newNFT);
        FHE.allow(newNFT, msg.sender);

        emit IdentityUpdated(msg.sender, "nftCount");
    }

    /**
     * @notice 更新账户年龄
     * @param encryptedAge 新的加密账户年龄
     * @param inputProof 输入证明
     */
    function updateAccountAge(
        externalEuint32 encryptedAge,
        bytes calldata inputProof
    ) external onlyRegistered(msg.sender) {
        // ⭐ Step 1: 转换
        euint32 newAge = FHE.fromExternal(encryptedAge, inputProof);

        // ⭐ Step 2: 存储（必须先存储！）
        identities[msg.sender].accountAge = newAge;

        // ⭐ Step 3: 授权（必须在存储之后！）
        FHE.allowThis(newAge);
        FHE.allow(newAge, msg.sender);

        emit IdentityUpdated(msg.sender, "accountAge");
    }

    /**
     * @notice 更新交易次数
     * @param encryptedTx 新的加密交易次数
     * @param inputProof 输入证明
     */
    function updateTxCount(
        externalEuint32 encryptedTx,
        bytes calldata inputProof
    ) external onlyRegistered(msg.sender) {
        // ⭐ Step 1: 转换
        euint32 newTx = FHE.fromExternal(encryptedTx, inputProof);

        // ⭐ Step 2: 存储（必须先存储！）
        identities[msg.sender].txCount = newTx;

        // ⭐ Step 3: 授权（必须在存储之后！）
        FHE.allowThis(newTx);
        FHE.allow(newTx, msg.sender);

        emit IdentityUpdated(msg.sender, "txCount");
    }

    // ============ 授权访问函数（供其他合约调用）============

    /**
     * @notice 获取用户的加密资产余额（仅授权调用者）
     * @param user 用户地址
     * @return 加密的资产余额
     */
    function getEncryptedAssetBalance(address user)
        external
        view
        onlyAuthorized
        onlyRegistered(user)
        returns (euint32)
    {
        return identities[user].assetBalance;
    }

    /**
     * @notice 获取用户的加密 NFT 数量（仅授权调用者）
     * @param user 用户地址
     * @return 加密的 NFT 数量
     */
    function getEncryptedNFTCount(address user)
        external
        view
        onlyAuthorized
        onlyRegistered(user)
        returns (euint32)
    {
        return identities[user].nftCount;
    }

    /**
     * @notice 获取用户的加密账户年龄（仅授权调用者）
     * @param user 用户地址
     * @return 加密的账户年龄
     */
    function getEncryptedAccountAge(address user)
        external
        view
        onlyAuthorized
        onlyRegistered(user)
        returns (euint32)
    {
        return identities[user].accountAge;
    }

    /**
     * @notice 获取用户的加密交易次数（仅授权调用者）
     * @param user 用户地址
     * @return 加密的交易次数
     */
    function getEncryptedTxCount(address user)
        external
        view
        onlyAuthorized
        onlyRegistered(user)
        returns (euint32)
    {
        return identities[user].txCount;
    }

    /**
     * @notice 获取用户的完整加密身份数据（仅授权调用者）
     * @param user 用户地址
     * @return 完整的加密身份结构体
     */
    function getEncryptedIdentity(address user)
        external
        view
        onlyAuthorized
        onlyRegistered(user)
        returns (EncryptedIdentity memory)
    {
        return identities[user];
    }

    // ============ 公开查询函数 ============

    /**
     * @notice 检查用户是否已注册
     * @param user 用户地址
     * @return 是否已注册
     */
    function isRegistered(address user) external view returns (bool) {
        return identities[user].exists;
    }

    /**
     * @notice 获取用户的注册时间
     * @param user 用户地址
     * @return 注册时间戳
     */
    function getRegistrationTime(address user)
        external
        view
        onlyRegistered(user)
        returns (uint256)
    {
        return identities[user].registeredAt;
    }

    // ============ 授权其他合约访问加密数据 ============

    /**
     * @notice 允许指定地址访问用户的加密数据（仅用户自己可调用）
     * @param contractAddress 要授权的合约地址
     * @dev 这个函数用于授权 VerificationService 等合约访问用户的加密数据
     */
    function allowContractAccess(address contractAddress) external onlyRegistered(msg.sender) {
        require(contractAddress != address(0), "IdentityProofManager: invalid contract address");

        EncryptedIdentity storage identity = identities[msg.sender];

        FHE.allow(identity.assetBalance, contractAddress);
        FHE.allow(identity.nftCount, contractAddress);
        FHE.allow(identity.accountAge, contractAddress);
        FHE.allow(identity.txCount, contractAddress);
    }

    /**
     * @notice 批量授权（授权多个合约）
     * @param contractAddresses 要授权的合约地址数组
     */
    function allowMultipleContracts(address[] calldata contractAddresses)
        external
        onlyRegistered(msg.sender)
    {
        require(contractAddresses.length > 0, "IdentityProofManager: empty array");
        require(contractAddresses.length <= 10, "IdentityProofManager: too many contracts");

        EncryptedIdentity storage identity = identities[msg.sender];

        for (uint256 i = 0; i < contractAddresses.length; i++) {
            address contractAddr = contractAddresses[i];
            require(contractAddr != address(0), "IdentityProofManager: invalid address in array");

            FHE.allow(identity.assetBalance, contractAddr);
            FHE.allow(identity.nftCount, contractAddr);
            FHE.allow(identity.accountAge, contractAddr);
            FHE.allow(identity.txCount, contractAddr);
        }
    }
}

/**
 * FHE 调试工具 - 用于诊断 "第三方合约执行失败" 问题
 */

export async function diagnoseFheIssue() {
  console.log('🔍 ==================== FHE 诊断开始 ====================');

  try {
    // 1️⃣ 检查网络连接
    console.log('1️⃣ 检查网络配置...');
    if (!window.ethereum) {
      console.error('❌ 未检测到 MetaMask 或 Web3 Provider');
      return;
    }

    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    console.log('✅ 当前 ChainId:', chainId);

    if (chainId !== '0xaa36a7') { // Sepolia = 11155111 = 0xaa36a7
      console.error('❌ 错误：当前网络不是 Sepolia');
      console.log('请切换到 Sepolia 测试网 (ChainId: 11155111)');
      return;
    }
    console.log('✅ 网络正确: Sepolia 测试网');

    // 2️⃣ 检查账户
    console.log('\n2️⃣ 检查钱包账户...');
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      console.error('❌ 未连接钱包');
      return;
    }
    console.log('✅ 钱包地址:', accounts[0]);

    // 3️⃣ 检查余额
    console.log('\n3️⃣ 检查 ETH 余额...');
    const balance = await window.ethereum.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest']
    });
    const ethBalance = parseInt(balance, 16) / 1e18;
    console.log('✅ ETH 余额:', ethBalance.toFixed(6), 'ETH');

    if (ethBalance < 0.001) {
      console.warn('⚠️  余额过低，建议至少 0.01 ETH');
    }

    // 4️⃣ 检查合约代码是否存在
    console.log('\n4️⃣ 检查合约是否部署...');
    const identityManagerAddress = '0x1492770cbc14c29d308828ef95424E1975374cD2';
    const code = await window.ethereum.request({
      method: 'eth_getCode',
      params: [identityManagerAddress, 'latest']
    });

    if (code === '0x' || code === '0x0') {
      console.error('❌ 合约未部署或地址错误:', identityManagerAddress);
      return;
    }
    console.log('✅ 合约已部署，代码长度:', code.length, 'bytes');

    // 5️⃣ 检查是否已注册
    console.log('\n5️⃣ 检查是否已注册...');
    try {
      // hasRegistered(address) -> bool 的函数签名
      const functionSelector = '0xc3c5a547'; // hasRegistered(address)
      const paddedAddress = accounts[0].slice(2).padStart(64, '0');
      const callData = functionSelector + paddedAddress;

      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: identityManagerAddress,
          data: callData
        }, 'latest']
      });

      const isRegistered = result === '0x0000000000000000000000000000000000000000000000000000000000000001';

      if (isRegistered) {
        console.log('✅ 用户已注册');
        console.log('⚠️  如果尝试再次注册会失败！');
        console.log('💡 提示：请尝试"身份验证"功能，而不是"注册身份"');
      } else {
        console.log('✅ 用户未注册，可以进行注册');
      }
    } catch (err) {
      console.error('❌ 检查注册状态失败:', err);
    }

    // 6️⃣ 检查 FHE SDK 加载
    console.log('\n6️⃣ 检查 FHE SDK...');
    try {
      console.log('正在加载 FHE SDK from CDN...');
      // @ts-ignore - Dynamic CDN import
      const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');

      if (!sdk.initSDK || !sdk.createInstance) {
        console.error('❌ FHE SDK 加载失败：缺少必需的函数');
        return;
      }
      console.log('✅ FHE SDK 加载成功');

      // 尝试初始化
      console.log('正在初始化 FHE SDK...');
      await sdk.initSDK();
      console.log('✅ FHE SDK WASM 模块初始化成功');

      // 尝试创建实例
      console.log('正在创建 FHE instance...');
      const config = {
        network: window.ethereum,
        gatewayUrl: 'https://gateway.sepolia.zama.ai'  // ⭐ 显式指定 Gateway
      };
      const instance = await sdk.createInstance(config);
      console.log('✅ FHE instance 创建成功');

      // 获取公钥
      console.log('正在获取 FHE 公钥...');
      const publicKey = instance.getPublicKey();
      console.log('✅ FHE 公钥获取成功，长度:',
        typeof publicKey === 'string' ? publicKey.length : 'object');

    } catch (err: any) {
      console.error('❌ FHE SDK 测试失败:', err.message);
      console.error('详细错误:', err);
      return;
    }

    // 7️⃣ 尝试创建测试加密输入
    console.log('\n7️⃣ 测试加密功能...');
    try {
      // @ts-ignore - Dynamic CDN import
      const sdk: any = await import('https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.js');
      await sdk.initSDK();
      const config = {
        network: window.ethereum,
        gatewayUrl: 'https://gateway.sepolia.zama.ai'
      };
      const instance = await sdk.createInstance(config);

      // 创建测试加密输入
      const input = instance.createEncryptedInput(
        identityManagerAddress,
        accounts[0]
      );

      // 添加测试值
      input.add32(1000);
      console.log('✅ 创建加密输入成功');

      // 执行加密
      console.log('正在加密测试数据...');
      const encrypted = await input.encrypt();
      console.log('✅ 加密成功！');
      console.log('  - handles 数量:', encrypted.handles.length);
      console.log('  - inputProof 存在:', !!encrypted.inputProof);

    } catch (err: any) {
      console.error('❌ 加密测试失败:', err.message);
      console.error('详细错误:', err);
      return;
    }

    console.log('\n✅ ==================== FHE 诊断完成 ====================');
    console.log('\n📊 诊断结果总结:');
    console.log('  1. 网络: ✅');
    console.log('  2. 钱包: ✅');
    console.log('  3. 合约: ✅');
    console.log('  4. FHE SDK: ✅');
    console.log('  5. 加密功能: ✅');
    console.log('\n💡 如果所有检查都通过，但仍然失败，问题可能在于:');
    console.log('   - Gas 限制设置');
    console.log('   - MetaMask 版本问题');
    console.log('   - 网络拥堵');

  } catch (error: any) {
    console.error('❌ 诊断过程出错:', error.message);
    console.error('详细错误:', error);
  }
}

// 导出快捷命令
(window as any).diagnoseFhe = diagnoseFheIssue;

console.log('💡 FHE 诊断工具已加载！');
console.log('💡 在控制台运行: diagnoseFhe() 来开始诊断');

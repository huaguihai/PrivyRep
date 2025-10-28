# Oracle Callback Testing Guide 🧪

## Phase 3.3: Test Oracle Auto-Callback Functionality

This guide will walk you through testing the Oracle auto-callback mechanism for VerificationServiceV2.

---

## 📋 Prerequisites

✅ **Completed:**
- Phase 1: Oracle dependencies installed
- Phase 2: VerificationServiceV2 implemented
- Phase 3.1: V2 deployed to Sepolia at `0x92846236576E783D6404232934AFc1C5914eEFb7`
- Phase 3.2: Frontend configured with V2 address and ABI

✅ **Required:**
- MetaMask connected to Sepolia testnet
- Sepolia ETH for gas fees (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Identity registered in IdentityProofManager
- Frontend dev server running

---

## 🎯 Testing Steps

### Step 1: Start the Frontend

The frontend should already be running. If not:

```bash
cd /Users/guihaihua/lumao/zama_projects/PrivyRep/privyrep-frontend
pnpm run dev
```

Access the frontend at `http://localhost:5173` (or the port shown in terminal).

### Step 2: Register Identity (If Not Already Done)

Before requesting verification, you need encrypted identity data:

1. Connect your wallet (MetaMask)
2. Navigate to "Register Identity" or similar page
3. Submit encrypted identity data:
   - Asset Balance: e.g., 1000
   - NFT Count: e.g., 5
   - Account Age (days): e.g., 365
   - Transaction Count: e.g., 100

This creates FHE-encrypted data in IdentityProofManager.

### Step 3: Request Verification

1. Navigate to "Verify Identity" or similar page
2. Set verification requirements (lower than your identity for testing):
   - Min Asset Balance: 500
   - Min NFT Count: 3
   - Min Account Age: 180 days
   - Min Transaction Count: 50

3. Click "Request Verification"
4. **Confirm the transaction in MetaMask**
5. **Note the Task ID** from the transaction receipt or frontend UI

### Step 4: Monitor the Oracle Callback

**Option A: Use the Monitoring Script** (Recommended)

```bash
cd /Users/guihaihua/lumao/zama_projects/PrivyRep/privyrep-contracts

# Replace <taskId> with your actual task ID
pnpm hardhat run scripts/monitorCallback.js --network sepolia <taskId>

# Example:
pnpm hardhat run scripts/monitorCallback.js --network sepolia 1
```

The script will:
- Check task status every 5 seconds
- Show callback status, completion status, and verification result
- Exit automatically when callback is received
- Timeout after 5 minutes with diagnostic info

**Option B: Check Manually via Etherscan**

1. Go to [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x92846236576E783D6404232934AFc1C5914eEFb7)
2. Click "Events" tab
3. Look for recent `VerificationRequested` and `VerificationCompleted` events
4. Look for `DecryptionFulfilled` event (indicates Oracle callback)

**Option C: Check via Cast Commands**

```bash
# Check if callback was called for taskId=1
cast call 0x92846236576E783D6404232934AFc1C5914eEFb7 \
  "isCallbackCalled(uint256)(bool)" \
  1 \
  --rpc-url https://ethereum-sepolia.publicnode.com

# Get task details
cast call 0x92846236576E783D6404232934AFc1C5914eEFb7 \
  "getVerificationTask(uint256)" \
  1 \
  --rpc-url https://ethereum-sepolia.publicnode.com
```

---

## 🔍 What to Expect

### Timeline

| Phase | Expected Time | Description |
|-------|---------------|-------------|
| Transaction Confirmed | ~15-30 seconds | `requestVerification()` transaction mined |
| FHE Decryption Request | Immediate | `FHE.requestDecryption()` called |
| Oracle Processing | **2-10 minutes** | Zama Oracle decrypts and prepares callback |
| Callback Execution | ~15-30 seconds | Oracle calls `verificationCallback()` |
| **Total** | **2-11 minutes** | Full cycle completion |

⚠️ **Note:** Oracle callback timing on Sepolia testnet can vary significantly. Be patient!

### Success Indicators

When the Oracle callback executes successfully, you should see:

1. ✅ **Task Status Updated:**
   - `task.completed = true`
   - `task.passed = true/false` (depending on verification result)

2. ✅ **Callback Flag Set:**
   - `callbackCalled[taskId] = true`

3. ✅ **Event Emitted:**
   - `VerificationCompleted(taskId, user, passed)`
   - `DecryptionFulfilled(requestId)`

4. ✅ **Reputation Awarded (if passed):**
   - User's reputation score increased by `REWARD_IDENTITY_VERIFIED()`
   - `ReputationAwarded(user, amount)` event emitted

### Expected Results

**If your identity meets the requirements:**
- ✅ `task.passed = true`
- ✅ Reputation automatically awarded
- ✅ User can now access gated features

**If your identity doesn't meet requirements:**
- ❌ `task.passed = false`
- ❌ No reputation awarded
- ℹ️ Task still marked as `completed = true`

---

## 🐛 Troubleshooting

### Issue: Callback Not Received After 10+ Minutes

**Possible Causes:**
1. **Oracle Service Delay:** Zama's testnet Oracle can have delays
2. **Gas Issues:** Callback transaction might be stuck
3. **Network Congestion:** Sepolia network issues

**Solutions:**
1. Wait longer (up to 30 minutes on busy days)
2. Check [Sepolia Gas Tracker](https://sepolia.etherscan.io/gastracker)
3. Monitor contract events on Etherscan
4. Check Zama's status page (if available)

### Issue: Transaction Reverted

**Check:**
1. Do you have registered identity? (`IdentityProofManager.hasIdentity(your_address)`)
2. Do you have enough Sepolia ETH?
3. Are contract addresses correct in `.env`?

**Debug:**
```bash
# Check if you have identity
cast call 0x1492770cbc14c29d308828ef95424E1975374cD2 \
  "hasIdentity(address)(bool)" \
  YOUR_ADDRESS \
  --rpc-url https://ethereum-sepolia.publicnode.com

# Check your reputation score
cast call 0x16d91ec4F00cc05B2f8d3358e90ab0f4AC0db430 \
  "getScore(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url https://ethereum-sepolia.publicnode.com
```

### Issue: Callback Called But Task Not Completed

This indicates a bug in the callback logic. Check:
1. `FHE.checkSignatures()` might have failed
2. Decryption result parsing error
3. State update logic issue

**Debug:**
```bash
# Check callback status
cast call 0x92846236576E783D6404232934AFc1C5914eEFb7 \
  "callbackCalled(uint256)(bool)" \
  TASK_ID \
  --rpc-url https://ethereum-sepolia.publicnode.com

# Check task completion
cast call 0x92846236576E783D6404232934AFc1C5914eEFb7 \
  "verificationTasks(uint256)" \
  TASK_ID \
  --rpc-url https://ethereum-sepolia.publicnode.com
```

### Issue: Frontend Not Showing V2 Contract

**Verify Configuration:**
```bash
cd /Users/guihaihua/lumao/zama_projects/PrivyRep/privyrep-frontend

# Check .env has V2 address
cat .env | grep VERIFICATION_SERVICE

# Should show:
# VITE_VERIFICATION_SERVICE_ADDRESS=0x92846236576E783D6404232934AFc1C5914eEFb7

# Restart dev server
pkill -9 -f "vite"
pnpm run dev
```

---

## 📊 Verification Checklist

Use this checklist to verify successful Oracle callback:

- [ ] Transaction confirmed on Sepolia
- [ ] Task ID recorded from transaction receipt
- [ ] Monitoring script shows task created
- [ ] Decryption request ID is non-zero
- [ ] After 2-10 minutes: `DecryptionFulfilled` event emitted
- [ ] `callbackCalled[taskId]` returns `true`
- [ ] `task.completed` is `true`
- [ ] `task.passed` is `true` or `false` (expected result)
- [ ] If passed: reputation was awarded to user
- [ ] `ReputationAwarded` event emitted (if passed)

---

## 🎓 Understanding the Flow

```
┌─────────────────┐
│  1. Frontend    │  User clicks "Request Verification"
│  requestVerifi  │  with min requirements
│  cation()       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  2. VerificationServiceV2.requestVerification()         │
│                                                           │
│  a) Retrieve encrypted identity from IdentityProofMgr   │
│  b) Perform FHE comparisons (on-chain encrypted):       │
│     - assetPass = FHE.ge(userAsset, minAssetBalance)    │
│     - nftPass = FHE.ge(userNFT, minNFTCount)            │
│     - agePass = FHE.ge(userAge, minAccountAge)          │
│     - txPass = FHE.ge(userTx, minTxCount)               │
│  c) Convert results to bytes32 for Oracle:              │
│     cts = [toBytes32(assetPass), toBytes32(nftPass),..] │
│  d) Request Oracle decryption:                          │
│     requestId = FHE.requestDecryption(                  │
│       cts,                                              │
│       this.verificationCallback.selector                │
│     )                                                   │
│  e) Store requestId → taskId mapping                    │
│  f) Emit VerificationRequested(taskId, user, requestId) │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐  ⏰ 2-10 minutes (testnet)
│  3. Zama Oracle │  Oracle decrypts the 4 ebool results
│  Service        │  Prepares callback transaction
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  4. Oracle calls verificationCallback()                 │
│     (requestId, cleartexts, decryptionProof)            │
│                                                           │
│  a) Verify signatures: FHE.checkSignatures(...)         │
│  b) Decode results: (assetPass, nftPass, agePass, ..)   │
│  c) Determine overall: allPassed = all 4 are true       │
│  d) Update task:                                        │
│     - task.completed = true                             │
│     - task.passed = allPassed                           │
│     - callbackCalled[taskId] = true                     │
│  e) If passed:                                          │
│     - Award reputation to user                          │
│     - Mint credential NFT (if configured)               │
│  f) Emit VerificationCompleted(taskId, user, passed)    │
│  g) Emit DecryptionFulfilled(requestId)                 │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  5. Frontend    │  UI updates to show verification result
│  Updates        │  User sees reputation increase
└─────────────────┘
```

---

## 🚨 Emergency Rollback to V1

If Oracle callback is not working or causing issues:

1. **Stop frontend dev server:**
   ```bash
   pkill -9 -f "vite"
   ```

2. **Edit `.env` to use V1:**
   ```bash
   cd /Users/guihaihua/lumao/zama_projects/PrivyRep/privyrep-frontend
   nano .env

   # Comment V2 line:
   # VITE_VERIFICATION_SERVICE_ADDRESS=0x92846236576E783D6404232934AFc1C5914eEFb7

   # Uncomment V1 line:
   VITE_VERIFICATION_SERVICE_ADDRESS=0xe43D69d358a79E92c9dE402303aE957102090a75
   ```

3. **Update ABI import in `contracts.ts`:**
   ```typescript
   // Change back to V1
   import VerificationServiceABI from '../contracts/VerificationService.json';

   export const contracts = {
     verificationService: {
       address: VERIFICATION_SERVICE_ADDRESS,
       abi: VerificationServiceABI.abi, // V1 ABI
     },
   };
   ```

4. **Restart frontend:**
   ```bash
   pnpm run dev
   ```

V1 uses manual completion (off-chain verification), so no Oracle dependency.

---

## 📝 Report Results

After testing, please document:

1. **Task ID:** _______
2. **Transaction Hash (requestVerification):** _______
3. **Time to callback:** _______ minutes
4. **Callback received:** ✅ Yes / ❌ No
5. **Verification result:** ✅ Passed / ❌ Failed
6. **Reputation awarded:** ✅ Yes / ❌ No / N/A
7. **Any errors or issues:** _______

---

## 🔗 Useful Links

- **V2 Contract on Sepolia:** https://sepolia.etherscan.io/address/0x92846236576E783D6404232934AFc1C5914eEFb7
- **ReputationScore Contract:** https://sepolia.etherscan.io/address/0x16d91ec4F00cc05B2f8d3358e90ab0f4AC0db430
- **IdentityProofManager Contract:** https://sepolia.etherscan.io/address/0x1492770cbc14c29d308828ef95424E1975374cD2
- **Zama FHEVM Docs:** https://docs.zama.ai/fhevm
- **Sepolia Faucet:** https://sepoliafaucet.com/

---

## ✅ Next Steps (After Phase 3.3)

Once Oracle callback is verified working:

**Phase 4: Production Monitoring**
- Monitor V2 stability over 1-2 weeks
- Track callback success rate
- Monitor gas costs for callbacks
- Collect user feedback
- Keep V1 available as fallback

If everything works smoothly, V2 becomes the production version! 🎉

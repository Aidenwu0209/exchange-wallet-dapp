# 测试报告

项目名称：选题二：交易所钱包系统 DApp 开发

日期：2026-06-11

## 自动化测试记录

| 模块 | 命令 | 结果 |
|---|---|---|
| 合约编译 | `cd contracts && forge build` | 通过 |
| 合约测试 | `cd contracts && forge test` | 4 passed, 0 failed |
| 后端依赖 | `cd backend && npm install` | 通过，存在 npm audit moderate warnings |
| 后端构建 | `cd backend && npm run build` | 通过 |
| 后端测试 | `cd backend && npm run test` | 4 files passed, 8 tests passed，包含 EIP-712 签名恢复与篡改检测 |
| 前端依赖 | `cd frontend && npm install` | 通过，存在上游依赖 warnings |
| 前端构建 | `cd frontend && npm run build` | 通过，存在 wagmi/MetaMask 可选依赖 warning |
| 前端检查 | `cd frontend && npm run lint` | 通过，TypeScript noEmit |

## 待补充的本地手工验证截图

端到端本地手工验证完成后，建议在报告中补充 `docs/screenshot-checklist.md` 所列截图。

## 本地 Anvil smoke 验证记录

本轮使用 Anvil 本地链、`contracts/deployments/anvil.json`、后端 SQLite 本地库和前端 dev server 进行验证。

| 验证项 | 结果 |
|---|---|
| Anvil 启动 | 通过，`127.0.0.1:8545`，Chain ID 31337 |
| 合约部署 | 通过，生成 `contracts/deployments/anvil.json` |
| 数据库初始化 | `prisma db push` 在当前环境返回 schema engine 空错误，已通过 `prisma/init.sql` 兜底初始化成功 |
| 后端 health | 通过，`contracts_loaded=true` |
| 前端可访问 | 通过，`/user/assets` 返回 HTML，`/admin/onchain-data` 返回 HTTP 200 |
| 创建用户和独立充值地址 | 通过，用户 `alice` 和 `bob` 均成功获得 DepositWallet |
| Faucet | 通过，MockUSDT mint 到测试钱包 |
| 充值扫描 | 通过，扫描到充值 `Transfer` 事件并创建 `PENDING` 充值 |
| 确认数入账 | 通过，挖矿后 `confirmed_count=1`，用户余额增加 |
| 资金归集 | 通过，`sweep_count=1` 并返回归集 txHash |
| 普通提现 | 通过，1 MockUSDT 普通提现状态为 `CONFIRMED` |
| 黑名单拦截 | 通过，返回 `BLACKLISTED_ADDRESS` |
| 余额不足拒绝 | 通过，返回 `INSUFFICIENT_BALANCE` |
| 大额提现多签 | 通过，大额提现进入 `PENDING_MULTISIG`，两个管理员审批后可执行 |
| EIP-712 离线签名审批 | 通过，后端生成 typed data，管理员签名后 `eip712_verified=true`，链上审批 txHash 正常返回 |
| 多签执行 | 通过，状态更新为 `CONFIRMED` 并返回执行 txHash |
| 对账上链 | 通过，生成 Merkle Root、snapshotHash 和 AuditAnchor txHash |
| Proof of Reserve | 通过，用户 PoR 返回 `verified=true` |
| 链上数据中心 | 通过，包含 `DEPOSIT_WALLET_CREATED`、`SWEPT`、`WITHDRAWAL_SUBMITTED`、`WITHDRAWAL_APPROVED`、`WITHDRAWAL_EXECUTED`、`AUDIT_ANCHORED` |
| Chrome/MetaMask 连接 | Chrome 中前端 `连接 MetaMask` 按钮可唤起 MetaMask；当前 MetaMask 停在 unlock 页，需人工解锁后完成最终连接确认 |

本轮新增 EIP-712 smoke 结果：

```json
{
  "typed_data_action": "APPROVE_WITHDRAWAL",
  "approval1": {
    "approved_count": 1,
    "eip712_verified": true,
    "approval_tx_hash": "0xaa1ea92c8ed1ddfd52ae479781ba7582dc955e2d1a532d439785b041d1aa0b89"
  },
  "approval2": {
    "approved_count": 2,
    "eip712_verified": true,
    "approval_tx_hash": "0x7c8a46a03c4ddbdb77685bbff3d54a0d51b3b2bda846694bae131586fb412ec2"
  },
  "executed": {
    "status": "CONFIRMED",
    "tx_hash": "0x342eca08f152814137c741c43b1a3ad03238817f68d97bc6ec6a3c20cba35197"
  }
}
```

本轮部署合约地址：

```json
{
  "mock_usdt": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "deposit_wallet_factory": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  "multi_sig_cold_wallet": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  "audit_anchor": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
}
```

## 已覆盖测试点

- MockUSDT mint 和 transfer。
- DepositWalletFactory 创建充值钱包。
- DepositWallet 归集权限限制。
- MultiSigColdWallet 提交、审批、执行、防重复审批、防重复执行。
- AuditAnchor 写入快照和防重复锚定。
- 后端 atomic unit 金额计算。
- 后端 Merkle Root、Merkle Proof 生成与验证。
- 后端风控大额提现进入多签、余额不足拒绝。
- 后端 EIP-712 多签审批 typed data、签名恢复、篡改检测和过期判断。
- 前端用户端与管理员端页面生产构建。

## 风险提示

- 前端构建时出现 `@metamask/sdk` 和 `pino-pretty` 的可选依赖 warning，但构建成功，不影响当前页面产物。
- 本地端到端流程依赖 Anvil、合约部署 JSON、backend `.env` 中测试私钥正确配置。
- Chrome/MetaMask 最终连接截图需要浏览器中的 MetaMask 处于已解锁状态。
- Mainnet-ready 脚本只提供部署能力，不默认执行真实主网交易。

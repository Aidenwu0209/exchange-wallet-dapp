# 项目协作规则

本文件是 AI coding 的执行手册。详细设计以 `docs/` 下的文档为准。本文件只规定编码前必须阅读什么、实现时必须遵守什么、完成后必须检查什么。

## 1. 编码前必须阅读

在开始任何编码前，必须先阅读并遵守以下文档：

1. `docs/architecture.md`
2. `docs/frontend-patterns.md`
3. `docs/backend-patterns.md`
4. `docs/api-contract.md`

如果代码实现与这些文档冲突，以文档为准。确需调整设计时，必须同步更新对应文档，并在最终说明中列出调整原因。

## 2. 项目名称

项目名称固定为：

> 选题二：交易所钱包系统 DApp 开发

不得在报告、README、页面标题或核心文档中改成其他选题名称。

## 3. 总体硬性规则

1. 本项目必须完整实现交易所钱包系统 DApp，不得退化成普通充值提现页面。
2. 必须包含智能合约、后端服务和前端页面三层。
3. 必须使用本地 Anvil 链完整跑通业务流程。
4. 必须使用 MockUSDT 测试代币，不使用真实主网资产。
5. 必须实现用户独立充值地址。
6. 必须实现链上充值监听和确认数入账。
7. 必须实现热冷钱包隔离和资金归集。
8. 必须实现提现风控拦截。
9. 必须实现大额提现多签审批。
10. 必须实现本地账本与链上余额对账。
11. 必须实现钱包连接。
12. 必须实现链上全量数据查询页面。
13. 必须提供 Sepolia 或 Mainnet-ready 部署脚本与说明。
14. 必须实现至少两个超级加分能力：Proof of Reserve、区块扫描幂等处理与确认数机制。EIP-712 离线签名审批作为第三优先级增强项。

## 4. 合约实现规则

合约目录为 `contracts/`。

必须实现以下合约：

1. `MockUSDT.sol`
2. `DepositWallet.sol`
3. `DepositWalletFactory.sol`
4. `MultiSigColdWallet.sol`
5. `AuditAnchor.sol`

合约要求：

1. 使用 Solidity 0.8.x。
2. 使用 Foundry 编译、测试和部署。
3. 每个合约必须有清晰注释。
4. 合约必须有事件，便于后端查询链上数据。
5. 合约必须有单元测试。
6. 多签合约必须防止重复审批和重复执行。
7. 充值钱包归集必须限制权限。
8. 审计合约必须能记录 `snapshotHash` 和 `merkleRoot`。

禁止事项：

1. 不要把真实私钥写入合约或代码。
2. 不要引入与课程无关的复杂 DeFi 逻辑。
3. 不要把核心业务只写在前端。

## 5. 后端实现规则

后端目录为 `backend/`。

后端必须遵守 router、service、repository、schema 分层：

1. Router 只处理 HTTP 输入输出。
2. Service 负责业务编排。
3. Repository 负责数据库访问。
4. Schema 负责参数校验。
5. Jobs 负责区块扫描、充值确认、归集和对账等后台任务。

后端必须实现：

1. `GET /api/v1/health`
2. 用户创建与资产查询 API。
3. 充值地址查询 API。
4. MockUSDT faucet API。
5. 区块扫描 API。
6. 充值确认 API。
7. 提现申请 API。
8. 管理员看板 API。
9. 资金归集 API。
10. 大额提现审批 API。
11. 大额提现执行 API。
12. 黑名单管理 API。
13. 风控事件查询 API。
14. 对账 API。
15. Proof of Reserve API。
16. 链上事件查询 API。

后端必须遵守：

1. 统一响应结构，见 `docs/api-contract.md`。
2. 金额使用 atomic unit 字符串，不使用浮点数。
3. 充值事件唯一键为 `chain_id + tx_hash + log_index`。
4. 所有资产变化都必须写入 `ledger_entries`。
5. 写资产、写账本、改提现状态必须使用事务。
6. 风控命中必须写入 `risk_events`。
7. 私钥只能从 `.env` 读取，不得输出到日志。
8. 区块扫描失败不得推进 `last_scanned_block`。

## 6. 前端实现规则

前端目录为 `frontend/`。

前端必须实现用户端和管理员端。

用户端必须包含：

1. 钱包连接。
2. 用户资产页。
3. 充值地址和二维码页。
4. MockUSDT 领取入口。
5. 提现申请页。
6. 充值和提现历史页。
7. Proof of Reserve 查询页。

管理员端必须包含：

1. 管理员看板。
2. 资金归集页面。
3. 风控记录和黑名单页面。
4. 多签审批页面。
5. 资产对账页面。
6. 链上数据中心。
7. 区块扫描状态展示。

前端必须遵守：

1. 页面组件不得直接发起 fetch。
2. API 请求必须放在 `src/services/`。
3. 钱包状态必须通过统一 hook 管理。
4. 每个页面必须处理 loading、empty、error、success、permission 状态。
5. 所有链上交易必须显示 txHash。
6. 管理员操作必须做权限展示和禁止操作处理。
7. 前端不得直接修改用户余额。

## 7. API 契约规则

1. 所有响应必须符合 `docs/api-contract.md`。
2. 字段命名使用 `snake_case`。
3. 时间使用 ISO 8601。
4. 金额使用 atomic unit 字符串。
5. 分页结构必须统一。
6. 错误响应必须包含 `code`、`message`、`details`。
7. 不允许某个接口单独返回字符串或不规则结构。

## 8. 数据库规则

必须使用 SQLite + Prisma，或等价的本地数据库方案。

必须包含以下核心表：

1. `users`
2. `deposit_addresses`
3. `deposits`
4. `ledger_entries`
5. `withdrawals`
6. `risk_events`
7. `blacklist_addresses`
8. `block_scan_state`
9. `reconciliation_reports`
10. `multisig_approvals`

数据库迁移和初始化脚本必须可运行。

## 9. 实现顺序

请按以下顺序实现，不要跳跃式生成代码：

1. 创建项目基础目录和配置。
2. 实现并测试 Solidity 合约。
3. 编写 Anvil 部署脚本并输出合约地址文件。
4. 实现后端配置、数据库 schema、统一响应和错误处理。
5. 实现用户、充值地址、MockUSDT faucet。
6. 实现区块扫描和充值确认入账。
7. 实现提现风控和普通提现。
8. 实现资金归集。
9. 实现多签冷钱包审批和执行。
10. 实现资产对账和 AuditAnchor 上链。
11. 实现 Proof of Reserve。
12. 实现链上全量数据查询。
13. 实现前端用户端页面。
14. 实现前端管理员端页面。
15. 编写 README、启动说明和测试说明。
16. 运行本地测试，修复错误。

## 10. 完成前必须运行的检查

完成前必须运行：

```bash
cd contracts
forge build
forge test
```

```bash
cd backend
npm install
npm run lint || true
npm run test || true
npm run build
```

```bash
cd frontend
npm install
npm run lint || true
npm run build
```

同时必须手动验证：

1. Anvil 能启动。
2. 合约能部署。
3. 后端 `GET /api/v1/health` 正常。
4. 前端能打开。
5. 钱包能连接。
6. 用户能获得充值地址。
7. 充值能被扫描并确认入账。
8. 普通提现能执行。
9. 大额提现能进入多签审批。
10. 两个管理员审批后能执行提现。
11. 黑名单地址能提现失败。
12. 对账报告能生成并上链。
13. 链上数据中心能展示事件。

## 11. 输出要求

完成后请输出：

1. 已实现功能清单。
2. 未实现或降级处理的功能清单。
3. 启动命令。
4. 测试命令。
5. 合约地址。
6. 默认测试账号和管理员地址。
7. 截图建议清单。
8. 可能影响评分的风险点。

## 12. 禁止事项

1. 不要改选题名称。
2. 不要把项目做成只有前端页面的 demo。
3. 不要省略后端账本。
4. 不要省略区块扫描。
5. 不要省略多签。
6. 不要省略对账。
7. 不要伪造链上事件。
8. 不要使用真实主网资产。
9. 不要提交真实私钥。
10. 不要随意改变 API 响应结构。
11. 不要将业务规则写散在 React 组件中。
12. 不要把数据库访问写在 route 中。


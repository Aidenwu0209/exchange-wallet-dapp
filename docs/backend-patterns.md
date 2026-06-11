# 后端模式与约定

## 1. 技术栈

后端使用：

- Node.js 18+
- TypeScript
- Express
- Prisma
- SQLite
- ethers.js 或 viem
- zod 或 class-validator
- BullMQ + Redis，可用本地任务队列模拟

后端是系统资产正确性的核心，必须负责业务规则、风控判断、账本一致性、交易构造、交易广播、区块扫描和审计记录。

## 2. 目录结构

推荐结构：

```text
backend/
├── src/
│   ├── index.ts
│   ├── routes/
│   │   ├── health.routes.ts
│   │   ├── users.routes.ts
│   │   ├── deposits.routes.ts
│   │   ├── withdrawals.routes.ts
│   │   ├── admin.routes.ts
│   │   └── onchain.routes.ts
│   ├── services/
│   │   ├── user.service.ts
│   │   ├── block-scanner.service.ts
│   │   ├── deposit.service.ts
│   │   ├── sweep.service.ts
│   │   ├── risk-engine.service.ts
│   │   ├── withdrawal.service.ts
│   │   ├── multisig.service.ts
│   │   ├── reconciliation.service.ts
│   │   ├── proof-of-reserve.service.ts
│   │   ├── audit-anchor.service.ts
│   │   └── onchain-query.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts
│   │   ├── deposit.repository.ts
│   │   ├── ledger.repository.ts
│   │   ├── withdrawal.repository.ts
│   │   ├── risk.repository.ts
│   │   ├── scan-state.repository.ts
│   │   └── reconciliation.repository.ts
│   ├── schemas/
│   │   ├── common.schema.ts
│   │   ├── user.schema.ts
│   │   ├── deposit.schema.ts
│   │   ├── withdrawal.schema.ts
│   │   └── admin.schema.ts
│   ├── jobs/
│   │   ├── scan-blocks.job.ts
│   │   ├── confirm-deposits.job.ts
│   │   ├── sweep-funds.job.ts
│   │   └── reconcile.job.ts
│   ├── core/
│   │   ├── config.ts
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   ├── prisma.ts
│   │   ├── provider.ts
│   │   ├── contracts.ts
│   │   └── response.ts
│   └── utils/
│       ├── address.ts
│       ├── amount.ts
│       ├── merkle.ts
│       ├── hash.ts
│       └── time.ts
├── prisma/
│   └── schema.prisma
└── package.json
```

## 3. 分层规则

### 3.1 Route 层

Route 只处理 HTTP 输入输出。

Route 可以做：

1. 读取请求参数。
2. 调用 schema 校验参数。
3. 调用 service。
4. 返回统一响应。

Route 禁止做：

1. 直接写数据库。
2. 直接调用合约。
3. 编写复杂业务逻辑。
4. 修改用户余额。
5. 执行风控判断。

### 3.2 Service 层

Service 负责业务编排。

Service 可以做：

1. 调用 repository。
2. 调用合约实例。
3. 控制事务。
4. 执行风控规则。
5. 写入账本流水。
6. 处理区块扫描和确认数逻辑。
7. 生成对账报告。
8. 生成 Merkle Tree。

### 3.3 Repository 层

Repository 只负责数据访问。

Repository 可以做：

1. 创建记录。
2. 查询记录。
3. 更新记录。
4. 执行简单条件过滤。

Repository 禁止做：

1. 风控判断。
2. 链上交易构造。
3. 余额业务计算。
4. HTTP 响应处理。

### 3.4 Schema 层

Schema 负责输入和输出边界定义。

所有外部输入必须经过 schema 校验，包括：

1. 用户 ID。
2. 地址。
3. 金额。
4. 分页参数。
5. 事件类型。
6. 黑名单地址。
7. 审批请求 ID。

## 4. 统一响应规则

所有 route 必须使用 `core/response.ts` 返回统一响应格式。不得在局部接口中发明新结构。

成功响应：

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "request_id": "req_xxx"
  }
}
```

失败响应：

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "可用余额不足",
    "details": {}
  },
  "meta": {
    "request_id": "req_xxx"
  }
}
```

## 5. 数据库事务规则

以下操作必须使用事务：

1. 充值确认入账：更新充值状态、写入账本、增加用户余额。
2. 提现申请：创建提现记录、冻结余额、写入冻结流水。
3. 普通提现确认：更新提现状态、扣减冻结余额、写入提现流水。
4. 大额提现进入多签：创建提现、多签记录、冻结余额。
5. 多签执行成功：更新提现状态、写入链上交易哈希、扣减冻结余额。
6. 对账报告生成：写入报告、写入 Merkle Root、保存 snapshotHash。

事务边界必须位于 Service 层，不能放在 Route 层或 Repository 层。

## 6. 资产账本规则

### 6.1 账本基本原则

1. 所有资产变动必须产生 `ledger_entries`。
2. 不允许只改余额不写流水。
3. 每条流水必须有业务类型和业务 ID。
4. 链上相关流水必须记录 `txHash`、`logIndex`、`blockNumber`。
5. 金额在数据库中统一使用 atomic unit 字符串，避免浮点误差。

### 6.2 账本方向

推荐方向枚举：

```text
CREDIT：增加用户资产
DEBIT：减少用户资产
FREEZE：冻结用户资产
UNFREEZE：解冻用户资产
```

### 6.3 业务类型

推荐业务类型枚举：

```text
DEPOSIT_CONFIRMED
WITHDRAWAL_REQUESTED
WITHDRAWAL_EXECUTED
WITHDRAWAL_REJECTED
SWEEP_TO_HOT
TRANSFER_TO_COLD
RECONCILIATION_ADJUSTMENT
```

## 7. 区块扫描规则

### 7.1 扫描范围

`BlockScanner` 从 `block_scan_state.last_scanned_block + 1` 开始扫描到当前最新区块。

### 7.2 事件识别

仅处理 `MockUSDT.Transfer` 事件，并判断 `to` 地址是否属于系统充值地址。

### 7.3 幂等规则

充值事件唯一键：

```text
chain_id + tx_hash + log_index
```

如果数据库中已经存在相同事件，不得重复入账。

### 7.4 确认数规则

推荐确认数：

```text
LOCAL_CONFIRMATIONS=2
SEPOLIA_CONFIRMATIONS=6
MAINNET_CONFIRMATIONS=12
```

未达到确认数的充值只能为 `PENDING`，不得增加用户可用余额。

### 7.5 异常恢复

1. 扫描失败不得更新 `last_scanned_block`。
2. 后端重启后从 `last_scanned_block` 继续扫描。
3. 如果检测到区块 hash 与历史记录不一致，应将未确认充值回退到待重新确认状态。

## 8. 风控规则

`RiskEngine` 统一处理提现风控。

推荐规则：

| 规则 | 处理结果 |
|---|---|
| 目标地址格式非法 | `REJECTED` |
| 目标地址在黑名单 | `BLOCKED` |
| 用户可用余额不足 | `REJECTED` |
| 单笔金额超过普通提现阈值 | `PENDING_MULTISIG` |
| 10 分钟内提现次数超过 3 次 | `PENDING_REVIEW` |
| 当日累计提现超过限额 | `PENDING_REVIEW` |
| 普通提现且规则通过 | `APPROVED` |

所有风控命中必须写入 `risk_events`。

## 9. 提现规则

### 9.1 普通提现

普通提现流程：

```text
校验参数
→ 风控通过
→ 冻结用户余额
→ 热钱包构造 ERC20 transfer
→ 广播交易
→ 记录 txHash
→ 交易确认后扣减冻结余额
```

### 9.2 大额提现

大额提现流程：

```text
校验参数
→ 风控判定大额提现
→ 冻结用户余额
→ 提交 MultiSigColdWallet 请求
→ 管理员审批
→ 达到阈值后执行链上转账
→ 更新提现状态
```

### 9.3 私钥规则

1. 后端只允许使用测试链私钥。
2. 私钥必须来自 `.env`。
3. 日志中不得输出完整私钥。
4. 前端不得接收或保存私钥。
5. 真实主网不执行真实资金提现。

## 10. 多签规则

1. 多签审批人初始化为 3 个测试地址。
2. 阈值为 2。
3. 同一审批人不得重复审批同一请求。
4. 达到阈值后才能执行。
5. 已执行请求不得重复执行。
6. 多签请求必须绑定业务 ID，防止业务记录与链上请求脱节。

## 11. 对账规则

对账服务需要统计：

1. 所有用户可用余额。
2. 所有用户冻结余额。
3. 用户总负债。
4. 热钱包链上余额。
5. 冷钱包链上余额。
6. 所有充值钱包未归集余额。
7. 链上总储备。
8. 差额。
9. 储备率。
10. Merkle Root。
11. snapshotHash。

如果差额不为 0，需要生成异常状态和告警。

## 12. Proof of Reserve 规则

1. 每个用户资产生成一个叶子节点。
2. 叶子节点不直接暴露真实用户 ID，应使用 `userIdHash`。
3. Merkle Root 写入对账报告。
4. snapshotHash 写入 `AuditAnchor` 合约。
5. 用户可以查询自己的 Merkle Proof。

叶子节点格式：

```text
hash(user_id_hash + asset_symbol + available_balance + frozen_balance)
```

## 13. 错误处理规则

统一错误码示例：

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
USER_NOT_FOUND
DEPOSIT_ADDRESS_NOT_FOUND
INSUFFICIENT_BALANCE
BLACKLISTED_ADDRESS
WITHDRAWAL_LIMIT_EXCEEDED
WITHDRAWAL_TOO_FREQUENT
MULTISIG_APPROVAL_REQUIRED
MULTISIG_ALREADY_APPROVED
MULTISIG_THRESHOLD_NOT_MET
TX_BROADCAST_FAILED
CHAIN_CONNECTION_FAILED
RECONCILIATION_FAILED
DUPLICATE_EVENT
INTERNAL_ERROR
```

所有错误必须返回统一错误结构，不允许直接返回字符串。

## 14. 日志规则

关键日志点：

1. 服务启动。
2. 链连接成功或失败。
3. 合约地址加载成功。
4. 区块扫描开始和结束。
5. 检测到充值事件。
6. 充值确认入账。
7. 提现申请创建。
8. 风控命中。
9. 交易广播成功或失败。
10. 多签审批。
11. 多签执行。
12. 对账开始和结束。
13. 审计哈希上链。

不得在日志中输出完整私钥。

## 15. 测试策略

### 15.1 单元测试

必须测试：

1. 风控规则。
2. 金额换算。
3. 地址校验。
4. Merkle Tree。
5. 幂等入账逻辑。

### 15.2 集成测试

必须测试：

1. 创建用户和充值地址。
2. 模拟充值并扫描入账。
3. 重复扫描不重复入账。
4. 普通提现。
5. 黑名单拦截。
6. 大额提现进入多签。
7. 两个管理员审批后执行。
8. 对账报告生成。

### 15.3 合约测试

必须测试：

1. MockUSDT mint 和 transfer。
2. DepositWalletFactory 创建充值钱包。
3. DepositWallet 归集权限。
4. MultiSigColdWallet 提交、审批、执行、防重复审批。
5. AuditAnchor 写入和查询快照。


# API 契约

## 1. 基本约定

后端对前端提供 REST API。所有接口统一使用 JSON。除文件或特殊资源外，不返回 HTML、纯文本或不规则结构。

默认基础地址：

```text
http://localhost:3001
```

API 版本：

```text
/api/v1
```

本文件是前后端对接的稳定契约。前端不得自行假设后端响应结构，后端不得为局部接口随意发明新的响应格式。

## 2. 统一响应结构

### 2.1 成功响应

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "request_id": "req_20260611_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 2.2 失败响应

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "可用余额不足",
    "details": {
      "available": "1000000000000000000",
      "required": "2000000000000000000"
    }
  },
  "meta": {
    "request_id": "req_20260611_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

## 3. 分页结构

分页接口响应中的 `data` 必须包含：

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 100
}
```

分页参数：

```text
page：默认 1
page_size：默认 20，最大 100
```

## 4. 字段命名规范

API JSON 字段统一使用 `snake_case`。

示例：

```json
{
  "user_id": "u_001",
  "wallet_address": "0x0000000000000000000000000000000000000000",
  "created_at": "2026-06-11T00:00:00.000Z"
}
```

前端内部可以使用 camelCase，但 services 层必须负责转换或统一处理。

## 5. 时间格式

所有时间使用 ISO 8601 UTC 格式：

```text
2026-06-11T00:00:00.000Z
```

前端展示时可以转换为本地时间。

## 6. 金额格式

链上金额统一使用 atomic unit 字符串，不使用浮点数。

示例：

```json
{
  "amount": "1000000000000000000",
  "decimals": 18,
  "display_amount": "1.0"
}
```

后端必须保存 atomic unit。前端可以展示 decimal string。

## 7. 地址格式

EVM 地址字段使用 0x 开头的 42 位地址字符串。后端保存时建议统一 checksum 或 lowercase，但响应中必须保持合法 EVM 地址格式。

## 8. 状态枚举

### 8.1 充值状态

```text
DETECTED
PENDING
CONFIRMED
FAILED
REORGED
```

### 8.2 提现状态

```text
CREATED
RISK_REJECTED
PENDING_REVIEW
PENDING_MULTISIG
APPROVED
BROADCASTED
CONFIRMED
FAILED
CANCELLED
```

### 8.3 风险等级

```text
LOW
MEDIUM
HIGH
BLOCKED
```

### 8.4 对账状态

```text
MATCHED
MISMATCHED
ANCHORED
FAILED
```

## 9. 健康检查接口

### 9.1 查询服务状态

```text
GET /api/v1/health
```

响应：

```json
{
  "success": true,
  "data": {
    "service": "exchange-wallet-backend",
    "status": "ok",
    "chain_id": 31337,
    "latest_block": 100,
    "database": "ok",
    "contracts_loaded": true
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

## 10. 用户接口

### 10.1 创建用户

```text
POST /api/v1/users
```

请求：

```json
{
  "username": "alice",
  "wallet_address": "0x0000000000000000000000000000000000000001"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "user_id": "u_001",
    "username": "alice",
    "wallet_address": "0x0000000000000000000000000000000000000001",
    "deposit_address": "0x0000000000000000000000000000000000000002",
    "user_id_hash": "0xabc...",
    "created_tx_hash": "0xdef..."
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 10.2 查询用户资产

```text
GET /api/v1/users/{user_id}/assets
```

响应：

```json
{
  "success": true,
  "data": {
    "user_id": "u_001",
    "asset_symbol": "MockUSDT",
    "available_balance": "1000000000000000000",
    "frozen_balance": "0",
    "total_deposit": "1000000000000000000",
    "total_withdrawal": "0",
    "decimals": 18
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 10.3 查询用户充值地址

```text
GET /api/v1/users/{user_id}/deposit-address
```

响应：

```json
{
  "success": true,
  "data": {
    "user_id": "u_001",
    "chain_id": 31337,
    "asset_symbol": "MockUSDT",
    "deposit_address": "0x0000000000000000000000000000000000000002",
    "qr_payload": "ethereum:0x0000000000000000000000000000000000000002"
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

## 11. 测试币接口

### 11.1 领取 MockUSDT

```text
POST /api/v1/faucet/mock-usdt
```

请求：

```json
{
  "to_address": "0x0000000000000000000000000000000000000001",
  "amount": "1000000000000000000000"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "tx_hash": "0xabc...",
    "to_address": "0x0000000000000000000000000000000000000001",
    "amount": "1000000000000000000000"
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

## 12. 充值接口

### 12.1 手动触发区块扫描

```text
POST /api/v1/deposits/scan
```

请求：

```json
{
  "from_block": 1,
  "to_block": "latest"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "scanned_from": 1,
    "scanned_to": 100,
    "detected_events": 3,
    "created_deposits": 2,
    "duplicate_events": 1
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 12.2 手动触发充值确认

```text
POST /api/v1/deposits/confirm
```

响应：

```json
{
  "success": true,
  "data": {
    "confirmed_count": 2,
    "pending_count": 1,
    "required_confirmations": 2
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 12.3 查询用户充值历史

```text
GET /api/v1/deposits/{user_id}/history?page=1&page_size=20
```

响应：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "deposit_id": "dep_001",
        "from_address": "0x0000000000000000000000000000000000000001",
        "deposit_address": "0x0000000000000000000000000000000000000002",
        "amount": "1000000000000000000",
        "tx_hash": "0xabc...",
        "log_index": 0,
        "detected_block": 10,
        "confirmed_block": 12,
        "confirmations": 2,
        "status": "CONFIRMED",
        "created_at": "2026-06-11T00:00:00.000Z"
      }
    ],
    "page": 1,
    "page_size": 20,
    "total": 1
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

## 13. 提现接口

### 13.1 创建提现申请

```text
POST /api/v1/withdrawals
```

请求：

```json
{
  "user_id": "u_001",
  "to_address": "0x0000000000000000000000000000000000000003",
  "amount": "1000000000000000000",
  "asset_symbol": "MockUSDT"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_001",
    "status": "BROADCASTED",
    "risk_level": "LOW",
    "risk_reason": null,
    "tx_hash": "0xabc...",
    "multisig_request_id": null
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

大额提现响应示例：

```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_002",
    "status": "PENDING_MULTISIG",
    "risk_level": "HIGH",
    "risk_reason": "单笔提现超过大额阈值，需要多签审批",
    "tx_hash": null,
    "multisig_request_id": "1"
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 13.2 查询提现历史

```text
GET /api/v1/withdrawals/{user_id}/history?page=1&page_size=20
```

### 13.3 查询提现详情

```text
GET /api/v1/withdrawals/detail/{withdrawal_id}
```

## 14. 管理员接口

### 14.1 管理员看板

```text
GET /api/v1/admin/dashboard
```

响应：

```json
{
  "success": true,
  "data": {
    "hot_wallet": {
      "address": "0xhot...",
      "balance": "100000000000000000000"
    },
    "cold_wallet": {
      "address": "0xcold...",
      "balance": "500000000000000000000"
    },
    "deposit_wallets": {
      "count": 10,
      "total_uncollected_balance": "3000000000000000000"
    },
    "ledger": {
      "total_user_available": "200000000000000000000",
      "total_user_frozen": "10000000000000000000"
    },
    "pending_multisig_count": 2,
    "risk_event_count": 5
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 14.2 资金归集

```text
POST /api/v1/admin/sweep
```

请求：

```json
{
  "deposit_address": "0x0000000000000000000000000000000000000002"
}
```

一键归集请求：

```json
{
  "deposit_address": "ALL"
}
```

响应：

```json
{
  "success": true,
  "data": {
    "sweep_count": 1,
    "tx_hashes": ["0xabc..."],
    "total_amount": "1000000000000000000"
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 14.3 查询待审批提现

```text
GET /api/v1/admin/pending-withdrawals?page=1&page_size=20
```

### 14.4 生成 EIP-712 审批签名数据

```text
GET /api/v1/admin/withdrawals/{withdrawal_id}/approval-typed-data?approver_address=0x0000000000000000000000000000000000000004
```

响应中的 `typed_data` 是标准 EIP-712 JSON，前端应原样传给 MetaMask `eth_signTypedData_v4`。`deadline` 必须在提交审批时一起回传，后端会按同一份业务数据重建 typed data 并验签。

响应：

```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_002",
    "approver_address": "0x0000000000000000000000000000000000000004",
    "deadline": "1781179000",
    "expires_at": "2026-06-11T11:56:40.000Z",
    "typed_data": {
      "domain": {
        "name": "ExchangeWalletMultisigApproval",
        "version": "1",
        "chainId": 31337,
        "verifyingContract": "0x0000000000000000000000000000000000001000"
      },
      "types": {
        "MultisigApproval": [
          { "name": "withdrawal_id", "type": "string" },
          { "name": "multisig_request_id", "type": "uint256" },
          { "name": "approver", "type": "address" },
          { "name": "token", "type": "address" },
          { "name": "to", "type": "address" },
          { "name": "amount", "type": "uint256" },
          { "name": "deadline", "type": "uint256" },
          { "name": "action", "type": "string" }
        ]
      },
      "primaryType": "MultisigApproval",
      "message": {
        "withdrawal_id": "wd_002",
        "multisig_request_id": "1",
        "approver": "0x0000000000000000000000000000000000000004",
        "token": "0x0000000000000000000000000000000000002000",
        "to": "0x0000000000000000000000000000000000003000",
        "amount": "1000000000000000000000",
        "deadline": "1781179000",
        "action": "APPROVE_WITHDRAWAL"
      }
    }
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 14.5 审批大额提现

```text
POST /api/v1/admin/withdrawals/{withdrawal_id}/approve
```

请求：

```json
{
  "approver_address": "0x0000000000000000000000000000000000000004",
  "signature": "0xsig...",
  "deadline": "1781179000"
}
```

本地 CLI 自动化可以只传 `approver_address`，由后端使用 `.env` 中对应测试私钥广播审批；前端管理员页面必须使用上一步生成的 EIP-712 签名。

响应：

```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_002",
    "multisig_request_id": "1",
    "approved_count": 2,
    "threshold": 2,
    "can_execute": true,
    "approval_tx_hash": "0xabc...",
    "eip712_verified": true
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 14.6 执行大额提现

```text
POST /api/v1/admin/withdrawals/{withdrawal_id}/execute
```

响应：

```json
{
  "success": true,
  "data": {
    "withdrawal_id": "wd_002",
    "status": "BROADCASTED",
    "tx_hash": "0xabc..."
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 14.7 新增黑名单地址

```text
POST /api/v1/admin/blacklist
```

请求：

```json
{
  "address": "0x0000000000000000000000000000000000000005",
  "reason": "测试黑名单地址"
}
```

### 14.8 查询风控事件

```text
GET /api/v1/admin/risk-events?page=1&page_size=20
```

## 15. 对账与储备金证明接口

### 15.1 执行资产对账

```text
POST /api/v1/admin/reconcile
```

响应：

```json
{
  "success": true,
  "data": {
    "report_id": "rec_001",
    "total_user_balance": "200000000000000000000",
    "total_frozen_balance": "10000000000000000000",
    "hot_wallet_balance": "100000000000000000000",
    "cold_wallet_balance": "110000000000000000000",
    "deposit_wallet_balance": "0",
    "total_onchain_balance": "210000000000000000000",
    "diff": "0",
    "reserve_ratio": "1.0",
    "merkle_root": "0xmerkle...",
    "snapshot_hash": "0xsnapshot...",
    "anchor_tx_hash": "0xanchor...",
    "status": "ANCHORED"
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 15.2 查询最新对账报告

```text
GET /api/v1/admin/reconcile/latest
```

### 15.3 查询用户储备金证明

```text
GET /api/v1/users/{user_id}/proof-of-reserve
```

响应：

```json
{
  "success": true,
  "data": {
    "user_id": "u_001",
    "user_id_hash": "0xuserhash...",
    "asset_symbol": "MockUSDT",
    "available_balance": "1000000000000000000",
    "frozen_balance": "0",
    "leaf_hash": "0xleaf...",
    "merkle_root": "0xmerkle...",
    "proof": ["0xproof1...", "0xproof2..."],
    "snapshot_hash": "0xsnapshot...",
    "verified": true
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

## 16. 链上数据查询接口

### 16.1 查询链上事件

```text
GET /api/v1/admin/onchain-events?event_type=ALL&page=1&page_size=20
```

支持的 `event_type`：

```text
ALL
TRANSFER
DEPOSIT_WALLET_CREATED
SWEPT
WITHDRAWAL_SUBMITTED
WITHDRAWAL_APPROVED
WITHDRAWAL_EXECUTED
AUDIT_ANCHORED
```

响应：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "event_type": "TRANSFER",
        "contract_address": "0xtoken...",
        "tx_hash": "0xabc...",
        "block_number": 100,
        "log_index": 0,
        "args": {
          "from": "0xfrom...",
          "to": "0xto...",
          "value": "1000000000000000000"
        }
      }
    ],
    "page": 1,
    "page_size": 20,
    "total": 1
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

### 16.2 查询区块扫描状态

```text
GET /api/v1/admin/block-scan-state
```

响应：

```json
{
  "success": true,
  "data": {
    "chain_id": 31337,
    "last_scanned_block": 100,
    "latest_block": 105,
    "required_confirmations": 2,
    "scanner_status": "running"
  },
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "timestamp": "2026-06-11T00:00:00.000Z"
  }
}
```

## 17. 错误码

| 错误码 | 含义 |
|---|---|
| `VALIDATION_ERROR` | 参数校验失败 |
| `UNAUTHORIZED` | 未认证 |
| `FORBIDDEN` | 权限不足 |
| `USER_NOT_FOUND` | 用户不存在 |
| `DEPOSIT_ADDRESS_NOT_FOUND` | 充值地址不存在 |
| `INSUFFICIENT_BALANCE` | 可用余额不足 |
| `BLACKLISTED_ADDRESS` | 目标地址在黑名单中 |
| `WITHDRAWAL_LIMIT_EXCEEDED` | 提现超过限额 |
| `WITHDRAWAL_TOO_FREQUENT` | 提现频率异常 |
| `MULTISIG_APPROVAL_REQUIRED` | 需要多签审批 |
| `MULTISIG_ALREADY_APPROVED` | 当前审批人已经审批 |
| `MULTISIG_THRESHOLD_NOT_MET` | 多签阈值未达到 |
| `INVALID_SIGNATURE` | EIP-712 审批签名无效 |
| `SIGNATURE_EXPIRED` | EIP-712 审批签名已过期 |
| `TX_BROADCAST_FAILED` | 链上交易广播失败 |
| `CHAIN_CONNECTION_FAILED` | 区块链节点连接失败 |
| `RECONCILIATION_FAILED` | 资产对账失败 |
| `DUPLICATE_EVENT` | 重复链上事件 |
| `INTERNAL_ERROR` | 服务端内部错误 |

## 18. 幂等规则

1. 充值事件唯一键为 `chain_id + tx_hash + log_index`。
2. 创建用户可使用 `wallet_address` 或 `username` 判断重复。
3. 大额提现执行前必须判断是否已执行。
4. 多签审批前必须判断当前审批人是否已经审批。
5. 对账上链前必须判断 `snapshot_hash` 是否已经锚定。

## 19. 版本策略

当前版本为：

```text
/api/v1
```

后续新增字段必须向后兼容。不得删除已有字段。需要破坏性调整时，应新增 `/api/v2`。

# 前端模式与约定

## 1. 技术栈

前端使用：

- Next.js App Router
- React
- TypeScript
- wagmi + viem
- MetaMask
- Tailwind CSS 或 CSS Module
- qrcode.react
- fetch API 或轻量 API client

前端不得保存私钥，不得直接修改资产余额，不得绕过后端风控直接执行业务提现。

## 2. 目录结构

推荐结构：

```text
frontend/
├── app/
│   ├── page.tsx
│   ├── user/
│   │   ├── assets/page.tsx
│   │   ├── deposit/page.tsx
│   │   ├── withdraw/page.tsx
│   │   ├── history/page.tsx
│   │   └── proof-of-reserve/page.tsx
│   └── admin/
│       ├── dashboard/page.tsx
│       ├── sweep/page.tsx
│       ├── risk/page.tsx
│       ├── multisig/page.tsx
│       ├── reconciliation/page.tsx
│       └── onchain-data/page.tsx
├── src/
│   ├── components/
│   │   ├── layout/
│   │   ├── ui/
│   │   └── feedback/
│   ├── features/
│   │   ├── wallet-connect/
│   │   ├── user-assets/
│   │   ├── deposit/
│   │   ├── withdraw/
│   │   ├── admin-dashboard/
│   │   ├── risk-control/
│   │   ├── multisig/
│   │   ├── reconciliation/
│   │   └── onchain-data/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   └── utils/
└── package.json
```

## 3. 分层规则

### 3.1 页面层

页面层位于 `app/**/page.tsx`。

页面层只负责：

1. 页面布局。
2. 调用 feature 组件。
3. 处理路由参数。
4. 组合页面级 UI。

页面层不得：

1. 直接写复杂业务逻辑。
2. 直接拼接 API URL。
3. 直接处理资产账本计算。
4. 直接决定提现风控结果。

### 3.2 Feature 层

Feature 层位于 `src/features/`。

Feature 层负责一个业务场景的组合，例如充值、提现、风控看板、多签审批、资产对账等。

Feature 组件可以：

1. 调用 hooks。
2. 组合多个通用组件。
3. 处理局部表单状态。
4. 展示业务状态。

Feature 组件不得：

1. 直接访问数据库。
2. 伪造后端业务状态。
3. 在前端自行修改资产余额。

### 3.3 Components 层

`src/components/` 只放通用组件。

通用组件包括：

1. `Button`。
2. `Card`。
3. `Table`。
4. `StatusBadge`。
5. `AddressText`。
6. `TxHashLink`。
7. `EmptyState`。
8. `ErrorState`。
9. `LoadingState`。
10. `PermissionGuard`。

通用组件不得耦合具体业务接口。

### 3.4 Hooks 层

`src/hooks/` 放可复用逻辑。

推荐 hooks：

1. `useWalletStatus()`：封装钱包地址、链 ID、连接状态。
2. `useAdminGuard()`：判断当前钱包是否管理员。
3. `useApiQuery()`：封装 GET 请求状态。
4. `useApiMutation()`：封装 POST 请求状态。
5. `useTransactionStatus()`：根据 txHash 查询交易状态。
6. `usePolling()`：轮询充值状态、提现状态或区块扫描状态。

### 3.5 Services 层

`src/services/` 是前端唯一允许发起后端 API 请求的位置。

禁止在 React 组件里直接写：

```ts
fetch('/api/...')
```

必须封装为：

```ts
import { apiClient } from '@/services/api-client';

export function getUserAssets(userId: string) {
  return apiClient.get(`/api/users/${userId}/assets`);
}
```

## 4. API 调用规则

1. 所有 API 响应必须符合 `docs/api-contract.md`。
2. 前端只读取 `success`、`data`、`error`、`meta`。
3. API 失败时必须展示错误信息。
4. API 处理中必须展示 loading。
5. 空数据必须展示 empty state。
6. 权限不足必须展示 permission state。
7. 交易提交后必须展示 txHash。
8. 需要确认的交易必须展示确认状态。

## 5. 钱包连接规则

### 5.1 必须展示的信息

前端顶部或侧边栏必须展示：

1. 当前钱包地址。
2. 当前 Chain ID。
3. 是否连接 MetaMask。
4. 是否为管理员。
5. 是否为多签审批人。
6. 当前网络是否为支持网络。

### 5.2 支持网络

默认支持：

| 网络 | Chain ID | 用途 |
|---|---:|---|
| Anvil | 31337 | 完整本地演示 |
| Sepolia | 11155111 | 测试网部署验证 |
| Ethereum Mainnet | 1 | Mainnet-ready 配置展示，不承载真实业务 |

### 5.3 管理员权限

管理员按钮必须通过 `PermissionGuard` 包裹。非管理员不能执行：

1. 资金归集。
2. 转入冷钱包。
3. 审批大额提现。
4. 执行多签提现。
5. 新增黑名单。
6. 执行资产对账上链。

## 6. 页面状态规范

每个页面必须处理以下状态：

| 状态 | 展示要求 |
|---|---|
| loading | 显示加载中，不允许用户重复提交 |
| empty | 显示清晰的空数据提示 |
| error | 显示错误码和错误信息 |
| success | 显示成功结果，链上交易必须展示 txHash |
| permission | 权限不足时展示说明 |
| pending | 交易或充值确认中展示确认进度 |

## 7. 表单规则

### 7.1 充值页

充值页展示：

1. 用户 ID。
2. 充值地址。
3. 地址二维码。
4. 复制按钮。
5. MockUSDT 领取按钮。
6. 充值历史。
7. 充值确认状态。

### 7.2 提现页

提现表单字段：

1. 目标地址。
2. 提现金额。
3. 资产类型，默认为 MockUSDT。
4. 备注，可选。

前端只做基础校验：

1. 地址格式是否像 EVM 地址。
2. 金额是否大于 0。
3. 金额输入是否为数字。

后端负责最终风控校验。

### 7.3 管理员审批页

多签审批页面展示：

1. 提现请求 ID。
2. 用户 ID。
3. 目标地址。
4. 金额。
5. 风险等级。
6. 已审批人数。
7. 审批阈值。
8. 当前钱包是否已审批。
9. 审批按钮。
10. 执行按钮。

## 8. 数据展示规则

### 8.1 地址展示

地址默认缩略展示：

```text
0x1234...abcd
```

同时提供复制按钮。

### 8.2 金额展示

所有链上金额后端返回 atomic unit 字符串，前端展示时转换为 decimal string。

示例：

```text
1000000000000000000 → 1.000000 MockUSDT
```

### 8.3 时间展示

API 返回 ISO 8601 时间。前端展示本地时间。

### 8.4 交易哈希展示

交易哈希应缩略显示，并可复制。在本地链中无需跳转外部浏览器；在 Sepolia 或主网中可以根据网络生成浏览器链接。

## 9. 样式约定

1. 页面风格简洁、稳定、偏后台管理系统。
2. 不使用过多动画。
3. 用户端强调清晰资产状态。
4. 管理员端强调看板、表格、状态标签和操作按钮。
5. 风险状态使用明显标签，例如 `LOW`、`MEDIUM`、`HIGH`、`BLOCKED`。
6. 成功、失败、等待确认、风控拦截必须有不同文本提示。

## 10. 禁止事项

1. 禁止在前端硬编码真实私钥。
2. 禁止前端直接修改余额。
3. 禁止组件内随意发请求。
4. 禁止伪造充值到账结果。
5. 禁止绕过后端风控直接提现。
6. 禁止使用不符合 API 契约的响应结构。
7. 禁止为了页面好看牺牲业务状态展示。


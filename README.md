# 选题二：交易所钱包系统 DApp 开发

本仓库实现课程设计要求的交易所钱包系统 DApp，包含 Solidity/Foundry 智能合约、Node.js/TypeScript/Express/Prisma 后端、Next.js/wagmi 前端。系统使用 MockUSDT 和本地 Anvil 链演示，不使用真实主网资产。

## 功能覆盖

- 用户独立充值地址：`DepositWalletFactory` 为每个用户创建 `DepositWallet`。
- 链上充值监听：后端扫描 `MockUSDT.Transfer`，按 `chain_id + tx_hash + log_index` 幂等入库。
- 确认数入账：未达确认数保持 `PENDING`，达标后写 `ledger_entries` 并增加用户可用余额。
- 热冷钱包隔离：普通提现走热钱包，大额提现走 `MultiSigColdWallet`。
- 资金归集：管理员调用工厂合约，把充值钱包余额扫到热钱包。
- 提现风控：黑名单、余额不足、频率、日限额、大额阈值。
- 大额提现多签：2/3 审批后执行，链上防重复审批和重复执行。
- EIP-712 离线审批：管理员用 MetaMask 对多签审批 typed data 签名，后端验签后广播链上审批。
- 本地账本：所有资产变化写入 `ledger_entries`。
- 对账与审计：统计本地负债和链上储备，生成 Merkle Root 与 snapshotHash，并写入 `AuditAnchor`。
- Proof of Reserve：用户可查询自己的 Merkle Proof。
- 链上数据中心：展示充值、归集、多签、审计锚定等关键事件。
- MetaMask 钱包连接：前端支持 Anvil、Sepolia、Mainnet-ready 网络展示。

## 目录结构

```text
contracts/  Solidity 合约、Foundry 测试、部署脚本
backend/    Express API、Prisma/SQLite、区块扫描、风控、对账、多签服务
frontend/   Next.js App Router 用户端和管理员端页面
docs/       架构、API 契约、报告草稿、测试记录、截图清单
scripts/    本地启动、部署、数据库初始化和 smoke check
```

## 环境要求

- Foundry：`forge`、`anvil`
- Node.js 18+，推荐 Node.js 22
- npm
- MetaMask 浏览器插件

## 从零启动

需要 4 个终端。

### 1. 安装依赖

```bash
cd contracts
forge build

cd ../backend
npm install

cd ../frontend
npm install
```

### 2. 准备环境变量

```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

把 `backend/.env` 中的私钥占位符替换为 Anvil 终端打印的测试私钥。不要使用真实主网私钥。

默认管理员地址：

```text
admin1/hot wallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
admin2:            0x70997970C51812dc3A010C7d01b50e0d17dc79C8
admin3:            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

### 3. 终端 1：启动 Anvil

```bash
./scripts/start-anvil.sh
```

### 4. 终端 2：部署合约并初始化数据库

```bash
export DEPLOYER_PRIVATE_KEY=<Anvil 第一个账户测试私钥>
./scripts/deploy-anvil.sh
./scripts/init-backend-db.sh
```

部署完成后会生成：

```text
contracts/deployments/anvil.json
```

后端默认会读取这个文件。如果需要，也可以把其中地址复制到 `backend/.env` 的合约地址字段。

如果当前机器上的 Prisma schema engine 在 `prisma db push` 阶段报空错误，初始化脚本会自动使用 `backend/prisma/init.sql` 创建 SQLite 表结构，并继续执行 seed。

### 5. 终端 2：启动后端

```bash
cd backend
npm run dev
```

健康检查：

```bash
curl http://localhost:3001/api/v1/health
```

### 6. 终端 3：启动前端

```bash
cd frontend
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

### 7. MetaMask 配置

添加本地网络：

```text
Network name: Anvil
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency: ETH
```

导入 Anvil 测试账户后连接前端。

## 本地演示流程

1. 用户资产页连接 MetaMask，创建用户并获得独立充值地址。
2. 充值页领取 MockUSDT 到用户钱包。
3. 用 MetaMask 向独立充值地址转入 MockUSDT。
4. 充值页点击“扫描区块”和“确认入账”，观察 `PENDING` 到 `CONFIRMED`。
5. 用户资产页查看可用余额增加。
6. 管理员资金归集页执行 `ALL` 归集。
7. 用户提现页发起普通提现。
8. 风控页添加黑名单地址，再向该地址提现，观察拦截。
9. 提交超过 `LARGE_WITHDRAWAL_THRESHOLD` 的大额提现，进入多签审批。
10. 多签页用两个管理员地址分别通过 MetaMask EIP-712 签名审批，达到阈值后执行。
11. 对账页生成报告并上链到 `AuditAnchor`。
12. 链上数据中心查看关键事件。
13. 用户 PoR 页面查询 Merkle Proof。

## 测试命令

```bash
cd contracts
forge build
forge test
```

```bash
cd backend
npm install
npm run build
npm run test
```

```bash
cd frontend
npm install
npm run build
npm run lint
```

根目录：

```bash
npm run check
```

## Sepolia / Mainnet-ready 部署说明

部署脚本默认不自动执行真实主网交易。需要部署到 Sepolia 或 Mainnet-ready 环境时：

1. 使用测试网或主网 RPC 设置 `RPC_URL`。
2. 设置 `DEPLOYER_PRIVATE_KEY`，仅使用专门测试部署账户。
3. 设置 `DEPLOY_NETWORK=sepolia` 或 `mainnet-ready`。
4. 设置 `DEPLOYMENT_FILE=./deployments/sepolia.json`。
5. 执行 `./scripts/deploy-anvil.sh` 同一脚本入口。

Mainnet-ready 仅表示脚本和配置结构可用于部署，不表示本课程项目默认承载真实资产。

## 安全说明

- `.env`、真实私钥、真实助记词、RPC Key、数据库文件、构建产物不提交。
- `.env.example` 只保留占位符和公开测试地址。
- 所有金额使用 atomic unit 字符串。
- 前端不保存私钥、不直接修改用户余额。
- 管理员大额提现审批默认走 EIP-712 离线签名，后端只接受签名地址与审批地址一致且未过期的签名。

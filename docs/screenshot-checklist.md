# 截图清单

项目名称：选题二：交易所钱包系统 DApp 开发

建议截图按以下顺序放入课程报告：

1. Anvil 启动成功，显示 Chain ID 31337 和测试账户。
2. `forge build` 成功。
3. `forge test` 成功。
4. 合约部署成功，展示 `contracts/deployments/anvil.json`。
5. 后端 `GET /api/v1/health` 成功。
6. 前端首页打开，MetaMask 已连接 Anvil。
7. 用户资产页创建用户，显示 `user_id`、充值地址、创建 txHash。
8. 充值页显示独立充值地址和二维码。
9. Faucet 领取 MockUSDT 成功，显示 txHash。
10. MetaMask 向充值地址转账 MockUSDT。
11. 区块扫描后充值记录为 `PENDING`。
12. 达到确认数并确认入账后充值记录为 `CONFIRMED`。
13. 用户资产页可用余额增加。
14. 管理员看板显示热钱包、冷钱包、未归集充值钱包和账本统计。
15. 资金归集页面执行 `ALL` 归集，显示 txHash。
16. 普通提现成功，显示 txHash。
17. 黑名单页面新增黑名单地址。
18. 向黑名单地址提现被风控拦截，显示错误或 `RISK_REJECTED`。
19. 大额提现进入 `PENDING_MULTISIG`。
20. 多签页面 MetaMask EIP-712 签名弹窗。
21. 多签页面管理员 1 签名审批成功。
22. 多签页面管理员 2 签名审批后达到阈值。
23. 多签执行成功，显示提现 txHash。
24. 资产对账页面生成报告，显示本地负债、链上储备、diff、reserve ratio。
25. AuditAnchor 上链成功，显示 snapshotHash、merkleRoot、anchor txHash。
26. 用户 Proof of Reserve 页面显示 leaf、proof、root、verified。
27. 链上数据中心显示 `TRANSFER`、`SWEPT`、`WITHDRAWAL_APPROVED`、`AUDIT_ANCHORED` 等事件。
28. `npm run check` 或分模块 build/test 命令成功截图。

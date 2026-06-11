export type ErrorDetails = Record<string, unknown>;

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: ErrorDetails;

  constructor(code: string, message: string, statusCode = 400, details: ErrorDetails = {}) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const errors = {
  validation: (details: ErrorDetails) => new AppError("VALIDATION_ERROR", "参数校验失败", 400, details),
  forbidden: () => new AppError("FORBIDDEN", "权限不足", 403),
  userNotFound: (userId: string) => new AppError("USER_NOT_FOUND", "用户不存在", 404, { user_id: userId }),
  depositAddressNotFound: (userId: string) =>
    new AppError("DEPOSIT_ADDRESS_NOT_FOUND", "充值地址不存在", 404, { user_id: userId }),
  insufficientBalance: (available: string, required: string) =>
    new AppError("INSUFFICIENT_BALANCE", "可用余额不足", 400, { available, required }),
  blacklisted: (address: string) => new AppError("BLACKLISTED_ADDRESS", "目标地址在黑名单中", 400, { address }),
  chainConnection: (message: string) => new AppError("CHAIN_CONNECTION_FAILED", message, 503),
  txBroadcast: (message: string) => new AppError("TX_BROADCAST_FAILED", message, 502),
  multisigAlreadyApproved: () => new AppError("MULTISIG_ALREADY_APPROVED", "当前审批人已经审批", 400),
  multisigThresholdNotMet: () => new AppError("MULTISIG_THRESHOLD_NOT_MET", "多签阈值未达到", 400),
  reconciliation: (message: string) => new AppError("RECONCILIATION_FAILED", message, 500)
};

import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, errors } from "./errors.js";
import { randomId } from "../utils/id.js";

export type ApiMeta = {
  request_id: string;
  timestamp: string;
};

declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.requestId = `req_${randomId()}`;
  next();
}

export function ok<T>(req: Request, res: Response, data: T, status = 200) {
  const meta: ApiMeta = {
    request_id: req.requestId,
    timestamp: new Date().toISOString()
  };
  return res.status(status).json({ success: true, data, error: null, meta });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const normalized =
    err instanceof ZodError
      ? errors.validation(err.flatten())
      : err instanceof AppError
        ? err
        : new AppError("INTERNAL_ERROR", err instanceof Error ? err.message : "服务端内部错误", 500);

  const meta: ApiMeta = {
    request_id: req.requestId ?? `req_${randomId()}`,
    timestamp: new Date().toISOString()
  };

  return res.status(normalized.statusCode).json({
    success: false,
    data: null,
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details
    },
    meta
  });
}

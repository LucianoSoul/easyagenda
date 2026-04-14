import { ZodError } from "zod";
import { AppError } from "./app-error.js";
function normalizeStatusCode(value) {
    if (typeof value === "number" && Number.isInteger(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isInteger(parsed)) {
            return parsed;
        }
    }
    return 500;
}
function normalizeMessage(error) {
    if (error && typeof error === "object" && "message" in error) {
        const message = error.message;
        if (typeof message === "string" && message.trim().length > 0) {
            return message;
        }
    }
    return "Erro interno do servidor.";
}
export default function errorHandler(error, _request, reply) {
    if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
            success: false,
            error: {
                code: error.code,
                message: error.message
            }
        });
    }
    if (error instanceof ZodError) {
        return reply.status(400).send({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Dados inválidos.",
                details: error.flatten()
            }
        });
    }
    const statusCode = normalizeStatusCode(error.statusCode);
    const code = typeof error.code === "string" && error.code.length > 0
        ? error.code
        : "INTERNAL_SERVER_ERROR";
    const message = normalizeMessage(error);
    console.error(error);
    return reply.status(statusCode).send({
        success: false,
        error: {
            code,
            message
        }
    });
}

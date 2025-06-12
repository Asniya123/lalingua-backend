var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    getAllWallet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                if (!userId) {
                    throw new Error("User ID is required");
                }
                const wallet = yield this.walletService.getAllWallet(userId);
                res.status(200).json({
                    success: true,
                    message: "Fetched wallet successfully",
                    wallet,
                });
            }
            catch (error) {
                console.error("Controller: Error in getAllWallet:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("not found")
                            ? 404
                            : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to fetch wallet",
                });
            }
        });
    }
    checkBalance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { userId, amount } = req.body;
                const authenticatedUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                if (!userId || !authenticatedUserId) {
                    throw new Error("User ID is required");
                }
                if (userId !== authenticatedUserId) {
                    throw new Error("Unauthorized: User ID mismatch");
                }
                if (typeof amount !== "number" || amount < 0) {
                    throw new Error("Invalid amount");
                }
                const walletResponse = yield this.walletService.wallet_payment({
                    userId,
                    amount,
                });
                res.status(200).json(walletResponse);
            }
            catch (error) {
                console.error("Controller: Error checking wallet balance:", {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                const statusCode = error instanceof Error
                    ? error.message.includes("Invalid") || error.message.includes("required")
                        ? 400
                        : error.message.includes("Unauthorized")
                            ? 401
                            : error.message.includes("not found") || error.message.includes("Insufficient")
                                ? 400
                                : 500
                    : 500;
                res.status(statusCode).json({
                    success: false,
                    message: error instanceof Error ? error.message : "Failed to check wallet balance",
                });
            }
        });
    }
}

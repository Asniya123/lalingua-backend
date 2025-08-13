import { IWalletController, IWalletService } from "../../interface/IWallet"
import {  Request, Response } from "express";

export default class WalletController implements IWalletController{
    private walletService: IWalletService

    constructor(walletService: IWalletService){
        this.walletService = walletService
    }

   async getAllWallet(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new Error("User ID is required");
      }

      const wallet = await this.walletService.getAllWallet(userId);
      res.status(200).json({
        success: true,
        message: "Fetched wallet successfully",
        wallet,
      });
    } catch (error) {
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
  }

  async checkBalance(req: Request, res: Response): Promise<void> {
    try {
      const { userId, amount } = req.body;
      const authenticatedUserId = req.user?._id;

      if (!userId || !authenticatedUserId) {
        throw new Error("User ID is required");
      }
      if (userId !== authenticatedUserId) {
        throw new Error("Unauthorized: User ID mismatch");
      }
      if (typeof amount !== "number" || amount < 0) {
        throw new Error("Invalid amount");
      }

      const walletResponse = await this.walletService.wallet_payment({
        userId,
        amount,
      });

      res.status(200).json(walletResponse);
    } catch (error) {
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
  }
}

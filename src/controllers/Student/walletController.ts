import HttpStatusCode from "../../domain/enum/httpstatus.js";
import { CustomError } from "../../domain/errors/customError.js";
import { IWalletController, IWalletService } from "../../interface/IWallet.js"
import {  Request, Response } from "express";

export default class WalletController implements IWalletController{
    private walletService: IWalletService

    constructor(walletService: IWalletService){
        this.walletService = walletService
    }

    async getAllWallet(req: Request, res: Response): Promise<void> {
        try {
          const { userId } = req.params;

          const wallet = await this.walletService.getAllWallet(userId);
          res.status(HttpStatusCode.OK).json({
            success: true,
            message: "Fetched wallet successfully",
            wallet,
          });
        } catch (error) {
          console.error("Error in getAllWallet controller:", error);
          if (error instanceof CustomError) {
            res.status(error.statusCode).json({
              success: false,
              message: error.message,
            });
          } else {
            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
              success: false,
              message: "Internal server error",
            });
          }
        }
    }
      


   async checkBalance(req: Request, res: Response): Promise<void> {
    try {
        const { userId, amount } = req.body;
        const authenticatedUserId = req.user?._id;
  
       
        if (!userId || !authenticatedUserId) {
          throw new CustomError(
            "User ID is required",
            HttpStatusCode.BAD_REQUEST
          );
        }
        if (userId !== authenticatedUserId) {
          throw new CustomError(
            "Unauthorized: User ID mismatch",
            HttpStatusCode.UNAUTHORIZED
          );
        }
        if (typeof amount !== "number" || amount < 0) {
          throw new CustomError(
            "Invalid amount",
            HttpStatusCode.BAD_REQUEST
          );
        }
  
        
        const walletResponse = await this.walletService.wallet_payment({
          userId,
          amount,
        });
  
        res.status(200).json(walletResponse);
      } catch (error) {
        console.error("Controller error checking wallet balance:", error);
        const status =
          error instanceof CustomError
            ? error.statusCode
            : HttpStatusCode.INTERNAL_SERVER_ERROR;
        res.status(status).json({
          success: false,
          message:
            error instanceof Error ? error.message : "Failed to check wallet balance",
        });
      }
    }
}

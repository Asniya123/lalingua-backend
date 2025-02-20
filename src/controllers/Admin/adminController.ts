import { IAdminController, IAdminService } from "../../interface/IAdmin.js";
import { Request, Response } from "express";

export default class AdminController implements IAdminController {
  private adminService: IAdminService;

  constructor(adminService: IAdminService) {
    this.adminService = adminService;
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const { accessToken, refreshToken, adminId } =
        await this.adminService.login(email, password);

      res.status(200).json({
        message: "Login successful",
        adminId,
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.message.includes("Admin not found")) {
        res.status(404).json({ error: "Admin not found" });
      } else if (error.message.includes("Invalid password")) {
        res.status(404).json({ error: "Invalid password" });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.adminService.getUsers();
      if (!Array.isArray(users)) {
        res
          .status(500)
          .json({ error: "Invalid response format: Expected an array" });
        return;
      }
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async blockUnblock(req: Request, res: Response): Promise<void> {
    try {
      const { isBlocked } = req.body;
      const { userId } = req.params;

      console.log("User Block/Unblock Request:", req.body);

      if (typeof isBlocked !== "boolean") {
        res
          .status(400)
          .json({ message: "Invalid isBlocked value. It must be a boolean." });
        return;
      }

      const updatedUser = await this.adminService.blockUnblock(
        userId,
        isBlocked
      );

      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.status(200).json({
        message: isBlocked
          ? "User blocked successfully"
          : "User unblocked successfully",
        updatedUser,
      });
    } catch (error: any) {
      console.error("Error in blockUnblock:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async getTutors(req: Request, res: Response): Promise<void> {
    try {
      const tutor = await this.adminService.getTutors();
      if (!Array.isArray(tutor)) {
        res
          .status(500)
          .json({ error: "Invalid response format: Expected an array" });
        return;
      }
      res.status(200).json(tutor);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async tutorManagement(req: Request, res: Response): Promise<void> {
    try {
      const { isBlocked } = req.body;
      const { tutorId } = req.params;

      if (typeof isBlocked !== "boolean") {
        res
          .status(400)
          .json({ message: "Invalid isBlocked value. It must be a boolean." });
        return;
      }

      const updatedTutor = await this.adminService.tutorManagement(
        tutorId,
        isBlocked
      );

      if (!updatedTutor) {
        res.status(404).json({ message: "Tutor not found" });
        return;
      }

      res.status(200).json({
        message: isBlocked
          ? "User blocked successfully"
          : "Tutor unblocked successfully",
        updatedTutor,
      });
    } catch (error: any) {
      console.error("Error in managing:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async getAllTutors(req: Request, res: Response): Promise<void> {
    try {
        const tutors = await this.adminService.getAllTutors();
        res.status(200).json({ success: true, tutors });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        res.status(500).json({ success: false, message: errorMessage });
    }
}



async updateTutorStatus(req: Request, res: Response): Promise<void> {
  try {
    const { tutorId } = req.params;
    const { status, reason } = req.body;
console.log(tutorId,status,reason,"user Data")
    if (!tutorId || !status) {
      res.status(400).json({ success: false, message: 'Tutor ID and status are required' });
      return;
    }
    

    if (status === 'rejected' && !reason) {
      res.status(400).json({ success: false, message: 'Rejection reason is required' });
      return;
    }

    const result = await this.adminService.updateTutorStatus(tutorId, status, reason);
    res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    res.status(500).json({ success: false, message: errorMessage });
  }
}


}

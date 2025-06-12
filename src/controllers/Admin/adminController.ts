import { IAdminController, IAdminService } from "../../interface/IAdmin.js";
import { Request, Response } from "express";


export const isString = (value: unknown): value is string =>
  typeof value === "string";

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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;
        const search = (req.query.search as string) || '';

        if (page < 1 || limit < 1) {
            res.status(400).json({
                success: false,
                error: 'Invalid pagination parameters. Page and limit must be positive numbers'
            });
            return;
        }

        const { users, total } = await this.adminService.getUsers(page, limit, search);

        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
        });
    } catch (error) {
        console.error("Error in getUsers controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

  async blockUnblock(req: Request, res: Response): Promise<void> {
    try {
      const { isBlocked } = req.body;
      const { userId } = req.params;

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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 5;
        const status = (req.query.status as string) || 'approved';
        const search = (req.query.search as string) || '';

        if (page < 1 || limit < 1) {
            res.status(400).json({
                error: 'Invalid pagination parameters. Page and limit must be positive numbers'
            });
            return;
        }

        const { tutor, total } = await this.adminService.getTutors(page, limit, { status }, search);

        res.status(200).json({
            success: true,
            data: {
                tutors: tutor,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit,
                },
            },
        });
    } catch (error) {
        console.error('Error in getTutors controller:', error);
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


//Course
async getCourse(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query. page as string) || 1
      const limit = parseInt(req.query.limit as string) || 5
      const search = (req.query.search as string) || '';

      if(page < 1 || limit < 1){
        res.status(400).json({
          error: 'Invalid pagination parameters. page and limit must be positive number'
        })
        return
      }

      const {courses, total} = await this.adminService.getCourse(page, limit,search)

      res.status(200).json({
        success: true,
        data: {
          courses, pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItem: total,
            itemPerPage: limit, 
          },
        },
      })
    } catch (error) {
      console.error('Error in getCourses controller:', error)
      res.status(500).json({error: 'Internal server error'})
    }
}

async blockedUnblocked(req: Request, res: Response): Promise<void> {
  try {
    const { isBlocked } = req.body;
    const { courseId } = req.params;

    if (typeof isBlocked !== "boolean") {
      res.status(400).json({ message: "Invalid isBlocked value. It must be a boolean." });
      return;
    }

    if (!courseId) {
      res.status(400).json({ message: "Course ID is required." });
      return;
    }

    const updatedCourse = await this.adminService.blockedUnblocked(courseId, isBlocked);

    if (!updatedCourse) {
      res.status(404).json({ message: "Course not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: isBlocked ? "Course blocked successfully" : "Course unblocked successfully",
      course: updatedCourse,
    });
  } catch (error: any) {
    console.error("Error in blockedUnblocked:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}



}

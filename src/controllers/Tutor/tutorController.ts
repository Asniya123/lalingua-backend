import {
  ITutor,
  ITutorController,
  ITutorService,
  IEnrollmentStudService
} from "../../interface/ITutor";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";

export default class Tutorcontroller implements ITutorController {
  private tutorService: ITutorService;
  enrollmentService: any;

  constructor(tutorService: ITutorService) {
    this.tutorService = tutorService;
  }

  async googlesignIn(req: Request, res: Response): Promise<void> {
    try {
      const tutorData = req.body;
      const { tutor, accessToken, refreshToken } =
        await this.tutorService.googlesignIn(tutorData);

  
      res.cookie("tutorToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      res.status(200).json({
        message: "Google Sign-In successful",
        tutor: {
          _id: tutor._id,
          name: tutor.name,
          email: tutor.email,
          mobile: tutor.mobile,
        },
        accessToken,
        refreshToken,
      });
    } catch (error: unknown) {
      console.error("Google Sign-In Error:", (error as Error).message);
      res.status(500).json({
        message: "Failed to sign in with Google",
        error: (error as Error).message,
      });
    }
  }

  async registerTutor(req: Request, res: Response): Promise<void> {
    try {
      const newTutor = await this.tutorService.registerTutor(req.body);
      if (newTutor) {
        res.status(201).json({
          message:
            "OTP sent to mail. Please verify your OTP to complete registration",
          tutor: {
            id: newTutor._id,
            name: newTutor.name,
            email: newTutor.email,
            mobile: newTutor.mobile,
          },
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error occurred during registration",
      });
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        throw new Error("Email and OTP are required");
      }

      const isVerified = await this.tutorService.verifyOtp(email, otp);

      if (isVerified) {
        res.status(200).json({
          message: "OTP verified successfully",
          tutor: {
            id: isVerified._id,
            name: isVerified.name,
            email: isVerified.email,
          },
        });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP" });
      }
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error occurred during OTP verification",
      });
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const tutor = await this.tutorService.resendOtp(email);

      if (tutor) {
        res.status(200).json({ message: "OTP resend successfully" });
      } else {
        res.status(400).json({ message: "Failed resend OTP" });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      res.status(500).json({ message: errorMessage });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const { accessToken, refreshToken, tutor } =
        await this.tutorService.login(email, password);
      res
        .status(200)
        .json({ message: "login success", accessToken, refreshToken, tutor });
    } catch (error) {
      if (error instanceof Error) {
        res
          .status(404)
          .json({ message: error.message || "Something went wrong" });
      } else {
        res.status(500).json({ message: "Invalid server error" });
      }
    }
  }

  async refreshTutorAccessToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
          .status(400)
          .json({ message: "Authorization header missing or malformed." });
        return;
      }
      const refreshToken = authHeader.split(" ")[1];
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as JwtPayload;

      if (!decoded?.id) {
        res.status(400).json({ message: "Invalid refresh token structure." });
        return;
      }

      const tutor = await this.tutorService.verifyTutor(decoded.id);
      if (!tutor) {
        res.status(403).json({ message: "Tutor not found." });
        return;
      }

      if (tutor.is_blocked) {
        res
          .status(403)
          .json({
            message:
              "Your account has been blocked by the admin. Please contact support.",
          });
        return;
      }

      const newAccessToken = await this.tutorService.renewAccessToken(
        decoded.id
      );

      res.status(200).json({
        accessToken: newAccessToken,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      console.error("Refresh Token Error:", error);
      if (error instanceof jwt.TokenExpiredError) {
        res
          .status(403)
          .json({ message: "Refresh token expired. Please log in again." });
      } else {
        res.status(403).json({ message: "Invalid refresh token." });
      }
    }
  }

  async getTutorProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tutor || !req.tutor._id) {
        res.status(403).json({ message: "forbiden access" });
        return;
      }

      const tutorId = req.tutor._id;
      const tutor = await this.tutorService.getTutorProfile(tutorId);

      if (!tutor) {
        res.status(404).json({ message: "Tutor not found" });
        return;
      }

      res.status(200).json(tutor);
    } catch (error) {
      console.error("Error fetching tutor profile:", error);
      res.status(500).json({ message: "Internal server Error" });
    }
  }

  async updateTutorProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tutor || !req.tutor._id) {
        res.status(403).json({ message: "Unauthorized access" });
        return;
      }
  
      const tutorId = req.tutor._id;
      const {
        name,
        email,
        mobile,
        documents,
        qualification,
        language,
        country,
        experience,
        specialization,
        dateOfBirth,
        bio,
      } = req.body;
  
      const updateData: Partial<ITutor> = {};
  
      
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (mobile !== undefined) updateData.mobile = mobile;
      if (documents !== undefined) updateData.documents = documents;
      if (qualification !== undefined) updateData.qualification = qualification;
      if (language !== undefined) {
        if (language) {
         
          const isValidLanguage = await this.tutorService.validateLanguage(language);
          if (!isValidLanguage) {
            res.status(400).json({ message: "Invalid language ID" });
            return;
          }
        }
        updateData.language = language;
      }
      if (country !== undefined) updateData.country = country;
      if (experience !== undefined) updateData.experience = experience;
      if (specialization !== undefined) updateData.specialization = specialization;
      if (dateOfBirth !== undefined) {
        if (dateOfBirth && isNaN(new Date(dateOfBirth).getTime())) {
          res.status(400).json({ message: "Invalid date of birth" });
          return;
        }
        updateData.dateOfBirth = dateOfBirth;
      }
      if (bio !== undefined) updateData.bio = bio;
  
      
  
      const updatedTutor = await this.tutorService.updateTutorProfile(tutorId, updateData);
  
      if (!updatedTutor) {
        res.status(404).json({ message: "Failed to update profile" });
        return;
      }
  
      res.status(200).json({ message: "Profile updated successfully", tutor: updatedTutor });
    } catch (error) {
      console.error("Controller: Error updating tutor profile:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async uploadProfilePicture(req: Request, res: Response): Promise<void> {
    try {
      if (!req.tutor || !req.tutor._id) {
        res.status(404).json({ message: "Unauthorized access" });
        return;
      }

      const tutorId = req.tutor._id;
      const { profilePicture } = req.body;

      if (!profilePicture) {
        res.status(400).json({ message: "Profile picture URL is required" });
        return;
      }

      const updatedTutor = await this.tutorService.uploadProfilePicture(
        tutorId,
        profilePicture
      );

      if (!updatedTutor) {
        res.status(404).json({ message: "Failed to update profile picture" });
        return;
      }

      res
        .status(200)
        .json({
          message: "Profile picture updated successfully",
          tutor: updatedTutor,
        });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
        return;
      }

      await this.tutorService.forgotPassword(email);
      res
        .status(200)
        .json({ message: "OTP sent to your email for password reset" });
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error occurred during forgot password reset",
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        res
          .status(400)
          .json({ message: "Email, OTP and new password are required" });
        return;
      }

      const updatedTutor = await this.tutorService.resetPassword(
        email,
        otp,
        newPassword
      );
      res
        .status(200)
        .json({ message: "Password reset successfully", tutor: updatedTutor });
    } catch (error) {
      res.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Error occurred during password reset",
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res
        .status(400)
        .json({ message: "Current password and new password are required" });
      return;
    }

    try {
      const tutorId = req.tutor?._id;
      if (!tutorId) {
        res.status(403).json({ message: "Unauthorized, tutor ID not found" });
        return;
      }

      const tutor = await this.tutorService.changePassword(
        tutorId,
        currentPassword,
        newPassword
      );
      if (!tutor) {
        res.status(404).json({ message: "Tutor not found" });
        return;
      }
      res.status(200).json({ message: "Password changed successfully" });
    } catch (error: any) {
      res
        .status(400)
        .json({ message: error.message || "Failed to change password" });
    }
  }


  async getEnrolledStudents(req: Request, res: Response): Promise<void>{
    const tutorId = req.params.tutorId;
    const requestingTutorId = req.user?._id;

    if (!tutorId) {
      res.status(400).json({ success: false, message: 'Tutor ID is required' });
      return;
    }

    if (!requestingTutorId) {
      res.status(401).json({ success: false, message: 'Unauthorized: No user authenticated' });
      return;
    }
    try {
      const result = await this.enrollmentService.getEnrolledStudents(tutorId, requestingTutorId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Server error',
      });
    }
  }
}

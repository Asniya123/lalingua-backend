import mongoose, { FilterQuery } from "mongoose";
import {
  ITutor,
  ITutorRepository,
  IEnrolledStudent,
  IEnrollmentStudRepository,
} from "../../interface/ITutor.js";
import tutorModel from "../../models/tutorModel.js";
import CourseModel from "../../models/courseModel.js";
import EnrollmentModel from "../../models/enrollmentModel.js";
import { ICourse } from "../../interface/ICourse.js";
import { IStudent } from "../../interface/IStudent.js";
import languageModel from "../../models/languageModel.js";

class TutorRepository implements ITutorRepository {
  async create(data: Partial<ITutor>): Promise<ITutor | null> {
    try {
      return await tutorModel.create(data);
    } catch (error) {
      console.error("Error creating tutor:", error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<ITutor | null> {
    try {
      return await tutorModel.findOne({ email });
    } catch (error) {
      console.error("Error finding tutor by email:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<ITutor | null> {
    try {
      return await tutorModel.findById(id);
    } catch (error) {
      console.error("Error finding tutor ID", error);
      throw error;
    }
  }

  async createOtp(data: Partial<ITutor>): Promise<ITutor | null> {
    try {
      const { email, otp, expiresAt } = data;
      return await tutorModel.findOneAndUpdate({ email }, { otp, expiresAt });
    } catch (error) {
      throw error;
    }
  }

  async findByEmailOtp(email: string | undefined): Promise<ITutor | null> {
    try {
      const result = await tutorModel
        .find({ email })
        .sort({ createdAt: -1 })
        .limit(1);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      throw error;
    }
  }

  async updateOtp(
    email: string,
    otp: string,
    expiresAt: Date
  ): Promise<ITutor | null> {
    try {
      return await tutorModel.findOneAndUpdate(
        { email },
        { otp, expiresAt },
        { new: true, upsert: true }
      );
    } catch (error) {
      throw error;
    }
  }

  async findGoogleId(googleId: string): Promise<ITutor | null> {
    return await tutorModel.findOne({ google_id: googleId });
  }

  async getTutors(
    page: number,
    limit: number,
    query: any = { status: "approved" },
    search?: string
  ): Promise<{ tutor: ITutor[]; total: number; totalApprovedTutors: number }> {
    try {
      const skip = (page - 1) * limit;
      const searchQuery = search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { status: { $regex: search, $options: "i" } },
            ],
          }
        : {};
      const finalQuery = { ...query, ...searchQuery };

      const aggregation = await tutorModel
        .aggregate([
          {
            $facet: {
              tutorData: [
                { $match: finalQuery },
                { $skip: skip },
                { $limit: limit },
                {
                  $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    is_blocked: 1,
                    status: 1,
                    createdAt: 1,
                    role: { $literal: "Tutor" },
                    joinDate: "$createdAt",
                  },
                },
              ],
              totalFiltered: [{ $match: finalQuery }, { $count: "count" }],
              // Count only approved tutors for dashboard stats
              totalApprovedTutors: [
                { $match: { status: "approved" } },
                { $count: "count" },
              ],
            },
          },
          {
            $project: {
              tutor: "$tutorData",
              total: { $arrayElemAt: ["$totalFiltered.count", 0] },
              totalApprovedTutors: {
                $arrayElemAt: ["$totalApprovedTutors.count", 0],
              },
            },
          },
        ])
        .exec();

      const result = aggregation[0] || {
        tutor: [],
        total: 0,
        totalApprovedTutors: 0,
      };

      return {
        tutor: result.tutor || [],
        total: result.total || 0,
        totalApprovedTutors: result.totalApprovedTutors || 0,
      };
    } catch (error: any) {
      console.error("Error in TutorRepository.getTutors:", error);
      throw new Error("Failed to fetch tutors from database");
    }
  }

async getAllTutors(search?: string): Promise<ITutor[]> {
    try {
        let query = {};
        
        if (search && search.trim()) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { status: { $regex: search, $options: 'i' } }
                ]
            };
        }
        
        return await tutorModel.find(query).sort({ createdAt: -1 });
    } catch (error) {
        console.error("Error in getAllTutors repository:", error);
        throw error;
    }
}

  async getTutorProfile(tutorId: string): Promise<ITutor | null> {
    return await tutorModel.findById(tutorId);
  }

  async updateTutorProfile(
    tutorId: string,
    updateData: Partial<ITutor>
  ): Promise<ITutor | null> {
    try {
      const updatedTutor = await tutorModel.findByIdAndUpdate(
        tutorId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      if (!updatedTutor) {
        console.error(`Repository: No tutor found for ID ${tutorId}`);
      }
      return updatedTutor;
    } catch (error) {
      console.error("Repository: Mongoose update error:", error);
      throw error;
    }
  }

  async findLanguageById(languageId: string): Promise<any | null> {
    try {
      const language = await languageModel.findById(languageId);
      return language;
    } catch (error) {
      console.error(
        `Repository: Error fetching language ${languageId}:`,
        error
      );
      return null;
    }
  }

  async uploadProfilePicture(
    tutorId: string,
    profilePicture: string
  ): Promise<ITutor | null> {
    return await tutorModel.findByIdAndUpdate(
      tutorId,
      { profilePicture },
      { new: true, runValidators: true }
    );
  }

  async updatePasswordAndClearOtp(
    email: string,
    password: string
  ): Promise<ITutor | null> {
    return await tutorModel
      .findOneAndUpdate(
        { email },
        { password, otp: null, expiresAt: null },
        { new: true }
      )
      .exec();
  }

  async changePassword(
    tutorId: string,
    newPassword: string
  ): Promise<ITutor | null> {
    const tutor = await tutorModel.findOneAndUpdate(
      { _id: tutorId },
      { password: newPassword },
      { new: true }
    );

    return tutor;
  }

  async getContact(
    query: FilterQuery<ITutor>,
    tutorId: string
  ): Promise<ITutor[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(tutorId)) {
        console.error(`Invalid tutorId: ${tutorId}`);
        throw new Error("Invalid tutor ID");
      }
      if (!query || typeof query !== "object") {
        console.error(`Invalid query: ${JSON.stringify(query)}`);
        throw new Error("Invalid query parameters");
      }

      const completedQuery: FilterQuery<ITutor> = {
        ...query,
        is_blocked: false,
        _id: { $ne: tutorId },
      };

      console.log(
        `Repository: Fetching contacts for tutorId: ${tutorId}, query: ${JSON.stringify(
          completedQuery
        )}`
      );
      const users: ITutor[] = await tutorModel
        .find(completedQuery, {
          _id: 1,
          username: 1,
          email: 1,
          profilePicture: 1,
        })
        .lean();

      console.log(`Contacts fetched: ${users.length} users`);
      return users;
    } catch (error) {
      console.error("Repository: Error fetching contacts:", {
        message: error instanceof Error ? error.message : String(error),
        tutorId,
        query: JSON.stringify(query),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(
        `Failed to fetch contacts: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getEnrolledStudentsByTutor(
    tutorId: string
  ): Promise<IEnrolledStudent[]> {
    try {
      const courses = await CourseModel.find({ tutorId }).select(
        "_id courseTitle"
      );
      const courseIds = courses.map((course) => course._id);

      const enrollments = await EnrollmentModel.find({
        courseId: { $in: courseIds },
      })
        .populate<{ courseId: ICourse }>("courseId", "_id courseTitle")
        .populate<{ userId: IStudent }>("userId", "_id name profilePicture");

      type PopulatedEnrollment = {
        courseId: ICourse;
        userId: IStudent;
      } & (typeof enrollments)[number];

      const enrolledStudents: IEnrolledStudent[] = enrollments.reduce<
        IEnrolledStudent[]
      >((acc: IEnrolledStudent[], enrollment: PopulatedEnrollment) => {
        if (
          enrollment.courseId &&
          enrollment.courseId._id &&
          enrollment.userId &&
          enrollment.userId._id &&
          enrollment.userId.name
        ) {
          acc.push({
            student: {
              _id: enrollment.userId._id.toString(),
              name: enrollment.userId.name,
              profilePicture: enrollment.userId.profilePicture,
            },
            course: {
              _id: enrollment.courseId._id.toString(),
              courseTitle: enrollment.courseId.courseTitle,
            },
          });
        }
        return acc;
      }, []);

      return enrolledStudents;
    } catch (error) {
      throw new Error("Failed to fetch enrolled students from database");
    }
  }
}

export default new TutorRepository();

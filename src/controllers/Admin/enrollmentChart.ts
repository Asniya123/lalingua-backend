import { Request, Response } from "express";
import { IEnrollmentChartController, IEnrollmentChartService, IEnrollmentStats } from "../../interface/IEnrollment.js";

export default class EnrollmentChartController implements IEnrollmentChartController{
    private enrollmentChartService: IEnrollmentChartService
    
    constructor(enrollmentChartService: IEnrollmentChartService){
        this.enrollmentChartService = enrollmentChartService
    }

  async getEnrollmentStats(req: Request, res: Response): Promise<void> {
  try {
    const stats: IEnrollmentStats = await this.enrollmentChartService.fetchEnrollmentStats();
    res.status(200).json({
      success: true,
      data: stats,
      message: 'Enrollment stats retrieved successfully',
    });
  } catch (error: unknown) {
    console.error('Controller: Error fetching enrollment stats:', error);

    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollment stats',
      error: errorMessage,
    });
  }
}

}
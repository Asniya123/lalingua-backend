import { IEnrollmentChartRepository, IEnrollmentChartService, IEnrollmentStats } from "../../interface/IEnrollment";
import enrollmentChart from "../../repositories/admin/enrollmentChart";


class EnrollmentChartService implements IEnrollmentChartService{
    private enrollmentChartRepository: IEnrollmentChartRepository

    constructor(enrollmentChartRepository: IEnrollmentChartRepository){
        this.enrollmentChartRepository = enrollmentChartRepository
    }
    
    async fetchEnrollmentStats(): Promise<IEnrollmentStats> {
    try {
      const stats = await this.enrollmentChartRepository.getEnrollmentStats();
      if (!stats.daily || !stats.monthly || !stats.yearly) {
        throw new Error('Invalid enrollment stats data');
      }
      return stats;
    } catch (error) {
      console.error('Service: Error fetching enrollment stats:', error);
      throw new Error('Failed to fetch enrollment stats');
    }
  }

}

export default new EnrollmentChartService(enrollmentChart)
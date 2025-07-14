import { IDailyEnrollment, IEnrollmentChartRepository, IEnrollmentStats, IMonthlyEnrollment, IYearlyEnrollment } from "../../interface/IEnrollment.js";
import studentModel from "../../models/studentModel.js";

class EnrollmentChartRepository implements IEnrollmentChartRepository{
    async getDailyEnrollmentData(): Promise<IDailyEnrollment[]> {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    const dailyEnrollments = await studentModel.aggregate([
      { $unwind: '$enrollments' },
      {
        $match: {
          'enrollments.status': 'completed',
          'enrollments.enrolledAt': { $gte: sevenDaysAgo, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$enrollments.enrolledAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyDataArray: IDailyEnrollment[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayIndex = new Date(currentDate);
      dayIndex.setDate(currentDate.getDate() - i);
      const dayOfWeek = dayIndex.getDay() === 0 ? 7 : dayIndex.getDay();
      const foundDay = dailyEnrollments.find((enrollment) => enrollment._id === dayOfWeek);
      const count = foundDay ? foundDay.count : 0;
      const dayNameIndex = dayIndex.getDay() === 0 ? 0 : dayIndex.getDay();
      const dayName = dayNames[dayNameIndex];
      dailyDataArray.push({ day: dayName, count });
    }
    return dailyDataArray;
  }

  async getMonthlyEnrollmentData(): Promise<IMonthlyEnrollment[]> {
    const currentDate = new Date();
    const twelveMonthsAgo = new Date(currentDate);
    twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);

    const monthlyEnrollments = await studentModel.aggregate([
      { $unwind: '$enrollments' },
      {
        $match: {
          'enrollments.status': 'completed',
          'enrollments.enrolledAt': { $gte: twelveMonthsAgo, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: { $month: '$enrollments.enrolledAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthlyDataArray: IMonthlyEnrollment[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentDate.getMonth() - i + 12) % 12;
      const foundMonth = monthlyEnrollments.find((enrollment) => enrollment._id === monthIndex + 1);
      const count = foundMonth ? foundMonth.count : 0;
      const monthName = monthNames[monthIndex];
      monthlyDataArray.push({ month: monthName, count });
    }
    return monthlyDataArray;
  }

  async getYearlyEnrollmentData(): Promise<IYearlyEnrollment[]> {
    const currentDate = new Date();
    const sevenYearsAgo = new Date(currentDate);
    sevenYearsAgo.setFullYear(currentDate.getFullYear() - 7);

    const yearlyEnrollments = await studentModel.aggregate([
      { $unwind: '$enrollments' },
      {
        $match: {
          'enrollments.status': 'completed',
          'enrollments.enrolledAt': { $gte: sevenYearsAgo, $lte: currentDate },
        },
      },
      {
        $group: {
          _id: { $year: '$enrollments.enrolledAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const yearlyDataArray: IYearlyEnrollment[] = [];
    for (let i = 6; i >= 0; i--) {
      const year = currentDate.getFullYear() - i;
      const foundYear = yearlyEnrollments.find((enrollment) => enrollment._id === year);
      const count = foundYear ? foundYear.count : 0;
      yearlyDataArray.push({ year, count });
    }
    return yearlyDataArray;
  }

  async getEnrollmentStats(): Promise<IEnrollmentStats> {
    try {
      const [daily, monthly, yearly] = await Promise.all([
        this.getDailyEnrollmentData(),
        this.getMonthlyEnrollmentData(),
        this.getYearlyEnrollmentData(),
      ]);
      return { daily, monthly, yearly };
    } catch (error) {
      console.error('Error in getEnrollmentStats:', error);
      throw new Error('Failed to retrieve enrollment stats');
    }
  }
}

export default new EnrollmentChartRepository
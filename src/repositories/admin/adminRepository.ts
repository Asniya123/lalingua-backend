import { IAdmin, IAdminRepository } from "../../interface/IAdmin.js";
import adminModel from "../../models/adminModel.js";

class AdminRepository implements IAdminRepository {
  async findByEmail(email: string | undefined): Promise<IAdmin | null> {
    if (!email) throw new Error("Email is required");
    return adminModel.findOne({ email }).exec();
  }

 

}

export default new AdminRepository();

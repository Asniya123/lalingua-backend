import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}


export async function comparePassword(password:string,userPassword:string){
  return await bcrypt.compare(password,userPassword)
}

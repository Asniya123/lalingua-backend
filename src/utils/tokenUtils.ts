import jwt from 'jsonwebtoken';

const generateAccessToken = (studentId: string) => {  
  return jwt.sign({ id: studentId }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
};

const generateRefreshToken = (userId: string) => { 
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
};

export { generateAccessToken, generateRefreshToken };

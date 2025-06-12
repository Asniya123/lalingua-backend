import jwt from 'jsonwebtoken';
const generateAccessToken = (studentId) => {
    return jwt.sign({ id: studentId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};
const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};
export { generateAccessToken, generateRefreshToken };

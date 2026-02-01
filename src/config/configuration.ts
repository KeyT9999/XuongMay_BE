export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mongodb: {
    uri: process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/xuongmay',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  email: {
    host: process.env.MAIL_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.MAIL_SECURE === 'true' || process.env.EMAIL_SECURE === 'true',
    user: process.env.MAIL_USERNAME || process.env.EMAIL_USER || '',
    password: process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD || '',
    fromName: process.env.MAIL_FROM_NAME || process.env.EMAIL_FROM_NAME || 'Quản Lý Xưởng May',
    fromEmail: process.env.MAIL_FROM_EMAIL || process.env.EMAIL_FROM_EMAIL || process.env.MAIL_USERNAME || process.env.EMAIL_USER || '',
    replyTo: process.env.MAIL_REPLY_TO || process.env.EMAIL_REPLY_TO || '',
    adminEmail: process.env.ADMIN_EMAIL || '',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
});

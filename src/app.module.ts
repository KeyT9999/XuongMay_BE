import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailModule } from './email/email.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { AppController } from './app.controller';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/xuongmay'),
    AuthModule,
    UsersModule,
    EmailModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

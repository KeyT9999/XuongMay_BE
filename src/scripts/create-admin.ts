import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    console.log('Creating admin user...');
    
    const existingAdmin = await usersService.findByUsername('admin');
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      await usersService.create({
        username: 'admin',
        password: 'admin123',
        name: 'Admin Nguyễn',
        email: 'admin@xuongmay.com',
        role: UserRole.ADMIN,
        avatar: 'https://i.pravatar.cc/150?u=admin',
      });
      console.log('✅ Admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }

  await app.close();
}

bootstrap();

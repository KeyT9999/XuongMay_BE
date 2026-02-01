import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('Starting seed...');
  await usersService.seedDefaultUsers();
  console.log('Seed completed!');
  
  await app.close();
}

bootstrap().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});

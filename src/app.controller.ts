import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      message: 'Xuong May Backend API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'xuongmay-backend',
      version: '1.0.0',
    };
  }
}

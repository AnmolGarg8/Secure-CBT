import { Controller, Get } from '@nestjs/common';
import { HealthCheckResponse } from '@securecbt/shared-types';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): HealthCheckResponse {
    return { status: 'ok' };
  }
}

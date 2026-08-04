import { Controller, Get } from '@nestjs/common';
import { HealthCheckResponse } from '@securecbt/shared-types';
import { Public } from './auth/decorators/public.decorator.js';

@Controller()
export class AppController {
  @Get('health')
  @Public()
  getHealth(): HealthCheckResponse {
    return { status: 'ok' };
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.WEB3_SERVICE_PORT || 3004;
  await app.listen(port);
  console.log(`Web3 service running on port ${port}`);
}
bootstrap();

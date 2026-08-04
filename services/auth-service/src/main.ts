import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.AUTH_PORT || 3001;
  await app.listen(port);
  console.log(`Auth service running on port ${port}`);
}
bootstrap();

import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { Web3Module } from './web3/web3.module.js';

@Module({
  imports: [PrismaModule, Web3Module],
  controllers: [AppController],
})
export class AppModule {}

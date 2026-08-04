import { Controller, Get } from '@nestjs/common';
import { Web3Service } from './web3/web3.service.js';

@Controller('web3')
export class AppController {
  constructor(private web3Service: Web3Service) {}

  @Get('health')
  async getHealth() {
    const magicLinkStatus = await this.web3Service.checkMagicLink();
    const amoyRpcStatus = await this.web3Service.checkAmoyRpc();

    const overallStatus =
      magicLinkStatus === 'ok' && amoyRpcStatus === 'ok' ? 'ok' : 'degraded';

    return {
      status: overallStatus,
      magicLink: magicLinkStatus,
      amoyRpc: amoyRpcStatus,
    };
  }
}

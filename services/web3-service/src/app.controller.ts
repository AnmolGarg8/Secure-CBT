import { Controller, Get, Post, Body, Param, Req, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Web3Service } from './web3/web3.service.js';
import { Request } from 'express';

@Controller('web3')
export class AppController {
  constructor(private web3Service: Web3Service) {}

  private validateInternalToken(req: Request) {
    const authHeader = req.headers['authorization'];
    const expectedToken = process.env.WEB3_INTERNAL_TOKEN || 'secure_internal_dev_token_123';
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== expectedToken) {
      throw new UnauthorizedException('Unauthorized: Invalid internal service token');
    }
  }

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

  @Post('wallets')
  async provisionWallet(
    @Body() body: { userId: string; institutionId: string; email: string },
    @Req() req: Request,
  ) {
    this.validateInternalToken(req);

    if (!body.userId || !body.institutionId || !body.email) {
      throw new BadRequestException('Missing required fields: userId, institutionId, email');
    }

    return this.web3Service.provisionWallet(body.userId, body.institutionId, body.email);
  }

  @Get('wallets/:userId')
  async getWallet(@Param('userId') userId: string, @Req() req: Request) {
    this.validateInternalToken(req);

    if (!userId) {
      throw new BadRequestException('Missing required parameter: userId');
    }

    return this.web3Service.getWallet(userId);
  }
}


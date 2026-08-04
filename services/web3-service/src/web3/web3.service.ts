import { Injectable, OnModuleInit } from '@nestjs/common';
import { Magic } from '@magic-sdk/admin';
import { createPublicClient, http, PublicClient } from 'viem';
import { polygonAmoy } from 'viem/chains';

@Injectable()
export class Web3Service implements OnModuleInit {
  private magic!: Magic;
  private viemClient!: PublicClient;

  onModuleInit() {
    const magicKey = process.env.MAGIC_SECRET_KEY || 'mock_magic_secret_key';
    this.magic = new Magic(magicKey);

    const rpcUrl = process.env.POLYGON_AMOY_RPC_URL;
    this.viemClient = createPublicClient({
      chain: polygonAmoy,
      transport: http(rpcUrl),
    });
  }

  async checkMagicLink(): Promise<'ok' | 'unreachable'> {
    try {
      // Hit the user metadata API with a placeholder issuer to check connectivity
      await this.magic.users.getMetadataByIssuer('did:ethr:0x0000000000000000000000000000000000000000');
      return 'ok';
    } catch (err: any) {
      const msg = String(err.message || '').toLowerCase();
      // If network fails (fetch failed, ENOTFOUND, ETIMEDOUT, etc.), mark unreachable
      if (
        msg.includes('fetch failed') ||
        msg.includes('enotfound') ||
        msg.includes('timeout') ||
        msg.includes('network')
      ) {
        return 'unreachable';
      }
      // If we got an API authentication error, Magic Link servers are reachable
      return 'ok';
    }
  }

  async checkAmoyRpc(): Promise<'ok' | 'unreachable'> {
    try {
      const blockNumber = await this.viemClient.getBlockNumber();
      return blockNumber >= 0n ? 'ok' : 'unreachable';
    } catch (err) {
      console.error('Amoy RPC connectivity error:', err);
      return 'unreachable';
    }
  }
}

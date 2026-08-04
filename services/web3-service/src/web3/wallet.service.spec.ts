import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Web3Service } from './web3.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BadRequestException } from '@nestjs/common';

describe('Web3 Wallet Provisioning Suite', () => {
  let service: Web3Service;
  let prismaMock: any;
  let magicMock: any;

  beforeEach(() => {
    prismaMock = {
      userWallet: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    service = new Web3Service(prismaMock as unknown as PrismaService);

    magicMock = {
      users: {
        getMetadataByIssuer: vi.fn(),
      },
    };
    (service as any).magic = magicMock;
  });

  it('should throw an error if web3 is disabled', async () => {
    process.env.WEB3_ENABLED = 'false';
    await expect(
      service.provisionWallet('user-123', 'inst-1', 'user@test.com'),
    ).rejects.toThrow(BadRequestException);
    process.env.WEB3_ENABLED = 'true';
  });

  it('should provision a wallet with correctly formatted did:pkh and checksummed address', async () => {
    process.env.WEB3_ENABLED = 'true';
    prismaMock.userWallet.findFirst.mockResolvedValue(null);
    magicMock.users.getMetadataByIssuer.mockResolvedValue({});

    prismaMock.userWallet.create.mockImplementation(({ data }: any) =>
      Promise.resolve({
        walletAddress: data.walletAddress,
        did: data.did,
      }),
    );

    const result = await service.provisionWallet('user-123', 'inst-1', 'user@test.com');

    expect(result.walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(result.did).toBe(`did:pkh:eip155:80002:${result.walletAddress}`);
    // Checksum check: should not be strictly lowercase
    expect(result.walletAddress).not.toEqual(result.walletAddress.toLowerCase());
  });

  it('should be idempotent: returning existing record on second attempt', async () => {
    const existingRecord = {
      walletAddress: '0x328329b36C5f396489370155bB5477B703C1741F',
      did: 'did:pkh:eip155:80002:0x328329b36C5f396489370155bB5477B703C1741F',
    };
    prismaMock.userWallet.findFirst.mockResolvedValue(existingRecord);

    const result = await service.provisionWallet('user-123', 'inst-1', 'user@test.com');
    expect(result).toEqual(existingRecord);
    expect(prismaMock.userWallet.create).not.toHaveBeenCalled();
  });

  it('should guarantee atomicity and leave no DB row behind on Magic.link failure', async () => {
    prismaMock.userWallet.findFirst.mockResolvedValue(null);

    magicMock.users.getMetadataByIssuer.mockRejectedValue(new Error('fetch failed'));

    await expect(
      service.provisionWallet('user-123', 'inst-1', 'user@test.com'),
    ).rejects.toThrow('Magic.link provisioning failed');

    expect(prismaMock.userWallet.create).not.toHaveBeenCalled();
  });
});

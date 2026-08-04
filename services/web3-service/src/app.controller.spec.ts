import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppController } from './app.controller.js';
import { Web3Service } from './web3/web3.service.js';

describe('AppController', () => {
  let controller: AppController;
  let web3ServiceMock: any;

  beforeEach(() => {
    web3ServiceMock = {
      checkMagicLink: vi.fn(),
      checkAmoyRpc: vi.fn(),
    };
    controller = new AppController(web3ServiceMock as unknown as Web3Service);
  });

  it('should return health status ok when all dependencies are reachable', async () => {
    web3ServiceMock.checkMagicLink.mockResolvedValue('ok');
    web3ServiceMock.checkAmoyRpc.mockResolvedValue('ok');

    const status = await controller.getHealth();
    expect(status).toEqual({
      status: 'ok',
      magicLink: 'ok',
      amoyRpc: 'ok',
    });
  });

  it('should return degraded when a dependency is down', async () => {
    web3ServiceMock.checkMagicLink.mockResolvedValue('unreachable');
    web3ServiceMock.checkAmoyRpc.mockResolvedValue('ok');

    const status = await controller.getHealth();
    expect(status).toEqual({
      status: 'degraded',
      magicLink: 'unreachable',
      amoyRpc: 'ok',
    });
  });
});

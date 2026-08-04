import { describe, it, expect } from 'vitest';
import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('should return health status', () => {
    const controller = new AppController();
    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });
});

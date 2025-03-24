declare module '@primuslabs/zktls-js-sdk' {
  export class ZkTLSClient {
    constructor();
    
    sign(signParams: any, appSecret: string): Promise<string>;
  }

  // Also include the actual exports for completeness
  export class PrimusZKTLS {
    constructor();
    
    init(appId: string, appSecret?: string): Promise<string | boolean>;
    sign(signParams: string): Promise<string>;
  }

  export class AttRequest {
    constructor();
  }
} 
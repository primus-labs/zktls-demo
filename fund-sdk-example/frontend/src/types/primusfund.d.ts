declare module '@primuslabs/fund-js-sdk' {
  export class PrimusFund {
    supportedChainIds: number[];
    supportedSocialPlatforms: string[];
    
    constructor();
    
    init(provider: any, chainId: number, appId: string): Promise<any>;
    
    fund(params: {
      tokenInfo: {
        tokenType: number;
        tokenAddress?: string;
      };
      recipientInfos: Array<{
        socialPlatform: string;
        userIdentifier: string;
        tokenAmount: string;
      }>;
    }): Promise<any>;
    
    attest(
      socialPlatform: string, 
      userAddress: string, 
      signFn: (signParams: any) => Promise<string>
    ): Promise<any>;
    
    claim(receipt: {
      socialPlatform: string;
      userIdentifier: string;
      attestation: any;
    }): Promise<any>;
    
    refund(recipients: Array<{
      socialPlatform: string;
      userIdentifier: string;
    }>): Promise<any>;
  }
} 
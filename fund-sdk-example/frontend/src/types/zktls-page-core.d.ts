declare module '@primuslabs/zktls-page-core-sdk' {
  export class PrimusPageCoreTLS {
    constructor();
    
    /**
     * Initialize the SDK with appId and optional appSecret
     * @param appId The application ID
     * @param appSecret Optional app secret (only needed on backend)
     * @returns Promise resolving to init result
     */
    init(appId: string, appSecret?: string): Promise<string | boolean>;
    
    /**
     * Generate request parameters for attestation
     * @param request Request details
     * @param responseResolves What to extract from the response
     */
    generateRequestParams(
      request: {
        url: string;
        method: string;
        header: Record<string, string>;
        body: string;
      },
      responseResolves: Array<{
        keyName: string;
        parsePath: string;
      }>
    ): AttestationRequest;
    
    /**
     * Sign request parameters (backend only)
     * @param requestParams Request parameters as a string
     * @returns Promise resolving to signed request
     */
    sign(requestParams: string): Promise<string>;
    
    /**
     * Start the attestation process
     * @param signedRequest The signed request string
     * @returns Promise resolving to attestation result
     */
    startAttestation(signedRequest: string): Promise<any>;
    
    /**
     * Verify an attestation
     * @param attestation The attestation to verify
     * @returns Whether the attestation is valid
     */
    verifyAttestation(attestation: any): boolean;
  }
  
  export class AttestationRequest {
    /**
     * Set attestation mode
     * @param mode The attestation mode
     */
    setAttMode(mode: { algorithmType: string }): void;
    
    /**
     * Set additional parameters for the attestation
     * @param params JSON string of additional parameters
     */
    setAdditionParams(params: string): void;
    
    /**
     * Convert to JSON string
     * @returns JSON string representation
     */
    toJsonString(): string;
  }
} 
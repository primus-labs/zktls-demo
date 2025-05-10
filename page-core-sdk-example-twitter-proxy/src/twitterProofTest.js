import { PrimusPageCoreTLS } from "@primuslabs/zktls-page-core-sdk"

export async function twitterProofTest() {
    // Initialize parameters from environment variables
    const appId = import.meta.env.VITE_APP_ID;
    const appSecret = import.meta.env.VITE_APP_SECRET;
    
    if (!appId || !appSecret) {
        throw new Error('Missing APP_ID or APP_SECRET environment variables');
    }

    try {
        const zkTLS = new PrimusPageCoreTLS();
        const initResult = await zkTLS.init(appId, appSecret);
        console.log("Twitter proof initResult=", initResult);

        // Set up the Twitter API request
        const request = {
            url: "https://api.x.com/1.1/account/settings.json",
            method: "GET",
            header: {
                'accept': '*/*',
                'authorization': 'Bearer ...',
                'cookie': '...',
                'other_headers': '...'
            },
            body: ""
        };

        // Log the complete request object for comparison
        console.log("Working version - Complete request object:", {
            url: request.url,
            method: request.method,
            headerCount: Object.keys(request.header).length,
            headerKeys: Object.keys(request.header),
            headers: request.header,  // Log all headers
            body: request.body
        });

        // Log each header individually for comparison
        console.log("Working version - Headers detail:");
        Object.entries(request.header).forEach(([key, value]) => {
            console.log(`${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
        });

        // Define response resolves according to the Twitter API response structure
        const responseResolves = [
            {
                keyName: 'screen_name',
                parsePath: '$.screen_name',
            }
        ];

        // Generate attestation request
        const generateRequest = zkTLS.generateRequestParams(request, responseResolves);

        // Set zkTLS mode to proxy model
        generateRequest.setAttMode({
            algorithmType: "proxytls"
        });

        // Transfer request object to string
        const generateRequestStr = generateRequest.toJsonString();
        console.log("Working version - Generated request structure:", {
            hasAppId: generateRequestStr.includes(appId),
            hasRequest: generateRequestStr.includes('"request"'),
            requestLength: generateRequestStr.length,
            hasQueryParams: generateRequestStr.includes('?'),
            request: JSON.parse(generateRequestStr)  // Log complete generated request
        });

        // Sign request
        const signedRequestStr = await zkTLS.sign(generateRequestStr);
        console.log("Working version - Signed request length:", signedRequestStr.length);

        // Start attestation process
        console.log("Starting attestation...");
        const attestation = await zkTLS.startAttestation(signedRequestStr);
        console.log("Attestation response:", attestation);

        const verifyResult = zkTLS.verifyAttestation(attestation);
        console.log("verifyResult=", verifyResult);
        
        if (verifyResult === true) {
            console.log("Attestation verified successfully!");
            const resolvedData = attestation.getResolvedData();
            console.log("Attested data:", resolvedData);
            return {
                success: true,
                data: resolvedData
            };
        } else {
            console.error("Attestation verification failed!");
            return {
                success: false,
                error: "Attestation verification failed"
            };
        }
    } catch (error) {
        console.error("Attestation error:", error);
        const errorDetails = error.data?.details?.errlog || {};
        const wsError = error.data?.details?.online?.wsError;
        return {
            success: false,
            error: `${error.message}${wsError ? ` - WebSocket Error: ${wsError}` : ''} - ${errorDetails.message || ''}`,
            code: error.code,
            details: errorDetails
        };
    }
} 
import { PrimusPageCoreTLS } from "@primuslabs/zktls-page-core-sdk"

function parseCurlCommand(curlString) {
    // Extract URL
    const urlMatch = curlString.match(/curl ['"]([^'"]+)['"]/);
    const url = urlMatch ? urlMatch[1] : '';

    // Extract headers - handle both single and double quotes
    const headers = {};
    const headerRegex = /-H ['"]([^:]+):\s*([^'"]+)['"]/g;
    let match;
    while ((match = headerRegex.exec(curlString)) !== null) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        // Skip unwanted headers
        if (['priority'].includes(key.toLowerCase())) {
            continue;
        }

        // Special handling for certain headers
        if (key === 'sec-ch-ua') {
            headers[key] = '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"';
        } else if (key === 'sec-ch-ua-platform') {
            headers[key] = '"macOS"';
        } else {
            headers[key] = value;
        }
    }

    // Extract cookie from -b flag and add it as a header
    const fullCookieMatch = curlString.match(/-b\s+'([^']+)'/);
    if (fullCookieMatch) {
        headers['cookie'] = fullCookieMatch[1].replace(/\\"/g, '"').replace(/\\'/g, "'");
    }

    return {
        url,
        method: 'GET',
        header: headers,
        body: ""
    };
}

export async function runAttestation(curlString) {
    // Initialize parameters from environment variables
    const appId = import.meta.env.VITE_APP_ID;
    const appSecret = import.meta.env.VITE_APP_SECRET;
    
    if (!appId || !appSecret) {
        throw new Error('Missing APP_ID or APP_SECRET environment variables');
    }

    try {
        const zkTLS = new PrimusPageCoreTLS();
        const initResult = await zkTLS.init(appId, appSecret);
        console.log("Attestation initResult=", initResult);

        // Parse the curl command
        const request = parseCurlCommand(curlString);

        // Log full request details for debugging
        console.log("Full request details:", {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(
                Object.entries(request.header).map(([k, v]) => [
                    k,
                    v.length > 50 ? v.substring(0, 50) + '...' : v
                ])
            )
        });

        // Log specific headers we care about
        const criticalHeaders = ['authorization', 'x-client-transaction-id', 'x-csrf-token', 'cookie', 'sec-ch-ua', 'sec-ch-ua-platform'];
        console.log("\nCritical headers:");
        criticalHeaders.forEach(header => {
            console.log(`${header}: ${request.header[header] ? 'present' : 'missing'} (${request.header[header]?.length || 0} chars)`);
        });

        // Define response resolves according to the API response structure
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
        console.log("\nGenerated request structure:", {
            hasAppId: generateRequestStr.includes(appId),
            hasRequest: generateRequestStr.includes('"request"'),
            requestLength: generateRequestStr.length,
            hasQueryParams: generateRequestStr.includes('?'),
            request: JSON.parse(generateRequestStr)
        });

        // Sign request
        const signedRequestStr = await zkTLS.sign(generateRequestStr);
        console.log("Signed request length:", signedRequestStr.length);

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
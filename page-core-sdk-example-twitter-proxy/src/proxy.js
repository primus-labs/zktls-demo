import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = 3001;

// Enable CORS with specific options
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default dev server
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-twitter-active-user']
}));

app.use(express.json());

// Twitter API proxy endpoint
app.post('/twitter-proxy', async (req, res) => {
  try {
    const { url, method, header, body } = req.body;
    
    console.log('Proxying request to:', url);
    console.log('Headers:', header);
    
    const response = await axios({
      url,
      method: method || 'GET',
      headers: header || {},
      data: body || null,
      validateStatus: () => true // Don't throw on error status codes
    });
    
    console.log('Proxy response status:', response.status);
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Return the response from Twitter
    res.status(response.status).json({
      status: response.status,
      data: response.data,
      headers: response.headers
    });
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({
      error: 'Proxy Error',
      message: error.message
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Twitter proxy server running at http://localhost:${port}`);
});

// Export for potential programmatic usage
export default app; 
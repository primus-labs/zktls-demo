import { twitterProofTest } from './twitterProofTest.js';
import { primusProofTest } from './testprimus.js';

// Check command line args to determine which test to run
const runTests = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('twitter')) {
    console.log('Running Twitter proof test...');
    try {
      const result = await twitterProofTest();
      console.log('Twitter proof test completed with result:', result);
    } catch (error) {
      console.error('Twitter proof test failed:', error);
    }
  } else if (args.includes('primus')) {
    console.log('Running Primus OKX proof test...');
    try {
      await primusProofTest();
      console.log('Primus OKX proof test completed');
    } catch (error) {
      console.error('Primus OKX proof test failed:', error);
    }
  } else {
    console.log('Please specify which test to run:');
    console.log('- node src/index.js twitter  # Run Twitter API test');
    console.log('- node src/index.js primus   # Run OKX API test');
  }
};

// Run the tests if this file is being run directly
// In ES modules, we use import.meta.url instead of require.main
const isMainModule = import.meta.url.startsWith('file:');
if (isMainModule) {
  runTests();
}

export { twitterProofTest, primusProofTest }; 
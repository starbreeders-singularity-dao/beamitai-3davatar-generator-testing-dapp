const puppeteer = require('puppeteer');

// URL of the Gradio app
const gradioUrl = 'http://34.42.169.146:8080/';

async function openTrellisInterface() {
  console.log('Opening TRELLIS Gradio interface...');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
    defaultViewport: null
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the Gradio app
    console.log(`Navigating to ${gradioUrl}...`);
    await page.goto(gradioUrl, { waitUntil: 'networkidle2' });
    
    console.log('\n==============================================');
    console.log('TRELLIS GRADIO INTERFACE');
    console.log('==============================================');
    console.log('The browser window is now open showing the TRELLIS Gradio interface.');
    console.log('Please follow these steps:');
    console.log('1. Upload an image by clicking "Drop Image Here" or "Click to Upload"');
    console.log('2. Click the "Generate" button');
    console.log('3. Wait for processing to complete (may take several minutes)');
    console.log('4. When the 3D model appears, click "Extract GLB"');
    console.log('5. Download the GLB file when it becomes available');
    console.log('6. Close the browser window when finished');
    console.log('==============================================');
    console.log('For detailed instructions, refer to TRELLIS-MANUAL-GUIDE.md');
    console.log('Press Ctrl+C in this terminal to exit the script');
    
    // Keep the script running until the browser is closed
    await page.waitForFunction(() => false, { timeout: 0 }).catch(() => {});
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // This will only run if the script is interrupted
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the function
openTrellisInterface().catch(console.error); 
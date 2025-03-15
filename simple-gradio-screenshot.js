const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create output directory
const outputDir = path.join(__dirname, 'gradio-screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('Created output directory:', outputDir);
}

// URL of the Gradio app
const gradioUrl = 'http://34.42.169.146:8080/';

async function captureGradioInterface() {
  console.log('Starting Gradio interface capture...');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the Gradio app
    console.log(`Navigating to ${gradioUrl}...`);
    await page.goto(gradioUrl, { waitUntil: 'networkidle2' });
    
    // Take a screenshot of the initial interface
    const initialScreenshotPath = path.join(outputDir, 'gradio_initial.png');
    await page.screenshot({ path: initialScreenshotPath, fullPage: true });
    console.log('Initial screenshot saved to:', initialScreenshotPath);
    
    // Wait for user to interact with the page
    console.log('\n==============================================');
    console.log('MANUAL INTERACTION REQUIRED:');
    console.log('1. The browser window is now open showing the TRELLIS Gradio interface');
    console.log('2. Please upload an image manually by clicking "Drop Image Here" or "Click to Upload"');
    console.log('3. After uploading, click the "Generate" button');
    console.log('4. Wait for processing to complete (may take several minutes)');
    console.log('5. When the 3D model appears, click "Extract GLB"');
    console.log('6. Download the GLB file when it becomes available');
    console.log('7. Close the browser window when finished');
    console.log('==============================================\n');
    
    // Wait for the browser to be closed
    await browser.waitForTarget(target => target.opener() === page.target());
    
    console.log('Browser closed by user. Capture complete.');
    return { success: true };
  } catch (error) {
    console.error('Error capturing Gradio interface:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the capture
captureGradioInterface()
  .then(result => {
    if (result.success) {
      console.log('Gradio interface capture completed successfully');
    } else {
      console.error('Gradio interface capture failed:', result.error);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 
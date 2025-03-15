const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create output directory
const outputDir = path.join(__dirname, 'gradio-screenshots');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('Created output directory:', outputDir);
}

// URL of the Gradio app
const gradioUrl = 'http://34.42.169.146:8080/';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user
function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
}

async function guidedGradioInteraction() {
  console.log('Starting guided TRELLIS Gradio interaction...');
  
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
    
    // Display instructions
    console.log('\n==============================================');
    console.log('TRELLIS GRADIO INTERFACE GUIDE');
    console.log('==============================================');
    console.log('This script will guide you through using the TRELLIS Gradio interface');
    console.log('and take screenshots at each step to document the process.');
    console.log('\nThe browser window is now open showing the TRELLIS Gradio interface.');
    
    // Step 1: Upload an image
    console.log('\nSTEP 1: Upload an image');
    console.log('- Look for "Drop Image Here" or "Click to Upload" text');
    console.log('- Click on that area and select an image from your computer');
    console.log('- The image should appear in the interface after uploading');
    
    await prompt('\nPress Enter after you have uploaded an image...');
    
    // Take a screenshot after upload
    const uploadScreenshotPath = path.join(outputDir, 'gradio_after_upload.png');
    await page.screenshot({ path: uploadScreenshotPath, fullPage: true });
    console.log('Screenshot after upload saved to:', uploadScreenshotPath);
    
    // Step 2: Generate the 3D model
    console.log('\nSTEP 2: Generate the 3D model');
    console.log('- Look for a "Generate" button');
    console.log('- Click the button to start the 3D model generation process');
    console.log('- This process may take several minutes to complete');
    
    await prompt('\nPress Enter after you have clicked the Generate button...');
    
    // Take a screenshot after clicking Generate
    const generateScreenshotPath = path.join(outputDir, 'gradio_after_generate.png');
    await page.screenshot({ path: generateScreenshotPath, fullPage: true });
    console.log('Screenshot after clicking Generate saved to:', generateScreenshotPath);
    
    // Step 3: Wait for processing
    console.log('\nSTEP 3: Wait for processing');
    console.log('- The system is now processing your image');
    console.log('- This may take several minutes');
    console.log('- You should see progress indicators or a loading animation');
    
    // Take periodic screenshots during processing
    console.log('\nTaking periodic screenshots during processing...');
    
    for (let i = 1; i <= 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      const processingScreenshotPath = path.join(outputDir, `gradio_processing_${i}.png`);
      await page.screenshot({ path: processingScreenshotPath, fullPage: true });
      console.log(`Processing screenshot ${i} saved to: ${processingScreenshotPath}`);
    }
    
    // Step 4: Extract GLB
    console.log('\nSTEP 4: Extract GLB');
    console.log('- Once the 3D model appears, look for an "Extract GLB" button');
    console.log('- Click this button to generate the downloadable GLB file');
    
    await prompt('\nPress Enter after the 3D model has appeared and you have clicked Extract GLB (or if you need more time for processing)...');
    
    // Take a screenshot after the 3D model appears
    const modelScreenshotPath = path.join(outputDir, 'gradio_3d_model.png');
    await page.screenshot({ path: modelScreenshotPath, fullPage: true });
    console.log('Screenshot of 3D model saved to:', modelScreenshotPath);
    
    // Step 5: Download GLB
    console.log('\nSTEP 5: Download GLB');
    console.log('- After extraction, you should see a download link or button');
    console.log('- Click this to download the GLB file to your computer');
    
    await prompt('\nPress Enter after you have downloaded the GLB file (or if the download option appeared)...');
    
    // Take a final screenshot
    const finalScreenshotPath = path.join(outputDir, 'gradio_final.png');
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    console.log('Final screenshot saved to:', finalScreenshotPath);
    
    console.log('\nProcess complete! Check the screenshots in the gradio-screenshots directory.');
    console.log('You can now close the browser window.');
    
    await prompt('\nPress Enter to close the browser and exit...');
    
    return { success: true };
  } catch (error) {
    console.error('Error during guided interaction:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
    
    // Close readline interface
    rl.close();
  }
}

// Run the guided interaction
guidedGradioInteraction()
  .then(result => {
    if (result.success) {
      console.log('Guided interaction completed successfully');
    } else {
      console.error('Guided interaction failed:', result.error);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 
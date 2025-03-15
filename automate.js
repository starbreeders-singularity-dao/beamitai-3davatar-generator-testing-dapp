const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const config = {
  // URL of the test page (adjust as needed)
  testPageUrl: 'http://localhost:3001/test',
  
  // URL of the Gradio app (if we need to go directly to it)
  gradioAppUrl: 'http://34.42.169.146:8080/',
  
  // Directory to save GLB files
  outputDir: path.join(__dirname, 'backend', 'glb'),
  
  // Timeout for the entire process (5 minutes)
  timeout: 300000,
  
  // Whether to run in headless mode (true = no UI, false = show browser)
  headless: false
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
  console.log('Created output directory:', config.outputDir);
}

/**
 * Helper function to wait for a specified time
 * @param {number} ms - Time to wait in milliseconds
 * @returns {Promise} - Promise that resolves after the specified time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function to automate the TRELLIS avatar generation
 */
async function generateAvatar() {
  console.log('Starting TRELLIS avatar generation automation...');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: config.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Enable console logging from the page
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Navigate to the test page
    console.log(`Navigating to ${config.testPageUrl}...`);
    await page.goto(config.testPageUrl, { waitUntil: 'networkidle2' });
    
    // Wait for the image to load
    await page.waitForSelector('#testImage', { visible: true });
    console.log('Test image loaded successfully');
    
    // Wait for the "Generate" button and click it
    await page.waitForSelector('#sendButton', { visible: true });
    console.log('Clicking the generate button...');
    await page.click('#sendButton');
    
    // Wait for the status element to update
    console.log('Waiting for processing to complete (this may take several minutes)...');
    
    // Set up a timeout for the entire process
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timed out waiting for avatar generation')), config.timeout);
    });
    
    // Wait for either success or error
    const resultPromise = Promise.race([
      // Success case
      page.waitForFunction(() => {
        const statusEl = document.getElementById('status');
        return statusEl && statusEl.innerText.includes('GLB file generated successfully');
      }, { timeout: config.timeout }),
      
      // Error case
      page.waitForFunction(() => {
        const statusEl = document.getElementById('status');
        return statusEl && statusEl.classList.contains('error');
      }, { timeout: config.timeout })
    ]);
    
    // Wait for either the result or timeout
    await Promise.race([resultPromise, timeoutPromise]);
    
    // Check if we got an error
    const isError = await page.evaluate(() => {
      const statusEl = document.getElementById('status');
      return statusEl && statusEl.classList.contains('error');
    });
    
    if (isError) {
      const errorMessage = await page.evaluate(() => document.getElementById('status').innerText);
      console.error('Error generating avatar:', errorMessage);
      
      // Get debug info if available
      const debugInfo = await page.evaluate(() => {
        const debugEl = document.getElementById('debugInfo');
        return debugEl ? debugEl.innerText : 'No debug information available';
      });
      
      console.error('Debug information:', debugInfo);
      throw new Error('Avatar generation failed');
    }
    
    // If we get here, the avatar was generated successfully
    console.log('Avatar generated successfully!');
    
    // Retrieve the GLB file path from the page
    const glbPath = await page.evaluate(() => {
      const glbPathEl = document.getElementById('glbPath');
      return glbPathEl ? glbPathEl.innerText : null;
    });
    
    if (glbPath) {
      console.log('GLB file saved to:', glbPath);
      
      // You can download the file if needed
      // For example, if the GLB is served from your local server:
      const glbUrl = `http://localhost:3001${glbPath}`;
      const glbFilename = path.basename(glbPath);
      const localPath = path.join(config.outputDir, `downloaded_${glbFilename}`);
      
      console.log(`Downloading GLB file from ${glbUrl} to ${localPath}...`);
      
      try {
        const response = await axios.get(glbUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(localPath, response.data);
        console.log('GLB file downloaded successfully to:', localPath);
      } catch (downloadError) {
        console.error('Error downloading GLB file:', downloadError.message);
      }
    } else {
      console.warn('GLB file path not found on the page');
    }
    
    // Take a screenshot for reference
    const screenshotPath = path.join(config.outputDir, 'result_screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot saved to:', screenshotPath);
    
    return { success: true, glbPath };
  } catch (error) {
    console.error('Automation error:', error.message);
    
    // Take a screenshot of the error state
    try {
      const page = (await browser.pages())[0];
      const errorScreenshotPath = path.join(config.outputDir, 'error_screenshot.png');
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      console.log('Error screenshot saved to:', errorScreenshotPath);
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
    
    return { success: false, error: error.message };
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
}

/**
 * Alternative function to directly use the Gradio interface
 */
async function generateAvatarDirectGradio(imagePath) {
  console.log('Starting direct Gradio interface automation...');
  
  // Launch browser
  const browser = await puppeteer.launch({ 
    headless: config.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Enable console logging from the page
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Navigate to the Gradio app
    console.log(`Navigating to ${config.gradioAppUrl}...`);
    await page.goto(config.gradioAppUrl, { waitUntil: 'networkidle2' });
    
    // Take a screenshot immediately to see what we're dealing with
    const initialScreenshotPath = path.join(config.outputDir, 'gradio_initial.png');
    await page.screenshot({ path: initialScreenshotPath, fullPage: true });
    console.log('Initial screenshot saved to:', initialScreenshotPath);
    
    // Wait for the page to fully load
    console.log('Waiting for page to load...');
    await wait(3000);
    
    // Look for text that says "Drop Image Here" or "Click to Upload"
    console.log('Looking for image upload area...');
    
    // Find elements containing the upload text
    const uploadAreaElements = await page.$$('div, p, span, button, label');
    let uploadArea = null;
    
    for (const element of uploadAreaElements) {
      const text = await page.evaluate(el => el.innerText, element);
      if (text && (
          text.includes('Drop Image Here') || 
          text.includes('Click to Upload')
        )) {
        console.log(`Found upload area with text: "${text}"`);
        uploadArea = element;
        break;
      }
    }
    
    if (!uploadArea) {
      console.log('Could not find upload area by text, looking for file input...');
    }
    
    // Find the file input (it might be hidden)
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`Found ${fileInputs.length} file input elements`);
    
    let fileInput = null;
    
    if (fileInputs.length > 0) {
      fileInput = fileInputs[0];
    } else if (uploadArea) {
      // If we found the upload area but no file input, try clicking it
      console.log('Clicking upload area to reveal file input...');
      await uploadArea.click();
      await wait(1000);
      
      // Check if a file input appeared
      const newFileInputs = await page.$$('input[type="file"]');
      if (newFileInputs.length > 0) {
        console.log('File input appeared after clicking upload area');
        fileInput = newFileInputs[0];
      }
    }
    
    // If we still don't have a file input, try to find it by traversing up from the upload area
    if (!fileInput && uploadArea) {
      console.log('Looking for file input near the upload area...');
      fileInput = await page.evaluateHandle(el => {
        // Try to find the closest input[type="file"]
        let current = el;
        while (current && current !== document.body) {
          const input = current.querySelector('input[type="file"]');
          if (input) return input;
          current = current.parentElement;
        }
        return null;
      }, uploadArea);
    }
    
    // If we still don't have a file input, try to inject one
    if (!fileInput) {
      console.log('No file input found, trying to inject one...');
      
      // Inject a file input element
      fileInput = await page.evaluateHandle(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'injected-file-input';
        input.style.position = 'fixed';
        input.style.top = '0';
        input.style.left = '0';
        input.style.zIndex = '9999';
        document.body.appendChild(input);
        return input;
      });
      
      console.log('Injected file input element');
    }
    
    // Upload the image
    if (fileInput) {
      console.log('Uploading image:', imagePath);
      await fileInput.uploadFile(imagePath);
      console.log('Image uploaded');
      
      // Take a screenshot after upload
      const uploadScreenshotPath = path.join(config.outputDir, 'gradio_after_upload.png');
      await page.screenshot({ path: uploadScreenshotPath, fullPage: true });
      console.log('Upload screenshot saved to:', uploadScreenshotPath);
    } else {
      throw new Error('Could not find or create a file input element');
    }
    
    // Wait a moment for the upload to be processed
    await wait(2000);
    
    // Look for the "Generate" button
    console.log('Looking for "Generate" button...');
    
    // Find buttons or elements with text "Generate"
    const generateButtons = await page.$$('button, div[role="button"]');
    let generateButton = null;
    
    for (const button of generateButtons) {
      const text = await page.evaluate(el => el.innerText, button);
      const isVisible = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }, button);
      
      if (isVisible && text && text.trim() === 'Generate') {
        console.log('Found "Generate" button');
        generateButton = button;
        break;
      }
    }
    
    if (generateButton) {
      console.log('Clicking "Generate" button...');
      await generateButton.click();
      console.log('"Generate" button clicked');
    } else {
      console.log('Could not find "Generate" button, looking for any submit button...');
      
      // Try to find any button that might be the submit button
      const buttonSelectors = [
        'button.primary',
        'button[type="submit"]',
        'button.submit',
        'button:not([disabled])'
      ];
      
      for (const selector of buttonSelectors) {
        try {
          const buttons = await page.$$(selector);
          for (const button of buttons) {
            const text = await page.evaluate(el => el.innerText, button);
            const isVisible = await page.evaluate(el => {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
            }, button);
            
            if (isVisible) {
              console.log(`Found potential submit button: ${text || '[no text]'}`);
              generateButton = button;
              break;
            }
          }
          
          if (generateButton) break;
        } catch (error) {
          console.log(`Error finding selector ${selector}:`, error.message);
        }
      }
      
      if (generateButton) {
        console.log('Clicking potential submit button...');
        await generateButton.click();
        console.log('Button clicked');
      } else {
        console.log('No submit button found, continuing without explicit submission');
      }
    }
    
    // Wait for processing to complete (look for the 3D asset to appear)
    console.log('Waiting for 3D asset generation (this may take several minutes)...');
    
    // Take a screenshot after clicking generate
    const processingScreenshotPath = path.join(config.outputDir, 'gradio_processing.png');
    await page.screenshot({ path: processingScreenshotPath, fullPage: true });
    console.log('Processing screenshot saved to:', processingScreenshotPath);
    
    // Wait for a while to allow processing
    console.log('Waiting 1 minute for processing...');
    await wait(60000); // Wait 1 minute
    
    // Take a mid-processing screenshot
    const midProcessingScreenshotPath = path.join(config.outputDir, 'gradio_mid_processing.png');
    await page.screenshot({ path: midProcessingScreenshotPath, fullPage: true });
    console.log('Mid-processing screenshot saved to:', midProcessingScreenshotPath);
    
    // Wait for the "Extract GLB" button to appear
    console.log('Looking for "Extract GLB" button...');
    
    // Wait for more time to complete processing
    console.log('Waiting another minute for processing to complete...');
    await wait(60000); // Wait another minute
    
    // Take a screenshot after processing
    const postProcessingScreenshotPath = path.join(config.outputDir, 'gradio_post_processing.png');
    await page.screenshot({ path: postProcessingScreenshotPath, fullPage: true });
    console.log('Post-processing screenshot saved to:', postProcessingScreenshotPath);
    
    // Look for the "Extract GLB" button
    const extractButtons = await page.$$('button, div[role="button"]');
    let extractButton = null;
    
    for (const button of extractButtons) {
      const text = await page.evaluate(el => el.innerText, button);
      const isVisible = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      }, button);
      
      if (isVisible && text && text.includes('Extract GLB')) {
        console.log('Found "Extract GLB" button');
        extractButton = button;
        break;
      }
    }
    
    if (extractButton) {
      console.log('Clicking "Extract GLB" button...');
      await extractButton.click();
      console.log('"Extract GLB" button clicked');
      
      // Wait for the GLB to be extracted
      await wait(5000);
      
      // Take a screenshot after extraction
      const extractionScreenshotPath = path.join(config.outputDir, 'gradio_extraction.png');
      await page.screenshot({ path: extractionScreenshotPath, fullPage: true });
      console.log('Extraction screenshot saved to:', extractionScreenshotPath);
      
      // Look for download links that might appear
      console.log('Looking for GLB download link...');
      const downloadLinks = await page.$$('a[href*=".glb"], a[download]');
      
      if (downloadLinks.length > 0) {
        console.log(`Found ${downloadLinks.length} potential download links`);
        
        for (const link of downloadLinks) {
          const href = await page.evaluate(el => el.href, link);
          console.log('Download link found:', href);
          
          if (href && href.includes('.glb')) {
            console.log('Attempting to download GLB from:', href);
            
            try {
              const response = await axios.get(href, { responseType: 'arraybuffer' });
              const glbFilename = `trellis_avatar_${Date.now()}.glb`;
              const localPath = path.join(config.outputDir, glbFilename);
              
              fs.writeFileSync(localPath, response.data);
              console.log('GLB file downloaded successfully to:', localPath);
              break;
            } catch (downloadError) {
              console.error('Error downloading GLB:', downloadError.message);
            }
          }
        }
      } else {
        console.log('No download links found, checking for other download elements...');
        
        // Look for other elements that might trigger a download
        const downloadElements = await page.$$('button:contains("Download"), div:contains("Download")');
        
        if (downloadElements.length > 0) {
          console.log(`Found ${downloadElements.length} potential download elements`);
          
          for (const element of downloadElements) {
            const text = await page.evaluate(el => el.innerText, element);
            console.log(`Clicking potential download element: ${text}`);
            
            await element.click();
            await wait(2000);
          }
        }
      }
    } else {
      console.log('Could not find "Extract GLB" button');
    }
    
    // Take a final screenshot
    const finalScreenshotPath = path.join(config.outputDir, 'gradio_final.png');
    await page.screenshot({ path: finalScreenshotPath, fullPage: true });
    console.log('Final screenshot saved to:', finalScreenshotPath);
    
    console.log('Automation completed - check the screenshots and downloaded files');
    return { success: true };
  } catch (error) {
    console.error('Direct Gradio automation error:', error.message);
    
    // Take a screenshot of the error state
    try {
      const page = (await browser.pages())[0];
      const errorScreenshotPath = path.join(config.outputDir, 'gradio_error.png');
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      console.log('Error screenshot saved to:', errorScreenshotPath);
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
    
    return { success: false, error: error.message };
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the automation
if (require.main === module) {
  // If this script is run directly (not imported)
  generateAvatar()
    .then(result => {
      if (result.success) {
        console.log('Automation completed successfully');
      } else {
        console.error('Automation failed:', result.error);
        
        // If the first approach fails, try the direct Gradio approach
        console.log('Trying direct Gradio approach as fallback...');
        const imagePath = path.join(__dirname, 'backend', 'fullbodyimages', 'beamit-1741786964822-fullbody.png');
        
        return generateAvatarDirectGradio(imagePath);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

// Export the functions for use in other scripts
module.exports = {
  generateAvatar,
  generateAvatarDirectGradio,
  config  // Export the config object so it can be modified
}; 
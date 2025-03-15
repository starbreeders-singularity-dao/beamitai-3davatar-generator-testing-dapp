const { generateAvatar, generateAvatarDirectGradio } = require('./automate');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const directGradio = args.includes('--direct-gradio');
const headless = !args.includes('--show-browser');
const imagePath = args.find(arg => arg.startsWith('--image='))?.split('=')[1] || 
                  path.join(__dirname, 'backend', 'fullbodyimages', 'beamit-1741786964822-fullbody.png');

console.log('TRELLIS Avatar Generation');
console.log('=======================');
console.log(`Mode: ${directGradio ? 'Direct Gradio Interface' : 'Local Test Server'}`);
console.log(`Browser: ${headless ? 'Headless (no UI)' : 'Visible'}`);
console.log(`Image: ${imagePath}`);
console.log('=======================');

// Update configuration
const automate = require('./automate');
automate.config = {
  ...automate.config,
  headless: headless
};

// Run the appropriate function
if (directGradio) {
  console.log('Starting direct Gradio automation...');
  generateAvatarDirectGradio(imagePath)
    .then(result => {
      if (result.success) {
        console.log('Direct Gradio automation completed successfully');
        process.exit(0);
      } else {
        console.error('Direct Gradio automation failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} else {
  console.log('Starting local test server automation...');
  generateAvatar()
    .then(result => {
      if (result.success) {
        console.log('Local test server automation completed successfully');
        process.exit(0);
      } else {
        console.error('Local test server automation failed:', result.error);
        
        // Ask if user wants to try direct Gradio approach
        console.log('\nWould you like to try the direct Gradio approach instead?');
        console.log('Run: node run-trellis-automation.js --direct-gradio');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
} 
# TRELLIS Gradio Interface Manual Guide

This guide provides step-by-step instructions for using the TRELLIS Gradio interface to generate 3D avatars from images.

## Overview

TRELLIS is a tool developed by Microsoft that generates 3D avatars from images. The Gradio interface provides a web-based way to interact with this tool. This guide will walk you through the process of:

1. Accessing the TRELLIS Gradio interface
2. Uploading an image
3. Generating a 3D avatar
4. Extracting and downloading the GLB file

## Prerequisites

- A full-body image of a person (preferably with a clean background)
- A web browser (Chrome recommended)
- Internet connection

## Step 1: Access the TRELLIS Gradio Interface

1. Open your web browser
2. Navigate to: http://34.42.169.146:8080/
3. Wait for the interface to load completely

## Step 2: Upload an Image

1. Look for the "Drop Image Here" or "Click to Upload" area in the interface
2. Click on this area to open a file selection dialog
3. Select your full-body image file
4. Wait for the image to upload and appear in the interface

**Tips for best results:**
- Use a full-body image with the person standing in a T-pose or A-pose
- Images with clean backgrounds work best
- Make sure the entire body is visible in the frame
- Avoid complex clothing or accessories that might confuse the model

## Step 3: Generate the 3D Avatar

1. After your image is uploaded, look for the "Generate" button
2. Click the "Generate" button to start the 3D avatar generation process
3. Wait for the processing to complete (this may take several minutes)
4. You should see progress indicators or a loading animation during processing

## Step 4: Extract the GLB File

1. Once the 3D avatar appears in the interface, look for the "Extract GLB" button
2. Click the "Extract GLB" button to prepare the downloadable 3D model
3. Wait for the extraction process to complete

## Step 5: Download the GLB File

1. After extraction, a download link or button should appear
2. Click this link/button to download the GLB file to your computer
3. Save the file to your desired location

## Troubleshooting

If you encounter issues:

- **Interface not loading**: Try refreshing the page or using a different browser
- **Upload errors**: Ensure your image is in a supported format (JPG, PNG) and not too large
- **Processing errors**: If the generation fails, try with a different image or at a different time
- **Download issues**: If the GLB file doesn't download, try right-clicking the download link and selecting "Save link as..."

## Using the GLB File

The downloaded GLB file is a standard 3D model format that can be used in various applications:

- View it in online viewers like [Three.js Editor](https://threejs.org/editor/)
- Import it into 3D modeling software like Blender
- Use it in game engines like Unity or Unreal Engine
- Integrate it into AR/VR applications

## Integration with Your Application

To integrate TRELLIS-generated avatars into your application, you have several options:

1. **Manual Process**: Use this guide to manually generate avatars as needed
2. **Automated Browser**: Use tools like Puppeteer to automate the browser interaction with the Gradio interface
3. **Direct API**: If you have access to the TRELLIS API, you can integrate it directly into your application

For the automated browser approach, you can use the scripts provided in this repository as a starting point.

## Limitations

- The quality of the generated avatar depends on the quality of the input image
- Processing times can vary based on server load
- The service may have usage limits or be unavailable at times
- The generated avatars may not perfectly capture all details from the original image

## Additional Resources

- [TRELLIS GitHub Repository](https://github.com/microsoft/TRELLIS)
- [Gradio Documentation](https://gradio.app/docs/)
- [GLB File Format Documentation](https://www.khronos.org/gltf/) 
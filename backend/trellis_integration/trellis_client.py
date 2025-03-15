import os
import requests
import json
from pathlib import Path

TRELLIS_SERVER = "http://34.42.169.146:8080"

def process_image(image_path):
    """
    Send an image to the TRELLIS server for processing.
    
    Args:
        image_path (str): Path to the input image file
        
    Returns:
        dict: Response from the TRELLIS server
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    print(f"Processing image: {image_path}")
    
    # Prepare the file upload
    with open(image_path, 'rb') as f:
        files = {'files': f}
        
        try:
            # Step 1: Upload the file
            print("Uploading file to TRELLIS server...")
            upload_response = requests.post(f"{TRELLIS_SERVER}/upload", files=files)
            upload_response.raise_for_status()
            
            uploaded_file = upload_response.json()[0]
            print(f"File uploaded successfully: {uploaded_file}")
            
            # Step 2: Create the file data object for prediction
            file_data = {
                "orig_name": os.path.basename(image_path),
                "path": uploaded_file,
                "url": None,
                "meta": {"_type": "gradio.FileData"}
            }
            
            # Step 3: Send for prediction
            print("Sending to TRELLIS for processing...")
            predict_response = requests.post(
                f"{TRELLIS_SERVER}/run/predict",
                json={"data": [file_data]},
                timeout=300  # 5 minute timeout
            )
            predict_response.raise_for_status()
            
            return predict_response.json()
            
        except requests.exceptions.RequestException as e:
            print(f"Error communicating with TRELLIS server: {str(e)}")
            if hasattr(e.response, 'text'):
                print(f"Server response: {e.response.text}")
            raise

def main():
    """
    Process all PNG files in the fullbodyimages directory.
    """
    # Get the directory paths
    fullbody_dir = Path(__file__).parent.parent / 'fullbodyimages'
    
    # Get list of PNG files
    image_files = [f for f in os.listdir(fullbody_dir) if f.endswith('.png') and not f.startswith('.')]
    
    if not image_files:
        print("No PNG images found in the fullbodyimages directory!")
        return
    
    # Process each image
    for image_file in image_files:
        image_path = os.path.join(fullbody_dir, image_file)
        try:
            result = process_image(image_path)
            print(f"\nSuccessfully processed {image_file}")
            print("Server response:", json.dumps(result, indent=2))
        except Exception as e:
            print(f"\nError processing {image_file}: {str(e)}")

if __name__ == '__main__':
    main() 
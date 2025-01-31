import os
import time
import logging
from google.cloud import storage

# Configure logging with timestamps
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Constants
bucket_name = 'fullbody-images'
logs_dir = '/home/content_thomasheindl/dreamgaussian/logs'
results_prefix = 'dg-results'

def initialize_storage_client():
    """Initialize the Google Cloud Storage client."""
    try:
        client = storage.Client()
        return client
    except Exception as e:
        logging.error(f"Failed to initialize Google Cloud Storage client: {e}")
        exit(1)

def upload_all_results():
    """Upload all files from logs directory to bucket."""
    logging.info('Starting upload of all generated files...')
    
    storage_client = initialize_storage_client()
    bucket = storage_client.bucket(bucket_name)
    allowed_extensions = {'.obj', '.glb', '.png', '.jpg', '.jpeg', '.txt', '.log', '.ply', '.mtl'}
    
    uploaded_files = 0
    for filename in os.listdir(logs_dir):
        _, ext = os.path.splitext(filename)
        ext = ext.lower()
        if ext not in allowed_extensions:
            logging.debug(f"Skipping {filename}: Unsupported extension '{ext}'")
            continue
            
        local_path = os.path.join(logs_dir, filename)
        if not os.path.isfile(local_path):
            logging.debug(f"Skipping {filename}: Not a file")
            continue
            
        remote_path = os.path.join(results_prefix, filename)
        
        try:
            blob = bucket.blob(remote_path)
            blob.upload_from_filename(local_path)
            logging.info(f'Uploaded: {filename} to gs://{bucket_name}/{remote_path}')
            uploaded_files += 1
        except Exception as e:
            logging.error(f'Error uploading {filename}: {e}')
    
    if uploaded_files == 0:
        logging.info("No files were uploaded.")
    else:
        logging.info(f"Successfully uploaded {uploaded_files} files.")

def watch_for_signal():
    """Watch for signal file indicating files are ready to upload."""
    signal_file = '/tmp/ready_for_upload'
    logging.info('Uploader started. Waiting for upload signal...')
    
    while True:
        if os.path.exists(signal_file):
            logging.info('Upload signal received')
            upload_all_results()
            try:
                os.remove(signal_file)
                logging.info('Upload complete, removed signal file')
            except Exception as e:
                logging.error(f"Failed to remove signal file '{signal_file}': {e}")
        time.sleep(1)

if __name__ == '__main__':
    watch_for_signal()

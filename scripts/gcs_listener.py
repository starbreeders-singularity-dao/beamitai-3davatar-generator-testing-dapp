import os
import json
import logging
import subprocess
from pathlib import Path
from google.cloud import pubsub_v1
from google.cloud import storage
import sys
import glob

# Configure logging to be less verbose
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s',  # Simplified format
    handlers=[
        logging.StreamHandler()
    ]
)

# Consider adding this to filter out progress bar outputs
class ProgressFilter(logging.Filter):
    def filter(self, record):
        return '%' not in record.getMessage()

logging.getLogger().addFilter(ProgressFilter())

# Constants
project_id = 'beamit-prototype'
subscription_name = 'fbi-transfer-sub'
subscription_path = f'projects/{project_id}/subscriptions/{subscription_name}'
bucket_name = 'fullbody-images'
local_data_dir = '/home/content_thomasheindl/dreamgaussian/data'
desired_subfolder = 'fullbodyimages/'
desired_extension = '.png'

# Initialize clients
subscriber = pubsub_v1.SubscriberClient()
storage_client = storage.Client()

def download_blob(bucket_name, source_blob_name, destination_folder):
    """Download a blob from the bucket to a local directory."""
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    local_path = os.path.join(destination_folder, os.path.basename(source_blob_name))
    blob.download_to_filename(local_path)
    logging.info(f'Downloaded storage object {source_blob_name} to {local_path}.')

def callback(message):
    """Callback function to process incoming messages."""
    try:
        logging.info("=== START NEW FILE PROCESSING ===")
        logging.info(f'Received message: {message.data}')
        message.ack()
        
        data = json.loads(message.data)
        filename = data.get('name')
        logging.info(f"Filename from message: {filename}")
        
        if (
            filename and
            filename.startswith('fullbodyimages/') and
            filename.lower().endswith('.png') and
            not filename.endswith('_rgba.png')
        ):
            logging.info(f'File qualifies for processing: {filename}')
            
            # Download
            logging.info("Starting download...")
            download_blob(bucket_name, filename, local_data_dir)
            logging.info("Download complete")
            
            # Try to run batch-one
            logging.info('Attempting to start batch-one.py...')
            try:
                process = subprocess.Popen(
                    ["python3", "batch-one.py"],
                    cwd="/home/content_thomasheindl/dreamgaussian",
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True,
                    bufsize=1
                )
                logging.info("batch-one.py started successfully")
                
                # Monitor output in real-time
                while True:
                    output = process.stdout.readline()
                    if output == '' and process.poll() is not None:
                        break
                    if output:
                        logging.info(f"batch-one output: {output.strip()}")
                
                # Check completion
                rc = process.poll()
                if rc == 0:
                    logging.info("batch-one.py completed successfully")
                    # Create signal file for uploader
                    with open('/tmp/ready_for_upload', 'w') as f:
                        f.write('ready')
                    logging.info("batch-one.py complete, signaled ready for upload.")
                else:
                    logging.error(f"batch-one.py failed with return code {rc}")
                    
            except Exception as e:
                logging.error(f"Failed to start/monitor batch-one.py: {str(e)}")
                
    except Exception as e:
        logging.error(f'Error in callback: {str(e)}')

def listen_for_messages():
    """Listen for incoming messages on the subscription."""
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    logging.info(f'Listening for messages on {subscription_path}...')

    try:
        streaming_pull_future.result()
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
    except Exception as e:
        logging.error(f'Listening failed: {e}')

def run_batch_one(filename):
    try:
        process = subprocess.Popen(
            ['python3', 'batch-one.py', filename],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )

        # Stream output in real-time
        while True:
            output = process.stdout.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print("batch-one output:", output.strip())

        return_code = process.poll()
        if return_code == 0:
            print("batch-one.py completed successfully")
            # Verify signal file creation
            if os.path.exists("ready_for_upload"):
                print("Signal file exists")
            else:
                print("Signal file not created!")
            return True
        else:
            print(f"batch-one.py failed with return code {return_code}")
            return False

    except Exception as e:
        print(f"Error running batch-one.py: {e}")
        return False

if __name__ == '__main__':
    listen_for_messages()

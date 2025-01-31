import os
import json
import logging
import subprocess

from google.cloud import pubsub_v1
from google.cloud import storage

# Configure logging
logging.basicConfig(level=logging.INFO)

# Set your project ID and subscription name
project_id = 'beamit-prototype'
subscription_name = 'fbi-transfer-sub'

# Fully qualified subscription path
subscription_path = f'projects/{project_id}/subscriptions/{subscription_name}'

# Initialize Google Cloud Storage and Pub/Sub clients
subscriber = pubsub_v1.SubscriberClient()
storage_client = storage.Client()

# Bucket and local paths
bucket_name = 'fullbody-images'
local_data_dir = '/home/content_thomasheindl/dreamgaussian/data'
logs_dir = '/home/content_thomasheindl/dreamgaussian/logs'
results_prefix = 'dg-results'  # Folder in the bucket where logs go

def callback(message):
    """Callback function to process incoming messages."""
    logging.info(f'Received message: {message.data}')

    # Acknowledge the message
    message.ack()

    # Decode the JSON message to get the file name
    data = json.loads(message.data)
    filename = data.get('name')

    # Define the subfolder and desired file extension
    desired_subfolder = 'fullbodyimages/'
    desired_extension = '.png'

    # Check if the file is in the desired subfolder and has the desired extension
    if (
        filename and
        filename.startswith(desired_subfolder) and
        filename.lower().endswith(desired_extension)
    ):
        logging.info(f'Processing file: {filename}')

        # 1) Download the file from GCS to the local directory
        download_blob(bucket_name, filename, local_data_dir)

        # 2) Run the AI/batch-render script (from its own directory so relative paths work)
        subprocess.run(
            ["python", "batch-render.py"],
            cwd="/home/content_thomasheindl/dreamgaussian"
        )

        # 3) Upload everything in the logs folder to 'dg-results/' in GCS
        upload_folder(logs_dir, bucket_name, results_prefix)
    else:
        logging.info(f"Skipping file: {filename} (Not a PNG in '{desired_subfolder}')")

def download_blob(bucket_name, source_blob_name, destination_folder):
    """Download a blob (file) from the bucket to a local directory."""
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)

    # Ensure local folder exists
    os.makedirs(destination_folder, exist_ok=True)

    # Construct local path
    local_path = os.path.join(destination_folder, os.path.basename(source_blob_name))
    blob.download_to_filename(local_path)

    logging.info(f'Downloaded storage object {source_blob_name} to local file {local_path}.')

def upload_folder(local_folder, bucket_name, bucket_prefix):
    """
    Upload all files from a local folder (recursively) to the bucket,
    under the given prefix (e.g., 'dg-results/').
    """
    bucket = storage_client.bucket(bucket_name)

    # Walk the folder structure
    for root, dirs, files in os.walk(local_folder):
        for filename in files:
            local_path = os.path.join(root, filename)

            # Compute the relative path of each file under local_folder
            relative_path = os.path.relpath(local_path, local_folder)
            
            # Construct the destination path in GCS (e.g., 'dg-results/logs_file.png')
            remote_path = os.path.join(bucket_prefix, relative_path)

            blob = bucket.blob(remote_path)
            blob.upload_from_filename(local_path)

            logging.info(f'Uploaded {local_path} to gs://{bucket_name}/{remote_path}')

def listen_for_messages():
    """Listen for incoming messages on the subscription."""
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=callback)
    logging.info(f'Listening for messages on {subscription_path}...')

    try:
        streaming_pull_future.result()  # block & listen
    except KeyboardInterrupt:
        streaming_pull_future.cancel()
        logging.info("Stopped listening manually.")
    except Exception as e:
        logging.error(f'Listening for messages failed: {e}')

if __name__ == '__main__':
    listen_for_messages()

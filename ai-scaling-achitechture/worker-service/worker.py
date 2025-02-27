import os
import json
import logging
import requests
from google.cloud import pubsub_v1, storage

# Set up logging
logging.basicConfig(level=logging.INFO)

# Configuration
PROJECT_ID = os.environ.get("GCP_PROJECT", "beamit-prototype")
SUBSCRIPTION_ID = "trellis-tasks-sub"  # Ensure this subscription exists for the trellis-tasks topic.
BUCKET_NAME = "fullbody-images"
INPUT_FOLDER = "fullbodyimages"
OUTPUT_FOLDER = "trellis-results"
# TRELLIS_MODEL_URL should point to your deployed TRELLIS model service (e.g., https://trellis-model-xxxx.a.run.app/render)
TRELLIS_MODEL_URL = os.environ.get("TRELLIS_MODEL_URL", "https://trellis-model-url/render")

# Initialize Pub/Sub subscriber and Cloud Storage client
subscriber = pubsub_v1.SubscriberClient()
subscription_path = subscriber.subscription_path(PROJECT_ID, SUBSCRIPTION_ID)
storage_client = storage.Client()

def process_message(message):
    logging.info(f"Received message: {message.data.decode('utf-8')}")
    try:
        data = json.loads(message.data.decode("utf-8"))
        filename = data["filename"]
        logging.info(f"Processing file: {filename}")

        # Download image from Cloud Storage
        bucket = storage_client.bucket(BUCKET_NAME)
        input_blob = bucket.blob(f"{INPUT_FOLDER}/{filename}")
        local_input = f"/tmp/{filename}"
        input_blob.download_to_filename(local_input)
        logging.info(f"Downloaded {filename} to {local_input}")

        # Call the TRELLIS model service to render the image
        local_output = f"/tmp/{os.path.splitext(filename)[0]}.glb"
        with open(local_input, "rb") as f:
            files = {"image": f}
            logging.info(f"Sending image to TRELLIS model service at {TRELLIS_MODEL_URL}...")
            response = requests.post(TRELLIS_MODEL_URL, files=files)
        if response.status_code != 200:
            raise Exception(f"TRELLIS service error: {response.status_code} {response.text}")
        with open(local_output, "wb") as out_f:
            out_f.write(response.content)
        logging.info(f"Received rendered GLB file saved locally as {local_output}")

        # Upload the rendered GLB file to Cloud Storage
        output_blob = bucket.blob(f"{OUTPUT_FOLDER}/{os.path.basename(local_output)}")
        output_blob.upload_from_filename(local_output)
        logging.info(f"Uploaded GLB file to gs://{BUCKET_NAME}/{OUTPUT_FOLDER}/{os.path.basename(local_output)}")

        # Acknowledge the message
        message.ack()
    except Exception as e:
        logging.error(f"Error processing message: {e}")
        message.nack()

def main():
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=process_message)
    logging.info("Worker service is listening for messages...")
    try:
        streaming_pull_future.result()
    except Exception as e:
        streaming_pull_future.cancel()
        logging.error(f"Listening stopped: {e}")

if __name__ == "__main__":
    main()

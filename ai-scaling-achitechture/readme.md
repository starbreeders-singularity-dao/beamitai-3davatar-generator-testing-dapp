# TRELLIS 3D Pipeline Services

This repository contains two separate services that together form the TRELLIS 3D asset generation pipeline:

1. **Ingestion API**  
   Receives user-uploaded 2D images, stores them in Cloud Storage, and publishes a message to a Pub/Sub topic.

2. **Worker Service**  
   Subscribes to the Pub/Sub topic, downloads the uploaded images, calls the TRELLIS model service to render a 3D asset, and uploads the rendered output (GLB file) back to Cloud Storage.

Both services are designed to run as separate Docker containers and be deployed independently (for example, on Cloud Run).

---

## Prerequisites

- **Google Cloud Project:** `<YOUR_PROJECT_ID>`
- **Cloud Storage Bucket:** `<YOUR_BUCKET_NAME>`
  - **Input Folder:** `<INPUT_FOLDER>` (e.g., `fullbodyimages`)
  - **Output Folder:** `<OUTPUT_FOLDER>` (e.g., `trellis-results`)
- **Pub/Sub Topic:** `<PUBSUB_TOPIC>` (e.g., `trellis-tasks`)
- **TRELLIS Model Service:**  
  A separate service running on your instance with a public IP, accessible at:  
  `http://<INSTANCE_PUBLIC_IP>:<MODEL_PORT>/<RENDER_ENDPOINT>`  
  (e.g., `http://35.XX.XX.XX:8080/render`)
- **IAM Permissions:**  
  Ensure the service accounts used by your services have the following roles:
  - **Pub/Sub Subscriber** – to pull messages.
  - **Storage Object Admin** (or a combination of Viewer/Creator) – to download and upload files.

---

## Ingestion API

### Description

The Ingestion API is a Flask-based service that:
- Accepts POST requests at `/upload` with a 2D image.
- Stores the image in Cloud Storage at `gs://<YOUR_BUCKET_NAME>/<INPUT_FOLDER>/`.
- Publishes a JSON message (with metadata like filename and storage path) to the Pub/Sub topic `<PUBSUB_TOPIC>`.

### Files & Directory Structure

Place these files in the `ingestion-api/` directory:

- **main.py** – API server code.
- **Dockerfile** – Builds the Ingestion API image.
- **requirements.txt** – Lists dependencies (e.g., Flask, google-cloud-pubsub, google-cloud-storage).

### Example Dockerfile

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

EXPOSE 8080

CMD ["python", "main.py"]
```

### Deployment Steps

1. **Build the Image:**
   ```bash
   docker build -t trellis-ingestion .
   ```
2. **Tag & Push the Image:**
   ```bash
   docker tag trellis-ingestion gcr.io/<YOUR_PROJECT_ID>/trellis-ingestion
   docker push gcr.io/<YOUR_PROJECT_ID>/trellis-ingestion
   ```
3. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy trellis-ingestion \
     --image gcr.io/<YOUR_PROJECT_ID>/trellis-ingestion \
     --platform managed \
     --region <YOUR_REGION> \
     --allow-unauthenticated
   ```
4. **Test the Endpoint:**
   ```bash
   curl -X POST https://<INGESTION_API_URL>/upload -F "image=@/path/to/your/image.jpg"
   ```

---

## Worker Service

### Description

The Worker Service:
- Subscribes to the Pub/Sub topic `<PUBSUB_TOPIC>`.
- Downloads images from Cloud Storage at `gs://<YOUR_BUCKET_NAME>/<INPUT_FOLDER>/`.
- Calls the TRELLIS model service (running on your instance) using the URL `http://<INSTANCE_PUBLIC_IP>:<MODEL_PORT>/<RENDER_ENDPOINT>` to render a 3D asset.
- Uploads the resulting GLB file to `gs://<YOUR_BUCKET_NAME>/<OUTPUT_FOLDER>/`.

A minimal Flask app is included for a health check on port 8080 (required by Cloud Run), while the background thread subscribes to Pub/Sub and processes messages.

### Files & Directory Structure

Place these files in the `worker-service/` directory:

- **worker.py** – Worker service code.
- **Dockerfile** – Builds the Worker Service image.
- **requirements.txt** – Lists dependencies (e.g., Flask, google-cloud-pubsub, google-cloud-storage, requests).

### Example Worker Service Code (worker.py)

```python
import os
import json
import logging
import threading
import requests
from flask import Flask, jsonify
from google.cloud import pubsub_v1, storage

# Set up logging
logging.basicConfig(level=logging.INFO)

# Configuration
PROJECT_ID = os.environ.get("GCP_PROJECT", "<YOUR_PROJECT_ID>")
SUBSCRIPTION_ID = "trellis-tasks-sub"  # Create this subscription for topic <PUBSUB_TOPIC>
BUCKET_NAME = "<YOUR_BUCKET_NAME>"
INPUT_FOLDER = "<INPUT_FOLDER>"          # e.g., fullbodyimages
OUTPUT_FOLDER = "<OUTPUT_FOLDER>"        # e.g., trellis-results
TRELLIS_MODEL_URL = os.environ.get("TRELLIS_MODEL_URL", "http://<INSTANCE_PUBLIC_IP>:<MODEL_PORT>/<RENDER_ENDPOINT>")

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

def subscribe_to_pubsub():
    streaming_pull_future = subscriber.subscribe(subscription_path, callback=process_message)
    logging.info("Worker service is listening for messages...")
    try:
        streaming_pull_future.result()
    except Exception as e:
        streaming_pull_future.cancel()
        logging.error(f"Listening stopped: {e}")

# Minimal Flask app for health checks
app = Flask(__name__)

@app.route('/')
def health():
    return jsonify(status="ok"), 200

def main():
    # Start Pub/Sub subscription in a background thread
    thread = threading.Thread(target=subscribe_to_pubsub, daemon=True)
    thread.start()

    # Start Flask server on port specified by environment variable PORT (default 8080)
    port = int(os.environ.get("PORT", 8080))
    logging.info(f"Starting Flask server on port {port}")
    app.run(host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()
```

### Example Dockerfile for Worker Service

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY worker.py .

EXPOSE 8080

CMD ["python", "worker.py"]
```

### Example requirements.txt for Worker Service

```plaintext
google-cloud-pubsub==2.18.0
google-cloud-storage==2.7.0
requests==2.28.1
Flask==2.2.2
```

### Deployment Steps for Worker Service

1. **Build the Image using Cloud Build:**

   From the `worker-service/` directory, run:
   ```bash
   gcloud builds submit --tag gcr.io/<YOUR_PROJECT_ID>/worker-service .
   ```

2. **Deploy to Cloud Run:**

   Replace `<INSTANCE_PUBLIC_IP>`, `<MODEL_PORT>`, and `<RENDER_ENDPOINT>` with your actual values.
   ```bash
   gcloud run deploy worker-service \
     --image gcr.io/<YOUR_PROJECT_ID>/worker-service \
     --platform managed \
     --region <YOUR_REGION> \
     --set-env-vars TRELLIS_MODEL_URL=http://<INSTANCE_PUBLIC_IP>:<MODEL_PORT>/<RENDER_ENDPOINT> \
     --allow-unauthenticated
   ```

3. **Verify the Deployment:**
   - Visit the health check endpoint at `https://<WORKER_SERVICE_URL>/`
   - Check Cloud Logging to see that the worker service is subscribing to Pub/Sub and processing messages.

---

## End-to-End Workflow

1. **User Upload:**  
   A user uploads an image via the Ingestion API, which saves the image to Cloud Storage and publishes a message to Pub/Sub.

2. **Worker Processing:**  
   The Worker Service picks up the message, downloads the image, calls the TRELLIS model service to render a 3D asset, and uploads the rendered GLB file back to Cloud Storage.

3. **Monitoring:**  
   Use Cloud Logging to monitor both services and ensure everything is working as expected.

---

Adjust any placeholders (e.g., `<YOUR_PROJECT_ID>`, `<YOUR_BUCKET_NAME>`, `<INPUT_FOLDER>`, `<OUTPUT_FOLDER>`, `<YOUR_REGION>`, `<INSTANCE_PUBLIC_IP>`, `<MODEL_PORT>`, and `<RENDER_ENDPOINT>`) as needed for your environment. 

This README should provide a clear and comprehensive guide to setting up and deploying both services in your TRELLIS 3D pipeline. Let me know if you have any questions or need further adjustments!
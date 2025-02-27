import os
import json
import logging
from flask import Flask, request, jsonify
from google.cloud import pubsub_v1, storage
from werkzeug.utils import secure_filename

# Set up basic logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Configure Pub/Sub publisher
PROJECT_ID = os.environ.get("GCP_PROJECT") or "beamit-prototype"
TOPIC_ID = "trellis-tasks"
publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)

# Configure Cloud Storage
BUCKET_NAME = "fullbody-images"
INPUT_FOLDER = "fullbodyimages"  # For storing the incoming images

def upload_to_bucket(local_path, bucket_name, destination_blob_name):
    """Uploads a file to a Cloud Storage bucket."""
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(local_path)
        logging.info(f"File {local_path} uploaded to gs://{bucket_name}/{destination_blob_name}")
        return True
    except Exception as e:
        logging.error(f"Error uploading file {local_path} to bucket: {e}")
        return False

@app.route("/upload", methods=["POST"])
def upload_image():
    # Verify request has a file part
    if "image" not in request.files:
        logging.error("No image part in the request")
        return jsonify({"error": "No image part in the request"}), 400

    file = request.files["image"]
    if file.filename == "":
        logging.error("No selected file")
        return jsonify({"error": "No selected file"}), 400

    # No authentication needed as per your specification

    # Secure the filename and save temporarily
    filename = secure_filename(file.filename)
    temp_path = f"/tmp/{filename}"
    try:
        file.save(temp_path)
        logging.info(f"File saved temporarily at {temp_path}")
    except Exception as e:
        logging.error(f"Error saving file temporarily: {e}")
        return jsonify({"error": "File saving error"}), 500

    # Upload the file to Cloud Storage
    destination_blob_name = f"{INPUT_FOLDER}/{filename}"
    if not upload_to_bucket(temp_path, BUCKET_NAME, destination_blob_name):
        return jsonify({"error": "File upload to Cloud Storage failed"}), 500

    # Remove the temporary file after upload (optional)
    try:
        os.remove(temp_path)
        logging.info(f"Temporary file {temp_path} removed")
    except Exception as e:
        logging.warning(f"Could not remove temporary file {temp_path}: {e}")

    # Create the message payload with metadata (e.g., storage URL, filename)
    storage_path = f"gs://{BUCKET_NAME}/{destination_blob_name}"
    message = {
        "filename": filename,
        "storage_path": storage_path
    }
    message_data = json.dumps(message).encode("utf-8")

    # Publish message to Pub/Sub
    try:
        future = publisher.publish(topic_path, message_data)
        message_id = future.result()
        logging.info(f"Published message to Pub/Sub with ID: {message_id}")
    except Exception as e:
        logging.error(f"Error publishing message to Pub/Sub: {e}")
        return jsonify({"error": "Pub/Sub publishing error"}), 500

    return jsonify({"message": "Image received", "pubsub_message_id": message_id}), 200

if __name__ == "__main__":
    # Run locally for testing
    app.run(host="0.0.0.0", port=8080, debug=True)

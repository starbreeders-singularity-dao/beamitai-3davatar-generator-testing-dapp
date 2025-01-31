import os
import time
import logging
from google.cloud import storage
import shutil
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
BUCKET_NAME = 'fullbody-images'
DESTINATION_FOLDER = 'dg-results'
LOGS_DIR = '/home/content_thomasheindl/dreamgaussian/logs'
DATA_DIR = '/home/content_thomasheindl/dreamgaussian/data'

def clean_directories():
    """Clean up data and logs directories"""
    try:
        logger.info("Cleaning DreamGaussian directories...")
        
        # Clean data directory
        if os.path.exists(DATA_DIR):
            for item in os.listdir(DATA_DIR):
                item_path = os.path.join(DATA_DIR, item)
                try:
                    if os.path.isfile(item_path):
                        os.unlink(item_path)
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                except Exception as e:
                    logger.error(f"Error cleaning {item_path}: {e}")

        # Clean logs directory
        if os.path.exists(LOGS_DIR):
            for item in os.listdir(LOGS_DIR):
                item_path = os.path.join(LOGS_DIR, item)
                try:
                    if os.path.isfile(item_path):
                        os.unlink(item_path)
                    elif os.path.isdir(item_path):
                        shutil.rmtree(item_path)
                except Exception as e:
                    logger.error(f"Error cleaning {item_path}: {e}")

        logger.info("DreamGaussian directories cleaned successfully")
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")

def upload_file(source_file):
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        
        # Get just the filename without the path and prepend the destination folder
        blob_name = os.path.join(DESTINATION_FOLDER, os.path.basename(source_file))
        blob = bucket.blob(blob_name)
        
        # Upload the file
        blob.upload_from_filename(source_file)
        logging.info(f"File {source_file} uploaded to {BUCKET_NAME}/{blob_name}")
        return True
        
    except Exception as e:
        logging.error(f"Failed to upload {source_file}: {str(e)}")
        return False

def upload_glb():
    """Upload GLB file to Google Cloud Storage"""
    try:
        logger.info("=== Starting Upload Process ===")
        logger.info(f"Current working directory: {os.getcwd()}")
        logger.info(f"Looking for GLB files in: {LOGS_DIR}")
        
        # List all files in logs directory
        all_files = os.listdir(LOGS_DIR)
        logger.info(f"All files in logs directory: {all_files}")
        
        glb_files = [f for f in all_files if f.endswith('.glb')]
        logger.info(f"Found GLB files: {glb_files}")

        if not glb_files:
            logger.warning("No GLB files found in logs directory")
            return False

        glb_file = os.path.join(LOGS_DIR, glb_files[0])
        logger.info(f"Attempting to upload: {glb_file}")
        
        # Check if file exists and is readable
        if not os.path.exists(glb_file):
            logger.error(f"GLB file does not exist: {glb_file}")
            return False
            
        if not os.access(glb_file, os.R_OK):
            logger.error(f"GLB file is not readable: {glb_file}")
            return False

        # Upload the file
        upload_file(glb_file)
        
        # Clean up after successful upload
        clean_directories()
        
        if os.path.exists("ready_for_upload"):
            os.remove("ready_for_upload")
            logger.info("Upload signal file removed")
        return True

    except Exception as e:
        logger.error("=== Upload Error Details ===")
        logger.error(str(e))
        logger.error(traceback.format_exc())
        return False

def main():
    logger.info(f"=== Starting Uploader Service ===")
    logger.info(f"Watching for signal file in: {os.getcwd()}")
    logger.info(f"LOGS_DIR set to: {LOGS_DIR}")
    
    while True:
        try:
            if os.path.exists("ready_for_upload"):
                logger.info("Found ready_for_upload signal")
                upload_glb()
            time.sleep(1)
        except Exception as e:
            logger.error(f"Error in main loop: {str(e)}")
            time.sleep(1)

if __name__ == "__main__":
    main()

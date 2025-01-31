import os
import time
import logging
import subprocess
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)

# Constants
logs_dir = '/home/content_thomasheindl/dreamgaussian/logs'

def convert_obj_to_glb(obj_path):
    """Convert a single OBJ file to GLB format."""
    try:
        logging.info(f'Starting GLB conversion for: {obj_path}')
        obj_filename = Path(obj_path).stem
        glb_output = os.path.join(logs_dir, f"{obj_filename}.glb")
        logging.info(f'Will save GLB to: {glb_output}')
        
        cmd = f'obj2gltf -i "{obj_path}" -o "{glb_output}" --binary'
        logging.info(f'Running command: {cmd}')
        
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0
            
    except Exception as e:
        logging.error(f'Exception during conversion: {str(e)}')
        return False

def process_obj_files():
    """Process all OBJ files in the logs directory."""
    logging.info(f'Checking for OBJ files in: {logs_dir}')
    for filename in os.listdir(logs_dir):
        if filename.endswith('.obj'):
            obj_path = os.path.join(logs_dir, filename)
            convert_obj_to_glb(obj_path)

def watch_for_signal():
    """Watch for signal to start GLB conversion."""
    glb_signal = '/tmp/ready_for_glb'
    upload_signal = '/tmp/ready_for_upload'
    
    while True:
        if os.path.exists(glb_signal):
            logging.info('GLB conversion signal received')
            process_obj_files()
            os.remove(glb_signal)
            
            # Signal uploader
            with open(upload_signal, 'w') as f:
                f.write('ready')
                
            logging.info('GLB conversion complete, signaled uploader')
        time.sleep(1)

if __name__ == '__main__':
    watch_for_signal()

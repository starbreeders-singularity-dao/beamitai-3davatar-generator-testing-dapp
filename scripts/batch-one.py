import subprocess
import sys
import os
import glob
from tqdm import tqdm
import logging

def run_command(command):
    """Run a command and preserve nice progress bars/logging."""
    print('Running command:', ' '.join(command))
    process = subprocess.run(command)
    
    # Check if command was successful
    if process.returncode != 0:
        print(f"Command failed with return code {process.returncode}")
        sys.exit(1)

class TqdmToLogger(object):
    def __init__(self, logger, level=logging.INFO):
        self.logger = logger
        self.level = level
        self.last_msg = ""

    def write(self, buf):
        self.last_msg = buf.strip()

    def flush(self):
        if self.last_msg and not self.last_msg.endswith('\r'):
            self.logger.log(self.level, self.last_msg)

def main():
    print("Script started")
    print("Looking for PNG files in data...")
    
    # Get PNG files
    png_files = glob.glob('data/*.png')
    png_files = [f for f in png_files if not f.endswith('_rgba.png')]
    print(f"Found {len(png_files)} PNG files: {png_files}")
    print(f"After filtering _rgba.png: {len(png_files)} files: {png_files}")
    
    # Process each file
    for input_file in png_files:  # Changed from indexed loop to for-each loop
        print(f"\nProcessing {input_file}...")
        
        # Process steps
        base_name = os.path.splitext(os.path.basename(input_file))[0]
        
        # Run process.py
        process_cmd = f"python3 process.py {input_file} --size 512"
        print(f"Running command: {process_cmd}")
        subprocess.run(process_cmd, shell=True, check=True)
        
        # Run main.py
        main_cmd = f"python3 main.py --config configs/image.yaml input={input_file.replace('.png', '_rgba.png')} save_path={base_name}"
        print(f"Running command: {main_cmd}")
        subprocess.run(main_cmd, shell=True, check=True)
        
        # GLB export
        print("\nAttempting GLB export...")
        print("Mesh format: glb")
        glb_cmd = f"python3 main2.py --config configs/image.yaml mesh=logs/{base_name}_mesh.obj input={input_file.replace('.png', '_rgba.png')} save_path={base_name} outdir=logs mesh_format=glb input_mesh_format=obj"
        print(f"Running command: {glb_cmd}")
        subprocess.run(glb_cmd, shell=True, check=True)

    # At the end of the script, after GLB creation
    try:
        signal_path = os.path.join(os.getcwd(), "ready_for_upload")
        with open(signal_path, "w") as f:
            pass
        print(f"Signal file created at: {signal_path}")
    except Exception as e:
        print(f"Error creating signal file: {e}")

    print("batch-one.py completed successfully")
    print("batch-one.py complete, signaled ready for upload.")

if __name__ == "__main__":
    main()

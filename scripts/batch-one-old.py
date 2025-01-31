import subprocess
import sys
import os
import glob

def run_command(command):
    """Run command and preserve nice progress bars"""
    print('Running command:', ' '.join(command))
    process = subprocess.run(command)
    
    # Check if command was successful
    if process.returncode != 0:
        print(f"Command failed with return code {process.returncode}")
        sys.exit(1)

def main():
    # Debug prints
    print("Script started", flush=True)
    
    # Find all PNG files in data directory
    data_dir = 'data'
    print(f"Looking for PNG files in {data_dir}...")
    
    png_files = glob.glob(os.path.join(data_dir, '*.png'))
    print(f"Found {len(png_files)} PNG files: {png_files}")
    
    # Filter out _rgba.png files
    png_files = [f for f in png_files if not f.endswith('_rgba.png')]
    print(f"After filtering _rgba.png: {len(png_files)} files: {png_files}")
    
    if not png_files:
        print("No PNG files found in data directory!")
        return
    
    mesh_format = 'glb'  # Define the format here
    
    for input_file in png_files:
        base_name = os.path.splitext(os.path.basename(input_file))[0]
        print(f"\nProcessing {input_file}...")

        # 1. Process image
        run_command([
            'python3', 'process.py',
            input_file,
            '--size', '512'
        ])

        # 2. Train Gaussian stage
        run_command([
            'python3', 'main.py',
            '--config', 'configs/image.yaml',
            f'input=data/{base_name}_rgba.png',
            f'save_path={base_name}'
        ])

        # 3. Train Mesh stage (with GLB output)
        print("\nAttempting GLB export...")
        print(f"Mesh format: {mesh_format}")
        try:
            run_command([
                'python3', 'main2.py',
                '--config', 'configs/image.yaml',
                f'mesh=logs/{base_name}_mesh.obj',
                f'input=data/{base_name}_rgba.png',
                f'save_path={base_name}',
                f'outdir=logs',
                f'mesh_format=glb',
                'input_mesh_format=obj'
            ])
        except Exception as e:
            print(f"GLB export failed with error: {str(e)}")

if __name__ == '__main__':
    main() 
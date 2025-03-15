import os
import imageio
from PIL import Image
from trellis.pipelines import TrellisImageTo3DPipeline
from trellis.utils import render_utils, postprocessing_utils

# Optional: Set environment variables if needed.
# For instance, use the 'native' SPConv algorithm.
os.environ['SPCONV_ALGO'] = 'native'

def process_image(image_path, output_dir=None):
    """
    Process a single image through the TRELLIS pipeline.
    
    Args:
        image_path (str): Path to the input image
        output_dir (str, optional): Directory to save outputs. If None, uses default.
    
    Returns:
        dict: Paths to generated files
    """
    if output_dir is None:
        output_dir = os.path.join(os.path.dirname(__file__), '..', 'generated_assets')
    
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading image from {image_path} ...")
    image = Image.open(image_path)
    
    # Load pipeline from Hugging Face
    print("Loading TRELLIS pipeline...")
    pipeline = TrellisImageTo3DPipeline.from_pretrained("JeffreyXiang/TRELLIS-image-large")
    pipeline.cuda()  # Move the pipeline to GPU

    # Run the pipeline
    print("Running the TRELLIS pipeline (this may take a while)...")
    outputs = pipeline.run(
        image,
        seed=1,
        sparse_structure_sampler_params={
            "steps": 12,
            "cfg_strength": 7.5,
        },
        slat_sampler_params={
            "steps": 12,
            "cfg_strength": 3,
        },
    )

    # Get base filename without extension
    base_filename = os.path.splitext(os.path.basename(image_path))[0]
    
    # Dictionary to store output paths
    generated_files = {}

    # Check available outputs
    print("Pipeline finished. Available outputs:")
    for key in outputs.keys():
        print(f" - {key}: {len(outputs[key])} item(s)")

    # Generate and save all outputs
    print("Generating output files...")
    
    # Gaussian representation video
    video_gaussian = render_utils.render_video(outputs['gaussian'][0])['color']
    gaussian_path = os.path.join(output_dir, f"{base_filename}_gaussian.mp4")
    imageio.mimsave(gaussian_path, video_gaussian, fps=30)
    generated_files['gaussian_video'] = gaussian_path
    print(f"Saved Gaussian video as {gaussian_path}")
    
    # Radiance Field video
    video_rf = render_utils.render_video(outputs['radiance_field'][0])['color']
    rf_path = os.path.join(output_dir, f"{base_filename}_rf.mp4")
    imageio.mimsave(rf_path, video_rf, fps=30)
    generated_files['rf_video'] = rf_path
    print(f"Saved Radiance Field video as {rf_path}")
    
    # Mesh video
    video_mesh = render_utils.render_video(outputs['mesh'][0])['normal']
    mesh_path = os.path.join(output_dir, f"{base_filename}_mesh.mp4")
    imageio.mimsave(mesh_path, video_mesh, fps=30)
    generated_files['mesh_video'] = mesh_path
    print(f"Saved Mesh video as {mesh_path}")
    
    # GLB file
    print("Extracting GLB file...")
    glb = postprocessing_utils.to_glb(
        outputs['gaussian'][0],
        outputs['mesh'][0],
        simplify=0.95,
        texture_size=1024
    )
    glb_path = os.path.join(output_dir, f"{base_filename}.glb")
    glb.export(glb_path)
    generated_files['glb'] = glb_path
    print(f"Saved GLB file as {glb_path}")
    
    # PLY file
    print("Saving Gaussian output as PLY...")
    ply_path = os.path.join(output_dir, f"{base_filename}.ply")
    outputs['gaussian'][0].save_ply(ply_path)
    generated_files['ply'] = ply_path
    print(f"Saved PLY file as {ply_path}")
    
    return generated_files

def main():
    """
    Main function to process all PNG files in the fullbodyimages directory.
    """
    fullbody_dir = os.path.join(os.path.dirname(__file__), '..', 'fullbodyimages')
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'generated_assets')
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Get list of PNG files
    image_files = [f for f in os.listdir(fullbody_dir) if f.endswith('.png') and not f.startswith('.')]
    
    if not image_files:
        print("No PNG images found in the fullbodyimages directory!")
        return
    
    # Process each image
    for image_file in image_files:
        image_path = os.path.join(fullbody_dir, image_file)
        try:
            generated_files = process_image(image_path, output_dir)
            print(f"\nSuccessfully processed {image_file}")
            print("Generated files:", generated_files)
        except Exception as e:
            print(f"\nError processing {image_file}: {str(e)}")

if __name__ == '__main__':
    main() 
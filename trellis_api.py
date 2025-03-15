import os
import sys
import json
import imageio
from PIL import Image
from trellis.pipelines import TrellisImageTo3DPipeline
from trellis.utils import render_utils, postprocessing_utils

def generate_3d_asset(image_path, output_dir):
    """
    Generate a 3D asset from an image using TRELLIS.
    
    Args:
        image_path (str): Path to the input image
        output_dir (str): Directory to save outputs
        
    Returns:
        dict: Paths to the generated files
    """
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate output file paths
    base_filename = os.path.splitext(os.path.basename(image_path))[0]
    glb_path = os.path.join(output_dir, f"{base_filename}.glb")
    ply_path = os.path.join(output_dir, f"{base_filename}.ply")
    video_gs_path = os.path.join(output_dir, f"{base_filename}_gs.mp4")
    video_rf_path = os.path.join(output_dir, f"{base_filename}_rf.mp4")
    video_mesh_path = os.path.join(output_dir, f"{base_filename}_mesh.mp4")
    
    try:
        # Load the TRELLIS pipeline
        print("Loading TRELLIS pipeline...")
        pipeline = TrellisImageTo3DPipeline.from_pretrained("JeffreyXiang/TRELLIS-image-large")
        pipeline.cuda()  # Move the pipeline to GPU
        
        # Load the input image
        print(f"Loading image from {image_path} ...")
        image = Image.open(image_path)
        
        # Run the pipeline
        print("Running the TRELLIS pipeline (this may take a while)...")
        outputs = pipeline.run(
            image,
            seed=1,  # You can change the seed for different outputs
        )
        
        # Check what outputs we have
        print("Pipeline finished. Available outputs:")
        for key in outputs.keys():
            print(f" - {key}: {len(outputs[key])} item(s)")
        
        # Render output videos
        print("Rendering videos...")
        video_gaussian = render_utils.render_video(outputs['gaussian'][0])['color']
        imageio.mimsave(video_gs_path, video_gaussian, fps=30)
        
        video_rf = render_utils.render_video(outputs['radiance_field'][0])['color']
        imageio.mimsave(video_rf_path, video_rf, fps=30)
        
        video_mesh = render_utils.render_video(outputs['mesh'][0])['normal']
        imageio.mimsave(video_mesh_path, video_mesh, fps=30)
        
        # Extract GLB file
        print("Extracting GLB file...")
        glb = postprocessing_utils.to_glb(
            outputs['gaussian'][0],
            outputs['mesh'][0],
            simplify=0.95,
            texture_size=1024
        )
        glb.export(glb_path)
        
        # Save Gaussian output as PLY
        print("Saving Gaussian output as PLY...")
        outputs['gaussian'][0].save_ply(ply_path)
        
        # Return paths to generated files
        result = {
            "success": True,
            "glb_path": glb_path,
            "ply_path": ply_path,
            "video_gs_path": video_gs_path,
            "video_rf_path": video_rf_path,
            "video_mesh_path": video_mesh_path
        }
        
        return result
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    # Check if correct number of arguments is provided
    if len(sys.argv) != 3:
        print("Usage: python trellis_api.py <image_path> <output_dir>")
        sys.exit(1)
    
    # Get arguments
    image_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    # Generate 3D asset
    result = generate_3d_asset(image_path, output_dir)
    
    # Print result as JSON
    print(json.dumps(result)) 
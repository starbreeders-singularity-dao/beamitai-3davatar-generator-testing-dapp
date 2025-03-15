import os
import imageio
from PIL import Image
from trellis.pipelines import TrellisImageTo3DPipeline
from trellis.utils import render_utils, postprocessing_utils

# Optional: Set environment variables if needed.
# For instance, use the 'native' SPConv algorithm.
os.environ['SPCONV_ALGO'] = 'native'

def main():
    # Load a pipeline from a model folder or from Hugging Face
    print("Loading TRELLIS pipeline...")
    pipeline = TrellisImageTo3DPipeline.from_pretrained("JeffreyXiang/TRELLIS-image-large")
    pipeline.cuda()  # Move the pipeline to GPU

    # Create assets directory if it doesn't exist
    os.makedirs("assets/example_image", exist_ok=True)

    # Load an input image from the fullbodyimages directory
    fullbody_dir = "backend/fullbodyimages"
    image_files = [f for f in os.listdir(fullbody_dir) if f.endswith('.png') and not f.startswith('.')]
    
    if not image_files:
        print("No PNG images found in the fullbodyimages directory!")
        return
        
    image_path = os.path.join(fullbody_dir, image_files[0])
    print(f"Loading image from {image_path} ...")
    image = Image.open(image_path)

    # Run the pipeline to generate 3D asset outputs
    print("Running the TRELLIS pipeline (this may take a while)...")
    outputs = pipeline.run(
        image,
        seed=1,  # You can change the seed for different outputs
        sparse_structure_sampler_params={
            "steps": 12,
            "cfg_strength": 7.5,
        },
        slat_sampler_params={
            "steps": 12,
            "cfg_strength": 3,
        },
    )

    # Create output directory
    output_dir = "backend/generated_assets"
    os.makedirs(output_dir, exist_ok=True)

    # Get base filename without extension
    base_filename = os.path.splitext(os.path.basename(image_path))[0]

    # Check what outputs we have
    print("Pipeline finished. Available outputs:")
    for key in outputs.keys():
        print(f" - {key}: {len(outputs[key])} item(s)")

    # Render output videos from different representations
    print("Rendering videos from different representations...")
    
    # Gaussian representation
    video_gaussian = render_utils.render_video(outputs['gaussian'][0])['color']
    gaussian_path = os.path.join(output_dir, f"{base_filename}_gaussian.mp4")
    imageio.mimsave(gaussian_path, video_gaussian, fps=30)
    print(f"Saved Gaussian video as {gaussian_path}")
    
    # Radiance Field representation
    video_rf = render_utils.render_video(outputs['radiance_field'][0])['color']
    rf_path = os.path.join(output_dir, f"{base_filename}_rf.mp4")
    imageio.mimsave(rf_path, video_rf, fps=30)
    print(f"Saved Radiance Field video as {rf_path}")
    
    # Mesh representation
    video_mesh = render_utils.render_video(outputs['mesh'][0])['normal']
    mesh_path = os.path.join(output_dir, f"{base_filename}_mesh.mp4")
    imageio.mimsave(mesh_path, video_mesh, fps=30)
    print(f"Saved Mesh video as {mesh_path}")
    
    # Extract GLB file
    print("Extracting GLB file from outputs...")
    glb = postprocessing_utils.to_glb(
        outputs['gaussian'][0],
        outputs['mesh'][0],
        simplify=0.95,     # Simplification ratio
        texture_size=1024  # Texture size
    )
    glb_path = os.path.join(output_dir, f"{base_filename}.glb")
    glb.export(glb_path)
    print(f"Saved GLB file as {glb_path}")
    
    # Save Gaussian output as PLY file
    print("Saving Gaussian output as PLY file...")
    ply_path = os.path.join(output_dir, f"{base_filename}.ply")
    outputs['gaussian'][0].save_ply(ply_path)
    print(f"Saved PLY file as {ply_path}")

if __name__ == '__main__':
    main() 
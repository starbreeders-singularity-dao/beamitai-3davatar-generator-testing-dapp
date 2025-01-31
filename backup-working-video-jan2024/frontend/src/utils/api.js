export const fetchLocalImages = async () => {
  const backendUrl = process.env.REACT_APP_API_URL; // Get the backend URL from environment variables
  try {
    const response = await fetch(`${backendUrl}/pfp`); // Fetch from the backend
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Backend data:', data); // Log the data received from backend
    return data.images.map((img) => {
      const fullUrl = `${backendUrl}${img}`;
      console.log('Full image URL:', fullUrl); // Log the full image URL
      return fullUrl;
    });
  } catch (error) {
    console.error('Error fetching local images:', error.message);
    throw error;
  }
};

export const generateImages = async (pfpFile) => {
  const backendUrl = process.env.REACT_APP_API_URL; // Get the backend URL from environment variables
  try {
    const formData = new FormData();
    formData.append('pfpImage', pfpFile);

    const response = await fetch(`${backendUrl}/generate-images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error generating images: ${errorData.error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating images:', error.message);
    throw error;
  }
};

export const uploadImageToCloud = async (fileName) => {
  const backendUrl = process.env.REACT_APP_API_URL; // Get the backend URL from environment variables
  try {
    const response = await fetch(`${backendUrl}/upload-to-cloud`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error uploading image: ${errorData.error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading image:', error.message);
    throw error;
  }
};

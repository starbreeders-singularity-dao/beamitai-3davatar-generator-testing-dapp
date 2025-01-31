import React from 'react';

const RenderResults = ({ videoUrl, fileName }) => {
  return (
    <div>
      <h2>Rendered Video</h2>
      {videoUrl ? (
        <>
          <video width="600" controls>
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <p>File Name: {fileName}</p>
        </>
      ) : (
        <p>No video available yet.</p>
      )}
    </div>
  );
};

export default RenderResults;

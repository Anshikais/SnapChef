import React from 'react';

export default function ImageUploader({ imagePreview, onImageChange, onScan, isScanning }) {
  return (
    <div className="upload-section animate-fade-in mb-5">
      {!imagePreview ? (
        <label className="upload-card d-block">
          <input 
            type="file" 
            accept="image/*" 
            className="d-none" 
            onChange={onImageChange} 
          />
          <div className="text-secondary">
            <h4 className="mb-3">Take a photo of your fridge</h4>
            <p>Click to browse or drag and drop an image here</p>
            <span style={{ fontSize: '3rem' }}>📸</span>
          </div>
        </label>
      ) : (
        <div className="preview-section text-center">
          <div className="preview-container mb-3">
            <img src={imagePreview} alt="Preview" className="preview-image" />
          </div>
          <button 
            className="btn btn-primary-custom btn-lg w-100" 
            onClick={onScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Scanning Ingredients...</>
            ) : (
              'Scan Ingredients'
            )}
          </button>
          <button 
            className="btn btn-link text-secondary mt-2" 
            onClick={() => onImageChange({ target: { files: [] } })}
          >
            Upload a different image
          </button>
        </div>
      )}
    </div>
  );
}

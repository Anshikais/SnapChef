import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

export default function ImageUploader({
  imagePreview,
  onImageChange,
  onScan,
  isScanning,
}) {
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);

  const capture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();

    if (!imageSrc) return;

    const response = await fetch(imageSrc);
    const blob = await response.blob();

    const file = new File(
      [blob],
      `captured-${Date.now()}.jpg`,
      {
        type: "image/jpeg",
      }
    );

    onImageChange({
      target: {
        files: [file],
      },
    });

    setShowCamera(false);
  };

  return (
    <div className="upload-section animate-fade-in mb-5">
      {!imagePreview ? (
        <>
          {/* Upload Area */}
          <label className="upload-card d-block">
            <input
              type="file"
              accept="image/*"
              className="d-none"
              onChange={onImageChange}
            />

            <div className="text-secondary text-center">
              <h4 className="mb-3">Take a photo of your fridge</h4>
              <p>Click to browse or drag and drop an image here</p>

              <span
                style={{
                  fontSize: "3rem",
                  display: "block",
                  marginBottom: "15px",
                }}
              >
                📸
              </span>

              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={(e) => {
                  e.preventDefault();
                  setShowCamera(true);
                }}
              >
                Open Camera
              </button>
            </div>
          </label>

          {/* Webcam Section */}
          {showCamera && (
            <div className="mt-4 text-center">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width="100%"
                videoConstraints={{
                  facingMode: "environment",
                }}
                style={{
                  borderRadius: "12px",
                  maxWidth: "500px",
                }}
              />

              <div className="mt-3">
                <button
                  className="btn btn-success me-2"
                  onClick={capture}
                >
                  Capture Photo
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCamera(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="preview-section text-center">
          <div className="preview-container mb-3">
            <img
              src={imagePreview}
              alt="Preview"
              className="preview-image"
            />
          </div>

          <button
            className="btn btn-primary-custom btn-lg w-100"
            onClick={onScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Scanning Ingredients...
              </>
            ) : (
              "Scan Ingredients"
            )}
          </button>

          <button
            className="btn btn-link text-secondary mt-2"
            onClick={() =>
              onImageChange({
                target: {
                  files: [],
                },
              })
            }
          >
            Upload a different image
          </button>
        </div>
      )}
    </div>
  );
}
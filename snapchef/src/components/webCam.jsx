import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

function webCam() {
  const webcamRef = useRef(null);
  const [image, setImage] = useState(null);

  const capture = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setImage(screenshot);
  };

  return (
    <div>
      {!image ? (
        <>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={300}
          />
          <button onClick={capture}>Capture</button>
        </>
      ) : (
        <img src={image} alt="Captured" width={300} />
      )}
    </div>
  );
}

export default webCam;
import React, { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import { toast } from "react-toastify";
import './webcam.css';

const FACING_MODE_USER = { facingMode: 'user' }; //Front Camera
const FACING_MODE_ENVIRONMENT = { facingMode: { exact: 'environment' } }; //Back Camera

const CameraCapture = ({ onCapture, onClose }) => {
    const webcamRef = useRef(null);
    const [image, setImage] = useState(null);
    const [videoConstraints, setVideoConstraints] = useState(FACING_MODE_USER);

    const getListOfVideoInputs = async () => {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        return mediaDevices.filter(device => device.kind === 'videoinput');
    };

    const switchCamera = async () => {
        const videoInputList = await getListOfVideoInputs();
        if (videoInputList.length > 1) {
            const currentVideoConstraints = { ...videoConstraints };

            // If the current constraint is the front camera, switch to the back camera.
            if (JSON.stringify(currentVideoConstraints) === JSON.stringify(FACING_MODE_USER)) {
                setVideoConstraints(FACING_MODE_ENVIRONMENT);
            }
            // If the current constraint is the back camera, switch to the front camera.
            else if (JSON.stringify(currentVideoConstraints) === JSON.stringify(FACING_MODE_ENVIRONMENT)) {
                setVideoConstraints(FACING_MODE_USER);
            }
        } else {
            toast.error('Device has only one camera.');
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImage(imageSrc);
    }, [webcamRef, setImage]);

    const handleUpload = () => {
        if (image) {
            onCapture(image);
        }
    };

    const retake = () => setImage(null);

    return (
        <div className="camera-capture-modal">
            <div className="camera-capture-content">
                {image ? (
                    <img src={image} alt="Captured" className="captured-image" />
                ) : (
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={videoConstraints}
                        className="webcam-preview"
                    />
                )}

                <div className="camera-actions mt-2">
                    {image ? (
                        <>
                            <button 
                                className="btn btn-secondary me-2" 
                                onClick={retake}
                            >
                                Re-Take
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleUpload}
                            >
                                Use Photo
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                className="btn btn-secondary me-2" 
                                onClick={switchCamera}
                            >
                                Switch Camera
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={capture}
                            >
                                Take Photo
                            </button>
                        </>
                    )}
                    <button 
                        className="btn btn-danger ms-2" 
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CameraCapture;
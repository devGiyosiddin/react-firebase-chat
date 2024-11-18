import { useState, useRef } from "react";
import { IoTrashOutline } from "react-icons/io5";
import "./chatBgImg.css";
import { toast } from "react-toastify";
import { IoIosArrowBack } from "react-icons/io";
import upload from "../../../lib/upload";
import { IoImagesOutline } from "react-icons/io5";

const ChatBgImg = ({ onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const progressBarRef = useRef(null);


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileSize((selectedFile.size / 1024).toFixed(1) + " KB");
      setError("");
      setImgUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
        setError("Пожалуйста, выберите файл");
        return;
    }
    setIsUploading(true);
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            if (imgUrl && onUploadComplete) {
                onUploadComplete(imgUrl);
            }
        } else {
            width += 5;
            if (progressBarRef.current) {
                progressBarRef.current.style.width = width + "%";
            }
        }
    }, 50);

    try {
        // Загрузка изображения на Firebase
        const uploadedImgUrl = await upload(file);
        console.log("Uploaded image URL:", uploadedImgUrl);
        setIsFormVisible(false);
        setImgUrl(uploadedImgUrl);
      toast.success("Image uploaded successfully!");
      handleRemoveFile();
    } catch (error) {
        setError("Ошибка при загрузке файла: " + error);
    }
};

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    setFileSize("");
    setError("");
    setImgUrl(null);
    if (progressBarRef.current) {
      progressBarRef.current.style.width = "0%";
    }
  };

  return (
    <>
      <div className="option" onClick={() => setIsFormVisible(!isFormVisible)}>
        <IoImagesOutline className="option-icon" />
        {isFormVisible ? "Close Form" : "Background Image"}
      </div>
      {isFormVisible && (
        <div className="compact-form-container" onKeyDown={(e) => e.key === "Escape" && setIsFormVisible(false)}>
          <div className="compact-upload-files-container">
            <IoIosArrowBack title="Back" className="cancel-icon" onClick={() => setIsFormVisible(false)} />
            <div
              className="compact-drag-file-area"
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) {
                  setFile(droppedFile);
                  setFileName(droppedFile.name);
                  setFileSize((droppedFile.size / 1024).toFixed(1) + " KB");
                  setImgUrl(URL.createObjectURL(droppedFile));
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {imgUrl && (
                <div className="uploaded-image-container">
                  <h4 className="uploaded-image-title">Uploaded Image:</h4>
                  <img src={imgUrl} alt="Uploaded Preview" className="uploaded-image-preview" />
                </div>
              )}
              <h4 className={file ? "dynamic-message-active" : "dynamic-message"}>
                {file ? "File Dropped Successfully ✅" : "Drag & drop file here"}
              </h4>
              {!file && (
                <>
                  <span className="material-icons-outlined upload-icon">Upload an image</span>
                  <label className="label">
                    or{" "}
                    <span className="browse-files">
                      <input
                        type="file"
                        className="default-file-input"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                      />
                      <span className="browse-files-text">browse file</span>
                    </span>
                  </label>
                </>
              )}
            </div>
            {error && (
              <div className="cannot-upload-message">
                <span className="material-icons-outlined">error</span>
                {error}
                <span className="material-icons-outlined cancel-alert-button" onClick={() => setError("")}>
                  cancel
                </span>
              </div>
            )}
            {file && (
              <div className="file-block">
                <div className="file-info">
                  <div className="file-name-container">
                    <span className="file-label">Name:</span>
                    <span className="file-name">{fileName}</span> 
                    <span className="separator">|</span> 
                    <span className="file-size">Size: {fileSize}</span>
                  </div>
                </div>
                <button title="Remove the image" type="button" className="material-icons remove-file-icon" onClick={handleRemoveFile}>
                  <IoTrashOutline />
                </button>
                <div className="progress-bar" ref={progressBarRef}></div>
              </div>
            )}
            <button type="button" className="upload-button" onClick={handleUpload}>
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBgImg;
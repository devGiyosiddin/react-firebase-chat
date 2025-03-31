import React, { useState, useRef, useEffect } from "react";
import { IoTrashOutline, IoImagesOutline } from "react-icons/io5";
import { GrPowerReset } from "react-icons/gr";
import { IoIosArrowBack } from "react-icons/io";
import { FaPaintbrush } from "react-icons/fa6";
import { toast } from "react-toastify";
import { uploadImage, saveBackgroundImageUrl } from "../../../lib/firebase";
import "./chatBgImg.css";

const MAX_FILE_SIZE_MB = 5; // Максимальный размер файла в мегабайтах
const ALLOWED_TYPES = ["image/jpeg", "image/png"]; // Разрешённые типы файлов

const ChatBgImg = ({ chatId, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  const [currentFilter, setCurrentFilter] = useState(""); // Для хранения текущего фильтра
  const [isFilterMenuVisible, setIsFilterMenuVisible] = useState(false);

  const progressBarRef = useRef(null);
  const filterMenuRef = useRef(null); // Ref для меню фильтров

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!ALLOWED_TYPES.includes(selectedFile.type)) {
        setError("Разрешены только изображения (JPEG, PNG).");
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Размер файла не должен превышать ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileSize((selectedFile.size / 1024).toFixed(1) + " KB");
      setError("");
      setImgUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Пожалуйста, выберите файл.");
      return;
    }

    if (!chatId) {
      setError("Не указан chatId.");
      return;
    }

    setIsUploading(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.src = imgUrl;
      await new Promise((resolve) => (img.onload = resolve));

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.filter = currentFilter;
      ctx.drawImage(img, 0, 0);

      const filteredImageData = canvas.toDataURL("image/png");
      const response = await fetch(filteredImageData);
      const filteredImageBlob = await response.blob();

      const filteredImageFile = new File(
        [filteredImageBlob],
        `filtered_${file.name}`,
        { type: "image/png" }
      );

      const uploadedImgUrl = await uploadImage(
        filteredImageFile,
        `chatBackgrounds/${chatId}/${filteredImageFile.name}`
      );

      if (!uploadedImgUrl) {
        throw new Error("Не удалось получить URL изображения.");
      }

      await saveBackgroundImageUrl(chatId, uploadedImgUrl);
      setImgUrl(uploadedImgUrl);
      toast.success("Изображение успешно загружено!");
      setIsFormVisible(false);

      if (onUploadComplete) {
        onUploadComplete(uploadedImgUrl);
      }

      handleRemoveFile();
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      toast.error("Ошибка при загрузке файла: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName("");
    setFileSize("");
    setError("");
    setImgUrl(null);
    setCurrentFilter(""); // Сбрасываем фильтр
    if (progressBarRef.current) {
      progressBarRef.current.style.width = "0%";
    }
  };

  const toggleFilter = (filter) => {
    setCurrentFilter((prevFilter) => (prevFilter === filter ? "" : filter));
  };

  // Закрытие меню при клике вне области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setIsFilterMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (KeyboardEvent.key === "Escape") {
    setIsFormVisible(false);
  }

  return (
    <>
      <div className="option" onClick={() => setIsFormVisible(!isFormVisible)}>
        <IoImagesOutline className="option-icon" />
        {isFormVisible ? "Закрыть форму" : "Изображение фона"}
      </div>
      {isFormVisible && (
        <div className="compact-form-container" onKeyDown={(e) => e.key === "Escape" && setIsFormVisible(false)}>
          <div className="compact-upload-files-container">
            <IoIosArrowBack title="Назад" className="cancel-icon" onClick={() => setIsFormVisible(false)} />
            <div
              className="compact-drag-file-area"
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile) {
                  handleFileChange({ target: { files: [droppedFile] } });
                }
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              {imgUrl && (
                <div className="uploaded-image-container">
                  <h4 className="uploaded-image-title">Uploaded Image:</h4>
                  <img
                    src={imgUrl}
                    alt="Uploaded Preview"
                    className="uploaded-image-preview"
                    style={{ filter: currentFilter }} // Применяем фильтр
                  />
                  <FaPaintbrush
                    title="Изменить изображение"
                    className="changeImg"
                    onClick={() => setIsFilterMenuVisible(!isFilterMenuVisible)} // Открываем/закрываем меню фильтров
                  />
                  {isFilterMenuVisible && (
                    <div className="filter-menu" ref={filterMenuRef}>
                      <button title="blur" onClick={() => toggleFilter("blur(5px)")}>Blur</button>
                      <button title="Black & White" onClick={() => toggleFilter("grayscale(100%)")}>W/B</button>
                      <button title="cuttlefish" onClick={() => toggleFilter("sepia(100%)")}>Cuttlefish</button>
                      <button title="contrast" onClick={() => toggleFilter("contrast(200%)")}>Contrast</button>
                      <button title="brightness" onClick={() => toggleFilter("brightness(150%)")}>Brightness</button>
                      <button title="reset" onClick={() => toggleFilter("")}><GrPowerReset /></button>
                    </div>
                  )}
                </div>
              )}
              <h4 className={file ? "dynamic-message-active" : "dynamic-message"}>
                {file ? "Файл успешно добавлен ✅" : "Перетащите файл сюда"}
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
                      <span className="browse-files-text">select the file</span>
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
                <button title="Удалить файл" type="button" className="material-icons remove-file-icon" onClick={handleRemoveFile}>
                  <IoTrashOutline />
                </button>
                <div className="progress-bar" ref={progressBarRef}></div>
              </div>
            )}
            <button className="upload-button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Загрузка..." : "Загрузить"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBgImg;
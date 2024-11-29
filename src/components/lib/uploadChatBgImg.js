import { useState } from 'react';
import { uploadImage, saveBackgroundImageUrl } from '../lib/firebase';

const UploadChatBgImg = ({ chatId }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleUpload = async () => {
    if (image) {
      setLoading(true);
      try {
        // Загружаем изображение в Firebase Storage
        const imageUrl = await uploadImage(image, `chatBackgrounds/${chatId}/${image.name}`);

        // Сохраняем URL изображения в Firestore
        await saveBackgroundImageUrl(chatId, imageUrl);
        console.log("Image uploaded and URL saved!");
      } catch (error) {
        console.error("Error during image upload:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Image"}
      </button>
    </div>
  );
};

export default UploadChatBgImg;
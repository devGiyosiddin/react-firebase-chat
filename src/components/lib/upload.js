import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
const upload = async (file) => {
    const date = new Date()
    const storage = getStorage();  // storage инициализируется раньше
    const storageRef = ref(storage, `images/${date + file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {},
            (error) => {
                reject("Something went wrong! " + error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    resolve(downloadURL);
                });
            }
        );
    });
};

export default upload;

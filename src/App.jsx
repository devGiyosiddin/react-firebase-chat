import List from "./components/list/List";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./components/lib/firebase";
import { useUserStore } from "./components/lib/userStore";
import { useChatStore } from "./components/lib/chatStore";
import { doc, getDoc } from "firebase/firestore";

const App = () => {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const [showDetail, setShowDetail] = useState(false);
  const currentUserId = auth?.currentUser?.uid;
  const [userSettings, setUserSettings] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('light');

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserInfo(user.uid);
        console.log("user", user.uid);
        
      } else {
        fetchUserInfo(null);
        console.log("no user");
      }
    });

    return () => unSub();
  }, [fetchUserInfo]);
  
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        if (currentUserId) {
          const userRef = doc(db, 'users', currentUserId);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserSettings(userData.settings || {});
            setSelectedTheme(userData.settings.selectedTheme || 'light');
          }
        }
      } catch (error) {
        console.error("Ошибка при загрузке настроек:", error);
      }
    };

    loadUserSettings();
  }, [currentUserId]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
}, [selectedTheme]);


  function handleChange(newState) {
    setShowDetail(newState);
  }

  if (isLoading) return <div className="loader-wrapper"><div className="loader"></div></div>;

  return (
    <div className="container">
      {currentUser ? (
        <>
          <List />
          {chatId && <Chat onInfoClick={() => setShowDetail(prev => !prev)} />}
          {chatId && showDetail && <Detail onChangeState={handleChange} />}
        </>
      ) : (
        <Login />
      )}
      <Notification />
    </div>
  );
};

export default App;
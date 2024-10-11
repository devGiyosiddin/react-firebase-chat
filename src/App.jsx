import List from "./components/list/List";
import Chat from "./components/chat/Chat";
import Detail from "./components/detail/Detail";
import Login from "./components/login/Login";
import Notification from "./components/notification/Notification";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./components/lib/firebase";
import { useUserStore } from "./components/lib/userStore";
import { useChatStore } from "./components/lib/chatStore";

const App = () => {

  const { currentUser, isLoading, fetchUserInfo } = useUserStore();
  const { chatId } = useChatStore();
  const [showDetail, setShowDetail] = useState(false); // Новое состояние для отображения Detail

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      fetchUserInfo(user?.uid)
    });

    return () => {
      unSub();
    };
  }, [fetchUserInfo]);

  if (isLoading) return <div className="loader"></div>

  return (
    <div className='container'>
      {currentUser ? (
            <>
          <List />
          {chatId && <Chat onInfoClick={() => setShowDetail(prev => !prev)} />} {/* Передаем обработчик клика */}
          {chatId && showDetail && <Detail />} {/* Условный рендеринг Detail */}
          </>
        ) : (
            <Login />
        )}
      <Notification />
    </div>
  )
}

export default App;
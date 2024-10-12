import { toast } from "react-toastify";
import "./login.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import upload from "../lib/upload";

const Login = () => {
    const [avatar, setAvatar] = useState({
        file: null,
        url: ""
    });

    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true); // Состояние для переключения между формами
    const [usernameAvailable, setUsernameAvailable] = useState(true); // Состояние для доступности имени
    const [checkingUsername, setCheckingUsername] = useState(false); // Для показа статуса проверки

    const navigate = useNavigate(); // Инициализируем useNavigate

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate("/chat"); // Перенаправление на чат при успешной авторизации
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const checkUsernameAvailability = async (username) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty; // Возвращает true, если имя пользователя доступно
    };

    const handleAvatar = e => {
        if (e.target.files[0]) {
            setAvatar({
                file: e.target.files[0],
                url: URL.createObjectURL(e.target.files[0])
            });
        }
    };

    const handleUsernameChange = async (e) => {
        const username = e.target.value;
        setCheckingUsername(true); // Показываем, что идет проверка

        const available = await checkUsernameAvailability(username);
        setUsernameAvailable(available);
        setCheckingUsername(false); // Скрываем статус проверки
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);
    
        try {
            if (!usernameAvailable) {
                toast.error("Username is already taken. Please choose another one.");
                setLoading(false);
                return;
            }

            const res = await createUserWithEmailAndPassword(auth, email, password);
            const imgUrl = await upload(avatar.file);
    
            await setDoc(doc(db, "users", res.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: res.user.uid,
                blocked: [],
            });
    
            await setDoc(doc(db, "userchats", res.user.uid), {
                chats: [],
            });
    
            toast.success("Account created successfully! You can login now");
            setIsLogin(true); // Переключение на форму логина после успешной регистрации
    
        } catch (err) {
            if (err.code === "auth/email-already-in-use") {
                toast.error("This email is already registered. Please use another email or login.");
            } else {
                toast.error(err.message);
            }
        } finally {
            setLoading(false);
        }
    };    

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login">
            {isLogin ? (
                <div className={`item login-item ${isLogin ? "active" : ""}`}>
                    <h2>Welcome back!</h2>
                    <form onSubmit={handleLogin}>
                        <input type="email" placeholder="Email" name="email" required />
                        <input type="password" placeholder="Password" name="password" required />
                        <button>{loading ? "loading" : "Sign In"}</button>
                        <span className="or">or</span>
                        <button onClick={() => setIsLogin(false)} className="toggle-button">Register</button>
                    </form>
                </div>
            ) : (
                <div className={`item register-item ${!isLogin ? "active" : ""}`}>
                    <h2>Create an Account</h2>
                    <form onSubmit={handleRegister}>
                        <label htmlFor="file">
                            <img src={avatar.url || "./avatar.png"} alt="" />
                            <span>Upload an image</span>
                        </label>
                        <input required type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />
                        <input required type="text" placeholder="Username" name="username" onChange={handleUsernameChange} />
                        <span className={
                            checkingUsername 
                                ? "checking" 
                                : usernameAvailable 
                                    ? "available" 
                                    : "unavailable"
                        }>
                            {checkingUsername 
                                ? "Checking..." 
                                : (usernameAvailable 
                                    ? "Username is available" 
                                    : "Username is taken")}
                        </span>
                        <input required type="email" placeholder="Email" name="email" />
                        <input required type="password" placeholder="Password" name="password" />
                        <button>{loading ? "loading" : "Sign Up"}</button>
                        <span className="or">or</span>
                        <button onClick={() => setIsLogin(true)} className="toggle-button">Login</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Login;
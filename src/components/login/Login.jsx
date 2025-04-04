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
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const Login = () => {
    const [avatar, setAvatar] = useState({ file: null, url: "" });
    const [loading, setLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [usernameAvailable, setUsernameAvailable] = useState(true);
    const [checkingUsername, setCheckingUsername] = useState(false);
    const [passwordRules, setPasswordRules] = useState({
        length: false,
        uppercase: false,
        number: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [usernameInput, setUsernameInput] = useState("");
    const [isEmailValid, setIsEmailValid] = useState(true);
    const [emailInput, setEmailInput] = useState("");
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) navigate();
        });

        return () => unsubscribe();
    }, [navigate]);

    const checkUsernameAvailability = async (username) => {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
    };

    const handleAvatar = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar({ file, url: URL.createObjectURL(file) });
        }
    };

    const handleUsernameChange = async (e) => {
        const username = e.target.value.trim().toLowerCase();
        setUsernameInput(username);

        const isNotOnlyDigits = /\D/.test(username);
        if (username.length < 3 || !isNotOnlyDigits) {
            setUsernameAvailable(false);
            setCheckingUsername(false);
            return;
        }

        setCheckingUsername(true);
        const available = await checkUsernameAvailability(username);
        setUsernameAvailable(available);
        setCheckingUsername(false);
    };

    const handlePasswordChange = (e) => {
        const password = e.target.value;

            setPasswordRules({
                length: password.length >= 8,
                uppercase: /[A-Z]/.test(password),
                number: /\d/.test(password),
            });
    };
    const isValid = passwordRules.length && passwordRules.uppercase && passwordRules.number;
    const isInvalid = !isValid && passwordRules.length;

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        const { username, email, password } = Object.fromEntries(formData);
    
        if (!usernameAvailable) {
            toast.error("Username must be at least 3 characters long and cannot be only numbers.");
            setLoading(false);
            return;
        }
    
        if (!passwordRules.length || !passwordRules.uppercase || !passwordRules.number) {
            toast.error("Password does not meet the requirements.");
            setLoading(false);
            return;
        }
    
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            console.log("User UID:", res.user.uid);
    
            const imgUrl = await upload(avatar.file);
            console.log("Uploaded image URL:", imgUrl);
    
            await setDoc(doc(db, "users", res.user.uid), {
                username,
                email,
                avatar: imgUrl,
                id: res.user.uid,
                blocked: [],
            });
            console.log("User data saved:", { username, email });  // Логируем сохранённые данные без аватара
    
            await setDoc(doc(db, "userchats", res.user.uid), { chats: [] });
    
            toast.success("Account created successfully! You can login now.");
            setIsLogin(true);
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
            toast.success("Logged in successfully!");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailChange = (e) => {
        const email = e.target.value.trim();
        setEmailInput(email);
    
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        setIsEmailValid(email && emailRegex.test(email)); // Проверка только если email не пустой
    };

    return (
        <div className="login">
            {isLogin ? (
                <div className={`item login-item ${isLogin ? "active" : ""}`}>
                    <h2>Welcome back!</h2>
                    <form onSubmit={handleLogin}>
                        <input type="email" placeholder="Email" name="email" required />
                        <div className="password">
                            <input
                                required
                                type={showLoginPassword ? "text" : "password"}
                                placeholder="Password"
                                name="password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowLoginPassword((prev) => !prev)}
                                className="show-password-btn"
                            >
                                {showLoginPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                            </button>
                        </div>
                        <button>{loading ? "Loading..." : "Sign In"}</button>
                        <span className="or">or</span>
                        <button onClick={() => setIsLogin(false)} className="toggle-button">Register</button>
                    </form>
                </div>
            ) : (
                    // TODO: Add a loading spinner when the image is being uploaded
                <div className={`item register-item ${!isLogin ? "active" : ""}`}>
                    <h2>Create an Account</h2>
                    <form onSubmit={handleRegister}>
                            <label htmlFor="file">
                                {/* TODO: Add default image if user don't selected the avatar image */}
                            <img src={avatar.url || "../../../public/avatar.png"} alt="" />
                            <span>Upload an image</span>
                        </label>
                        <input required type="file" id="file" style={{ display: "none" }} onChange={handleAvatar} />

                        <input
                            required
                            type="text"
                            placeholder="Username"
                            name="username"
                            onChange={handleUsernameChange}
                            className={`username-input ${usernameInput && (usernameAvailable ? 'valid' : 'invalid')}`}
                        />
                        <span className={`username-check ${checkingUsername ? 'checking' : usernameAvailable ? 'valid' : 'invalid'}`}>
                            {usernameInput === ""
                                ? "Choose a username"
                                : checkingUsername
                                ? "Checking..."
                                : usernameAvailable
                                ? "Username is available"
                                : "Username is already taken"}
                        </span>
                        
                        <div className="password">
                        <input
                            required
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            name="password"
                            onChange={handlePasswordChange}
                            className={`password-input ${
                                passwordRules.length > 0 ? (isValid ? "valid" : isInvalid ? "invalid" : "") : ""
                            }`}
                        />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="show-password-btn"
                            >
                                {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                            </button>
                        </div>

                        <ul className="password-rules">
                            <li className={passwordRules.length ? "rule-valid" : "rule-invalid"}>At least 8 characters</li>
                            <li className={passwordRules.uppercase ? "rule-valid" : "rule-invalid"}>At least one capital letter</li>
                            <li className={passwordRules.number ? "rule-valid" : "rule-invalid"}>At least one number</li>
                        </ul>

                        <input
                            required
                            type="email"
                            placeholder="Email"
                            name="email"
                            onChange={handleEmailChange}
                            className={`email-input ${
                                emailInput.length > 0 ? (isEmailValid ? "valid" : "invalid") : ""
                            }`}
                        />
                        <button>{loading ? "Loading..." : "Sign Up"}</button>
                        <span className="or">or</span>
                        <button onClick={() => setIsLogin(true)} className="toggle-button">Login</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Login;
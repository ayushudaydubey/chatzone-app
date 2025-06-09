import loginGirl from '../assets/boyregi.jpg';
import React, { useState, useContext } from 'react';
import { chatContext } from '../Context/Context';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Login = () => {
  const { login } = useContext(chatContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.warning("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      const result = await login({ email, password });
      
      if (result.success) {
        toast.success("Login successful!");
        navigate("/chat");
      } else {
        toast.error(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center w-full min-h-screen bg-stone-950">
      {/* Image Section */}
      <div className="w-full md:w-1/2 h-80 sm:h-70 md:h-screen">
        <img
          src={loginGirl}
          alt="login"
          className="w-full h-full object-cover object-top sm:object-top"
        />
      </div>

      {/* Form Section */}
      <div className="w-full md:w-1/2 px-4 sm:px-6 py-6 sm:py-10 flex flex-col items-center justify-center">
        <h1 className="text-lg sm:text-xl text-zinc-300 mb-2">Welcome back!</h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-200 mb-4 text-center">
          Login to ChatZone
        </h2>
        <p className="text-center text-zinc-400 mb-6 px-2 text-sm sm:text-base">
          Connect instantly with your friends, share moments, and chat without limits. <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>Secure. Fast. Effortless.
        </p>

        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <input
            type="email"
            name="email"
            placeholder="Enter your Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 text-blue-200 bg-zinc-800 border border-blue-200 rounded-md mb-4 outline-none text-sm sm:text-base"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 text-blue-200 bg-zinc-800 border border-blue-200 rounded-md mb-4 outline-none text-sm sm:text-base"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-2 border-2 border-blue-200 hover:border-blue-400 hover:text-black rounded-md hover:bg-blue-400 transition disabled:opacity-50 text-sm sm:text-base"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-zinc-300 mt-4 text-xs sm:text-sm text-center">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Register here
          </button>
        </p>

        <p className="text-xs text-zinc-500 mt-2 text-center">
          Your login is protected with end-to-end encryption.
        </p>
      </div>
    </div>
  );
};

export default Login;
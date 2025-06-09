import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import moonGirl from '../assets/login.avif';
import { toast } from 'react-toastify';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mobileNo: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.warning("Please fill all required fields");
      return;
    }

    if (formData.password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    if (!formData.mobileNo == 10) {
      toast.warning("To valid Mobile number 10 digits are required");
      return;
    }
    const firstDigit = mobileNo.charAt(0);
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      toast.error("Valid mobile number is required");
      return;
    }


    if ((!formData.email.includes("@" && "com"))) {
      toast.error("Enter Valid Email");
      return;
    }

    setLoading(true);

    try {
      await axiosInstance.post("/user/register", formData);
      toast.success("Registration successful!");

      setFormData({
        name: '',
        mobileNo: '',
        email: '',
        password: ''
      });

      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-950 overflow-hidden">
      <div className="flex flex-col md:flex-row w-full h-full">

        {/* Image Panel (Visible on all screens) */}
        <div className="w-full md:w-1/2 h-72 md:h-auto">
          <img
            className="w-full h-full object-cover object-center"
            src={moonGirl}
            alt="Login Illustration"
          />
        </div>

        {/* Form Panel */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-8 text-blue-200">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Create Your Account</h1>
          <p className="text-center text-zinc-400 mb-6 text-sm md:text-base">
            Join ChatZone today and start meaningful conversations instantly. <br className="hidden sm:block" />
            It only takes a minute to get started!
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-sm">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 mb-4 bg-zinc-900 border border-blue-200 rounded-md outline-none text-sm"
              required
            />

            <input
              type="text"
              name="mobileNo"
              placeholder="Mobile Number"
              value={formData.mobileNo}
              onChange={handleChange}
              className="w-full px-4 py-3 mb-4 bg-zinc-900 border border-blue-200 rounded-md outline-none text-sm"
            />

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 mb-4 bg-zinc-900 border border-blue-200 rounded-md outline-none text-sm"
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password (min 6 chars)"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 mb-4 bg-zinc-900 border border-blue-200 rounded-md outline-none text-sm"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full border-2 border-blue-200 text-white font-semibold py-2 rounded-md hover:bg-blue-400 hover:text-black hover:border-blue-400 transition disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-4">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-500 cursor-pointer hover:underline"
            >
              Login here
            </button>
          </p>

          <p className="text-xs text-zinc-500 mt-2 flex flex-wrap justify-center gap-2 text-center">
            <span>Fast onboarding</span> • <span>Secure data</span> • <span>Real-time chat</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

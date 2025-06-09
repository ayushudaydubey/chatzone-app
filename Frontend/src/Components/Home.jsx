import React from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/wmremove-transformed.jpeg';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className='flex flex-col md:flex-row w-full min-h-screen overflow-hidden'>

      {/* Left Image Section */}
      <div className='w-full md:w-1/2 h-full md:h-auto '>
        <img
          className='object-cover w-full h-full'
          src={bgImage}
          alt="Chat background"
        />
      </div>

      {/* Right Content Section */}
      <div className='w-full md:w-1/2 px-4 md:px-8 py-6 flex flex-col items-center justify-center text-blue-100'>
        <h1 className='text-center text-2xl md:text-3xl font-semibold mt-4 md:mt-6 mb-4 md:mb-6'>
          Welcome to ChatZone - Chat Made Easy!
        </h1>
        <h2 className='text-base md:text-lg font-thin mb-4 md:mb-6 text-center'>
          Chat in real-time, share files instantly <br /> 
          and see who's online or offline at a glance.
        </h2>
        <p className='text-sm md:text-md font-thin text-center px-2 md:px-6 mb-4 md:mb-6'>
          Stay connected with smooth, fast, and secure messaging. Whether it’s text, images, or documents — send and receive everything in seconds. With live online status and a clean, easy-to-use interface, ChatZone makes chatting effortless.
        </p>

        <button
          className='text-base md:text-xl px-6 py-2 md:p-3 bg-transparent border-2 border-blue-200 rounded-lg text-white hover:bg-blue-200 hover:text-black transition'
          onClick={() => navigate('/register')}
        >
          Create account now...!
        </button>
      </div>
      
    </div>
  );
};

export default Home;

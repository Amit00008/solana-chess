import React, { useState } from "react";
import emailjs from "emailjs-com";
import { FaEnvelope, FaUser, FaCommentDots } from "react-icons/fa";

const Support = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    query: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    emailjs
      .send(
        "YOUR_SERVICE_ID", // Replace with your EmailJS Service ID
        "YOUR_TEMPLATE_ID", // Replace with your EmailJS Template ID
        formData,
        "YOUR_USER_ID" // Replace with your EmailJS User ID
      )
      .then(
        () => {
          setSuccessMessage("Your query has been submitted successfully!");
          setFormData({ name: "", email: "", query: "" });
        },
        () => {
          setErrorMessage("Failed to send your query. Please try again.");
        }
      );
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 ">
      <div className="max-w-md w-full bg-gray-900 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-white mb-6">
          Support - We're Here to Help!
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="flex items-center space-x-2 bg-gray-800 p-3 rounded-lg">
            <FaUser className="text-purple-500 w-5 h-5" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
              required
            />
          </div>

          {/* Email Field */}
          <div className="flex items-center space-x-2 bg-gray-800 p-3 rounded-lg">
            <FaEnvelope className="text-purple-500 w-5 h-5" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Your Email"
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
              required
            />
          </div>

          {/* Query Field */}
          <div className="flex items-start space-x-2 bg-gray-800 p-3 rounded-lg">
            <FaCommentDots className="text-purple-500 w-5 h-5 mt-1" />
            <textarea
              name="query"
              value={formData.query}
              onChange={handleChange}
              placeholder="Your Query"
              rows="4"
              className="w-full bg-transparent text-white placeholder-gray-400 focus:outline-none"
              required
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Submit
          </button>
        </form>

        {/* Success or Error Messages */}
        {successMessage && (
          <p className="text-green-500 text-center mt-4">{successMessage}</p>
        )}
        {errorMessage && (
          <p className="text-red-500 text-center mt-4">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

export default Support;

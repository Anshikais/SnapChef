import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function DishAI() {
  const [dishName, setDishName] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await axios.post('http://localhost:5001/api/ai/dish', { dishName });
      setResult(response.data.text);
    } catch (err) {
      console.error(err);
      setError('Failed to generate recipe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold mb-3">👨‍🍳 Dish AI Chef</h1>
        <p className="text-secondary fs-5">
          Want to make a specific dish? Let me help you with ingredients and step-by-step methods!
        </p>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Spaghetti Carbonara, Butter Chicken, Vegan Brownies..."
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary-custom px-4 text-nowrap rounded"
                  disabled={isLoading || !dishName.trim()}
                >
                  {isLoading ? 'Thinking...' : 'Get Recipe'}
                </button>
              </form>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger text-center">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="text-center my-5 py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-secondary">Writing down the recipe for you...</p>
            </div>
          )}

          {result && !isLoading && (
            <div className="card shadow-sm border-0 animate-fade-in">
              <div className="card-body p-4 p-md-5">
                <div className="markdown-content">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

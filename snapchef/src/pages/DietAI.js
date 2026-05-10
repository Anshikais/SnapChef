import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
export default function DietAI() {
  const [dietType, setDietType] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dietType.trim()) return;
    setIsLoading(true);
    setError('');
    setResult('');
    try {
     const response = await axios.post(
  `${process.env.REACT_APP_API_URL}/api/ai/diet` , { dietType });
      setResult(response.data.text);
    } catch (err) {
      console.error(err);
      setError('Failed to generate recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold mb-3">🥗 Diet AI Chef</h1>
        <p className="text-secondary fs-5">
          Tell me your diet goal, and I'll create 3-5 perfect recipes for you!
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
                  placeholder="e.g., Keto, Vegan, High Protein, Gluten-Free..."
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary-custom px-4 text-nowrap rounded"
                  disabled={isLoading || !dietType.trim()}
                >
                  {isLoading ? 'Thinking...' : 'Generate Recipes'}
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
              <p className="mt-3 text-secondary">Crafting the perfect recipes for you...</p>
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

// src/pages/ExamResults.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Award, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { fetchResults } from '../store/slices/examSlice';
import './ExamResults.css';
const ExamResults = () => {
  const dispatch = useDispatch();
  const { results, isLoading } = useSelector((state) => state.exams);
  
  useEffect(() => {
    dispatch(fetchResults());
  }, [dispatch]);
  
  const calculateAverageScore = () => {
    if (!results?.length) return 0;
    const total = results.reduce((sum, r) => sum + (r.percentage || 0), 0);
    return (total / results.length).toFixed(2);
  };
  
  const getPassCount = () => {
    return results?.filter(r => r.passed).length || 0;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
        <p className="text-gray-600 mt-1">View your examination performance</p>
      </div>
      
      {/* Summary Cards */}
      {results?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Average Score</p>
                <p className="text-3xl font-bold mt-1">{calculateAverageScore()}%</p>
              </div>
              <TrendingUp className="h-10 w-10 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Exams Passed</p>
                <p className="text-3xl font-bold mt-1">{getPassCount()} / {results.length}</p>
              </div>
              <Award className="h-10 w-10 opacity-50" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Exams</p>
                <p className="text-3xl font-bold mt-1">{results.length}</p>
              </div>
              <CheckCircle className="h-10 w-10 opacity-50" />
            </div>
          </div>
        </div>
      )}
      
      {/* Results List */}
      {results?.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Award className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No results available</h3>
          <p className="text-gray-500 mt-1">Complete exams to see your results here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{result.exam_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{result.exam?.course_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{result.score} / {result.exam?.total_marks}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{result.percentage}%</td>
                    <td className="px-6 py-4 text-sm">
                      {result.passed ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Passed
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(result.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResults;
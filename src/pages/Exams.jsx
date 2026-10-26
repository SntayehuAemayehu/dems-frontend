// src/pages/Exams.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Calendar, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { fetchExams } from '../store/slices/examSlice';
import './Exams.css'; 

const Exams = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams, isLoading } = useSelector((state) => state.exams);
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    dispatch(fetchExams());
  }, [dispatch]);
  
  const now = new Date();
  const upcomingExams = exams?.filter(exam => new Date(exam.start_time) > now) || [];
  const pastExams = exams?.filter(exam => new Date(exam.end_time) < now) || [];
  const ongoingExams = exams?.filter(exam => 
    new Date(exam.start_time) <= now && new Date(exam.end_time) >= now
  ) || [];
  
  const getExamStatus = (exam) => {
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    
    if (now < start) {
      return { label: 'Upcoming', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else if (now >= start && now <= end) {
      return { label: 'Ongoing', color: 'text-green-600', bg: 'bg-green-100' };
    } else {
      return { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
        <p className="text-gray-600 mt-1">View and take your online examinations</p>
      </div>
      
      {/* Ongoing Exams */}
      {ongoingExams.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-green-600 mr-2" />
            Ongoing Exams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ongoingExams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <div 
                  key={exam.id} 
                  onClick={() => navigate(`/exams/${exam.id}/details`)}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 hover:text-green-600 transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{exam.course_title}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{exam.duration_minutes} minutes</span>
                        <Calendar className="h-4 w-4 ml-3 mr-1" />
                        <span>{new Date(exam.start_time).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/exams/${exam.id}/details`); }}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" /> View Details
                    </button>
                    <Link
                      to={`/exams/${exam.id}/take`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Take Exam
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingExams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <div 
                  key={exam.id} 
                  onClick={() => navigate(`/exams/${exam.id}/details`)}
                  className="bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 hover:text-green-600 transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{exam.course_title}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{exam.duration_minutes} minutes</span>
                        <Calendar className="h-4 w-4 ml-3 mr-1" />
                        <span>{new Date(exam.start_time).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/exams/${exam.id}/details`); }}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" /> View Details
                    </button>
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm cursor-not-allowed"
                    >
                      Not Available Yet
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Past Exams */}
      {pastExams.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Past Exams</h2>
          <div className="space-y-3">
            {pastExams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <div 
                  key={exam.id} 
                  onClick={() => navigate(`/exams/${exam.id}/details`)}
                  className="bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900 hover:text-green-600 transition-colors">
                        {exam.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{exam.course_title}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(exam.start_time).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {exams?.length === 0 && (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No exams available</h3>
          <p className="text-gray-500 mt-1">Check back later for upcoming examinations.</p>
        </div>
      )}
    </div>
  );
};

export default Exams;
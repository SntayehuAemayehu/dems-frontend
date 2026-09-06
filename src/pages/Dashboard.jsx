// frontend/src/pages/Dashboard.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, FileText, Award, Clock, CheckCircle } from 'lucide-react';
import { fetchCourses } from '../store/slices/courseSlice';
import { fetchExams } from '../store/slices/examSlice';
import './Dashboard.css';
const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { courses = [], isLoading: coursesLoading = false } = useSelector((state) => state.courses || {});
  const { exams = [] } = useSelector((state) => state.exams || {});
  
  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchExams());
  }, [dispatch]);
  
  // Safety checks - ensure courses and exams are arrays
  const safeCourses = Array.isArray(courses) ? courses : [];
  const safeExams = Array.isArray(exams) ? exams : [];
  
  const upcomingExams = safeExams.filter((exam) => exam && new Date(exam.start_time) > new Date()) || [];
  const enrolledCourses = safeCourses.filter((course) => course && course.is_enrolled) || [];
  
  const stats = [
    { name: 'Enrolled Courses', value: enrolledCourses.length, icon: BookOpen, color: 'bg-blue-500' },
    { name: 'Upcoming Exams', value: upcomingExams.length, icon: Clock, color: 'bg-yellow-500' },
    { name: 'Completed Exams', value: safeExams.filter((e) => e && e.completed).length || 0, icon: CheckCircle, color: 'bg-green-500' },
    { name: 'CGPA', value: user?.student_profile?.cgpa || '0.00', icon: Award, color: 'bg-purple-500' },
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.full_name || 'Student'}!</h1>
        <p className="mt-2 opacity-90">Continue your learning journey with us.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Current Courses */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
          <Link to="/courses" className="text-primary-600 hover:text-primary-700 text-sm">
            View All
          </Link>
        </div>
        
        {coursesLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : enrolledCourses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="text-primary-600 hover:text-primary-700 mt-2 inline-block">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.slice(0, 3).map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`}>
                <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-gray-900">{course.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{course.course_code}</p>
                  <p className="text-sm text-gray-600 mt-2">Instructor: {course.instructor_name}</p>
                  <div className="mt-3 flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    In Progress
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Upcoming Exams */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Exams</h2>
          <Link to="/exams" className="text-primary-600 hover:text-primary-700 text-sm">
            View All
          </Link>
        </div>
        
        {upcomingExams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming exams scheduled.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingExams.slice(0, 3).map((exam) => (
              <div key={exam.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                  <p className="text-sm text-gray-500">{exam.course_title}</p>
                  <p className="text-sm text-gray-500">
                    Date: {new Date(exam.start_time).toLocaleDateString()}
                  </p>
                </div>
                <Link
                  to={`/exams/${exam.id}/take`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Start
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
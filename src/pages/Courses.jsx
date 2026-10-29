// src/pages/Courses.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Search, Filter, BookOpen, Users, Clock } from 'lucide-react';
import { fetchCourses, enrollCourse, fetchEnrollments } from '../store/slices/courseSlice';
import toast from 'react-hot-toast';
const Courses = () => {
  const dispatch = useDispatch();
  const { courses, enrollments, isLoading } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [enrolling, setEnrolling] = useState(null);
  
  useEffect(() => {
    dispatch(fetchCourses());
    if (user?.role === 'STUDENT') {
      dispatch(fetchEnrollments());
    }
  }, [dispatch, user]);
  
  const enrolledCourseIds = enrollments?.map(e => e.course) || [];
  
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.course_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSemester = !selectedSemester || course.semester === selectedSemester;
    return matchesSearch && matchesSemester;
  }) || [];
  
  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await dispatch(enrollCourse(courseId)).unwrap();
      toast.success('Successfully enrolled in course!');
      dispatch(fetchEnrollments());
    } catch (error) {
      toast.error(error.message || 'Failed to enroll');
    } finally {
      setEnrolling(null);
    }
  };
  
  const semesters = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-600 mt-1">Browse and enroll in available courses</p>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses by title or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Semesters</option>
              {semesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Courses Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.includes(course.id);
            const isFull = course.enrolled_count >= course.capacity;
            
            return (
              <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {course.course_code}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2">{course.title}</h3>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">{course.description}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{course.enrolled_count || 0} / {course.capacity} students</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Semester {course.semester}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>{course.credit_hours} Credit Hours</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex space-x-3">
                    <Link
                      to={`/courses/${course.id}`}
                      className="flex-1 text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50"
                    >
                      View Details
                    </Link>
                    
                    {user?.role === 'STUDENT' && (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={isEnrolled || isFull || enrolling === course.id}
                        className={`flex-1 px-4 py-2 rounded-lg ${
                          isEnrolled
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : isFull
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        {enrolling === course.id ? 'Enrolling...' : isEnrolled ? 'Enrolled' : isFull ? 'Full' : 'Enroll'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Courses;
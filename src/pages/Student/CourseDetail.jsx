import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Download, Video, FileText, Calendar, Users, BookOpen, ChevronLeft, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCourseDetail } from '../../store/slices/courseSlice';
import api from '../../api';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { selectedCourse: course, isLoading } = useSelector((state) => state.courses);
  const { user } = useSelector((state) => state.auth);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('materials');

  useEffect(() => {
    dispatch(fetchCourseDetail(id));
    fetchMaterials();
    fetchAssignments();
  }, [id]);

  const fetchMaterials = async () => {
    try {
      const response = await api.get(`/courses/${id}/materials/`);
      setMaterials(response.data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/courses/${id}/assignments/`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  const getMaterialIcon = (type) => {
    switch (type) {
      case 'VIDEO': return <Video size={20} />;
      case 'PDF': return <FileText size={20} />;
      default: return <FileText size={20} />;
    }
  };

  if (isLoading || !course) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="course-detail animate-fade-in">
      <Link to="/courses" className="back-button">
        <ChevronLeft size={20} />
        Back to Courses
      </Link>

      <div className="course-header">
        <div className="course-header-content">
          <div>
            <span className="course-code">{course.course_code}</span>
            <h1 className="course-title">{course.title}</h1>
            <p className="course-instructor">Instructor: {course.instructor_name}</p>
            <div className="course-meta">
              <div className="course-meta-item">
                <BookOpen size={16} />
                <span>{course.credit_hours} Credits</span>
              </div>
              <div className="course-meta-item">
                <Users size={16} />
                <span>{course.enrolled_count || 0} Students</span>
              </div>
              <div className="course-meta-item">
                <Calendar size={16} />
                <span>Semester {course.semester}</span>
              </div>
            </div>
          </div>
          {user?.role === 'TEACHER' && (
            <Link to={`/live-class/${course.id}`} className="live-class-button">
              <Play size={18} />
              Start Live Class
            </Link>
          )}
        </div>
      </div>

      <div className="course-description">
        <h2>Description</h2>
        <p>{course.description || 'No description provided.'}</p>
      </div>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            onClick={() => setActiveTab('materials')}
            className={`tab-button ${activeTab === 'materials' ? 'active' : ''}`}
          >
            Course Materials
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`}
          >
            Assignments
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'materials' && (
            materials.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} className="empty-icon" />
                <p>No course materials uploaded yet.</p>
              </div>
            ) : (
              <div className="materials-list">
                {materials.map((material) => (
                  <div key={material.id} className="material-item">
                    <div className="material-info">
                      {getMaterialIcon(material.material_type)}
                      <div>
                        <p className="material-title">{material.title}</p>
                        <p className="material-description">{material.description}</p>
                      </div>
                    </div>
                    {material.file && (
                      <a href={material.file} download className="material-download">
                        <Download size={20} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'assignments' && (
            assignments.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} className="empty-icon" />
                <p>No assignments posted yet.</p>
              </div>
            ) : (
              <div className="assignments-list">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="assignment-item">
                    <div className="assignment-header">
                      <div>
                        <h3 className="assignment-title">{assignment.title}</h3>
                        <p className="assignment-description">{assignment.description}</p>
                        <p className="assignment-due-date">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                        <p className="assignment-marks">Total Marks: {assignment.total_marks}</p>
                      </div>
                      {assignment.attachment && (
                        <a href={assignment.attachment} download className="assignment-attachment">
                          <Download size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
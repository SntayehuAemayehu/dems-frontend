export const normalizeResultList = (data) =>
  Array.isArray(data) ? data
    : Array.isArray(data?.results) ? data.results
    : Array.isArray(data?.data) ? data.data
    : [];

export const letterGrade = (total) => {
  const marks = Number(total) || 0;
  if (marks >= 90) return { letter: 'A+', color: '#16a34a' };
  if (marks >= 85) return { letter: 'A', color: '#16a34a' };
  if (marks >= 80) return { letter: 'A-', color: '#16a34a' };
  if (marks >= 75) return { letter: 'B+', color: '#2563eb' };
  if (marks >= 70) return { letter: 'B', color: '#2563eb' };
  if (marks >= 65) return { letter: 'B-', color: '#2563eb' };
  if (marks >= 60) return { letter: 'C+', color: '#d97706' };
  if (marks >= 55) return { letter: 'C', color: '#d97706' };
  if (marks >= 50) return { letter: 'C-', color: '#d97706' };
  if (marks >= 45) return { letter: 'D', color: '#dc2626' };
  return { letter: 'F', color: '#dc2626' };
};

export const buildCourseGrades = (exams, assignments) => {
  const courses = {};

  const ensureCourse = (courseId, code, title) => {
    const key = courseId != null ? `id:${courseId}` : `code:${code}`;
    if (!courses[key]) {
      courses[key] = {
        course_id: courseId,
        course_code: code,
        course_title: title || '—',
        quiz: 0,
        mid: 0,
        assignment: 0,
        final: 0,
        total: 0,
      };
    }
    return courses[key];
  };

  exams.forEach((result) => {
    const code = result.course_code || result.exam?.course_code
      || result.exam?.course_title || result.course_title || 'Unknown';
    const title = result.exam?.course_title || result.course_title || '—';
    const courseId = result.course_id ?? result.exam?.course_id;
    const course = ensureCourse(courseId, code, title);
    const obtained = Number(result.score ?? 0);
    const type = (result.exam_type || result.exam?.exam_type || '').toUpperCase();

    if (type === 'QUIZ') course.quiz += obtained;
    else if (type === 'MID' || type === 'MIDTERM') course.mid += obtained;
    else if (type === 'FINAL') course.final += obtained;

    course.total += obtained;
  });

  assignments.forEach((result) => {
    const code = result.course_code || result.course_title || 'Unknown';
    const course = ensureCourse(result.course_id, code, result.course_title || '—');
    const obtained = Number(result.marks_obtained ?? 0);
    course.assignment += obtained;
    course.total += obtained;
  });

  return Object.values(courses).map((course) => ({
    ...course,
    ...letterGrade(course.total),
  }));
};

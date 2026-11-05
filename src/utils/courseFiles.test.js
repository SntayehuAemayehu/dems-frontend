jest.mock('../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  getMediaUrl: (file) => `http://localhost:8000${file}`,
}));

import api from '../api/api';
import {
  downloadCourseFile,
  getCourseFileExtension,
  getCourseFileName,
  isOfficeDocument,
  openCourseFile,
} from './courseFiles';

describe('course file names', () => {
  it('preserves the uploaded extension when a preferred name is provided', () => {
    expect(getCourseFileName('/media/course-files/week-1.pdf?download=1', 'Week 1 notes')).toBe('Week 1 notes.pdf');
  });

  it('keeps the original filename when no preferred name is given', () => {
    expect(getCourseFileName('/media/course-files/lecture%20slides.pptx')).toBe('lecture slides.pptx');
  });

  it('detects Word and PowerPoint formats for in-app preview', () => {
    expect(getCourseFileExtension('/media/course-files/notes.docx?download=1')).toBe('docx');
    expect(isOfficeDocument('/media/course-files/notes.docx')).toBe(true);
    expect(isOfficeDocument('/media/course-files/slides.pptx')).toBe(true);
    expect(isOfficeDocument('/media/course-files/notes.pdf')).toBe(false);
  });

  it('opens the original file in a new tab', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);

    expect(openCourseFile('/media/course-files/lecture.pdf')).toBe(true);
    expect(open).toHaveBeenCalledWith(
      'http://localhost:8000/media/course-files/lecture.pdf',
      '_blank',
      'noopener,noreferrer'
    );
    open.mockRestore();
  });

  it('downloads the file response using its original extension', async () => {
    const blob = new Blob(['file contents']);
    api.get.mockResolvedValue({ data: blob });
    const oldCreateObjectURL = URL.createObjectURL;
    const oldRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => 'blob:course-file');
    URL.revokeObjectURL = jest.fn();
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    jest.useFakeTimers();

    await downloadCourseFile('/media/course-files/week-1.pdf', 'Week 1 notes');
    jest.runOnlyPendingTimers();

    expect(api.get).toHaveBeenCalledWith(
      'http://localhost:8000/media/course-files/week-1.pdf',
      { responseType: 'blob' }
    );
    expect(click).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:course-file');

    click.mockRestore();
    jest.useRealTimers();
    URL.createObjectURL = oldCreateObjectURL;
    URL.revokeObjectURL = oldRevokeObjectURL;
  });
});

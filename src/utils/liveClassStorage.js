const ATTENDANCE_KEY = 'dems_live_class_attendance';
const RECORDINGS_KEY = 'dems_live_class_recordings';
const DATABASE_NAME = 'dems-live-class-media';
const STORE_NAME = 'recordings';

const readLocalList = (key) => {
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const value = JSON.parse(stored);
    if (!Array.isArray(value)) {
        throw new Error(`Stored live class data for ${key} is invalid.`);
    }
    return value;
};

export const getAttendance = () => readLocalList(ATTENDANCE_KEY);

export const saveAttendanceSession = (session) => {
    const sessions = readLocalList(ATTENDANCE_KEY);
    const index = sessions.findIndex((item) => item.id === session.id);
    if (index === -1) sessions.push(session);
    else sessions[index] = session;
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(sessions));
    return sessions;
};

export const getRecordingMetadata = () => readLocalList(RECORDINGS_KEY);

const openRecordingDatabase = () => new Promise((resolve, reject) => {
    if (!window.indexedDB) {
        reject(new Error('This browser does not support local video storage.'));
        return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE_NAME)) {
            request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local video storage.'));
});

export const saveClassRecording = async (recording) => {
    const database = await openRecordingDatabase();
    try {
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readwrite');
            transaction.objectStore(STORE_NAME).put(recording);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error || new Error('Could not save the recording.'));
            transaction.onabort = () => reject(transaction.error || new Error('Saving the recording was cancelled.'));
        });
        const metadata = getRecordingMetadata();
        metadata.unshift({
            id: recording.id,
            courseId: recording.courseId,
            courseName: recording.courseName,
            createdAt: recording.createdAt,
            size: recording.blob.size
        });
        localStorage.setItem(RECORDINGS_KEY, JSON.stringify(metadata));
    } finally {
        database.close();
    }
};

export const getClassRecording = async (id) => {
    const database = await openRecordingDatabase();
    try {
        return await new Promise((resolve, reject) => {
            const request = database.transaction(STORE_NAME, 'readonly')
                .objectStore(STORE_NAME).get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error('Could not read the recording.'));
        });
    } finally {
        database.close();
    }
};

export const deleteClassRecording = async (id) => {
    const database = await openRecordingDatabase();
    try {
        await new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readwrite');
            transaction.objectStore(STORE_NAME).delete(id);
            transaction.oncomplete = resolve;
            transaction.onerror = () => reject(transaction.error || new Error('Could not delete the recording.'));
            transaction.onabort = () => reject(transaction.error || new Error('Deleting the recording was cancelled.'));
        });

        const metadata = getRecordingMetadata().filter((recording) => recording.id !== id);
        localStorage.setItem(RECORDINGS_KEY, JSON.stringify(metadata));
    } finally {
        database.close();
    }
};

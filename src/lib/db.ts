
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'src/database');
const PROFILE_PATH = path.join(process.cwd(), 'public/profile');
const UPLOADS_PATH = path.join(process.cwd(), 'public/uploads');

export async function ensureDbStructure() {
  try {
    // Ensure directories exist
    await fs.mkdir(DB_PATH, { recursive: true });
    await fs.mkdir(PROFILE_PATH, { recursive: true });
    await fs.mkdir(UPLOADS_PATH, { recursive: true });
    await fs.mkdir(path.join(UPLOADS_PATH, 'chat'), { recursive: true });
    
    const files = [
      'users.json', 
      'subjects.json', 
      'enrollments.json', 
      'attendance.json', 
      'labs.json', 
      'pcs.json', 
      'labrequests.json', 
      'auditlog.json', 
      'settings.json', 
      'books.json', 
      'libraryborrowings.json', 
      'rooms.json', 
      'reservations.json', 
      'borrowrequests.json', 
      'classworks.json', 
      'submissions.json',
      'conversations.json',
      'chatmessages.json',
      'termenrollments.json',
      'terms.json',
      'academicrecords.json',
      'gradingweights.json',
      'examscores.json',
      'materials.json'
    ];
    for (const file of files) {
      const filePath = path.join(DB_PATH, file);
      try {
        await fs.access(filePath);
      } catch {
        // Create empty array/object if file doesn't exist
        const initialContent = file === 'settings.json' ? '{}' : '[]';
        await fs.writeFile(filePath, initialContent);
      }
    }
  } catch (error) {
    console.error('Error ensuring DB structure:', error);
  }
}

export async function readDb(file: string) {
  await ensureDbStructure();
  const filePath = path.join(DB_PATH, `${file}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
     if (file === 'settings') return {};
     return [];
  }
}

export async function writeDb(file: string, data: any) {
  await ensureDbStructure();
  const filePath = path.join(DB_PATH, `${file}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function saveProfileImage(userId: string, base64Data: string) {
  await ensureDbStructure();
  
  // Extract file extension and actual base64 string
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;

  const type = matches[1];
  const extension = type.split('/')[1] === 'jpeg' ? 'jpg' : type.split('/')[1];
  const buffer = Buffer.from(matches[2], 'base64');
  
  const fileName = `${userId}.${extension}`;
  const filePath = path.join(PROFILE_PATH, fileName);

  // Remove any existing profile pics for this user (handle different extensions)
  try {
    const files = await fs.readdir(PROFILE_PATH);
    for (const file of files) {
      if (file.startsWith(`${userId}.`)) {
        await fs.unlink(path.join(PROFILE_PATH, file));
      }
    }
  } catch (e) {
    // Directory might be empty, that's fine
  }

  // Write new file
  await fs.writeFile(filePath, buffer);
  
  // Return the public URL
  return `/profile/${fileName}?v=${Date.now()}`;
}


export async function saveClassworkFile(classworkId: string, fileData: string, fileName: string): Promise<string | null> {
  await ensureDbStructure();
  
  const matches = fileData.match(/^data:.+;base64,(.+)$/);
  if (!matches || matches.length !== 2) return null;

  const buffer = Buffer.from(matches[1], 'base64');
  
  const uploadDir = path.join(UPLOADS_PATH, 'classwork', classworkId);
  await fs.mkdir(uploadDir, { recursive: true });
  
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = path.join(uploadDir, safeFileName);
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/classwork/${classworkId}/${safeFileName}`;
}

export async function saveSubmissionFile(submissionId: string, fileData: string, fileName: string): Promise<string | null> {
  await ensureDbStructure();
  
  const matches = fileData.match(/^data:.+;base64,(.+)$/);
  if (!matches || matches.length !== 2) return null;

  const buffer = Buffer.from(matches[1], 'base64');
  
  const uploadDir = path.join(UPLOADS_PATH, 'submissions', submissionId);
  await fs.mkdir(uploadDir, { recursive: true });
  
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = path.join(uploadDir, safeFileName);
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/submissions/${submissionId}/${safeFileName}`;
}

export async function saveChatFile(fileName: string, base64Data: string): Promise<string | null> {
  await ensureDbStructure();
  const matches = base64Data.match(/^data:.+;base64,(.+)$/);
  if (!matches) return null;
  const buffer = Buffer.from(matches[1], 'base64');
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
  const filePath = path.join(UPLOADS_PATH, 'chat', safeName);
  await fs.writeFile(filePath, buffer);
  return `/uploads/chat/${safeName}`;
}

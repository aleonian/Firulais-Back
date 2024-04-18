import fs from 'fs';
import path from 'path';

export function wait(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

export function createError(name, errorMessage) {
  const anError = new Error();
  anError.name = name;
  anError.message = errorMessage;
  return anError;
}

export async function deleteDirectoryContents(directoryPath) {
    try {
        // Read the contents of the directory
        const files = await fs.promises.readdir(directoryPath);

        // Loop through each file in the directory
        for (const file of files) {
            // Get the full path of the file
            const filePath = path.join(directoryPath, file);
            
            // Check if the file is a directory
            const stats = await fs.promises.stat(filePath);
            if (stats.isDirectory()) {
                // Recursively delete the contents of subdirectories
                await deleteDirectoryContents(filePath);
            } else {
                // Delete the file
                await fs.promises.unlink(filePath);
            }
        }
    } catch (error) {
        console.error('Error deleting directory contents:', error);
    }
}
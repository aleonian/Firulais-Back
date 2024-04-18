import express from 'express';
export const resultsRouter = express.Router();
import mongoose from 'mongoose';
import { Result } from '../models/result.mjs';
import * as commonTools from '../utils/common.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { deleteDirectoryContents} from '../utils/common.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

resultsRouter.get('/', async (request, response, next) => {
  try {
    const results = await Result.find({}).populate('testId');
    response.json(results);
  } catch (error) {
    next(error);
  }
});

resultsRouter.delete('/:id', async (request, response, next) => {
  const isValidObjectId = mongoose.Types.ObjectId.isValid(request.params.id);

  let objectId;

  if (isValidObjectId) {
    objectId = new mongoose.Types.ObjectId(request.params.id);
  } else {
    // eslint-disable-next-line no-console
    console.error('Invalid ObjectId format');
    return next(commonTools.createError('InvalidObjectId', 'Invalid ObjectId format'));
  }

  try {

    // first delete the files (snapshots or reports) for this result
    const toBeDeletedDocument = await Result.findById(objectId);

    if (toBeDeletedDocument.outcome.files) {
      toBeDeletedDocument.outcome.files.forEach(file => {
        if (file.endsWith("html")) {
          fs.unlinkSync(path.resolve(__dirname, "../public/reports/" + file));
        }
        else if (file.endsWith("png")) {
          fs.unlinkSync(path.resolve(__dirname, "../public/snapshots/" + file));
        }
      })
    }

    const deletedDocument = await Result.findByIdAndDelete(objectId);

    if (deletedDocument) {
      // eslint-disable-next-line no-console
      console.log('Document deleted successfully:', deletedDocument);
    } else {
      // eslint-disable-next-line no-console
      console.log('Document not found');
      throw commonTools.createError('DocumentNotFoundError', 'Could not find that doc, doc.');
    }
  } catch (error) {
    return next(error);
    // return response.status(401).send(`Error deleting document:${error.message}`);
  }

  return response.status(204).json('document deleted successfully!');
});

resultsRouter.get('/erase/all', async (request, response, next) => {
  try {
    const snapshotsDirPath = path.resolve(__dirname, "../public/snapshots/");
    const reportsDirPath = path.resolve(__dirname, "../public/reports/");

    const allResults = await Result.deleteMany({});

    if (!allResults) {
      throw commonTools.createError('DbError', 'Trouble deleting all results from db');
    }


    deleteDirectoryContents(snapshotsDirPath)
      .then(() => {
        console.log('Snapshots directory contents deleted successfully.');
      })
      .catch((error) => {
        console.error('Error deleting Snapshots directory contents:', error);
      });

    deleteDirectoryContents(reportsDirPath)
      .then(() => {
        console.log('Reports directory contents deleted successfully.');
      })
      .catch((error) => {
        console.error('Error deleting reports directory contents:', error);
      });

    // eslint-disable-next-line no-unreachable-loop
    return response.status(200).send('All results deleted!');
  } catch (error) {
    return (next(error));
  }
});
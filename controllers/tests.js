const testRouter = require('express').Router();

const mongoose = require('mongoose');

// eslint-disable-next-line import/no-extraneous-dependencies
const jwt = require('jsonwebtoken');

const Test = require('../models/test');

testRouter.get('/', async (request, response) => {
  const tests = await Test.find({});
  response.json(tests);
});

testRouter.post('/', async (request, response, next) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(request.token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'token invalid' });
    }
  } catch (error) {
    console.log('error->', error);
    return next(error);
  }

  //   const user = await User.findById(decodedToken.id);

  const newTest = request.body;

  const test = new Test(newTest);

  let savedTest;
  try {
    savedTest = await test.save();
    return response.status(201).json(savedTest);
  } catch (error) {
    return (next(error));
  }
});

testRouter.delete('/:id', async (request, response) => {
  console.log('request.params.id->', request.params.id);

  const isValidObjectId = mongoose.Types.ObjectId.isValid(request.params.id);

  let objectId;

  if (isValidObjectId) {
    objectId = new mongoose.Types.ObjectId(request.params.id);
  } else {
    // eslint-disable-next-line no-console
    console.error('Invalid ObjectId format');
    return response.status(400).end();
  }

  try {
    const deletedDocument = await Test.findByIdAndDelete(objectId);

    if (deletedDocument) {
      // eslint-disable-next-line no-console
      console.log('Document deleted successfully:', deletedDocument);
    } else {
      // eslint-disable-next-line no-console
      console.log('Document not found');
    }
  } catch (error) {
    return response.status(401).send(`Error deleting document:${error.message}`);
  }

  return response.status(204).json('document deleted successfully!');
});

// testRouter.delete('/id:', async (request, response, next) => {
//   let decodedToken;
//   try {
//     decodedToken = jwt.verify(request.token, process.env.SECRET);
//     if (!decodedToken.id) {
//       return response.status(401).json({ error: 'token invalid' });
//     }
//   } catch (error) {
//     console.log('error->', error);
//     return next(error);
//   }

//   //   const isValidObjectId = mongoose.Types.ObjectId.isValid(request.params.id);

//   //   let objectId;

//   //   if (isValidObjectId) {
//   //     objectId = new mongoose.Types.ObjectId(request.params.id);
//   //   } else {
//   //     // eslint-disable-next-line no-console
//   //     console.error('Invalid ObjectId format');
//   //     return response.status(400).end();
//   //   }

//   //   try {
//   //     const desiredTest = await Test.findById(objectId);

//   //     if (desiredTest.user.toString() === request.userId) {
//   //       const deletedDocument = await Test.findByIdAndDelete(objectId);

//   //       if (deletedDocument) {
//   //         // eslint-disable-next-line no-console
//   //         console.log('Document deleted successfully:', deletedDocument);
//   //       } else {
//   //         // eslint-disable-next-line no-console
//   //         console.log('Document not found');
//   //       }
//   //     } else {
//   //       return response.status(401).json({ error: 'Documents can only be deleted by owners.' });
//   //     }
//   //   } catch (error) {
//   //     return response.status(401).send(`Error deleting document:${error.message}`);
//   //   }

//   return response.status(204).json('document deleted successfully!');
// });

// testRouter.put('/:id', async (request, response) => {
//   const { body } = request.body;

//   const blogPost = {
//     title: body.title,
//     author: body.author,
//     url: body.url,
//     likes: body.likes,
//   };

//   try {
//     const updatedBlogpost = await Test.findByIdAndUpdate(
//       request.params.id,
//       blogPost,
//       { new: true },
//     );
//     response.json(updatedBlogpost);
//   } catch (error) {
//     response.status(400).json(error);
//     // eslint-disable-next-line no-console
//     console.log(error);
//   }
// });

module.exports = testRouter;

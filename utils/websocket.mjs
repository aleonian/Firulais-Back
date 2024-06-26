/* eslint-disable import/prefer-default-export */
const frontEndConnections = [];

export const processIncomingRequest = (socket) => {
  console.log('Client connected');

  frontEndConnections.push(socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
};

export const emit = (data) => {
  // Simulate task status changes
  frontEndConnections.forEach((frontEndConnection) => {
    frontEndConnection.emit('taskStatus', data);
  });
};

// module.exports = {
//   processIncomingRequest, emit,
// };

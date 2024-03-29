function wait(ms) {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
}

function createError(name, errorMessage) {
  const anError = new Error();
  anError.name = name;
  anError.message = errorMessage;
  return anError;
}

module.exports = { wait, createError };

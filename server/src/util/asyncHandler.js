/** Express 4: forward rejected promises from async route handlers to error middleware */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

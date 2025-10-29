import asyncHandler from 'express-async-handler';

export const healthCheck = asyncHandler(async (req, res) => {
  res.status(200).json({
    statusCode: 200,
    data: 'OK',
    message: 'Health check passed',
    success: 200
  })
})

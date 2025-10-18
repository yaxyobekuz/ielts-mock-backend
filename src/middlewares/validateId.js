const mongoose = require("mongoose");

// Helpers
const { upperFirstLetter } = require("../utils/helpers");

/**
 * Middleware to validate MongoDB ObjectId parameters
 * @param {string|string[]} params - Single param name or array of param names to validate
 * @returns {Function} Express middleware function
 */
const validateId = (params) => {
  return (req, res, next) => {
    // Convert single param to array for uniform processing
    const paramArray = Array.isArray(params) ? params : [params];

    // Validate each parameter
    for (const param of paramArray) {
      const id = req.params[param];

      // Check if parameter exists
      if (!id) {
        return res.status(400).json({
          code: "missingParameter",
          message: `${param} topilmadi`,
        });
      }

      // Validate if it's a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          code: "invalidId",
          message: `${upperFirstLetter(param)} noto'g'ri kiritildi`,
        });
      }
    }

    next();
  };
};

module.exports = validateId;

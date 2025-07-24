const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const schemas = {
  // User registration/signup
  userSignup: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    nickname: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Nickname must be at least 1 character long',
      'string.max': 'Nickname must be less than 50 characters',
      'any.required': 'Nickname is required'
    }),
    cycle_stage: Joi.string().valid(
      'considering', 'ivf_prep', 'stimulation', 'retrieval', 
      'transfer', 'tww', 'pregnant', 'between_cycles'
    ).required().messages({
      'any.only': 'Please select a valid cycle stage',
      'any.required': 'Cycle stage is required'
    }),
    primary_need: Joi.string().valid(
      'emotional_support', 'medication_guidance', 'financial_planning', 
      'procedure_info', 'community'
    ).required().messages({
      'any.only': 'Please select a valid primary need',
      'any.required': 'Primary need is required'
    }),
    confidence_meds: Joi.number().integer().min(1).max(10).default(5).messages({
      'number.base': 'Confidence must be a number',
      'number.integer': 'Confidence must be a whole number',
      'number.min': 'Confidence must be at least 1',
      'number.max': 'Confidence must be at most 10'
    }),
    confidence_costs: Joi.number().integer().min(1).max(10).default(5).messages({
      'number.base': 'Confidence must be a number',
      'number.integer': 'Confidence must be a whole number',
      'number.min': 'Confidence must be at least 1',
      'number.max': 'Confidence must be at most 10'
    }),
    confidence_overall: Joi.number().integer().min(1).max(10).default(5).messages({
      'number.base': 'Confidence must be a number',
      'number.integer': 'Confidence must be a whole number',
      'number.min': 'Confidence must be at least 1',
      'number.max': 'Confidence must be at most 10'
    }),
    email_opt_in: Joi.boolean().default(true).messages({
      'boolean.base': 'Email opt-in must be true or false'
    }),
    top_concern: Joi.string().max(500).optional().messages({
      'string.max': 'Top concern must be less than 500 characters'
    }),
    timezone: Joi.string().optional().messages({
      'string.base': 'Timezone must be a string'
    })
  }),

  // User login
  userLogin: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(1).required().messages({
      'any.required': 'Password is required'
    })
  }),

  // Daily check-in
  dailyCheckin: Joi.object({
    mood_today: Joi.string().required().messages({
      'any.required': 'Mood selection is required'
    }),
    confidence_today: Joi.number().integer().min(1).max(10).required().messages({
      'number.base': 'Confidence must be a number',
      'number.integer': 'Confidence must be a whole number',
      'number.min': 'Confidence must be at least 1',
      'number.max': 'Confidence must be at most 10',
      'any.required': 'Confidence level is required'
    }),
    top_concern_today: Joi.string().max(500).optional().messages({
      'string.max': 'Top concern must be less than 500 characters'
    }),
    energy_level_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Energy level must be a number',
      'number.integer': 'Energy level must be a whole number',
      'number.min': 'Energy level must be at least 1',
      'number.max': 'Energy level must be at most 10'
    }),
    sleep_quality_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Sleep quality must be a number',
      'number.integer': 'Sleep quality must be a whole number',
      'number.min': 'Sleep quality must be at least 1',
      'number.max': 'Sleep quality must be at most 10'
    }),
    stress_level_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Stress level must be a number',
      'number.integer': 'Stress level must be a whole number',
      'number.min': 'Stress level must be at least 1',
      'number.max': 'Stress level must be at most 10'
    }),
    financial_stress_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Financial stress must be a number',
      'number.integer': 'Financial stress must be a whole number',
      'number.min': 'Financial stress must be at least 1',
      'number.max': 'Financial stress must be at most 10'
    }),
    financial_concern_today: Joi.string().max(500).optional().messages({
      'string.max': 'Financial concern must be less than 500 characters'
    }),
    journey_readiness_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Journey readiness must be a number',
      'number.integer': 'Journey readiness must be a whole number',
      'number.min': 'Journey readiness must be at least 1',
      'number.max': 'Journey readiness must be at most 10'
    })
  }),

  // Enhanced daily check-in
  enhancedDailyCheckin: Joi.object({
    mood_today: Joi.string().required().messages({
      'any.required': 'Mood selection is required'
    }),
    confidence_today: Joi.number().integer().min(1).max(10).required().messages({
      'number.base': 'Confidence must be a number',
      'number.integer': 'Confidence must be a whole number',
      'number.min': 'Confidence must be at least 1',
      'number.max': 'Confidence must be at most 10',
      'any.required': 'Confidence level is required'
    }),
    top_concern_today: Joi.string().max(500).optional().messages({
      'string.max': 'Top concern must be less than 500 characters'
    }),
    energy_level_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Energy level must be a number',
      'number.integer': 'Energy level must be a whole number',
      'number.min': 'Energy level must be at least 1',
      'number.max': 'Energy level must be at most 10'
    }),
    sleep_quality_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Sleep quality must be a number',
      'number.integer': 'Sleep quality must be a whole number',
      'number.min': 'Sleep quality must be at least 1',
      'number.max': 'Sleep quality must be at most 10'
    }),
    stress_level_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Stress level must be a number',
      'number.integer': 'Stress level must be a whole number',
      'number.min': 'Stress level must be at least 1',
      'number.max': 'Stress level must be at most 10'
    }),
    financial_stress_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Financial stress must be a number',
      'number.integer': 'Financial stress must be a whole number',
      'number.min': 'Financial stress must be at least 1',
      'number.max': 'Financial stress must be at most 10'
    }),
    financial_concern_today: Joi.string().max(500).optional().messages({
      'string.max': 'Financial concern must be less than 500 characters'
    }),
    journey_readiness_today: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Journey readiness must be a number',
      'number.integer': 'Journey readiness must be a whole number',
      'number.min': 'Journey readiness must be at least 1',
      'number.max': 'Journey readiness must be at most 10'
    })
  })
};

// Validation middleware factory
function validateRequest(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      logger.error(new Error(`Validation schema '${schemaName}' not found`), req);
      return res.status(500).json({ 
        success: false, 
        error: 'Validation configuration error' 
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.security('Validation failed', {
        schema: schemaName,
        errors: validationErrors,
        request: {
          method: req.method,
          url: req.url,
          ip: req.ip
        }
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Replace request body with validated data
    req.body = value;
    next();
  };
}

// Export validation middleware
module.exports = {
  validateRequest,
  schemas
}; 
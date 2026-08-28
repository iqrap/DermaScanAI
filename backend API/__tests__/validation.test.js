const {
  validateAnalyzeRequest,
  validateQuizRequest,
  validateChatRequest,
  validateWeatherRequest,
  validateMoodRequest,
  validateGlowTipRequest,
  sanitizeString,
} = require('../middleware/validation');

// Mock express response
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

describe('sanitizeString', () => {
  test('removes < and > characters', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
  });

  test('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  test('returns non-string values unchanged', () => {
    expect(sanitizeString(123)).toBe(123);
    expect(sanitizeString(null)).toBe(null);
  });
});

describe('validateAnalyzeRequest', () => {
  test('calls next() for valid input', () => {
    const req = { body: { ingredientText: 'Water, Glycerin, Niacinamide, Hyaluronic Acid' } };
    const res = mockResponse();
    const next = mockNext();

    validateAnalyzeRequest(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 400 for short input', () => {
    const req = { body: { ingredientText: 'short' } };
    const res = mockResponse();
    const next = mockNext();

    validateAnalyzeRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 400 for missing input', () => {
    const req = { body: {} };
    const res = mockResponse();
    const next = mockNext();

    validateAnalyzeRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('validateQuizRequest', () => {
  test('calls next() for valid quiz answers', () => {
    const req = { body: { userAnswers: [{ question: 'Q1', answer: 'A1' }] } };
    const res = mockResponse();
    const next = mockNext();

    validateQuizRequest(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 400 for empty array', () => {
    const req = { body: { userAnswers: [] } };
    const res = mockResponse();
    const next = mockNext();

    validateQuizRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 for non-array', () => {
    const req = { body: { userAnswers: 'not-an-array' } };
    const res = mockResponse();
    const next = mockNext();

    validateQuizRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateChatRequest', () => {
  test('calls next() for valid message', () => {
    const req = { body: { message: 'What is acne?' } };
    const res = mockResponse();
    const next = mockNext();

    validateChatRequest(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 400 for empty message', () => {
    const req = { body: { message: '' } };
    const res = mockResponse();
    const next = mockNext();

    validateChatRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateWeatherRequest', () => {
  test('calls next() for valid city', () => {
    const req = { body: { city: 'Islamabad' } };
    const res = mockResponse();
    const next = mockNext();

    validateWeatherRequest(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 400 for missing city', () => {
    const req = { body: {} };
    const res = mockResponse();
    const next = mockNext();

    validateWeatherRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateMoodRequest', () => {
  test('calls next() for valid mood object', () => {
    const req = { body: { mood: { label: 'Happy', emoji: '😊', description: 'Great!' } } };
    const res = mockResponse();
    const next = mockNext();

    validateMoodRequest(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 400 for missing mood fields', () => {
    const req = { body: { mood: { label: 'Happy' } } };
    const res = mockResponse();
    const next = mockNext();

    validateMoodRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('sanitizes mood fields', () => {
    const req = { body: { mood: { label: '<b>Happy</b>', emoji: '😊', description: ' Great day ' } } };
    const res = mockResponse();
    const next = mockNext();

    validateMoodRequest(req, res, next);
    expect(req.body.mood.label).toBe('bHappy/b');
    expect(req.body.mood.description).toBe('Great day');
  });
});

describe('validateGlowTipRequest', () => {
  test('calls next() for valid tip', () => {
    const req = { body: { tip: 'hydration' } };
    const res = mockResponse();
    const next = mockNext();

    validateGlowTipRequest(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('returns 400 for empty tip', () => {
    const req = { body: { tip: '' } };
    const res = mockResponse();
    const next = mockNext();

    validateGlowTipRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 400 for tip longer than 50 chars', () => {
    const req = { body: { tip: 'a'.repeat(51) } };
    const res = mockResponse();
    const next = mockNext();

    validateGlowTipRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('sanitizes tip string', () => {
    const req = { body: { tip: '<b>hydration</b>' } };
    const res = mockResponse();
    const next = mockNext();

    validateGlowTipRequest(req, res, next);
    expect(req.body.tip).toBe('bhydration/b');
  });
});

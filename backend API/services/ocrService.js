const axios = require('axios');
const FormData = require('form-data');

async function performOCRSpace(apiKey, imageBase64) {
  try {
    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2');
    formData.append('base64Image', imageBase64);

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;
    
    if (data.IsErroredOnProcessing) {
      console.error('OCR.space error:', data.ErrorMessage);
      return { text: null, provider: 'ocr.space', confidence: 0 };
    }

    const extractedText = data.ParsedResults?.[0]?.ParsedText || '';
    
    const confidence = extractedText.length > 100 ? 0.9 : 
                      extractedText.length > 50 ? 0.7 : 
                      extractedText.length > 20 ? 0.5 : 0.3;
    
    return { 
      text: extractedText.trim(), 
      provider: 'ocr.space',
      confidence 
    };
  } catch (error) {
    console.error('OCR.space exception:', error);
    return { text: null, provider: 'ocr.space', confidence: 0 };
  }
}

async function performFallbackOCR(apiKey, imageBase64) {
  try {
    const formData = new FormData();
    formData.append('apikey', apiKey);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '1');
    formData.append('base64Image', imageBase64);

    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;
    
    if (data.IsErroredOnProcessing) {
      return { text: null, provider: 'fallback', confidence: 0 };
    }

    const extractedText = data.ParsedResults?.[0]?.ParsedText || '';
    const confidence = extractedText.length > 50 ? 0.6 : 0.3;
    
    return { 
      text: extractedText.trim(), 
      provider: 'fallback',
      confidence 
    };
  } catch (error) {
    console.error('Fallback OCR exception:', error);
    return { text: null, provider: 'fallback', confidence: 0 };
  }
}

async function performOCR(apiKey, imageBase64) {
  let result = await performOCRSpace(apiKey, imageBase64);
  
  if (!result.text || result.text.length < 20) {
    result = await performFallbackOCR(apiKey, imageBase64);
  }
  
  return result;
}

module.exports = {
  performOCR
};
// Utility functions for the refactored AI frontend module

/**
 * Validate that a string is a valid JSON
 * @param {string} str - String to validate
 * @returns {boolean} True if valid JSON, false otherwise
 */
export function isValidJSON(str: string): boolean {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Convert common number words to digits
 * @param {string} text - Text that may contain number words
 * @returns {string} Text with number words converted to digits
 */
export function convertNumberWordsToDigits(text: string): string {
    const numberMap: { [key: string]: string } = {
        'zero': '0',
        'one': '1',
        'two': '2',
        'three': '3',
        'four': '4',
        'five': '5',
        'six': '6',
        'seven': '7',
        'eight': '8',
        'nine': '9',
        'ten': '10',
        'eleven': '11',
        'twelve': '12',
        'thirteen': '13',
        'fourteen': '14',
        'fifteen': '15',
        'sixteen': '16',
        'seventeen': '17',
        'eighteen': '18',
        'nineteen': '19',
        'twenty': '20',
        // Yoruba number words
        'ise': '5',
        'iri': '10',
        'ogun': '20'
    };

    let result = text;
    for (const [word, digit] of Object.entries(numberMap)) {
        // Case insensitive replacement
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        result = result.replace(regex, digit);
    }
    
    return result;
}

/**
 * Extract base64 data from data URL
 * @param {string} dataURL - Data URL string
 * @returns {Object} Object containing base64 data and MIME type
 */
export function parseDataURL(dataURL: string): { mimeType: string; base64Data: string } {
    if (!dataURL.startsWith('data:')) {
        throw new Error('Invalid data URL');
    }
    
    const parts = dataURL.split(',');
    const meta = parts[0].split(':')[1];
    const mimeType = meta.split(';')[0];
    const base64Data = parts[1];
    
    return {
        mimeType,
        base64Data
    };
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const { HfInference } = require('@huggingface/inference');
const { split } = require('sentence-splitter');
const path = require('path');
const chineseTokenizer = require('chinese-tokenizer');
require('dotenv').config();

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Load the Chinese dictionary using the existing package
const tokenize = chineseTokenizer.loadFile(
  path.join(__dirname, '../config/cedict_ts.u8.txt')
);

/**
 * The tokenizeText fucntion uses Hugging Face's tokenization API.
 * If it fails, falls back to using the chinese-tokenizer.
 * The function returns an array of tokenized words with dictionary information.
 */
async function tokenizeText(text, language = 'zh') {
  try {
    // For Chinese, we can use Hugging Face with fallback to our original chinese-tokenizer.
    if (language === 'zh') {
      // First try Hugging Face for tokenization
      try {
        const result = await hf.tokenization({
          model: 'google/mt5-base',
          inputs: text
        });
        // Process the tokens to match the expected format.
        const processedText = result.tokens.join('');
        // Use our original dictionary for definitions.
        return tokenize(processedText);
      } catch (hfError) {
        console.error('Hugging Face tokenization error, falling back to chinese-tokenizer:', hfError);
        // If Hugging Face fails, fall back to the original tokenizer.
        return tokenize(text);
      }
    } 
    // For other languages, just use Hugging Face.
    else {
      const result = await hf.tokenization({
        model: 'google/mt5-base',
        inputs: text
      });
      
      // Format tokens in a similar structure to chinese-tokenizer output.
      // Including pinyin field in the matches array to maintain compatibility.
      return result.tokens.map(token => ({
        text: token,
        traditional: token,
        simplified: token,
        matches: [{
          pinyinPretty: '', // Empty pinyin for non-Chinese words.
          pinyin: '',
          english: token, // Use the token itself as the English meaning
          traditional: token,
          simplified: token
        }]
      }));
    }
  } catch (error) {
    console.error('Tokenization error:', error);
    throw error;
  }
}

/*
 * The splitSentences function uses the sentence-splitter package to split the text into sentences.
 * The function returns an array of strings, where each string is a complete sentence from the original text.
*/
function splitSentences(text) {
  try {
    // Use the split () function imported from sentence-splitter package to split the text into sentences (nodes).
    const result = split(text);
    // Keep only the "nodes" that are identified as sentences. 
    // Extract just the raw content from each sentence node.
    return result
      .filter(node => node.type === 'Sentence')
      .map(node => node.raw);
  } catch (error) {
    console.error('Sentence splitting error:', error);
    throw error;
  }
}

module.exports = {
  tokenizeText,
  splitSentences
};
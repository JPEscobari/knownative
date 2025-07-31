const chineseTokenizer = require('chinese-tokenizer');
const { split } = require('sentence-splitter');
const { HfInference } = require('@huggingface/inference');
const path = require('path');
require('dotenv').config();

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Load the Chinese dictionary using the existing package
const tokenize = chineseTokenizer.loadFile(
  path.join(__dirname, '../config/cedict_ts.u8.txt')
);

/**
 * The tokenizeText function uses Hugging Face's tokenization API.
 * If it fails, falls back to using the chinese-tokenizer.
 * The function returns an array of tokenized words with dictionary information.
 */
async function tokenizeText(text, language = 'zh') {
  try {
    // For Chinese, we can use Hugging Face with fallback to our original chinese-tokenizer.
    if (language === 'zh') {
      try {
        // Use the Hugging Face client directly with the Chinese word segmentation model
        const result = await hf.tokenClassification({
          model: 'ckiplab/bert-base-chinese-ws',
          inputs: text
        });
        
        console.log("HF tokenization result:", result);
        
        if (result && result.length > 0) {
          // Process the B/I (Beginning/Inside) tagging to form complete words
          const words = [];
          let currentWord = '';
          
          for (let i = 0; i < result.length; i++) {
            const item = result[i];
            // Remove spaces from the token
            const cleanToken = item.word.replace(/\s+/g, '');
            
            if (item.entity_group === 'B') {
              // If we have a current word, add it to the words array
              if (currentWord) {
                words.push(currentWord);
              }
              // Start a new word
              console.log("New word:", cleanToken);
              currentWord = cleanToken;
            } else if (item.entity_group === 'I') {
              // Continue the current word
              currentWord += cleanToken;
            }
          }
          
          // Add the last word if there is one
          if (currentWord) {
            words.push(currentWord);
          }
          
          // Use the chinese-tokenizer to get dictionary information for each word
          const tokenizedWords = [];
          for (const word of words) {
            try {
              // Try to get dictionary info for the word
              const tokenInfo = tokenize(word);
              if (tokenInfo && tokenInfo.length > 0) {
                tokenizedWords.push(...tokenInfo);
              } else {
                // If no dictionary info, create a basic structure
                tokenizedWords.push({
                  text: word,
                  traditional: word,
                  simplified: word,
                  matches: [{
                    pinyinPretty: '',
                    pinyin: '',
                    english: word,
                    traditional: word,
                    simplified: word
                  }]
                });
              }
            } catch (e) {
              console.error('Dictionary lookup error for word:', word, e);
              // If dictionary lookup fails, create a basic structure
              tokenizedWords.push({
                text: word,
                traditional: word,
                simplified: word,
                matches: [{
                  pinyinPretty: '',
                  pinyin: '',
                  english: word,
                  traditional: word,
                  simplified: word
                }]
              });
            }
          }
          
          return tokenizedWords;
        } else {
          console.log("No tokens returned from Hugging Face, falling back to chinese-tokenizer");
          return tokenize(text);
        }
      } catch (hfError) {
        console.error('Hugging Face tokenization error, falling back to chinese-tokenizer:', hfError);
        // If Hugging Face fails, fall back to the original tokenizer
        return tokenize(text);
      }
    } 
    // For other languages, just use Hugging Face
    else {
      try {
        const result = await hf.tokenClassification({
          // This is a another model I picked for  non-Chinese languages, but need to verify if it works well.
          model: 'dslim/bert-base-NER',  
          inputs: text
        });
        
        // Format tokens in a similar structure to chinese-tokenizer output
        return result.map(item => ({
          text: item.word,
          traditional: item.word,
          simplified: item.word,
          matches: [{
            pinyinPretty: '',
            pinyin: '',
            english: item.entity || item.word,
            traditional: item.word,
            simplified: item.word
          }]
        }));
      } catch (error) {
        console.error('Hugging Face tokenization error for non-Chinese text:', error);
        throw error;
      }
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
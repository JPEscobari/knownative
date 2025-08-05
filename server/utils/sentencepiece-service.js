// sentencepiece-service.js (updated to use REST API instead of HfInference)

const fetch = require('node-fetch');
const chineseTokenizer = require('chinese-tokenizer');
const { split } = require('sentence-splitter');
const path = require('path');
require('dotenv').config();

// Load the Chinese dictionary using the existing package
const tokenize = chineseTokenizer.loadFile(
  path.join(__dirname, '../config/cedict_ts.u8.txt')
);

// Helper function: fetch from Hugging Face API using raw HTTP
async function fetchChineseTokens(text) {
  const response = await fetch('https://api-inference.huggingface.co/models/ckiplab/bert-base-chinese-ws', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: text,
      parameters: { aggregation_strategy: 'none' } // Force BIO-tag output
    })
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.statusText}`);
  }

  return await response.json();
}

async function tokenizeText(text, language = 'zh') {
  if (language !== 'zh') {
    throw new Error('Only zh is supported in this tokenizer');
  }

  try {
    const rawTokens = await fetchChineseTokens(text);
    console.log('HF raw token output:', rawTokens);

    const words = [];
    let currentWord = '';

    for (const token of rawTokens) {
      const label = token.entity;
      const cleanChar = token.word.replace(/\s+/g, '');

      if (label === 'B') {
        if (currentWord) words.push(currentWord);
        currentWord = cleanChar;
      } else if (label === 'I') {
        currentWord += cleanChar;
      } else {
        // Unexpected label — treat as standalone
        if (currentWord) words.push(currentWord);
        words.push(cleanChar);
        currentWord = '';
      }
    }
    if (currentWord) words.push(currentWord);

    const tokenizedWords = [];
    for (const word of words) {
      try {
        const dictEntries = tokenize(word);
        if (dictEntries && dictEntries.length > 0) {
          tokenizedWords.push(...dictEntries);
        } else {
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
        console.error('Dictionary lookup error for:', word, e);
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
  } catch (error) {
    console.error('Tokenization error:', error);
    return tokenize(text); // fallback to old tokenizer
  }
}

function splitSentences(text) {
  try {
    const result = split(text);
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

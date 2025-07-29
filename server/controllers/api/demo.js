const path = require("path");
const { Translate } = require("@google-cloud/translate").v2;
// Import our new sentencepiece service
const { tokenizeText: tokenizeWithSentencePiece, splitSentences } = require("../../utils/sentencepiece-service");
// Keep the original tokenizer for backward compatibility if needed
const tokenize = require("chinese-tokenizer").loadFile(
  path.join(__dirname, "../../config/cedict_ts.u8.txt")
);
const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
const Text = require('../../models/text.js')

module.exports = {
  getDemo,
  tokenizeText,
  translateSentence,
  addText,
  splitTextIntoSentences // Export the new function
};

async function getDemo(req, res) {}

// Update to use the new sentencepiece service
async function tokenizeText(req, res) {
  const { text, language = 'zh' } = req.body;
  
  console.log(`Tokenizing text in language: ${language}`);
  console.log(`Text length: ${text.length} characters`);
  
  try {
    // Use our new tokenization service
    const tokenizedText = await tokenizeWithSentencePiece(text, language);
    console.log(`Successfully tokenized text into ${tokenizedText.length} tokens`);
    res.json(tokenizedText);
  } catch (error) {
    console.error('Error tokenizing text with SentencePiece:', error);
    // Fall back to the original tokenizer for Chinese if there's an error
    if (language === 'zh') {
      console.log('Falling back to original Chinese tokenizer');
      try {
        const fallbackTokenizedText = tokenize(text);
        console.log(`Successfully tokenized text with fallback into ${fallbackTokenizedText.length} tokens`);
        res.json(fallbackTokenizedText);
      } catch (fallbackError) {
        console.error('Fallback tokenization error:', fallbackError);
        res.status(500).json({ error: 'Failed to tokenize text with both primary and fallback methods' });
      }
    } else {
      res.status(500).json({ error: `Failed to tokenize ${language} text` });
    }
  }
}

async function translateSentence(req, res) {
  const { sentence } = req.body;
  const target = "en";

  try {
    let [translations] = await translate.translate(sentence, target);
    translations = Array.isArray(translations) ? translations : [translations];
    res.json(translations[0]);
  } catch (error) {
    res.status(400).json(error);
  }
}

// Add a new function to split text into sentences
function splitTextIntoSentences(req, res) {
  const { text } = req.body;
  
  try {
    const sentences = splitSentences(text);
    res.json(sentences);
  } catch (error) {
    console.error('Error splitting text into sentences:', error);
    res.status(500).json({ error: 'Failed to split text into sentences' });
  }
}

async function addText(req, res) {
  const { content, title, source } = req.body;
  const userId = req.user._id;

  console.log('User ID in addText:', userId);
  console.log('Adding text:', content);
  
  try {
    const newText = new Text({
      user: userId,
      title,
      source,
      content
    });
    console.log('New text:', newText);
    await newText.save();
    res.status(201).json({ message: 'Text added successfully', text: newText });
  } catch (error) {
    console.error('Error saving text:', error);
    res.status(500).json({ error: 'Failed to add text' });
  }
}
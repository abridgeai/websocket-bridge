const { wordsToNumbers } = require('words-to-numbers');
const {MEDICATION_MISTAKE_DICT} = require('./consts.js');
const {GENERIC_NAMES} = require('./generic_names.js');

// Function to remove 'and' from tokens for number conversion
function removeAnd(tokens) {
  return tokens.filter(token => token.toLowerCase() !== 'and');
}

function convertNumberPhrase(phrase) {
  /**
   * Converts a number phrase in words to its numeric digit representation.

   * The function handles special cases where phrases represent years,
   * such as "twenty twenty four" -> "2024".

   * For phrases like "twenty four", it sums the numbers to get "24".

   * Args:
   *     phrase (str): The number phrase in words (e.g., "twenty four").

   * Returns:
   *     str: The numeric representation of the number phrase (e.g., "24").
   */
  phrase = phrase.toLowerCase().trim();

  // Split the phrase into tokens
  let tokens = phrase.split(/\s+/);

  // Remove 'and' from tokens for number conversion
  const tokensNoAnd = removeAnd(tokens);

  const numberWordsSet = new Set([
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
    "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
    "hundred", "thousand"
  ]);

  // Check if all tokens are number words
  if (!tokensNoAnd.every(token => numberWordsSet.has(token))) {
    return phrase; // Return the original phrase if any token is not a number word
  }

  // Try to parse the phrase directly
  const phraseNoAnd = tokensNoAnd.join(" ");
  const number = wordsToNumbers(phraseNoAnd);
  if (!isNaN(number) && number < 1000) {
    return String(number);
  }

  // Handle special cases for years like "twenty twenty four"
  if (
    tokensNoAnd.length === 2 &&
    tokensNoAnd[0] === "twenty" &&
    ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"].includes(tokensNoAnd[1])
  ) {
    const firstNumber = wordsToNumbers(tokensNoAnd[0]);
    const secondNumber = wordsToNumbers(tokensNoAnd[1]);
    return `${firstNumber}${secondNumber}`;
  }

  // Handle phrases like "twenty twenty one"
  if (
    tokensNoAnd.length === 3 &&
    tokensNoAnd[0] === "twenty" &&
    ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"].includes(tokensNoAnd[1]) &&
    numberWordsSet.has(tokensNoAnd[2])
  ) {
    const firstNumber = wordsToNumbers(tokensNoAnd[0]);
    const restNumber = wordsToNumbers(tokensNoAnd.slice(1).join(' '));
    return `${firstNumber}${String(restNumber).padStart(2, '0')}`;
  }

  // Handle years starting with "nineteen" or "eighteen"
  if (tokensNoAnd.length >= 2 && ["eighteen", "nineteen"].includes(tokensNoAnd[0])) {
    const firstNumber = wordsToNumbers(tokensNoAnd[0]);
    const restNumber = wordsToNumbers(tokensNoAnd.slice(1).join(' '));
    if (!isNaN(restNumber) && restNumber >= 0 && restNumber < 100) {
      return `${firstNumber}${String(restNumber).padStart(2, '0')}`;
    }
  }

  // If parsing fails, return the original phrase
  return phrase;
}

function convertTextNumbers(text) {
  /**
   * Converts all number words in a text to their numeric digit representations.

   * The function handles:
   * - Number words (e.g., "twenty three" to "23").
   * - Dates formatted in words with slashes (e.g., "ten slash twenty five slash twenty four" to "10/25/24").
   * - Years expressed as "twenty twenty four" to "2024" without hardcoding each year.

   * Args:
   *     text (str): The input text containing number words.

   * Returns:
   *     str: The text with number words converted to digits.
   */
  // Exclude 'and' from number word keys
  const numberWordKeys = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
    "nineteen", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
    "hundred", "thousand"
  ];

  const numberWordPattern = `(?:${numberWordKeys.join('|')})(?:\\s+(?:${numberWordKeys.join('|')}))*`;

  // Build the date pattern to match dates with slashes
  const datePattern = new RegExp(`(${numberWordPattern})(?:\\s+slash\\s+(${numberWordPattern}))(?:\\s+slash\\s+(${numberWordPattern}))?`, "gi");

  // First, handle the dates with slashes
  text = text.replace(datePattern, function(match, p1, p2, p3) {
    const parts = [p1, p2, p3].filter(Boolean);
    const dateNumbers = parts.map(part => convertNumberPhrase(part));
    return dateNumbers.join("/");
  });

  // Replace number phrases in the rest of the text
  const numberPhrasePattern = new RegExp(`\\b${numberWordPattern}\\b`, "gi");

  text = text.replace(numberPhrasePattern, function(match) {
    return convertNumberPhrase(match);
  });

  return text;
}


function replaceVoiceCommands(text) {
    // Mapping of voice commands to their replacements (including leading/trailing spaces)
    const VOICE_COMMANDS = {
        " period": ".",
        " period.": ".",
        " semicolon ": ";",
        " newline ": "\n ",
        " new line ": "\n ",
        "newline.": ".",
        " new line.": ".\n",
        " slash ": "/",
        "slash.": "/",
        " paragraph ": "\n\n ",
        " new paragraph ": "\n\n ",
        " comma": ", ",
        " comma.": ", ",
        "comma,": ", ",
        " uh": "",
        " um": "",
        " hmm": "",
        " hm": "",
        " umm": "",
        " uhm": "",
        " ok": "",
        " okay": "",
        " yeah": "",
        " thank you": "",
        " thanks": "",
        " please": "",
        " oh": "",
        " a.": ".",
        " I know": "",
        ". I": "",

    };

    // Function to escape special regex characters in keys
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Sort the keys by length in descending order to handle substrings
    const keys = Object.keys(VOICE_COMMANDS)
        .sort((a, b) => b.length - a.length)
        .map(key => escapeRegExp(key));

    // Add spaces around the text to handle matches at the start and end
    text = ' ' + text + ' ';

    // Create a regex pattern to match any of the voice command keys
    const pattern = new RegExp('(' + keys.join('|') + ')', 'gi');

    // Replace occurrences of voice commands
    text = text.replace(pattern, (match) => {
        const replacement = VOICE_COMMANDS[match] || VOICE_COMMANDS[match.toLowerCase()];
        return replacement !== undefined ? replacement : match;
    });

    // Remove extra spaces added at the start and end, and replace multiple spaces with a single space
    text = text.trim().replace(/[ ]+/g, ' ');

    return text;
}

function capitalizeAfterKeyword(text) {
    return text.replace(/\bcapital (\w+)/g, function(match, word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
}

function convertQuoteToDoubleQuotes(input) {
  return input.replace(/\bquote\b\s+(\w+)/g, '"$1"');
}

function replaceMultiplePeriods(input) {
  return input.replace(/(\.\s*){2,}/g, '. ').replace(/\s+/g, ' ').trim();
}

function removeAllCommas(input) {
  return input.replace(/,/g, '');
}

function removeSpacesBeforePeriods(input) {
  return input.replace(/\s+\./g, '.');
}

function removePeriodsBeforeNonTitleCase(input) {
  return input.replace(/\. ([a-z])/g, ' $1');
}

function removeConsecutiveDuplicateWords(input) {
  return input.replace(/\b(\w+)\b \b\1\b/g, '$1');
}

function removeIAndIKnow(input) {
  return input.replace(/\bI\b( know)?/g, '').replace(/\s+/g, ' ').trim();
}

function capitalizeAfterPeriod(input) {
  return input
      .replace(/^\w/, (match) => match.toUpperCase()) // Capitalize the first word
      .replace(/\. (\w)/g, (match, firstLetter) => `. ${firstLetter.toUpperCase()}`); // Capitalize after periods
}

function replaceSpellingErrors(text) {
  // Get all the keys from the dictionary (misspelled words)
  const misspelledWords = Object.keys(MEDICATION_MISTAKE_DICT);

  // Escape special regex characters in the keys
  const escapedWords = misspelledWords.map(word => escapeRegExp(word));

  // Create a regular expression pattern to match any misspelled word
  const pattern = new RegExp('\\b(' + escapedWords.join('|') + ')\\b', 'gi');

  // Replace occurrences of misspelled words with correct spellings
  const correctedText = text.replace(pattern, (match) => {
      // Get the correct spelling from the dictionary
      const correctSpelling = MEDICATION_MISTAKE_DICT[match.toLowerCase()] || match;
      return correctSpelling;
  });

  return correctedText;
}

function replaceGenericNames(text) {
  // Get all the generic names (keys) from the dictionary
  const genericNames = Object.keys(GENERIC_NAMES);

  // Escape special regex characters in the generic names
  const escapedNames = genericNames.map(name => escapeRegExp(name));

  // Create a regex pattern to match any of the generic names
  const pattern = new RegExp('\\b(' + escapedNames.join('|') + ')\\b', 'g');

  // Replace title case generic names with their lowercase equivalents
  const correctedText = text.replace(pattern, (match) => {
      
        // Replace with the lowercase equivalent from the dictionary
        return GENERIC_NAMES[match] || match.toLowerCase();
  });

  return correctedText;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processTranscript(transcript) {

    // Remove I and I know
    transcript = removeIAndIKnow(transcript);

    // Remove all commas
    transcript = removeAllCommas(transcript);

    // Convert number words to digits
    transcript = convertTextNumbers(transcript);

    // Capitalize words after the keyword "capital"
    transcript = capitalizeAfterKeyword(transcript);

    // Remove periods before non-title case words
    transcript = removePeriodsBeforeNonTitleCase(transcript);

    // Replace voice commands with their corresponding symbols
    transcript = replaceVoiceCommands(transcript);

    // Convert 'quote' followed by a word to double quotes
    transcript = convertQuoteToDoubleQuotes(transcript);

    // Replace multiple periods with a single period
    transcript = replaceMultiplePeriods(transcript);

    // Replace misspelled words with correct spellings
    transcript = replaceSpellingErrors(transcript);

    // Replace generic names with lowercase equivalents
    transcript = replaceGenericNames(transcript);

    // Remove spaces before periods
    transcript = removeSpacesBeforePeriods(transcript);

    // Remove consecutive duplicate words
    transcript = removeConsecutiveDuplicateWords(transcript);

    // Capitalize words after periods
    transcript = capitalizeAfterPeriod(transcript);

    return transcript;
}

module.exports = {processTranscript};
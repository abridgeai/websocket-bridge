const {processTranscript} = require('./modules/postprocess_utils/utils');

const inputText = "He is a twenty three year old uhm referred to cardiology on 30th October twenty twenty four due to capital bradycardia newline He was in the emergency room on ten slash twenty five slash twenty four with vague chest discomfort noted to have bradycardia. He was born in nineteen ninety nine and visited in twenty twenty. He is being prescribed with amavig and some Acitretin."
const correctedText = processTranscript(inputText);
console.log(correctedText);
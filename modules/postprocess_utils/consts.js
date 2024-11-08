const { CLINICIAN_MEDICATION_MISTAKE_DICT } = require('./clinicial_mistake_dict.js');
const { SYNTHETIC_MEDICATION_MISTAKE_DICT } = require('./synthetic_mistake_dict.js');

//join the clinician and synthetic medication mistake dictionaries
const MEDICATION_MISTAKE_DICT = Object.assign({}, CLINICIAN_MEDICATION_MISTAKE_DICT, SYNTHETIC_MEDICATION_MISTAKE_DICT);

exports.MEDICATION_MISTAKE_DICT = MEDICATION_MISTAKE_DICT;



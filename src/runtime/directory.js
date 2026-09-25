// Loaded by the client boundary after hydration; roster files remain compatible
// with the existing source reconciliation scripts and stable B/P identifiers.
import '../../data/bishops.js';
import '../../data/pastors.js';
import '../../data/question-history.js';
import '../../data/bishop-questions.js';
import '../../data/pastor-questions.js';
import '../../data/bank-accounts.js';
export function getDirectory(){
  const {BISHOPS,PASTORS,BISHOP_QUESTIONS,BISHOP_QUESTION_SET,BISHOP_QUESTIONS_V1,BISHOP_QUESTIONS_V2,BISHOP_QUESTIONS_V3,PASTOR_QUESTIONS,PASTOR_QUESTION_SET,PASTOR_QUESTIONS_V1,PASTOR_QUESTIONS_V2,PASTOR_QUESTIONS_V3,FLOW_BANK_ACCOUNTS}=window;
  return {BISHOPS,PASTORS,BISHOP_QUESTIONS,BISHOP_QUESTION_SET,BISHOP_QUESTIONS_V1,BISHOP_QUESTIONS_V2,BISHOP_QUESTIONS_V3,PASTOR_QUESTIONS,PASTOR_QUESTION_SET,PASTOR_QUESTIONS_V1,PASTOR_QUESTIONS_V2,PASTOR_QUESTIONS_V3,FLOW_BANK_ACCOUNTS};
}

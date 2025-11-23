-- Economics Questions for Topic 1.1.1
INSERT INTO public.questions (topic_id, question_text, question_type, difficulty, marks, correct_answer, explanation, mark_scheme) VALUES
((SELECT id FROM public.topics WHERE topic_code = '1.1.1' AND theme_id IN (SELECT id FROM public.themes WHERE subject_id = (SELECT id FROM public.subjects WHERE code = 'ECON'))),
'Explain the difference between positive and normative statements in economics.',
'short_answer',
'easy',
4,
'Positive statements are objective facts that can be tested with evidence (e.g., "Unemployment is 5%"). Normative statements are value judgments about what should be (e.g., "Unemployment is too high").',
'Positive statements are factual and testable. Normative statements involve opinions and value judgments. Examples help distinguish between them.',
'Level 2 (3-4 marks): Clear explanation of both types with examples. Level 1 (1-2 marks): Basic understanding but lacks clarity or examples.'),

((SELECT id FROM public.topics WHERE topic_code = '1.1.1' AND theme_id IN (SELECT id FROM public.themes WHERE subject_id = (SELECT id FROM public.subjects WHERE code = 'ECON'))),
'Which of the following is a positive statement?',
'multiple_choice',
'easy',
1,
'A',
'Option A is factual and testable. Options B, C, and D involve value judgments about what "should" happen.',
'1 mark for correct answer (A).');

INSERT INTO public.question_options (question_id, option_text, is_correct) VALUES
((SELECT id FROM public.questions WHERE question_text = 'Which of the following is a positive statement?' ORDER BY id DESC LIMIT 1),
'Unemployment rose by 2% last year', true),
((SELECT id FROM public.questions WHERE question_text = 'Which of the following is a positive statement?' ORDER BY id DESC LIMIT 1),
'The government should reduce unemployment', false),
((SELECT id FROM public.questions WHERE question_text = 'Which of the following is a positive statement?' ORDER BY id DESC LIMIT 1),
'Unemployment is the most serious economic problem', false),
((SELECT id FROM public.questions WHERE question_text = 'Which of the following is a positive statement?' ORDER BY id DESC LIMIT 1),
'The government must prioritize reducing unemployment', false);

-- Economics Questions for Topic 1.2.2 (Demand)
INSERT INTO public.questions (topic_id, question_text, question_type, difficulty, marks, correct_answer, explanation, mark_scheme) VALUES
((SELECT id FROM public.topics WHERE topic_code = '1.2.2' AND theme_id IN (SELECT id FROM public.themes WHERE subject_id = (SELECT id FROM public.subjects WHERE code = 'ECON'))),
'Explain how a rise in consumer incomes would affect the demand for normal goods.',
'short_answer',
'medium',
6,
'A rise in incomes increases purchasing power. For normal goods, demand increases as consumers can afford more. The demand curve shifts right. At each price level, quantity demanded is higher. Examples include luxury items, dining out, quality products.',
'Need to explain that higher income leads to increased demand, mention shift in demand curve, and ideally provide examples.',
'Level 3 (5-6 marks): Thorough explanation with diagram reference and examples. Level 2 (3-4 marks): Adequate explanation of the relationship. Level 1 (1-2 marks): Limited understanding.'),

((SELECT id FROM public.topics WHERE topic_code = '1.2.2' AND theme_id IN (SELECT id FROM public.themes WHERE subject_id = (SELECT id FROM public.subjects WHERE code = 'ECON'))),
'A decrease in the price of tea would most likely cause:',
'multiple_choice',
'medium',
1,
'B',
'A price decrease causes movement along the demand curve (extension of demand), not a shift of the curve. Demand curve shifts are caused by non-price factors.',
'1 mark for correct answer (B).');

INSERT INTO public.question_options (question_id, option_text, is_correct) VALUES
((SELECT id FROM public.questions WHERE question_text LIKE 'A decrease in the price of tea%' ORDER BY id DESC LIMIT 1),
'A shift in the demand curve for tea to the left', false),
((SELECT id FROM public.questions WHERE question_text LIKE 'A decrease in the price of tea%' ORDER BY id DESC LIMIT 1),
'A movement along the demand curve for tea', true),
((SELECT id FROM public.questions WHERE question_text LIKE 'A decrease in the price of tea%' ORDER BY id DESC LIMIT 1),
'A shift in the demand curve for tea to the right', false),
((SELECT id FROM public.questions WHERE question_text LIKE 'A decrease in the price of tea%' ORDER BY id DESC LIMIT 1),
'No change in quantity demanded of tea', false);

-- Business Questions for Topic 1.1.1
INSERT INTO public.questions (topic_id, question_text, question_type, difficulty, marks, correct_answer, explanation, mark_scheme) VALUES
((SELECT id FROM public.topics WHERE topic_code = '1.1.1' AND theme_id IN (SELECT id FROM public.themes WHERE subject_id = (SELECT id FROM public.subjects WHERE code = 'BUS'))),
'Analyse the advantages of operating in a niche market rather than a mass market.',
'essay',
'hard',
9,
'Advantages include: less competition, can charge premium prices, builds strong customer loyalty, clear focus on customer needs, lower marketing costs. However, may have limited growth potential and higher risk if market declines.',
'Must analyze both advantages and consider context. Strong answers will evaluate and reach a judgment.',
'Level 4 (8-9 marks): Detailed analysis with evaluation and judgment. Level 3 (6-7 marks): Good analysis of several advantages. Level 2 (3-5 marks): Some analysis but limited depth. Level 1 (1-2 marks): Basic description.'),

((SELECT id FROM public.topics WHERE topic_code = '1.1.1' AND theme_id IN (SELECT id FROM public.themes WHERE subject_id = (SELECT id FROM public.subjects WHERE code = 'BUS'))),
'Calculate the market share of a business with sales of £2.5 million in a market worth £20 million.',
'calculation',
'easy',
2,
'12.5%',
'Market share = (2.5 / 20) × 100 = 12.5%',
'2 marks for correct answer with working. 1 mark for correct method but incorrect calculation.');

-- Politics Questions for Topic 1.1.1
INSERT INTO public.questions (topic_id, question_text, question_type, difficulty, marks, correct_answer, explanation, mark_scheme) VALUES
((SELECT id FROM public.topics WHERE topic_code = '1.1.1' AND theme_id IN (SELECT id FROM public.themes WHERE subject_id = (SELECT id FROM public.subjects WHERE code = 'POL'))),
'Explain two differences between direct and representative democracy.',
'short_answer',
'medium',
4,
'Direct democracy involves citizens voting on every issue (e.g., referendums), while representative democracy involves electing representatives to make decisions (e.g., MPs). Direct democracy gives more public participation but is impractical for complex issues. Representative democracy is more efficient and allows expert decision-making but may not reflect public wishes.',
'Must explain two clear differences with examples or development.',
'2 marks for each well-explained difference. Total 4 marks.'),

((SELECT id FROM public.topics WHERE topic_code = '1.1.1' AND theme_id IN (SELECT id FROM public.themes WHERE subject_id = (SELECT id FROM public.subjects WHERE code = 'POL'))),
'Which of the following is an example of direct democracy in the UK?',
'multiple_choice',
'easy',
1,
'C',
'Referendums are the main form of direct democracy in the UK, where citizens vote directly on specific issues.',
'1 mark for correct answer (C).');

INSERT INTO public.question_options (question_id, option_text, is_correct) VALUES
((SELECT id FROM public.questions WHERE question_text LIKE '%example of direct democracy in the UK%' ORDER BY id DESC LIMIT 1),
'General elections', false),
((SELECT id FROM public.questions WHERE question_text LIKE '%example of direct democracy in the UK%' ORDER BY id DESC LIMIT 1),
'Prime Minister''s Questions', false),
((SELECT id FROM public.questions WHERE question_text LIKE '%example of direct democracy in the UK%' ORDER BY id DESC LIMIT 1),
'Referendums', true),
((SELECT id FROM public.questions WHERE question_text LIKE '%example of direct democracy in the UK%' ORDER BY id DESC LIMIT 1),
'Select Committees', false);

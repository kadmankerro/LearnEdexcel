-- Insert subjects
INSERT INTO public.subjects (name, code, description) VALUES
('Economics', 'ECON', 'A-Level Edexcel Economics'),
('Business', 'BUS', 'A-Level Edexcel Business'),
('Politics', 'POL', 'A-Level Edexcel Politics')
ON CONFLICT (code) DO NOTHING;

-- Insert Economics themes
INSERT INTO public.themes (subject_id, theme_number, title, description) VALUES
((SELECT id FROM public.subjects WHERE code = 'ECON'), 1, 'Introduction to Markets and Market Failure', 'Covers scarcity, choice, opportunity cost, demand, supply, elasticity, market failure, and government intervention'),
((SELECT id FROM public.subjects WHERE code = 'ECON'), 2, 'The UK Economy - Performance and Policies', 'Measures of economic performance, aggregate demand and supply, macroeconomic objectives, and policy tools'),
((SELECT id FROM public.subjects WHERE code = 'ECON'), 3, 'Business Behaviour and the Labour Market', 'Business growth, objectives, costs, profits, market structures, and labour markets'),
((SELECT id FROM public.subjects WHERE code = 'ECON'), 4, 'A Global Perspective', 'Globalisation, trade, protectionism, exchange rates, poverty, inequality, and emerging economies')
ON CONFLICT (subject_id, theme_number) DO NOTHING;

-- Insert Business themes
INSERT INTO public.themes (subject_id, theme_number, title, description) VALUES
((SELECT id FROM public.subjects WHERE code = 'BUS'), 1, 'Marketing and People', 'Meeting customer needs, the market, marketing mix and strategy, managing people, entrepreneurs and leaders'),
((SELECT id FROM public.subjects WHERE code = 'BUS'), 2, 'Managing Business Activities', 'Raising finance, financial planning, managing finance, resource management, external influences'),
((SELECT id FROM public.subjects WHERE code = 'BUS'), 3, 'Business Decisions and Strategy', 'Corporate objectives and strategy, business growth, decision-making techniques, influences on business decisions'),
((SELECT id FROM public.subjects WHERE code = 'BUS'), 4, 'Global Business', 'Globalisation, global markets and business expansion, global marketing, global industries and companies')
ON CONFLICT (subject_id, theme_number) DO NOTHING;

-- Insert Politics themes
INSERT INTO public.themes (subject_id, theme_number, title, description) VALUES
((SELECT id FROM public.subjects WHERE code = 'POL'), 1, 'UK Politics and Core Political Ideas', 'Democracy and participation, political parties, electoral systems, voting behaviour and the media'),
((SELECT id FROM public.subjects WHERE code = 'POL'), 2, 'UK Government', 'The constitution, parliament, Prime Minister and executive, relations between institutions'),
((SELECT id FROM public.subjects WHERE code = 'POL'), 3, 'Comparative Politics', 'US Constitution and federalism, US Congress, US Presidency, US Supreme Court, democracy and participation'),
((SELECT id FROM public.subjects WHERE code = 'POL'), 4, 'Political Ideas', 'Liberalism, conservatism, socialism, and other key political ideologies')
ON CONFLICT (subject_id, theme_number) DO NOTHING;

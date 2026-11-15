-- איך כל ציון חושב: { "priorSource": "category" | "type", "breakdown": { "<metric>": { mean, n, prior, shrunk, score10, weight } } }
-- כך אפשר להסביר ולשחזר ציון שנשמר, גם אחרי שביקורות הוצאו או שהשיטה השתנתה.
alter table scores add column explanation jsonb not null default '{}'::jsonb;

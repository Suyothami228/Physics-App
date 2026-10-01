import copy
import json
from pathlib import Path

from django.core.management import call_command
from django.test import TestCase
from learning.models import Chapter, ExamQuestion
from learning.management.commands.translate_measurement_questions import read_tsv


class TranslationTests(TestCase):
    def test_full_bank_translation_preserves_keys_and_admin_edits(self):
        chapter = Chapter.objects.create(id='01', title_en='Measurement', title_ta='அளவீடு')
        base = Path(__file__).parent / 'data/measurement_mcq'
        tamil = read_tsv(base / 'typed.tsv')
        keys = json.loads((base / 'questions.json').read_text(encoding='utf-8'))
        for row in keys:
            n = row['number']
            ExamQuestion.objects.create(
                chapter=chapter, kind='mcq', year=row['year'],
                import_key=f'measurement-mcq-v1-{n:02}', number=str(n),
                paper='Test collection', title_en='Measurement', title_ta='அளவீடு',
                solution_en='Answer key', solution_ta='விடை',
                prompt_ta=tamil[n][0], options_ta=tamil[n][1],
                correct_option=row['answers'][0], published=bool(tamil[n][1]),
            )
        call_command('import_measurement_structured')
        for q in ExamQuestion.objects.filter(kind='mcq'):
            n = int(q.number)
            self.assertEqual(q.prompt_ta, tamil[n][0])
            self.assertEqual(q.options_ta, tamil[n][1])
            self.assertEqual(q.correct_option, keys[n-1]['answers'][0])
            self.assertNotRegex(q.prompt_en + q.options_en, '[\u0b80-\u0bff]')
            self.assertTrue(q.prompt_en)
            self.assertEqual(len(q.options_en.splitlines()), len(q.options_ta.splitlines()))
        for q in ExamQuestion.objects.filter(kind='structured'):
            self.assertNotRegex(q.title_en + q.prompt_en, '[\u0b80-\u0bff]')
            self.assertTrue(q.prompt_en)
            for part in q.structured_parts:
                for field in ('prompt', 'answer'):
                    self.assertTrue(part[field]['en'])
                    self.assertNotRegex(part[field]['en'], '[\u0b80-\u0bff]')
        q = ExamQuestion.objects.filter(kind='structured').first()
        q.structured_parts[0]['answer']['en'] = 'Educator revision'
        q.save()
        previous = copy.deepcopy(q.structured_parts)
        mcq = ExamQuestion.objects.get(import_key='measurement-mcq-v1-81')
        mcq.prompt_en = 'Educator question revision'
        mcq.save()
        call_command('translate_measurement_questions')
        q.refresh_from_db()
        mcq.refresh_from_db()
        self.assertEqual(q.structured_parts, previous)
        self.assertEqual(mcq.prompt_en, 'Educator question revision')

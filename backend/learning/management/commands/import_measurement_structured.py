import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.management import call_command
from learning.models import Chapter, ExamQuestion


class Command(BaseCommand):
    help = 'Import the four reviewed measurement structured questions; preserve subsequent admin edits'

    def handle(self, *args, **options):
        chapter = Chapter.objects.get(pk='01')
        source = Path(__file__).resolve().parents[3] / 'seed' / 'measurement-structured.json'
        created = 0
        for i, row in enumerate(json.loads(source.read_text(encoding='utf-8')), 1):
            if ExamQuestion.objects.filter(import_key=row['key']).exists():
                continue
            question = ExamQuestion(chapter=chapter, kind='structured', year=row['year'], number=row['number'],
                position=i, import_key=row['key'], paper='Measurement structured reference, September 2026 scan',
                title_en=row['title'], title_ta=row['title'], prompt_ta=row['prompt'],
                structured_parts=row['parts'], marks=20 if row['year'] == 2024 else 1, minutes=20,
                solution_en='Reveal each subquestion answer to review your working.',
                solution_ta='ஒவ்வொரு துணை வினாவின் விடையையும் திறந்து உங்கள் செய்முறையைச் சரிபார்க்கவும்.', published=True)
            question.full_clean()
            question.save()
            created += 1
        call_command('translate_measurement_questions', stdout=self.stdout)
        self.stdout.write(self.style.SUCCESS(f'Imported {created} structured questions; existing admin edits preserved.'))

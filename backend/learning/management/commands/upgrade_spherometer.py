import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import Lesson, LessonBlock

class Command(BaseCommand):
    help = 'Add PDF-reviewed spherometer lesson blocks without overwriting educator edits.'

    @transaction.atomic
    def handle(self, *args, **options):
        lesson = Lesson.objects.get(pk='01/instruments')
        rows = json.loads((settings.BASE_DIR / 'seed' / 'measurement.json').read_text(encoding='utf8'))['01/instruments']
        added = 0
        for row in rows:
            if row.get('instrument') != 'spherometer' or lesson.blocks.filter(key=row['key']).exists():
                continue
            block = LessonBlock(lesson=lesson, **row)
            block.full_clean()
            block.save()
            added += 1
        self.stdout.write(f'Spherometer: {added} blocks added; existing educator content preserved.')

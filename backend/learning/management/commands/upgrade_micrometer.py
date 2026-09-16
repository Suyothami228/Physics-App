import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import Lesson, LessonBlock

class Command(BaseCommand):
    help = 'Add PDF-reviewed micrometer lesson blocks without overwriting educator edits.'

    @transaction.atomic
    def handle(self, *args, **options):
        lesson = Lesson.objects.get(pk='01/instruments')
        rows = json.loads((settings.BASE_DIR / 'seed' / 'measurement.json').read_text(encoding='utf8'))['01/instruments']
        added = 0
        for existing in LessonBlock.objects.all():
            changed = []
            for field in ['title_ta', 'body_ta', 'options_ta', 'explanation_ta']:
                old = getattr(existing, field)
                new = old.replace('திருகு நுண்மானி', 'நுண்மானித் திருகுக் கணிச்சி')
                if new != old:
                    setattr(existing, field, new)
                    changed.append(field)
            if changed:
                existing.save(update_fields=changed)
        for row in rows:
            if row.get('instrument') != 'micrometer' or lesson.blocks.filter(key=row['key']).exists():
                continue
            block = LessonBlock(lesson=lesson, **row)
            block.full_clean()
            block.save()
            added += 1
        self.stdout.write(f'Micrometer: {added} blocks added; existing educator content preserved.')

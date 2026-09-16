import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import Lesson, LessonBlock


class Command(BaseCommand):
    help = 'Install reviewed measurement uncertainty content; preserve educator edits.'

    @transaction.atomic
    def handle(self, *args, **options):
        lesson = Lesson.objects.get(pk='01/uncertainty')
        baseline = json.loads((settings.BASE_DIR / 'seed' / 'uncertainty-v1.json').read_text(encoding='utf8'))
        revised = json.loads((settings.BASE_DIR / 'seed' / 'measurement.json').read_text(encoding='utf8'))['01/uncertainty']
        archived = kept = added = 0
        for row in baseline:
            existing = lesson.blocks.filter(key=row['key']).first()
            if existing is None or not existing.published:
                continue
            if all(getattr(existing, key) == value for key, value in row.items()):
                existing.published = False
                existing.save(update_fields=['published'])
                archived += 1
            else:
                kept += 1
        for row in revised:
            if not lesson.blocks.filter(key=row['key']).exists():
                block = LessonBlock(lesson=lesson, **row)
                block.full_clean()
                block.save()
                added += 1
        lesson.metadata = {**(lesson.metadata or {}), 'uncertainty_edition': 'pdf-1.4-v2'}
        lesson.save(update_fields=['metadata'])
        self.stdout.write(f'Uncertainty: {added} added, {archived} unchanged starters archived, {kept} edited starters preserved. Publication status unchanged.')



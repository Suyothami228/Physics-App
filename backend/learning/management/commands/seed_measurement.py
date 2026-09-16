import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import Lesson, LessonBlock

class Command(BaseCommand):
    help='Add Measurement lessons without overwriting existing content.'
    @transaction.atomic
    def handle(self,*args,**options):
        data=json.loads((settings.BASE_DIR/'seed'/'measurement.json').read_text(encoding='utf8'))
        for lesson_id,blocks in data.items():
            lesson=Lesson.objects.filter(pk=lesson_id).first()
            if lesson is None or (lesson.metadata or {}).get("measurement_seeded"): continue
            if lesson.blocks.exists():
                lesson.metadata={**(lesson.metadata or {}), "measurement_seeded": True}
                lesson.save(update_fields=["metadata"])
                continue
            for row in blocks:
                block=LessonBlock(lesson=lesson,**row)
                block.full_clean()
                block.save()
            lesson.content_status='published'
            lesson.metadata={**(lesson.metadata or {}), 'measurement_seeded': True}
            lesson.save(update_fields=['content_status','metadata'])
        self.stdout.write('Measurement starter content ready; existing edits preserved.')

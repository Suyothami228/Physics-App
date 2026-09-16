import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import Lesson, LessonBlock

class Command(BaseCommand):
    help='Install the reviewed PDF-based introduction. Archive unchanged starter blocks and preserve educator edits.'
    @transaction.atomic
    def handle(self,*args,**options):
        lesson=Lesson.objects.get(pk='01/introduction')
        baseline=json.loads((settings.BASE_DIR/'seed'/'introduction-v1.json').read_text(encoding='utf8'))
        revised=json.loads((settings.BASE_DIR/'seed'/'measurement.json').read_text(encoding='utf8'))['01/introduction']
        archived=0
        kept=0
        for row in baseline:
            existing=lesson.blocks.filter(key=row['key']).first()
            if existing is None or not existing.published: continue
            if all(getattr(existing,key)==value for key,value in row.items()):
                existing.published=False
                existing.save(update_fields=['published'])
                archived+=1
            else: kept+=1
        added=0
        for row in revised:
            if not lesson.blocks.filter(key=row['key']).exists():
                block=LessonBlock(lesson=lesson,**row)
                block.full_clean()
                block.save()
                added+=1
        lesson.metadata={**(lesson.metadata or {}),'introduction_edition':'pdf-1.1-v2'}
        lesson.save(update_fields=['metadata'])
        self.stdout.write(f'Introduction ready: {added} sections added, {archived} unchanged starters archived, {kept} edited starters preserved. Publication status unchanged.')

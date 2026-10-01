import json
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from learning.models import Chapter, Lesson, LessonBlock

class Command(BaseCommand):
    help = 'Add Vectors and Scalars first in Mechanics, preserving admin content'

    @transaction.atomic
    def handle(self, *args, **options):
        chapter, _ = Chapter.objects.get_or_create(id='02', defaults={'title_en':'Mechanics','title_ta':'பொறியியல்'})
        lesson, _ = Lesson.objects.get_or_create(id='02/vectors', defaults={
            'chapter':chapter,'title_en':'Vectors and Scalars','title_ta':'காவிகளும் எண்ணிகளும்',
            'position':0,'available':True,'content_status':'published','metadata':{'slug':'vectors'},
        })
        if not lesson.metadata.get('vectors_first_seeded'):
            for index, other in enumerate(Lesson.objects.filter(chapter=chapter).exclude(pk=lesson.pk).order_by('position','id'), 1):
                other.position=index
                other.save(update_fields=['position'])
            lesson.position=0
            lesson.available=True
            lesson.content_status='published'
            lesson.metadata={**lesson.metadata,'vectors_first_seeded':True}
            lesson.save()
        rows=json.loads((settings.BASE_DIR/'seed/vectors.json').read_text(encoding='utf8'))['02/vectors']
        added=0
        for row in rows:
            if lesson.blocks.filter(key=row['key']).exists():
                continue
            block=LessonBlock(lesson=lesson,**row)
            block.full_clean()
            block.save()
            added+=1
        self.stdout.write(f'Vectors ready: {added} blocks added; existing admin edits preserved.')
